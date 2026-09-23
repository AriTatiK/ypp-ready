import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { computeReadiness, saveReadinessSnapshot, readinessRatingKey } from "@/lib/scoring";
import { hasAnyActivity, priorityAreaRoute } from "@/lib/recommendations";
import { getRecentActivity, type RecentActivityItem } from "@/lib/db/history";
import { ASSESSMENT_CATEGORIES } from "@/lib/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import ReadinessGauge from "@/components/ui/ReadinessGauge";
import EmptyState from "@/components/ui/EmptyState";
import { ScoreDisclaimer } from "@/components/ui/DisclaimerBanner";

export const metadata = { title: "My Progress — YPPReady" };

const COMPONENT_KEYS = ["assessment", "development", "organization", "interview", "consistency"] as const;

function activityLabel(
  item: RecentActivityItem,
  lang: "en" | "fr",
  dict: ReturnType<typeof getDictionary>
): string {
  if (item.type === "assessment") {
    const category = ASSESSMENT_CATEGORIES.find((c) => c.key === item.category);
    const categoryLabel = category ? category.label[lang] : item.category;
    return `${dict.progress.activityLabels.assessment} — ${categoryLabel}`;
  }
  if (item.type === "lesson") {
    return `${dict.progress.activityLabels.lesson} — ${item.title[lang]}`;
  }
  return `${dict.progress.activityLabels.interview} — ${item.question[lang]}`;
}

export default async function ProgressPage() {
  const user = await requireUser("/progress");
  const lang = await getLang();
  const dict = getDictionary(lang);

  const readiness = await computeReadiness(user.id);
  await saveReadinessSnapshot(user.id, readiness);
  const anyActivity = hasAnyActivity(readiness);

  const strengths = COMPONENT_KEYS.filter((key) => readiness[key] >= 70);
  const weakAreas = COMPONENT_KEYS.filter((key) => readiness[key] < 50);
  const weakestFirst = [...COMPONENT_KEYS].sort((a, b) => readiness[a] - readiness[b]).slice(0, 2);

  const recentActivity = anyActivity ? await getRecentActivity(user.id, 8) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{dict.progress.title}</h1>

      {!anyActivity ? (
        <div className="mt-8">
          <EmptyState
            title={dict.progress.noActivityYet}
            action={<Button href="/assessment/diagnostic">{dict.assessment.startDiagnostic}</Button>}
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-ink">{dict.progress.overallReadiness}</h2>
            <div className="mt-5 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
              <ReadinessGauge
                percent={readiness.overall}
                ratingLabel={dict.dashboard[readinessRatingKey(readiness.overall)]}
              />
              <div className="w-full space-y-4">
                {COMPONENT_KEYS.map((key) => (
                  <ProgressBar key={key} percent={readiness[key]} label={dict.dashboard.components[key]} />
                ))}
              </div>
            </div>
            <ScoreDisclaimer dict={dict} />
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-ink">{dict.progress.scoreModelTitle}</h2>
            <p className="mt-2 text-sm text-ink-soft">{dict.progress.scoreModelBreakdown}</p>
            <p className="mt-3 text-xs text-ink-soft">{dict.progress.scoreModelDisclaimer}</p>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-ink">{dict.progress.strengthsLabel}</h2>
            {strengths.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {strengths.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-sm text-ink">
                    <span aria-hidden>✓</span>
                    {dict.dashboard.components[key]}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">{dict.progress.noStrengthsYet}</p>
            )}

            <h2 className="mt-6 text-lg font-semibold text-ink">{dict.progress.improveLabel}</h2>
            {weakAreas.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {weakAreas.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-sm text-ink">
                    <span aria-hidden>•</span>
                    {dict.dashboard.components[key]}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">{dict.progress.noWeakAreasYet}</p>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-ink">{dict.progress.recentPracticeLabel}</h2>
            {recentActivity.length > 0 ? (
              <ul className="mt-3 divide-y divide-border-subtle">
                {recentActivity.map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <span className="text-ink">{activityLabel(item, lang, dict)}</span>
                    <span className="shrink-0 text-xs text-ink-soft">{item.date.slice(0, 10)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">{dict.progress.noRecentActivity}</p>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-ink">{dict.progress.recommendedActionsLabel}</h2>
            <ul className="mt-3 space-y-3">
              {weakestFirst.map((key) => {
                const route = priorityAreaRoute(key);
                return (
                  <li key={key} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-ink">{dict.dashboard.components[key]}</span>
                    <Link href={route.href} className="font-medium text-navy-900 underline underline-offset-2">
                      {dict.dashboard[route.ctaKey]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
