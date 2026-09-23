import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary, format } from "@/lib/i18n";
import { computeReadiness, saveReadinessSnapshot, readinessRatingKey } from "@/lib/scoring";
import { hasAnyActivity, priorityAreaRoute } from "@/lib/recommendations";
import { getUserOrganizations } from "@/lib/db/users";
import { ORG_OPTIONS } from "@/lib/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import ReadinessGauge from "@/components/ui/ReadinessGauge";
import { ScoreDisclaimer } from "@/components/ui/DisclaimerBanner";
import FormatNotice from "@/components/organizations/FormatNotice";

export const metadata = { title: "Dashboard — YPPReady" };

const COMPONENT_KEYS = ["assessment", "development", "organization", "interview", "consistency"] as const;

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const lang = await getLang();
  const dict = getDictionary(lang);

  const readiness = await computeReadiness(user.id);
  await saveReadinessSnapshot(user.id, readiness);

  const anyActivity = hasAnyActivity(readiness);
  const priorityKey = readiness.priorityArea?.key ?? "assessment";
  const route = priorityAreaRoute(priorityKey);

  const userOrgs = await getUserOrganizations(user.id);
  const orgLabels = userOrgs.map((o) => {
    const option = ORG_OPTIONS.find((opt) => opt.code === o.code);
    if (option) return option.label[lang];
    return o.otherText || o.code;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {format(dict.dashboard.welcomeBack, { name: user.first_name })}
      </h1>

      {userOrgs.some((o) => o.code === "AfDB") && (
        <div className="mt-6">
          <FormatNotice dict={dict} compact />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-ink">{dict.dashboard.readinessTitle}</h2>
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
          <h2 className="text-lg font-semibold text-ink">{dict.dashboard.priorityTitle}</h2>
          <p className="mt-2 text-ink-soft">
            {format(dict.dashboard.priorityBodyTemplate, {
              area: dict.dashboard.components[priorityKey as keyof typeof dict.dashboard.components],
            })}
          </p>
          <Button href={route.href} className="mt-5" variant="accent">
            {dict.dashboard[route.ctaKey]}
          </Button>
        </Card>

        <Card>
          {anyActivity ? (
            <>
              <h2 className="text-lg font-semibold text-ink">{dict.dashboard.todayTitle}</h2>
              <p className="mt-2 text-ink-soft">{dict.dashboard.todayBodyFallback}</p>
              <Button href="/today" className="mt-5">
                {dict.dashboard.ctaContinue}
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-ink">{dict.assessment.diagnosticCardTitle}</h2>
              <p className="mt-2 text-ink-soft">{dict.assessment.diagnosticCardIntro}</p>
              <Button href="/assessment/diagnostic" className="mt-5" variant="accent">
                {dict.assessment.startDiagnostic}
              </Button>
            </>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-ink">{dict.nav.organizations}</h2>
          {orgLabels.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {orgLabels.map((label, i) => (
                <li
                  key={i}
                  className="rounded-full bg-navy-900/10 px-3 py-1.5 text-sm font-medium text-navy-900"
                >
                  {label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-ink-soft">{dict.dashboard.noOrgSelected}</p>
          )}
          <Button href="/onboarding" variant="ghost" size="sm" className="mt-4">
            {dict.dashboard.updatePreferences}
          </Button>
        </Card>
      </div>
    </div>
  );
}
