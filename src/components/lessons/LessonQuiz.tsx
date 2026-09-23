"use client";

import { useState } from "react";
import { submitLessonQuizAction, type LessonQuizResult } from "@/app/actions/lessons";
import type { Dictionary } from "@/lib/i18n";
import type { Lang, LessonQuizQuestion } from "@/lib/types";
import Button from "@/components/ui/Button";

/**
 * The "quick quiz" gated behind a Take the Quiz button. Shared by the Learn
 * lesson detail page and the Know Your Organization lesson detail page.
 */
export default function LessonQuiz({
  lessonId,
  quiz,
  lang,
  dict,
  backHref,
  backLabel,
}: {
  lessonId: string;
  quiz: LessonQuizQuestion[];
  lang: Lang;
  dict: Dictionary;
  backHref: string;
  backLabel: string;
}) {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<string[]>(() => quiz.map(() => ""));
  const [result, setResult] = useState<LessonQuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = answers.length > 0 && answers.every((a) => a !== "");

  async function handleSubmit() {
    setSubmitting(true);
    const res = await submitLessonQuizAction(lessonId, answers);
    setSubmitting(false);
    if (!("error" in res)) {
      setResult(res);
    }
  }

  if (!started) {
    return (
      <Button type="button" variant="accent" onClick={() => setStarted(true)}>
        {dict.learn.takeQuiz}
      </Button>
    );
  }

  if (result && !("error" in result)) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-green-100 bg-green-100/60 px-4 py-3">
          <p className="font-semibold text-ink">{dict.learn.lessonComplete}</p>
          <p className="text-sm text-ink-soft">
            {dict.assessment.yourScoreTemplate
              .replace("{score}", String(result.score))
              .replace("{total}", String(result.total))}
          </p>
        </div>

        <div className="space-y-4">
          {quiz.map((question, index) => {
            const questionResult = result.results[index];
            return (
              <div key={index} className="rounded-lg border border-border-subtle bg-white/60 p-4">
                <p className="font-medium text-ink">{question.question[lang]}</p>
                <p
                  className={`mt-2 text-sm font-medium ${
                    questionResult.correct ? "text-green-700" : "text-terracotta-600"
                  }`}
                >
                  {questionResult.correct ? dict.learn.quizCorrect : dict.learn.quizIncorrect}
                </p>
                <p className="mt-1 text-sm text-ink-soft">{questionResult.explanation[lang]}</p>
              </div>
            );
          })}
        </div>

        <Button href={backHref} variant="secondary">
          {backLabel}
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (allAnswered) void handleSubmit();
      }}
    >
      {quiz.map((question, index) => (
        <fieldset key={index} className="rounded-lg border border-border-subtle bg-white/60 p-4">
          <legend className="px-1 font-medium text-ink">{question.question[lang]}</legend>
          <div className="mt-3 space-y-2">
            {question.options.map((option) => (
              <label
                key={option.key}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border-subtle bg-white px-3 py-2.5 has-[:checked]:border-navy-800 has-[:checked]:bg-navy-900/5"
              >
                <input
                  type="radio"
                  name={`lesson-quiz-question-${index}`}
                  value={option.key}
                  checked={answers[index] === option.key}
                  onChange={() => {
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[index] = option.key;
                      return next;
                    });
                  }}
                  className="h-4 w-4 accent-navy-900"
                />
                <span className="text-sm text-ink">{option[lang]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <Button type="submit" disabled={!allAnswered || submitting}>
        {submitting ? dict.common.loading : dict.common.submit}
      </Button>
    </form>
  );
}
