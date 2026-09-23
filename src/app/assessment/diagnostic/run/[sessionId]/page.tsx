import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { getAssessmentSession } from "@/lib/db/assessments";
import { getQuestionsByIds } from "@/lib/db/questions";
import { toPublicQuestion } from "@/components/assessment/publicQuestion";
import QuizRunner from "@/components/assessment/QuizRunner";
import Button from "@/components/ui/Button";

export default async function DiagnosticRunPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const user = await requireUser(`/assessment/diagnostic/run/${sessionId}`);
  const lang = await getLang();
  const dict = getDictionary(lang);

  const id = Number(sessionId);
  const session = Number.isFinite(id) ? await getAssessmentSession(id) : null;

  if (!session || session.user_id !== user.id || session.type !== "diagnostic") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-ink-soft">{dict.errors.notFound}</p>
        <div className="mt-4 flex justify-center">
          <Button href="/assessment">{dict.assessment.backToAssessment}</Button>
        </div>
      </div>
    );
  }

  if (session.status === "completed") {
    redirect(`/assessment/diagnostic/results/${session.id}`);
  }

  const questions = (await getQuestionsByIds(session.question_ids)).map(toPublicQuestion);

  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14">
      <p className="mx-auto mb-6 max-w-2xl text-center">
        <Link href="/assessment" className="text-sm font-medium text-navy-900 underline underline-offset-2">
          {dict.assessment.backToAssessment}
        </Link>
      </p>
      <QuizRunner
        sessionId={session.id}
        questions={questions}
        lang={lang}
        dict={dict}
        context="diagnostic"
        timed={false}
        resultsHref={`/assessment/diagnostic/results/${session.id}`}
      />
    </div>
  );
}
