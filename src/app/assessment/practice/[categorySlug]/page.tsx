import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary, format } from "@/lib/i18n";
import { assessmentCategoryFromSlug, assessmentCategorySlug } from "@/lib/slug";
import { ASSESSMENT_CATEGORIES } from "@/lib/types";
import { getQuestionsByCategory } from "@/lib/db/questions";
import { getAssessmentResultBySession, getAssessmentSession } from "@/lib/db/assessments";
import { startPracticeAction } from "@/app/actions/assessment";
import { toPublicQuestion } from "@/components/assessment/publicQuestion";
import QuizRunner from "@/components/assessment/QuizRunner";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ done?: string; sessionId?: string }>;
}) {
  const { categorySlug } = await params;
  const { done, sessionId: sessionIdParam } = await searchParams;
  const user = await requireUser(`/assessment/practice/${categorySlug}`);
  const lang = await getLang();
  const dict = getDictionary(lang);
  const { assessment } = dict;

  const categoryEntry = ASSESSMENT_CATEGORIES.find((c) => assessmentCategorySlug(c.key) === categorySlug);
  const category = assessmentCategoryFromSlug(categorySlug);

  if (!category || !categoryEntry?.hasSeedContent) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-ink-soft">{dict.errors.notFound}</p>
        <div className="mt-4 flex justify-center">
          <Button href="/assessment">{assessment.backToAssessment}</Button>
        </div>
      </div>
    );
  }

  if (done === "1" && sessionIdParam) {
    const id = Number(sessionIdParam);
    const completedSession = Number.isFinite(id) ? await getAssessmentSession(id) : null;
    const result = completedSession && completedSession.user_id === user.id ? await getAssessmentResultBySession(id) : null;

    if (result) {
      const totalCorrect = result.category_scores.reduce((sum, c) => sum + c.correct, 0);
      const totalQuestions = result.category_scores.reduce((sum, c) => sum + c.total, 0);

      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-ink">{assessment.practiceCompleteTitle}</h1>
          <p className="mt-3 text-ink-soft">
            {format(assessment.practiceCompleteBody, { score: totalCorrect, total: totalQuestions })}
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button href={`/assessment/practice/${categorySlug}`}>{assessment.practiceAgain}</Button>
            <Button href="/assessment" variant="secondary">
              {assessment.backToAssessment}
            </Button>
          </div>
        </div>
      );
    }
    // Falls through to starting a fresh session if the completed session/result couldn't be found.
  }

  const questions = await getQuestionsByCategory(category);
  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title={assessment.emptyCategory}
          action={<Button href="/assessment">{assessment.backToAssessment}</Button>}
        />
      </div>
    );
  }

  const session = await startPracticeAction(category);
  const publicQuestions = questions.map(toPublicQuestion);

  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14">
      <p className="mx-auto mb-6 max-w-2xl text-center text-sm font-medium text-ink-soft">{categoryEntry.label[lang]}</p>
      <QuizRunner
        sessionId={session.id}
        questions={publicQuestions}
        lang={lang}
        dict={dict}
        context="practice"
        timed={false}
        resultsHref={`/assessment/practice/${categorySlug}?done=1&sessionId=${session.id}`}
      />
    </div>
  );
}
