import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary, format } from "@/lib/i18n";
import { AFDB_REAL_ASSESSMENT_CATEGORIES, AFDB_REAL_QUESTION_COUNT, AFDB_REAL_TIME_LIMIT_SECONDS, ASSESSMENT_CATEGORIES } from "@/lib/types";
import { startAfdbRealAction } from "@/app/actions/assessment";
import FormatNotice from "@/components/organizations/FormatNotice";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export const metadata = { title: "AfDB Real Assessment Simulation — YPPReady" };

export default async function AfdbRealStartPage() {
  await requireUser("/assessment/afdb-real");
  const lang = await getLang();
  const dict = getDictionary(lang);
  const { assessment } = dict;

  const categoryLabels = AFDB_REAL_ASSESSMENT_CATEGORIES.map(
    (key) => ASSESSMENT_CATEGORIES.find((c) => c.key === key)?.label[lang] ?? key
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{assessment.afdbRealCardTitle}</h1>
      <p className="mt-3 text-ink-soft">{assessment.afdbRealCardIntro}</p>

      <div className="mt-6">
        <FormatNotice dict={dict} />
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-ink">{assessment.instructionsTitle}</h2>
        <ul className="mt-4 space-y-2 text-sm text-ink-soft">
          <li>{format(assessment.instructionCount, { count: AFDB_REAL_QUESTION_COUNT })}</li>
          <li>{format(assessment.instructionTime, { minutes: AFDB_REAL_TIME_LIMIT_SECONDS / 60 })}</li>
          <li>{format(assessment.instructionCategories, { categories: categoryLabels.join(", ") })}</li>
        </ul>
        <p className="mt-4 rounded-md bg-paper-alt/70 p-3 text-xs text-ink-soft">{assessment.instructionDisclaimer}</p>

        <div className="mt-5 rounded-md border border-border-subtle bg-paper-alt/40 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{assessment.dDayTitle}</h3>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            <li>• {assessment.dDayItem1}</li>
            <li>• {assessment.dDayItem2}</li>
            <li>• {assessment.dDayItem3}</li>
            <li>• {assessment.dDayItem4}</li>
          </ul>
        </div>

        <form action={startAfdbRealAction} className="mt-6">
          <Button type="submit" variant="accent" size="lg" className="w-full sm:w-auto">
            {assessment.startAfdbReal}
          </Button>
        </form>
      </Card>
    </div>
  );
}
