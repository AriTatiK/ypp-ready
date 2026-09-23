import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary, format } from "@/lib/i18n";
import { ASSESSMENT_CATEGORIES } from "@/lib/types";
import { startMockAction } from "@/app/actions/assessment";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const MOCK_QUESTION_COUNT = 50;
const MOCK_TIME_MINUTES = 60;

export default async function MockStartPage() {
  await requireUser("/assessment/mock");
  const lang = await getLang();
  const dict = getDictionary(lang);
  const { assessment } = dict;

  const categoryLabels = ASSESSMENT_CATEGORIES.filter((c) => c.hasSeedContent).map((c) => c.label[lang]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{assessment.mockCardTitle}</h1>
      <p className="mt-3 text-ink-soft">{assessment.mockCardIntro}</p>

      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-ink">{assessment.instructionsTitle}</h2>
        <ul className="mt-4 space-y-2 text-sm text-ink-soft">
          <li>{format(assessment.instructionCount, { count: MOCK_QUESTION_COUNT })}</li>
          <li>{format(assessment.instructionTime, { minutes: MOCK_TIME_MINUTES })}</li>
          <li>{format(assessment.instructionCategories, { categories: categoryLabels.join(", ") })}</li>
        </ul>
        <p className="mt-4 rounded-md bg-paper-alt/70 p-3 text-xs text-ink-soft">{assessment.instructionDisclaimer}</p>

        <form action={startMockAction} className="mt-6">
          <Button type="submit" variant="accent" size="lg" className="w-full sm:w-auto">
            {assessment.startMock}
          </Button>
        </form>
      </Card>
    </div>
  );
}
