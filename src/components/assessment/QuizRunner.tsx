"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitAnswerAction, completeSessionAction, type SubmitAnswerResult } from "@/app/actions/assessment";
import type { Dictionary } from "@/lib/i18n";
import { ASSESSMENT_CATEGORIES, type AttemptContext, type Lang } from "@/lib/types";
import type { PublicQuestion } from "./publicQuestion";
import Badge, { difficultyTone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Timer from "./Timer";

const WARNING_THRESHOLD_SECONDS = 5 * 60;

// Re-implemented locally (rather than imported from "@/lib/i18n") so this client
// component never pulls in that module's re-export of next/headers-dependent code.
function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (key in vars ? String(vars[key]) : `{${key}}`));
}

function categoryLabel(category: string, lang: Lang): string {
  return ASSESSMENT_CATEGORIES.find((c) => c.key === category)?.label[lang] ?? category;
}

function difficultyLabel(difficulty: string, dict: Dictionary): string {
  if (difficulty === "Easy") return dict.common.easy;
  if (difficulty === "Hard") return dict.common.hard;
  return dict.common.medium;
}

export default function QuizRunner({
  sessionId,
  questions,
  lang,
  dict,
  context,
  timed = false,
  timeLimitSeconds = null,
  resultsHref,
}: {
  sessionId: number;
  questions: PublicQuestion[];
  lang: Lang;
  dict: Dictionary;
  context: AttemptContext;
  timed?: boolean;
  timeLimitSeconds?: number | null;
  resultsHref: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<SubmitAnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(
    timed && typeof timeLimitSeconds === "number" ? timeLimitSeconds : null
  );
  const [warningDismissed, setWarningDismissed] = useState(false);
  const autoSubmittedRef = useRef(false);

  const current = questions[index];
  const isLast = index === questions.length - 1;

  // Held in a ref (rather than called directly) so the timer interval effect
  // below can call the latest version without needing to restart on every render.
  const finishSession = useRef(async (_autoSubmitted: boolean) => {});
  finishSession.current = async (autoSubmitted: boolean) => {
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    try {
      await completeSessionAction(sessionId);
    } finally {
      const separator = resultsHref.includes("?") ? "&" : "?";
      router.push(autoSubmitted ? `${resultsHref}${separator}autoSubmitted=1` : resultsHref);
    }
  };

  useEffect(() => {
    if (!timed || typeof timeLimitSeconds !== "number") return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev === null) return prev;
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          void finishSession.current(true);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, timeLimitSeconds]);

  const showWarning = timed && remaining !== null && remaining <= WARNING_THRESHOLD_SECONDS && !warningDismissed;

  async function handleSubmit() {
    if (!selected || !current) return;
    setSubmitting(true);
    try {
      const result = await submitAnswerAction({
        sessionId,
        questionId: current.id,
        selectedAnswer: selected,
        context,
      });
      setFeedback(result);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    if (isLast) {
      setAdvancing(true);
      await finishSession.current(false);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setFeedback(null);
  }

  if (!current) {
    return <p className="text-ink-soft">{dict.errors.generic}</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-soft">
          {format(dict.assessment.questionOf, { current: index + 1, total: questions.length })}
        </p>
        {timed && remaining !== null && (
          <Timer remainingSeconds={remaining} label={dict.assessment.timeRemaining} warning={showWarning} />
        )}
      </div>

      {showWarning && (
        <div
          role="status"
          className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-terracotta-600 bg-terracotta-100/50 p-4"
        >
          <div>
            <p className="text-sm font-semibold text-terracotta-600">{dict.assessment.timeWarningTitle}</p>
            <p className="mt-1 text-sm text-ink-soft">{dict.assessment.timeWarningBody}</p>
          </div>
          <button
            type="button"
            onClick={() => setWarningDismissed(true)}
            className="min-h-11 shrink-0 rounded-md px-2 text-xs font-medium text-ink-soft underline underline-offset-2"
          >
            {dict.common.close}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border-subtle bg-white/60 p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="navy">{categoryLabel(current.category, lang)}</Badge>
          <Badge tone={difficultyTone(current.difficulty)}>{difficultyLabel(current.difficulty, dict)}</Badge>
        </div>

        <p className="text-lg font-medium leading-relaxed text-ink">{current.question[lang]}</p>

        <div className="mt-5 space-y-3" role="radiogroup" aria-label={dict.assessment.questionOf}>
          {current.options.map((option) => {
            const isSelected = selected === option.key;
            const isCorrectOption = feedback && option.key === feedback.correctAnswer;
            const isWrongSelected = feedback && isSelected && !feedback.isCorrect;

            let stateClasses = "border-border-subtle bg-white hover:border-navy-700";
            if (feedback) {
              if (isCorrectOption) {
                stateClasses = "border-green-600 bg-green-100 text-green-700";
              } else if (isWrongSelected) {
                stateClasses = "border-terracotta-600 bg-terracotta-100 text-terracotta-600";
              } else {
                stateClasses = "border-border-subtle bg-white opacity-70";
              }
            } else if (isSelected) {
              stateClasses = "border-navy-800 bg-navy-900/5";
            }

            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={!!feedback}
                onClick={() => setSelected(option.key)}
                className={`flex min-h-11 w-full items-start gap-3 rounded-md border px-4 py-3 text-left text-sm text-ink transition-colors disabled:cursor-default sm:text-base ${stateClasses}`}
              >
                <span className="font-semibold">{option.key}.</span>
                <span>{option[lang]}</span>
              </button>
            );
          })}
        </div>

        {feedback && (
          <div role="status" aria-live="polite" className="mt-5 rounded-lg border border-border-subtle bg-paper-alt/60 p-4">
            <p
              className={`text-sm font-semibold ${feedback.isCorrect ? "text-green-700" : "text-terracotta-600"}`}
            >
              {feedback.isCorrect ? dict.assessment.correctLabel : dict.assessment.incorrectLabel}
            </p>
            {!feedback.isCorrect && (
              <p className="mt-1 text-sm text-ink">
                <span className="font-medium">{dict.assessment.correctAnswerLabel}:</span> {feedback.correctAnswer}
              </p>
            )}
            <p className="mt-2 text-sm text-ink-soft">
              <span className="font-medium text-ink">{dict.assessment.explanationLabel}:</span>{" "}
              {feedback.explanation[lang]}
            </p>
            {feedback.skillTested && (
              <p className="mt-2 text-sm text-ink-soft">
                <span className="font-medium text-ink">{dict.assessment.skillTestedLabel}:</span>{" "}
                {feedback.skillTested[lang]}
              </p>
            )}
            <p className="mt-2 text-xs text-ink-soft">{dict.assessment.reviewNote}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {!feedback ? (
            <Button onClick={handleSubmit} disabled={!selected || submitting}>
              {submitting ? dict.common.loading : dict.assessment.submitAnswer}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={advancing}>
              {advancing ? dict.common.loading : isLast ? dict.assessment.seeResults : dict.assessment.nextQuestion}
            </Button>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-soft">{dict.assessment.organizationScopeNote}</p>
    </div>
  );
}
