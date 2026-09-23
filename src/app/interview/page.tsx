import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { INTERVIEW_CATEGORIES } from "@/lib/types";
import { getInterviewQuestionsByCategory, getRandomInterviewQuestions } from "@/lib/db/interview";
import { interviewCategorySlug } from "@/lib/slug";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export const metadata = { title: "Interview Preparation — YPPReady" };

export default async function InterviewHubPage() {
  await requireUser("/interview");
  const lang = await getLang();
  const dict = getDictionary(lang);

  const categoryCounts = await Promise.all(
    INTERVIEW_CATEGORIES.map(async (category) => ({
      category,
      count: (await getInterviewQuestionsByCategory(category)).length,
    }))
  );

  const randomQuestion = (await getRandomInterviewQuestions(1))[0] ?? null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{dict.interview.hubTitle}</h1>
      <p className="mt-2 max-w-prose text-ink-soft">{dict.interview.hubIntro}</p>

      <Card className="mt-8 border-navy-900/20 bg-navy-900/5">
        <h2 className="text-lg font-semibold text-ink">{dict.interview.modes.mockInterview}</h2>
        <p className="mt-2 text-ink-soft">{dict.interview.modes.mockInterviewDesc}</p>
        <Button href="/interview/mock" className="mt-5" variant="accent">
          {dict.interview.startInterview}
        </Button>
      </Card>

      {randomQuestion && (
        <Card className="mt-6">
          <h2 className="text-lg font-semibold text-ink">{dict.interview.starBuilderTitle}</h2>
          <p className="mt-2 text-ink-soft">{dict.interview.starBuilderIntro}</p>
          <Button href={`/interview/star/${randomQuestion.id}`} className="mt-5" variant="secondary">
            {dict.interview.buildStarAnswer}
          </Button>
        </Card>
      )}

      <h2 className="mt-10 text-lg font-semibold text-ink">{dict.interview.browseByCategoryLabel}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {categoryCounts.map(({ category, count }) => (
          <Link key={category} href={`/interview/${interviewCategorySlug(category)}`} className="block">
            <Card className="h-full transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-ink">{dict.interview.categories[category] ?? category}</h3>
                <Badge tone="neutral">
                  {count} {dict.common.questions}
                </Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
