import { all } from "./index";
import type { Bilingual } from "../types";

export type RecentActivityItem =
  | { type: "assessment"; date: string; category: string; isCorrect: boolean }
  | { type: "lesson"; date: string; title: Bilingual }
  | { type: "interview"; date: string; question: Bilingual };

/**
 * Small recent-activity feed for the Progress page: unions the three kinds
 * of practice activity (question attempts, lesson completions, interview
 * answers) and returns the most recent `limit` items across all of them.
 */
export async function getRecentActivity(userId: number, limit = 8): Promise<RecentActivityItem[]> {
  const attempts = await all<{ date: string; category: string; is_correct: number }>(
    `SELECT qa.created_at as date, q.category as category, qa.is_correct as is_correct
     FROM question_attempts qa
     JOIN questions q ON q.id = qa.question_id
     WHERE qa.user_id = ?
     ORDER BY qa.created_at DESC
     LIMIT ?`,
    [userId, limit]
  );

  const lessons = await all<{ date: string; title_en: string; title_fr: string }>(
    `SELECT lp.completed_at as date, l.title_en as title_en, l.title_fr as title_fr
     FROM lesson_progress lp
     JOIN lessons l ON l.id = lp.lesson_id
     WHERE lp.user_id = ?
     ORDER BY lp.completed_at DESC
     LIMIT ?`,
    [userId, limit]
  );

  const interviewAnswers = await all<{ date: string; question_en: string; question_fr: string }>(
    `SELECT ia.updated_at as date, iq.question_en as question_en, iq.question_fr as question_fr
     FROM interview_answers ia
     JOIN interview_questions iq ON iq.id = ia.interview_question_id
     WHERE ia.user_id = ?
     ORDER BY ia.updated_at DESC
     LIMIT ?`,
    [userId, limit]
  );

  const items: RecentActivityItem[] = [
    ...attempts.map((a) => ({
      type: "assessment" as const,
      date: a.date,
      category: a.category,
      isCorrect: !!a.is_correct,
    })),
    ...lessons.map((l) => ({
      type: "lesson" as const,
      date: l.date,
      title: { en: l.title_en, fr: l.title_fr },
    })),
    ...interviewAnswers.map((i) => ({
      type: "interview" as const,
      date: i.date,
      question: { en: i.question_en, fr: i.question_fr },
    })),
  ];

  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return items.slice(0, limit);
}
