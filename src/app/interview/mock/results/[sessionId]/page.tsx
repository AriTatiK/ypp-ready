import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import {
  getMockInterviewSession,
  getMockInterviewResult,
  getInterviewQuestionById,
  getStarAnswer,
} from "@/lib/db/interview";
import { scoreStarAnswer } from "@/lib/interviewScoring";
import { readinessRatingKey } from "@/lib/scoring";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ReadinessGauge from "@/components/ui/ReadinessGauge";
import { ScoreDisclaimer } from "@/components/ui/DisclaimerBanner";
import type { InterviewQuestion } from "@/lib/types";

export default async function MockInterviewResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await requireUser("/interview/mock");
  const { sessionId } = await params;
  const lang = await getLang();
  const dict = getDictionary(lang);

  const idNum = Number(sessionId);
  const session = Number.isFinite(idNum) ? await getMockInterviewSession(idNum) : null;

  if (!session || session.userId !== user.id) {
    redirect("/interview/mock");
  }

  const result = await getMockInterviewResult(session.id);
  if (!result) {
    redirect(`/interview/mock/run/${session.id}`);
  }

  // Re-score each question's saved answer to identify the lowest-scoring ones
  // for the "practice next" recommendation — this is derived at render time
  // rather than stored, since the session only persists the overall result.
  const perQuestionRaw = await Promise.all(
    session.questionIds.map(async (qid) => {
      const q = await getInterviewQuestionById(qid);
      if (!q) return null;
      const answer = await getStarAnswer(user.id, qid);
      const feedback = scoreStarAnswer({
        situation: answer?.situation ?? "",
        task: answer?.task ?? "",
        action: answer?.action ?? "",
        result: answer?.result ?? "",
      });
      return { question: q, score: feedback.score };
    })
  );
  const perQuestion = perQuestionRaw
    .filter((x): x is { question: InterviewQuestion; score: number } => x !== null)
    .sort((a, b) => a.score - b.score);

  const toPracticeNext = perQuestion.slice(0, Math.min(2, perQuestion.length));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{dict.interview.readinessTitle}</h1>

      <Card className="mt-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <ReadinessGauge
            percent={result.readinessScore}
            ratingLabel={dict.dashboard[readinessRatingKey(result.readinessScore)]}
          />
          <ScoreDisclaimer dict={dict} text={dict.interview.readinessDisclaimer} />
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-ink">{dict.interview.strengthsLabel}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {result.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-ink">{dict.interview.improveLabel}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {result.weaknesses.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-sm font-semibold text-ink">{dict.interview.recommendationsLabel}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
          {result.recommendations.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </Card>

      {toPracticeNext.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-sm font-semibold text-ink">{dict.interview.questionsToPracticeLabel}</h2>
          <ul className="mt-3 space-y-2">
            {toPracticeNext.map(({ question }) => (
              <li key={question.id}>
                <Link
                  href={`/interview/question/${question.id}`}
                  className="text-sm font-medium text-navy-900 underline underline-offset-2 hover:text-navy-700"
                >
                  {question.question[lang]}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Button href="/interview" className="mt-8" variant="secondary">
        {dict.interview.backToInterview}
      </Button>
    </div>
  );
}
