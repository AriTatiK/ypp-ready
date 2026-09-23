import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { interviewCategoryFromSlug } from "@/lib/slug";
import { getInterviewQuestionsByCategory, getStarAnswer } from "@/lib/db/interview";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export default async function InterviewCategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const user = await requireUser("/interview");
  const { categorySlug } = await params;
  const lang = await getLang();
  const dict = getDictionary(lang);

  const category = interviewCategoryFromSlug(categorySlug);

  if (!category) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-ink-soft">{dict.errors.notFound}</p>
        <Button href="/interview" className="mt-6" variant="secondary">
          {dict.interview.backToInterview}
        </Button>
      </div>
    );
  }

  const questions = await getInterviewQuestionsByCategory(category);
  const answeredIds = new Set(
    (
      await Promise.all(
        questions.map(async (q) => ((await getStarAnswer(user.id, q.id)) ? q.id : null))
      )
    ).filter((id): id is string => id !== null)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Button href="/interview" variant="ghost" size="sm">
        ← {dict.interview.backToInterview}
      </Button>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {dict.interview.categories[category] ?? category}
      </h1>

      {questions.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={dict.empty.noQuestions}
            action={
              <Button href="/interview" variant="secondary">
                {dict.interview.backToInterview}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {questions.map((q) => {
            const answered = answeredIds.has(q.id);
            return (
              <Link key={q.id} href={`/interview/question/${q.id}`} className="block">
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="navy">{dict.interview.practiceQuestionLabel}</Badge>
                    {answered && <Badge tone="green">{dict.interview.savedAt}</Badge>}
                  </div>
                  <p className="mt-3 text-ink">{q.question[lang]}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
