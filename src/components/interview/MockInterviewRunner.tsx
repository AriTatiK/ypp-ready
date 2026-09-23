"use client";

import { useState, useTransition } from "react";
import StarForm from "@/components/interview/StarForm";
import { completeMockInterviewAction } from "@/app/actions/interview";
import type { Dictionary } from "@/lib/i18n";
import type { Lang, InterviewQuestion } from "@/lib/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

// Local copy of the tiny {token} interpolation helper from `@/lib/i18n` —
// that module also re-exports server-only `next/headers` helpers, which
// must not be pulled into this client bundle.
function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (key in vars ? String(vars[key]) : `{${key}}`));
}

type AnswerValues = { situation: string; task: string; action: string; result: string };

function isComplete(v: AnswerValues | null | undefined): boolean {
  return Boolean(v && v.situation && v.task && v.action && v.result);
}

/**
 * Sequential STAR-answer flow across a mock interview session's questions.
 * Each question renders the same StarForm used by the standalone builder, so
 * answers are saved (and revisitable) the same way either place.
 */
export default function MockInterviewRunner({
  dict,
  lang,
  sessionId,
  questions,
  initialAnswers,
  startIndex,
}: {
  dict: Dictionary;
  lang: Lang;
  sessionId: number;
  questions: InterviewQuestion[];
  initialAnswers: Record<string, AnswerValues | null>;
  startIndex: number;
}) {
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () =>
      new Set(
        Object.entries(initialAnswers)
          .filter(([, v]) => isComplete(v))
          .map(([id]) => id)
      )
  );
  const [isPending, startTransition] = useTransition();

  const total = questions.length;
  const question = questions[activeIndex];
  const isLast = activeIndex === total - 1;
  const canAdvance = savedIds.has(question.id);

  function handleSaved() {
    setSavedIds((prev) => {
      if (prev.has(question.id)) return prev;
      const next = new Set(prev);
      next.add(question.id);
      return next;
    });
  }

  function handleNext() {
    if (isLast) {
      startTransition(async () => {
        await completeMockInterviewAction(sessionId);
      });
    } else {
      setActiveIndex((i) => Math.min(i + 1, total - 1));
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-ink-soft">
        {format(dict.interview.questionProgress, { current: activeIndex + 1, total })}
      </p>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="navy">{dict.interview.practiceQuestionLabel}</Badge>
          <Badge tone="neutral">{dict.interview.categories[question.category] ?? question.category}</Badge>
        </div>
        <h2 className="text-lg font-semibold text-ink sm:text-xl">{question.question[lang]}</h2>
      </div>

      <StarForm
        key={question.id}
        dict={dict}
        lang={lang}
        questionId={question.id}
        initialAnswer={initialAnswers[question.id] ?? null}
        onSaved={handleSaved}
      />

      <div className="flex items-center justify-end border-t border-border-subtle pt-6">
        <Button onClick={handleNext} disabled={!canAdvance || isPending} variant="accent">
          {isPending ? dict.common.loading : isLast ? dict.interview.finishInterview : dict.interview.nextQuestion}
        </Button>
      </div>
    </div>
  );
}
