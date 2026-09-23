import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { getInterviewQuestionById, getStarAnswer } from "@/lib/db/interview";
import { trackEvent } from "@/lib/db/analytics";
import { interviewCategorySlug } from "@/lib/slug";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

function truncate(text: string, max = 160): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export default async function InterviewQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("/interview");
  const { id } = await params;
  const lang = await getLang();
  const dict = getDictionary(lang);

  const question = await getInterviewQuestionById(id);

  if (!question) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-ink-soft">{dict.errors.notFound}</p>
        <Button href="/interview" className="mt-6" variant="secondary">
          {dict.interview.backToInterview}
        </Button>
      </div>
    );
  }

  await trackEvent("interview_question_started", user.id, { interviewQuestionId: id });

  const existingAnswer = await getStarAnswer(user.id, id);
  const hasSavedAnswer = Boolean(existingAnswer?.situation && existingAnswer?.task && existingAnswer?.action && existingAnswer?.result);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Button href={`/interview/${interviewCategorySlug(question.category)}`} variant="ghost" size="sm">
        ← {dict.interview.backToInterview}
      </Button>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="navy">{dict.interview.practiceQuestionLabel}</Badge>
        <Badge tone="neutral">{dict.interview.categories[question.category] ?? question.category}</Badge>
      </div>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{question.question[lang]}</h1>

      {question.tip[lang] && (
        <Card className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{dict.interview.tipLabel}</h2>
          <p className="mt-2 text-ink">{question.tip[lang]}</p>
        </Card>
      )}

      {hasSavedAnswer && existingAnswer && (
        <Card className="mt-6">
          <h2 className="text-sm font-semibold text-ink">{dict.interview.yourAnswerLabel}</h2>
          <p className="mt-2 text-sm text-ink-soft">{dict.interview.revisitNote}</p>
          <p className="mt-3 text-sm text-ink">
            <span className="font-medium text-ink-soft">{dict.interview.situationLabel}: </span>
            {truncate(existingAnswer.situation ?? "")}
          </p>
        </Card>
      )}

      <Button href={`/interview/star/${id}`} className="mt-8" variant="accent">
        {dict.interview.buildStarAnswer}
      </Button>
    </div>
  );
}
