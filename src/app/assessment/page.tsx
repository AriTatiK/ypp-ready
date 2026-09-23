import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { getCategoryCounts, getQuestionsByCategory } from "@/lib/db/questions";
import { getUserAttemptStats } from "@/lib/db/assessments";
import { ASSESSMENT_CATEGORIES } from "@/lib/types";
import { assessmentCategorySlug } from "@/lib/slug";
import Card from "@/components/ui/Card";
import Badge, { difficultyTone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import FormatNotice from "@/components/organizations/FormatNotice";

export default async function AssessmentHubPage() {
  const user = await requireUser("/assessment");
  const lang = await getLang();
  const dict = getDictionary(lang);
  const { assessment, common } = dict;

  const counts = await getCategoryCounts();
  const stats = await getUserAttemptStats(user.id);
  const difficultiesByCategory = new Map<string, string[]>(
    await Promise.all(
      ASSESSMENT_CATEGORIES.filter((cat) => cat.hasSeedContent).map(
        async (cat): Promise<[string, string[]]> => [
          cat.key,
          Array.from(new Set((await getQuestionsByCategory(cat.key)).map((q) => q.difficulty))),
        ]
      )
    )
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{assessment.hubTitle}</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">{assessment.hubIntro}</p>

      <div className="mt-8">
        <FormatNotice dict={dict} />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Card className="border-navy-800/20 bg-navy-900/5">
          <h2 className="text-lg font-semibold text-ink">{assessment.diagnosticCardTitle}</h2>
          <p className="mt-2 text-sm text-ink-soft">{assessment.diagnosticCardIntro}</p>
          <p className="mt-3 text-sm font-medium text-ink">{assessment.diagnosticCount}</p>
          <div className="mt-4">
            <Button href="/assessment/diagnostic">{assessment.startDiagnostic}</Button>
          </div>
        </Card>

        <Card className="border-terracotta-100 bg-terracotta-100/20">
          <h2 className="text-lg font-semibold text-ink">{assessment.mockCardTitle}</h2>
          <p className="mt-2 text-sm text-ink-soft">{assessment.mockCardIntro}</p>
          <p className="mt-3 text-sm font-medium text-ink">
            {assessment.mockCount} · {assessment.mockTime}
          </p>
          <div className="mt-4">
            <Button href="/assessment/mock" variant="accent">
              {assessment.startMock}
            </Button>
          </div>
        </Card>

        <Card className="sm:col-span-2 border-navy-800/30 bg-navy-900/10">
          <h2 className="text-lg font-semibold text-ink">{assessment.afdbRealCardTitle}</h2>
          <p className="mt-2 text-sm text-ink-soft">{assessment.afdbRealCardIntro}</p>
          <p className="mt-3 text-sm font-medium text-ink">
            {assessment.afdbRealCount} · {assessment.afdbRealTime}
          </p>
          <div className="mt-4">
            <Button href="/assessment/afdb-real" variant="accent">
              {assessment.startAfdbReal}
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ASSESSMENT_CATEGORIES.map((cat) => {
          const available = counts[cat.key] ?? 0;
          const stat = stats.get(cat.key);
          const accuracy = stat && stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : null;
          const difficulties = difficultiesByCategory.get(cat.key) ?? [];

          return (
            <Card key={cat.key} className="flex flex-col">
              <h3 className="text-base font-semibold text-ink">{cat.label[lang]}</h3>
              <p className="mt-1 text-sm text-ink-soft">
                {assessment.available}: {available}
              </p>

              {difficulties.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {difficulties.map((d) => (
                    <Badge key={d} tone={difficultyTone(d)}>
                      {d === "Easy" ? common.easy : d === "Hard" ? common.hard : common.medium}
                    </Badge>
                  ))}
                </div>
              )}

              <p className="mt-3 text-sm">
                <span className="text-ink-soft">{assessment.score}: </span>
                <span className="font-medium text-ink">
                  {accuracy !== null ? `${accuracy}%` : assessment.noAttemptsYet}
                </span>
              </p>

              {cat.key === "Situational Judgment" && (
                <Link
                  href="/learn/situational-judgment"
                  className="mt-2 inline-block min-h-11 text-sm font-medium text-navy-900 underline underline-offset-2 hover:text-navy-700"
                >
                  {dict.learn.tabSituationalGuide}
                </Link>
              )}

              <div className="mt-4 flex-1" />

              {cat.hasSeedContent ? (
                <Button href={`/assessment/practice/${assessmentCategorySlug(cat.key)}`} variant="secondary" size="sm">
                  {assessment.practiceThisSkill}
                </Button>
              ) : (
                <EmptyState title={assessment.emptyCategory} />
              )}
            </Card>
          );
        })}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-ink-soft">
        <Link href="/dashboard" className="underline underline-offset-2">
          {dict.nav.dashboard}
        </Link>
      </p>
    </div>
  );
}
