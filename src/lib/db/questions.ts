import { all, get, run, batch } from "./index";
import type { Question, QuestionOption, Bilingual } from "../types";

type QuestionRow = {
  id: string;
  organization_scope: string;
  category: string;
  subcategory: string | null;
  difficulty: string;
  question_en: string;
  question_fr: string;
  options_json: string;
  correct_answer: string;
  explanation_en: string;
  explanation_fr: string;
  skill_tested_en: string | null;
  skill_tested_fr: string | null;
  source: string | null;
};

function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    organization_scope: row.organization_scope as Question["organization_scope"],
    category: row.category,
    subcategory: row.subcategory,
    difficulty: row.difficulty as Question["difficulty"],
    question: { en: row.question_en, fr: row.question_fr },
    options: JSON.parse(row.options_json) as QuestionOption[],
    correct_answer: row.correct_answer,
    explanation: { en: row.explanation_en, fr: row.explanation_fr },
    skill_tested:
      row.skill_tested_en != null
        ? { en: row.skill_tested_en, fr: row.skill_tested_fr ?? "" }
        : undefined,
    source: row.source,
  };
}

export async function upsertQuestion(q: Question): Promise<void> {
  await run(
    `INSERT INTO questions (
      id, organization_scope, category, subcategory, difficulty,
      question_en, question_fr, options_json, correct_answer,
      explanation_en, explanation_fr, skill_tested_en, skill_tested_fr, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      organization_scope=excluded.organization_scope,
      category=excluded.category,
      subcategory=excluded.subcategory,
      difficulty=excluded.difficulty,
      question_en=excluded.question_en,
      question_fr=excluded.question_fr,
      options_json=excluded.options_json,
      correct_answer=excluded.correct_answer,
      explanation_en=excluded.explanation_en,
      explanation_fr=excluded.explanation_fr,
      skill_tested_en=excluded.skill_tested_en,
      skill_tested_fr=excluded.skill_tested_fr,
      source=excluded.source
    `,
    [
      q.id,
      q.organization_scope,
      q.category,
      q.subcategory ?? null,
      q.difficulty,
      q.question.en,
      q.question.fr,
      JSON.stringify(q.options),
      q.correct_answer,
      q.explanation.en,
      q.explanation.fr,
      q.skill_tested?.en ?? null,
      q.skill_tested?.fr ?? null,
      q.source ?? null,
    ]
  );
}

export async function deleteQuestion(id: string): Promise<void> {
  await batch([
    { sql: `DELETE FROM question_attempts WHERE question_id = ?`, args: [id] },
    { sql: `DELETE FROM questions WHERE id = ?`, args: [id] },
  ]);
}

export async function getAllQuestions(): Promise<Question[]> {
  const rows = await all<QuestionRow>(`SELECT * FROM questions ORDER BY category, id`);
  return rows.map(toQuestion);
}

export async function getQuestionsByCategory(category: string): Promise<Question[]> {
  const rows = await all<QuestionRow>(`SELECT * FROM questions WHERE category = ? ORDER BY id`, [category]);
  return rows.map(toQuestion);
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const row = await get<QuestionRow>(`SELECT * FROM questions WHERE id = ?`, [id]);
  return row ? toQuestion(row) : null;
}

export async function getQuestionsByIds(ids: string[]): Promise<Question[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  const rows = await all<QuestionRow>(`SELECT * FROM questions WHERE id IN (${placeholders})`, ids);
  const byId = new Map(rows.map((r) => [r.id, toQuestion(r)]));
  // preserve requested order
  return ids.map((id) => byId.get(id)).filter((q): q is Question => !!q);
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const rows = await all<{ category: string; count: number }>(
    `SELECT category, COUNT(*) as count FROM questions GROUP BY category`
  );
  const result: Record<string, number> = {};
  for (const row of rows) result[row.category] = row.count;
  return result;
}

/** Picks `count` random question ids for a category (or across all categories if omitted). */
export async function pickRandomQuestionIds(opts: { category?: string; count: number }): Promise<string[]> {
  const rows = opts.category
    ? await all<{ id: string }>(
        `SELECT id FROM questions WHERE category = ? ORDER BY RANDOM() LIMIT ?`,
        [opts.category, opts.count]
      )
    : await all<{ id: string }>(`SELECT id FROM questions ORDER BY RANDOM() LIMIT ?`, [opts.count]);
  return rows.map((r) => r.id);
}

/** Picks a balanced diagnostic/mock set: spreads `count` roughly evenly across the given categories. */
export async function pickBalancedQuestionIds(categories: string[], count: number): Promise<string[]> {
  const perCategory = Math.max(1, Math.floor(count / categories.length));
  const ids: string[] = [];
  for (const category of categories) {
    const rows = await all<{ id: string }>(
      `SELECT id FROM questions WHERE category = ? ORDER BY RANDOM() LIMIT ?`,
      [category, perCategory]
    );
    ids.push(...rows.map((r) => r.id));
  }
  // Top up to reach `count` if some categories had fewer questions than requested.
  if (ids.length < count) {
    const placeholders = ids.map(() => "?").join(",") || "''";
    const extra = await all<{ id: string }>(
      `SELECT id FROM questions WHERE category IN (${categories.map(() => "?").join(",")}) AND id NOT IN (${placeholders}) ORDER BY RANDOM() LIMIT ?`,
      [...categories, ...ids, count - ids.length]
    );
    ids.push(...extra.map((r) => r.id));
  }
  // Shuffle final order so categories are interleaved, not blocked.
  return ids
    .map((id) => ({ id, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.id);
}

export function bilingual(q: Question["question"] | Bilingual, lang: "en" | "fr") {
  return q[lang];
}
