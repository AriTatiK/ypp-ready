import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { getMockInterviewSession, getInterviewQuestionById, getStarAnswer } from "@/lib/db/interview";
import MockInterviewRunner from "@/components/interview/MockInterviewRunner";
import type { InterviewQuestion } from "@/lib/types";

type AnswerValues = { situation: string; task: string; action: string; result: string };

export default async function MockInterviewRunPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await requireUser("/interview/mock");
  const { sessionId } = await params;
  const lang = await getLang();
  const dict = getDictionary(lang);

  const idNum = Number(sessionId);
  const session = Number.isFinite(idNum) ? await getMockInterviewSession(idNum) : null;

  if (!session || session.userId !== user.id) {
    redirect("/interview/mock");
  }
  if (session.status === "completed") {
    redirect(`/interview/mock/results/${session.id}`);
  }

  const questionsRaw = await Promise.all(session.questionIds.map((qid) => getInterviewQuestionById(qid)));
  const questions = questionsRaw.filter((q): q is InterviewQuestion => q !== null);

  if (questions.length === 0) {
    redirect("/interview/mock");
  }

  const initialAnswers: Record<string, AnswerValues | null> = {};
  let startIndex = 0;
  let foundUnanswered = false;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const answer = await getStarAnswer(user.id, q.id);
    const complete = Boolean(answer?.situation && answer?.task && answer?.action && answer?.result);
    initialAnswers[q.id] = answer
      ? {
          situation: answer.situation ?? "",
          task: answer.task ?? "",
          action: answer.action ?? "",
          result: answer.result ?? "",
        }
      : null;
    if (!complete && !foundUnanswered) {
      startIndex = i;
      foundUnanswered = true;
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <MockInterviewRunner
        dict={dict}
        lang={lang}
        sessionId={session.id}
        questions={questions}
        initialAnswers={initialAnswers}
        startIndex={startIndex}
      />
    </div>
  );
}
