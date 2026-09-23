import { all, get, run, batch } from "./index";
import type { Lesson, LessonQuizQuestion, LessonSource, TechnicalTerm, LessonSection } from "../types";

type LessonRow = {
  id: string;
  category: string;
  org_scope: string | null;
  title_en: string;
  title_fr: string;
  simple_definition_en: string;
  simple_definition_fr: string;
  why_it_matters_en_json: string;
  why_it_matters_fr_json: string;
  why_you_should_know_en: string;
  why_you_should_know_fr: string;
  quiz_json: string;
  sources_json: string;
  last_updated: string | null;
  african_context_en: string | null;
  african_context_fr: string | null;
  technical_terms_json: string | null;
  concrete_example_en: string | null;
  concrete_example_fr: string | null;
  one_line_summary_en: string | null;
  one_line_summary_fr: string | null;
  qcm_reflex_en: string | null;
  qcm_reflex_fr: string | null;
  structured_sections_json: string | null;
};

function toLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    category: row.category,
    org_scope: row.org_scope as Lesson["org_scope"],
    title: { en: row.title_en, fr: row.title_fr },
    simple_definition: { en: row.simple_definition_en, fr: row.simple_definition_fr },
    why_it_matters: {
      en: JSON.parse(row.why_it_matters_en_json),
      fr: JSON.parse(row.why_it_matters_fr_json),
    },
    african_context:
      row.african_context_en != null ? { en: row.african_context_en, fr: row.african_context_fr ?? "" } : undefined,
    technical_terms: row.technical_terms_json ? (JSON.parse(row.technical_terms_json) as TechnicalTerm[]) : undefined,
    concrete_example:
      row.concrete_example_en != null ? { en: row.concrete_example_en, fr: row.concrete_example_fr ?? "" } : undefined,
    one_line_summary:
      row.one_line_summary_en != null ? { en: row.one_line_summary_en, fr: row.one_line_summary_fr ?? "" } : undefined,
    qcm_reflex: row.qcm_reflex_en != null ? { en: row.qcm_reflex_en, fr: row.qcm_reflex_fr ?? "" } : undefined,
    structured_sections: row.structured_sections_json
      ? (JSON.parse(row.structured_sections_json) as LessonSection[])
      : undefined,
    why_you_should_know: { en: row.why_you_should_know_en, fr: row.why_you_should_know_fr },
    quiz: JSON.parse(row.quiz_json) as LessonQuizQuestion[],
    sources: JSON.parse(row.sources_json) as LessonSource[],
    last_updated: row.last_updated,
  };
}

export async function upsertLesson(l: Lesson): Promise<void> {
  await run(
    `INSERT INTO lessons (
      id, category, org_scope, title_en, title_fr,
      simple_definition_en, simple_definition_fr,
      why_it_matters_en_json, why_it_matters_fr_json,
      why_you_should_know_en, why_you_should_know_fr,
      quiz_json, sources_json, last_updated,
      african_context_en, african_context_fr, technical_terms_json,
      concrete_example_en, concrete_example_fr,
      one_line_summary_en, one_line_summary_fr,
      qcm_reflex_en, qcm_reflex_fr, structured_sections_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      category=excluded.category, org_scope=excluded.org_scope,
      title_en=excluded.title_en, title_fr=excluded.title_fr,
      simple_definition_en=excluded.simple_definition_en, simple_definition_fr=excluded.simple_definition_fr,
      why_it_matters_en_json=excluded.why_it_matters_en_json, why_it_matters_fr_json=excluded.why_it_matters_fr_json,
      why_you_should_know_en=excluded.why_you_should_know_en, why_you_should_know_fr=excluded.why_you_should_know_fr,
      quiz_json=excluded.quiz_json, sources_json=excluded.sources_json, last_updated=excluded.last_updated,
      african_context_en=excluded.african_context_en, african_context_fr=excluded.african_context_fr,
      technical_terms_json=excluded.technical_terms_json,
      concrete_example_en=excluded.concrete_example_en, concrete_example_fr=excluded.concrete_example_fr,
      one_line_summary_en=excluded.one_line_summary_en, one_line_summary_fr=excluded.one_line_summary_fr,
      qcm_reflex_en=excluded.qcm_reflex_en, qcm_reflex_fr=excluded.qcm_reflex_fr,
      structured_sections_json=excluded.structured_sections_json
    `,
    [
      l.id,
      l.category,
      l.org_scope ?? null,
      l.title.en,
      l.title.fr,
      l.simple_definition.en,
      l.simple_definition.fr,
      JSON.stringify(l.why_it_matters.en),
      JSON.stringify(l.why_it_matters.fr),
      l.why_you_should_know.en,
      l.why_you_should_know.fr,
      JSON.stringify(l.quiz),
      JSON.stringify(l.sources),
      l.last_updated,
      l.african_context?.en ?? null,
      l.african_context?.fr ?? null,
      l.technical_terms ? JSON.stringify(l.technical_terms) : null,
      l.concrete_example?.en ?? null,
      l.concrete_example?.fr ?? null,
      l.one_line_summary?.en ?? null,
      l.one_line_summary?.fr ?? null,
      l.qcm_reflex?.en ?? null,
      l.qcm_reflex?.fr ?? null,
      l.structured_sections ? JSON.stringify(l.structured_sections) : null,
    ]
  );
}

export async function deleteLesson(id: string): Promise<void> {
  await batch([
    { sql: `DELETE FROM lesson_progress WHERE lesson_id = ?`, args: [id] },
    { sql: `DELETE FROM lessons WHERE id = ?`, args: [id] },
  ]);
}

export async function getAllLessons(): Promise<Lesson[]> {
  const rows = await all<LessonRow>(`SELECT * FROM lessons ORDER BY category, id`);
  return rows.map(toLesson);
}

export async function getLessonsByCategory(category: string): Promise<Lesson[]> {
  const rows = await all<LessonRow>(`SELECT * FROM lessons WHERE category = ? ORDER BY id`, [category]);
  return rows.map(toLesson);
}

export async function getLessonsByOrgScope(orgScope: string): Promise<Lesson[]> {
  const rows = await all<LessonRow>(`SELECT * FROM lessons WHERE org_scope = ? ORDER BY id`, [orgScope]);
  return rows.map(toLesson);
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  const row = await get<LessonRow>(`SELECT * FROM lessons WHERE id = ?`, [id]);
  return row ? toLesson(row) : null;
}

export async function markLessonComplete(userId: number, lessonId: string, quizScore: number): Promise<void> {
  await run(
    `INSERT INTO lesson_progress (user_id, lesson_id, quiz_score, completed_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET quiz_score = excluded.quiz_score, completed_at = datetime('now')`,
    [userId, lessonId, quizScore]
  );
}

export async function getUserLessonProgress(
  userId: number
): Promise<Map<string, { quizScore: number | null; completedAt: string }>> {
  const rows = await all<{ lesson_id: string; quiz_score: number | null; completed_at: string }>(
    `SELECT lesson_id, quiz_score, completed_at FROM lesson_progress WHERE user_id = ?`,
    [userId]
  );
  return new Map(rows.map((r) => [r.lesson_id, { quizScore: r.quiz_score, completedAt: r.completed_at }]));
}

export async function countCompletedLessons(userId: number, lessonIds: string[]): Promise<number> {
  if (lessonIds.length === 0) return 0;
  const placeholders = lessonIds.map(() => "?").join(",");
  const row = await get<{ count: number }>(
    `SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ? AND lesson_id IN (${placeholders})`,
    [userId, ...lessonIds]
  );
  return row ? row.count : 0;
}
