import { all, get, run } from "./index";
import { getQuestionsByIds } from "./questions";
import type {
  AssessmentSession,
  AssessmentResult,
  AttemptContext,
  CategoryScore,
} from "../types";

type SessionRow = {
  id: number;
  user_id: number;
  type: string;
  category: string | null;
  question_ids_json: string;
  time_limit_seconds: number | null;
  status: string;
  started_at: string;
  completed_at: string | null;
};

function toSession(row: SessionRow): AssessmentSession {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type as AssessmentSession["type"],
    category: row.category,
    question_ids: JSON.parse(row.question_ids_json),
    time_limit_seconds: row.time_limit_seconds,
    status: row.status as AssessmentSession["status"],
    started_at: row.started_at,
    completed_at: row.completed_at,
  };
}

export async function createAssessmentSession(input: {
  userId: number;
  type: "diagnostic" | "mock" | "practice" | "afdb_real";
  category?: string | null;
  questionIds: string[];
  timeLimitSeconds?: number | null;
}): Promise<AssessmentSession> {
  const { lastInsertRowid } = await run(
    `INSERT INTO assessment_sessions (user_id, type, category, question_ids_json, time_limit_seconds)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.type,
      input.category ?? null,
      JSON.stringify(input.questionIds),
      input.timeLimitSeconds ?? null,
    ]
  );
  return (await getAssessmentSession(Number(lastInsertRowid)))!;
}

export async function getAssessmentSession(id: number): Promise<AssessmentSession | null> {
  const row = await get<SessionRow>(`SELECT * FROM assessment_sessions WHERE id = ?`, [id]);
  return row ? toSession(row) : null;
}

export async function recordQuestionAttempt(input: {
  userId: number;
  questionId: string;
  assessmentSessionId?: number | null;
  context: AttemptContext;
  selectedAnswer: string | null;
  isCorrect: boolean;
}): Promise<void> {
  await run(
    `INSERT INTO question_attempts (user_id, question_id, assessment_session_id, context, selected_answer, is_correct)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.questionId,
      input.assessmentSessionId ?? null,
      input.context,
      input.selectedAnswer,
      input.isCorrect ? 1 : 0,
    ]
  );
}

export async function getSessionAttempts(sessionId: number) {
  return all<{
    id: number;
    user_id: number;
    question_id: string;
    selected_answer: string | null;
    is_correct: number;
  }>(`SELECT * FROM question_attempts WHERE assessment_session_id = ?`, [sessionId]);
}

/** Finalizes a session: scores every attempted question against its category, stores the result row. */
export async function completeAssessmentSession(sessionId: number): Promise<AssessmentResult> {
  const session = await getAssessmentSession(sessionId);
  if (!session) throw new Error("Assessment session not found");

  const questions = await getQuestionsByIds(session.question_ids);
  const attempts = await getSessionAttempts(sessionId);
  const attemptByQuestion = new Map(attempts.map((a) => [a.question_id, a]));

  const byCategory = new Map<string, { correct: number; total: number }>();
  let totalCorrect = 0;

  for (const q of questions) {
    const attempt = attemptByQuestion.get(q.id);
    const isCorrect = !!attempt?.is_correct;
    if (isCorrect) totalCorrect++;
    const bucket = byCategory.get(q.category) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (isCorrect) bucket.correct += 1;
    byCategory.set(q.category, bucket);
  }

  const categoryScores: CategoryScore[] = Array.from(byCategory.entries()).map(
    ([category, v]) => ({
      category,
      correct: v.correct,
      total: v.total,
      percent: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    })
  );

  const overallScore =
    questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;

  const sorted = [...categoryScores].sort((a, b) => b.percent - a.percent);
  const strongest = sorted[0]?.category ?? null;
  const priority = sorted[sorted.length - 1]?.category ?? null;

  await run(
    `UPDATE assessment_sessions SET status = 'completed', completed_at = datetime('now') WHERE id = ?`,
    [sessionId]
  );

  const { lastInsertRowid } = await run(
    `INSERT INTO assessment_results (assessment_session_id, overall_score, category_scores_json, strongest_area, priority_area)
     VALUES (?, ?, ?, ?, ?)`,
    [sessionId, overallScore, JSON.stringify(categoryScores), strongest, priority]
  );

  return (await getAssessmentResultById(Number(lastInsertRowid)))!;
}

export async function getAssessmentResultById(id: number): Promise<AssessmentResult | null> {
  const row = await get<{
    id: number;
    assessment_session_id: number;
    overall_score: number;
    category_scores_json: string;
    strongest_area: string | null;
    priority_area: string | null;
    created_at: string;
  }>(`SELECT * FROM assessment_results WHERE id = ?`, [id]);
  if (!row) return null;
  return {
    id: row.id,
    assessment_session_id: row.assessment_session_id,
    overall_score: row.overall_score,
    category_scores: JSON.parse(row.category_scores_json),
    strongest_area: row.strongest_area,
    priority_area: row.priority_area,
    created_at: row.created_at,
  };
}

export async function getAssessmentResultBySession(sessionId: number): Promise<AssessmentResult | null> {
  const row = await get<{ id: number }>(
    `SELECT * FROM assessment_results WHERE assessment_session_id = ? ORDER BY id DESC LIMIT 1`,
    [sessionId]
  );
  return row ? getAssessmentResultById(row.id) : null;
}

export async function getUserAttemptStats(userId: number) {
  const rows = await all<{ category: string; is_correct: number }>(
    `SELECT q.category as category, qa.is_correct as is_correct
     FROM question_attempts qa
     JOIN questions q ON q.id = qa.question_id
     WHERE qa.user_id = ?`,
    [userId]
  );

  const byCategory = new Map<string, { correct: number; total: number }>();
  for (const row of rows) {
    const bucket = byCategory.get(row.category) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (row.is_correct) bucket.correct += 1;
    byCategory.set(row.category, bucket);
  }
  return byCategory;
}

export async function getUserPracticeDays(userId: number, sinceDays = 30): Promise<string[]> {
  const rows = await all<{ day: string }>(
    `SELECT DISTINCT date(created_at) as day FROM question_attempts
     WHERE user_id = ? AND created_at >= datetime('now', ?)
     ORDER BY day DESC`,
    [userId, `-${sinceDays} days`]
  );
  return rows.map((r) => r.day);
}
