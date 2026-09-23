"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  createAssessmentSession,
  getAssessmentSession,
  getAssessmentResultBySession,
  recordQuestionAttempt,
  completeAssessmentSession,
} from "@/lib/db/assessments";
import { getQuestionById, getQuestionsByCategory, pickBalancedQuestionIds } from "@/lib/db/questions";
import { trackEvent } from "@/lib/db/analytics";
import { ASSESSMENT_CATEGORIES, AFDB_REAL_ASSESSMENT_CATEGORIES, AFDB_REAL_QUESTION_COUNT, AFDB_REAL_TIME_LIMIT_SECONDS } from "@/lib/types";
import type { AttemptContext, AssessmentSession, AssessmentResult, Bilingual } from "@/lib/types";

const DIAGNOSTIC_CATEGORIES = ASSESSMENT_CATEGORIES.filter((c) => c.hasSeedContent).map((c) => c.key);
const DIAGNOSTIC_QUESTION_COUNT = 30;
const MOCK_QUESTION_COUNT = 50;
const MOCK_TIME_LIMIT_SECONDS = 60 * 60;

/** Starts a balanced diagnostic session and redirects into the runner. */
export async function startDiagnosticAction(): Promise<void> {
  const user = await requireUser("/assessment/diagnostic");
  const questionIds = await pickBalancedQuestionIds(DIAGNOSTIC_CATEGORIES, DIAGNOSTIC_QUESTION_COUNT);
  const session = await createAssessmentSession({
    userId: user.id,
    type: "diagnostic",
    questionIds,
    timeLimitSeconds: null,
  });
  await trackEvent("diagnostic_started", user.id, { sessionId: session.id, questionCount: questionIds.length });
  redirect(`/assessment/diagnostic/run/${session.id}`);
}

/** Starts a timed full mock session and redirects into the runner. */
export async function startMockAction(): Promise<void> {
  const user = await requireUser("/assessment/mock");
  const questionIds = await pickBalancedQuestionIds(DIAGNOSTIC_CATEGORIES, MOCK_QUESTION_COUNT);
  const session = await createAssessmentSession({
    userId: user.id,
    type: "mock",
    questionIds,
    timeLimitSeconds: MOCK_TIME_LIMIT_SECONDS,
  });
  await trackEvent("mock_started", user.id, { sessionId: session.id, questionCount: questionIds.length });
  redirect(`/assessment/mock/run/${session.id}`);
}

/**
 * Starts the AfDB Real Assessment Simulation: the format confirmed by the
 * YPP coordinator — 45 minutes once started, a single multiple-choice run,
 * balanced across exactly the 4 real domains (not the platform's broader,
 * generic practice categories).
 */
export async function startAfdbRealAction(): Promise<void> {
  const user = await requireUser("/assessment/afdb-real");
  const questionIds = await pickBalancedQuestionIds(AFDB_REAL_ASSESSMENT_CATEGORIES, AFDB_REAL_QUESTION_COUNT);
  const session = await createAssessmentSession({
    userId: user.id,
    type: "afdb_real",
    questionIds,
    timeLimitSeconds: AFDB_REAL_TIME_LIMIT_SECONDS,
  });
  await trackEvent("afdb_real_started", user.id, { sessionId: session.id, questionCount: questionIds.length });
  redirect(`/assessment/afdb-real/run/${session.id}`);
}

/**
 * Starts an untimed practice session for one category. Called directly from
 * the practice Server Component (not through a form) since practice begins
 * immediately, with no instructions gate.
 */
export async function startPracticeAction(category: string): Promise<AssessmentSession> {
  const user = await requireUser("/assessment");
  const questions = await getQuestionsByCategory(category);
  const questionIds = questions.map((q) => q.id);
  return await createAssessmentSession({
    userId: user.id,
    type: "practice",
    category,
    questionIds,
    timeLimitSeconds: null,
  });
}

export type SubmitAnswerResult = {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: Bilingual;
  skillTested?: Bilingual;
};

/**
 * Records the user's answer and — only now that they've answered — reveals
 * the correct answer and explanation for this one question.
 */
export async function submitAnswerAction(input: {
  sessionId: number;
  questionId: string;
  selectedAnswer: string;
  context: AttemptContext;
}): Promise<SubmitAnswerResult> {
  const user = await requireUser();
  const session = await getAssessmentSession(input.sessionId);
  if (!session || session.user_id !== user.id) {
    throw new Error("Assessment session not found.");
  }
  const question = await getQuestionById(input.questionId);
  if (!question) {
    throw new Error("Question not found.");
  }

  const isCorrect = question.correct_answer === input.selectedAnswer;

  await recordQuestionAttempt({
    userId: user.id,
    questionId: question.id,
    assessmentSessionId: input.sessionId,
    context: input.context,
    selectedAnswer: input.selectedAnswer,
    isCorrect,
  });

  await trackEvent("question_answered", user.id, {
    questionId: question.id,
    category: question.category,
    context: input.context,
    isCorrect,
  });

  return {
    isCorrect,
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
    skillTested: question.skill_tested,
  };
}

/** Finalizes a session (idempotent) and logs the relevant completion event. */
export async function completeSessionAction(sessionId: number): Promise<AssessmentResult> {
  const user = await requireUser();
  const session = await getAssessmentSession(sessionId);
  if (!session || session.user_id !== user.id) {
    throw new Error("Assessment session not found.");
  }

  if (session.status === "completed") {
    const existing = await getAssessmentResultBySession(sessionId);
    if (existing) return existing;
  }

  const result = await completeAssessmentSession(sessionId);

  if (session.type === "diagnostic") {
    await trackEvent("diagnostic_completed", user.id, { sessionId, overallScore: result.overall_score });
  } else if (session.type === "mock") {
    await trackEvent("mock_completed", user.id, { sessionId, overallScore: result.overall_score });
  } else if (session.type === "afdb_real") {
    await trackEvent("afdb_real_completed", user.id, { sessionId, overallScore: result.overall_score });
  }

  return result;
}
