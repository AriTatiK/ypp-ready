import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { getInterviewQuestionById, getStarAnswer } from "@/lib/db/interview";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StarForm from "@/components/interview/StarForm";

export default async function StarBuilderPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const user = await requireUser("/interview");
  const { questionId } = await params;
  const lang = await getLang();
  const dict = getDictionary(lang);

  const question = await getInterviewQuestionById(questionId);

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

  const existing = await getStarAnswer(user.id, questionId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Button href={`/interview/question/${questionId}`} variant="ghost" size="sm">
        ← {dict.interview.backToInterview}
      </Button>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{dict.interview.starBuilderTitle}</h1>
      <p className="mt-2 text-ink-soft">{dict.interview.starBuilderIntro}</p>
      <p className="mt-1 text-sm text-ink-soft">{dict.interview.revisitNote}</p>

      <Card className="mt-6">
        <Badge tone="navy">{dict.interview.practiceQuestionLabel}</Badge>
        <p className="mt-3 text-ink">{question.question[lang]}</p>
      </Card>

      <div className="mt-8">
        <StarForm
          dict={dict}
          lang={lang}
          questionId={questionId}
          initialAnswer={
            existing
              ? {
                  situation: existing.situation ?? "",
                  task: existing.task ?? "",
                  action: existing.action ?? "",
                  result: existing.result ?? "",
                }
              : null
          }
        />
      </div>
    </div>
  );
}
