"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { starAnswerSchema } from "@/lib/validations";
import { trackEvent } from "@/lib/db/analytics";
import {
  saveStarAnswer,
  saveStarAiScore,
  getStarAnswer,
  getRandomInterviewQuestions,
  createMockInterviewSession,
  getMockInterviewSession,
  completeMockInterviewSession,
} from "@/lib/db/interview";
import { scoreStarAnswer, scoreMockInterview, type StarInput } from "@/lib/interviewScoring";

// ---- STAR answer builder ----

export type StarSaveState = {
  status: "idle" | "success" | "error";
  savedAt: string | null;
  error: string | null;
  values: { situation: string; task: string; action: string; result: string };
};

export async function saveStarAnswerAction(
  questionId: string,
  _prev: StarSaveState,
  formData: FormData
): Promise<StarSaveState> {
  const user = await requireUser(`/interview/star/${questionId}`);

  const values = {
    situation: String(formData.get("situation") ?? ""),
    task: String(formData.get("task") ?? ""),
    action: String(formData.get("action") ?? ""),
    result: String(formData.get("result") ?? ""),
  };

  const parsed = starAnswerSchema.safeParse({ interviewQuestionId: questionId, ...values });
  if (!parsed.success) {
    return { status: "error", savedAt: null, error: "invalid", values };
  }

  await saveStarAnswer({
    userId: user.id,
    interviewQuestionId: questionId,
    situation: parsed.data.situation,
    task: parsed.data.task,
    action: parsed.data.action,
    result: parsed.data.result,
  });

  await trackEvent("interview_answer_saved", user.id, { interviewQuestionId: questionId });

  const saved = await getStarAnswer(user.id, questionId);
  return {
    status: "success",
    savedAt: saved?.updated_at ?? new Date().toISOString(),
    error: null,
    values,
  };
}

// ---- Heuristic feedback ----

export type StarFeedbackState = {
  status: "idle" | "success" | "error";
  score: number | null;
  strengths: string[];
  improve: string[];
  error: string | null;
};

export async function getFeedbackAction(
  questionId: string,
  _prev: StarFeedbackState,
  _formData: FormData
): Promise<StarFeedbackState> {
  const user = await requireUser(`/interview/star/${questionId}`);

  const answer = await getStarAnswer(user.id, questionId);
  if (!answer || !answer.situation || !answer.task || !answer.action || !answer.result) {
    return { status: "error", score: null, strengths: [], improve: [], error: "noAnswerYet" };
  }

  const feedback = scoreStarAnswer({
    situation: answer.situation,
    task: answer.task,
    action: answer.action,
    result: answer.result,
  });

  await saveStarAiScore(user.id, questionId, feedback);

  return { status: "success", score: feedback.score, strengths: feedback.strengths, improve: feedback.improve, error: null };
}

// ---- Mock interview flow ----

export async function startMockInterviewAction(mode: "quick" | "practice" | "mock"): Promise<void> {
  const user = await requireUser("/interview/mock");

  const count = mode === "quick" ? 1 : mode === "practice" ? 5 : 10;
  const questions = await getRandomInterviewQuestions(count);
  const session = await createMockInterviewSession({
    userId: user.id,
    mode,
    questionIds: questions.map((q) => q.id),
  });

  await trackEvent("mock_started", user.id, { mode, sessionId: session.id, area: "interview" });

  redirect(`/interview/mock/run/${session.id}`);
}

export async function completeMockInterviewAction(sessionId: number): Promise<void> {
  const user = await requireUser("/interview/mock");

  const session = await getMockInterviewSession(sessionId);
  if (!session || session.userId !== user.id) {
    redirect("/interview/mock");
  }

  const answers: StarInput[] = await Promise.all(
    session.questionIds.map(async (qid) => {
      const answer = await getStarAnswer(user.id, qid);
      return {
        situation: answer?.situation ?? "",
        task: answer?.task ?? "",
        action: answer?.action ?? "",
        result: answer?.result ?? "",
      };
    })
  );

  const overall = scoreMockInterview(answers);
  // Recommendations: phrase the identified weaknesses as forward-looking next steps.
  const recommendations = overall.weaknesses.length > 0
    ? overall.weaknesses
    : ["Keep practicing a range of behavioral questions to build consistency."];

  await completeMockInterviewSession(sessionId, {
    readinessScore: overall.readinessScore,
    strengths: overall.strengths,
    weaknesses: overall.weaknesses,
    recommendations,
  });

  await trackEvent("mock_completed", user.id, { mode: session.mode, sessionId, area: "interview", score: overall.readinessScore });

  redirect(`/interview/mock/results/${sessionId}`);
}
