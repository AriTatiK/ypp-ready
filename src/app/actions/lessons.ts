"use server";

import { requireUser } from "@/lib/auth";
import { getLessonById, markLessonComplete } from "@/lib/db/lessons";
import { trackEvent } from "@/lib/db/analytics";
import type { Bilingual } from "@/lib/types";

export type LessonQuizAnswerResult = {
  correct: boolean;
  correctAnswer: string;
  explanation: Bilingual;
};

export type LessonQuizResult =
  | { error: "notFound" }
  | {
      score: number;
      total: number;
      percent: number;
      results: LessonQuizAnswerResult[];
    };

/**
 * Scores a lesson's quick quiz against the lesson's stored answer key, records
 * completion for the current user, and logs a `lesson_completed` analytics event.
 * `answers` is the selected option key per quiz question, in question order.
 */
export async function submitLessonQuizAction(
  lessonId: string,
  answers: string[]
): Promise<LessonQuizResult> {
  const user = await requireUser();

  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    return { error: "notFound" };
  }

  const results: LessonQuizAnswerResult[] = lesson.quiz.map((question, index) => {
    const selected = answers[index] ?? "";
    return {
      correct: selected === question.correct_answer,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
    };
  });

  const total = results.length;
  const score = results.filter((r) => r.correct).length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  await markLessonComplete(user.id, lessonId, percent);
  await trackEvent("lesson_completed", user.id, { lessonId, quizScore: percent });

  return { score, total, percent, results };
}
