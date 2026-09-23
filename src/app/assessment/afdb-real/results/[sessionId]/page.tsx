import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary, format } from "@/lib/i18n";
import { getAssessmentSession, getAssessmentResultBySession } from "@/lib/db/assessments";
import { getCategoryCounts } from "@/lib/db/questions";
import { assessmentCategorySlug } from "@/lib/slug";
import { categoryDisplayLabel, categoryToneFor } from "@/components/assessment/resultsHelpers";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { ScoreDisclaimer } from "@/components/ui/DisclaimerBanner";

export default async function AfdbRealResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ autoSubmitted?: string }>;
}) {
  const { sessionId } = await params;
  const { autoSubmitted } = await searchParams;
  const user = await requireUser(`/assessment/afdb-real/results/${sessionId}`);
  const lang = await getLang();
  const dict = getDictionary(lang);
  const { assessment } = dict;

  const id = Number(sessionId);
  const session = Number.isFinite(id) ? await getAssessmentSession(id) : null;

  if (!session || session.user_id !== user.id || session.type !== "afdb_real") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-ink-soft">{dict.errors.notFound}</p>
        <div className="mt-4 flex justify-center">
          <Button href="/assessment">{assessment.backToAssessment}</Button>
        </div>
      </div>
    );
  }

  if (session.status !== "completed") {
    redirect(`/assessment/afdb-real/run/${session.id}`);
  }

  const result = await getAssessmentResultBySession(id);
  if (!result) {
    redirect(`/assessment/afdb-real/run/${session.id}`);
  }

  const totalCorrect = result.category_scores.reduce((sum, c) => sum + c.correct, 0);
  const totalQuestions = result.category_scores.reduce((sum, c) => sum + c.total, 0);
  const priorityCategory = result.priority_area;
  const categoryCounts = await getCategoryCounts();
  const availableInPriority = priorityCategory ? categoryCounts[priorityCategory] ?? 10 : 10;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      {autoSubmitted === "1" && (
        <p className="mb-4 rounded-md border border-navy-800/20 bg-navy-900/5 px-3 py-2 text-sm text-ink">
          {assessment.autoSubmitted}
        </p>
      )}

      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{assessment.afdbRealCardTitle}</h1>

      <Card className="mt-6">
        <p className="text-3xl font-semibold text-ink">
          {format(assessment.yourScoreTemplate, { score: totalCorrect, total: totalQuestions })}
        </p>
        <p className="mt-1 text-sm text-ink-soft">{result.overall_score}%</p>
        <ScoreDisclaimer dict={dict} />
      </Card>

      <Card className="mt-5">
        <h2 className="text-lg font-semibold text-ink">{assessment.skillScoreTitle}</h2>
        <div className="mt-4 space-y-4">
          {result.category_scores.map((score) => (
            <ProgressBar
              key={score.category}
              percent={score.percent}
              label={categoryDisplayLabel(score.category, lang)}
              tone={categoryToneFor(score.percent)}
            />
          ))}
        </div>
      </Card>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-green-700">{assessment.strongestArea}</h3>
          <p className="mt-2 text-sm text-ink">
            {result.strongest_area ? categoryDisplayLabel(result.strongest_area, lang) : assessment.noAttemptsYet}
          </p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-terracotta-600">{assessment.priorityArea}</h3>
          <p className="mt-2 text-sm text-ink">
            {priorityCategory ? categoryDisplayLabel(priorityCategory, lang) : assessment.noAttemptsYet}
          </p>
        </Card>
      </div>

      {priorityCategory && (
        <Card className="mt-5 border-navy-800/20 bg-navy-900/5">
          <h3 className="text-sm font-semibold text-ink">{assessment.recommendedNextAction}</h3>
          <p className="mt-1 text-sm text-ink-soft">
            {format(assessment.recommendedNextActionTemplate, {
              count: availableInPriority,
              category: categoryDisplayLabel(priorityCategory, lang),
            })}
          </p>
        </Card>
      )}

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {priorityCategory && (
          <Button href={`/assessment/practice/${assessmentCategorySlug(priorityCategory)}`}>
            {assessment.practiceWeakArea}
          </Button>
        )}
        <Button href="/assessment" variant="secondary">
          {assessment.backToAssessment}
        </Button>
      </div>
    </div>
  );
}
