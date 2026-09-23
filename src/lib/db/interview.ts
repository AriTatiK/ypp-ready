import { all, get, run, batch } from "./index";
import type { InterviewQuestion } from "../types";

type InterviewQuestionRow = {
  id: string;
  category: string;
  org_scope: string;
  question_en: string;
  question_fr: string;
  tip_en: string | null;
  tip_fr: string | null;
  label: string;
};

function toInterviewQuestion(row: InterviewQuestionRow): InterviewQuestion {
  return {
    id: row.id,
    category: row.category,
    org_scope: row.org_scope as InterviewQuestion["org_scope"],
    question: { en: row.question_en, fr: row.question_fr },
    tip: { en: row.tip_en ?? "", fr: row.tip_fr ?? "" },
    label: row.label,
  };
}

export async function upsertInterviewQuestion(q: InterviewQuestion): Promise<void> {
  await run(
    `INSERT INTO interview_questions (id, category, org_scope, question_en, question_fr, tip_en, tip_fr, label)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       category=excluded.category, org_scope=excluded.org_scope,
       question_en=excluded.question_en, question_fr=excluded.question_fr,
       tip_en=excluded.tip_en, tip_fr=excluded.tip_fr, label=excluded.label
    `,
    [q.id, q.category, q.org_scope, q.question.en, q.question.fr, q.tip.en, q.tip.fr, q.label]
  );
}

export async function deleteInterviewQuestion(id: string): Promise<void> {
  await batch([
    { sql: `DELETE FROM interview_answers WHERE interview_question_id = ?`, args: [id] },
    { sql: `DELETE FROM interview_questions WHERE id = ?`, args: [id] },
  ]);
}

export async function getAllInterviewQuestions(): Promise<InterviewQuestion[]> {
  const rows = await all<InterviewQuestionRow>(`SELECT * FROM interview_questions ORDER BY category, id`);
  return rows.map(toInterviewQuestion);
}

export async function getInterviewQuestionsByCategory(category: string): Promise<InterviewQuestion[]> {
  const rows = await all<InterviewQuestionRow>(
    `SELECT * FROM interview_questions WHERE category = ? ORDER BY id`,
    [category]
  );
  return rows.map(toInterviewQuestion);
}

export async function getInterviewQuestionById(id: string): Promise<InterviewQuestion | null> {
  const row = await get<InterviewQuestionRow>(`SELECT * FROM interview_questions WHERE id = ?`, [id]);
  return row ? toInterviewQuestion(row) : null;
}

export async function getRandomInterviewQuestions(count: number): Promise<InterviewQuestion[]> {
  const rows = await all<InterviewQuestionRow>(
    `SELECT * FROM interview_questions ORDER BY RANDOM() LIMIT ?`,
    [count]
  );
  return rows.map(toInterviewQuestion);
}

// ---- STAR answers ----

export type StarAnswer = {
  id: number;
  user_id: number;
  interview_question_id: string;
  situation: string | null;
  task: string | null;
  action: string | null;
  result: string | null;
  ai_score: unknown | null;
  updated_at: string;
};

type InterviewAnswerRow = {
  id: number;
  user_id: number;
  interview_question_id: string;
  situation: string | null;
  task: string | null;
  action: string | null;
  result: string | null;
  ai_score_json: string | null;
  updated_at: string;
};

export async function saveStarAnswer(input: {
  userId: number;
  interviewQuestionId: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}): Promise<void> {
  await run(
    `INSERT INTO interview_answers (user_id, interview_question_id, situation, task, action, result, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, interview_question_id) DO UPDATE SET
       situation=excluded.situation, task=excluded.task, action=excluded.action, result=excluded.result,
       updated_at=datetime('now')
    `,
    [input.userId, input.interviewQuestionId, input.situation, input.task, input.action, input.result]
  );
}

export async function saveStarAiScore(
  userId: number,
  interviewQuestionId: string,
  aiScore: unknown
): Promise<void> {
  await run(
    `UPDATE interview_answers SET ai_score_json = ? WHERE user_id = ? AND interview_question_id = ?`,
    [JSON.stringify(aiScore), userId, interviewQuestionId]
  );
}

export async function getStarAnswer(userId: number, interviewQuestionId: string): Promise<StarAnswer | null> {
  const row = await get<InterviewAnswerRow>(
    `SELECT * FROM interview_answers WHERE user_id = ? AND interview_question_id = ?`,
    [userId, interviewQuestionId]
  );
  if (!row) return null;
  return {
    ...row,
    ai_score: row.ai_score_json ? JSON.parse(row.ai_score_json) : null,
  };
}

export async function getUserStarAnswers(userId: number): Promise<StarAnswer[]> {
  const rows = await all<InterviewAnswerRow>(
    `SELECT * FROM interview_answers WHERE user_id = ? ORDER BY updated_at DESC`,
    [userId]
  );
  return rows.map((row) => ({ ...row, ai_score: row.ai_score_json ? JSON.parse(row.ai_score_json) : null }));
}

// ---- Mock interview sessions ----

type MockInterviewSessionRow = {
  id: number;
  user_id: number;
  mode: string;
  question_ids_json: string;
  status: string;
  started_at: string;
  completed_at: string | null;
};

export async function createMockInterviewSession(input: {
  userId: number;
  mode: "quick" | "practice" | "mock";
  questionIds: string[];
}) {
  const { lastInsertRowid } = await run(
    `INSERT INTO mock_interview_sessions (user_id, mode, question_ids_json) VALUES (?, ?, ?)`,
    [input.userId, input.mode, JSON.stringify(input.questionIds)]
  );
  return (await getMockInterviewSession(Number(lastInsertRowid)))!;
}

export async function getMockInterviewSession(id: number) {
  const row = await get<MockInterviewSessionRow>(`SELECT * FROM mock_interview_sessions WHERE id = ?`, [id]);
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    mode: row.mode as "quick" | "practice" | "mock",
    questionIds: JSON.parse(row.question_ids_json) as string[],
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export async function completeMockInterviewSession(
  sessionId: number,
  result: {
    readinessScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }
): Promise<void> {
  await batch([
    {
      sql: `UPDATE mock_interview_sessions SET status = 'completed', completed_at = datetime('now') WHERE id = ?`,
      args: [sessionId],
    },
    {
      sql: `INSERT INTO mock_interview_results (mock_interview_session_id, readiness_score, strengths_json, weaknesses_json, recommendations_json)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        sessionId,
        result.readinessScore,
        JSON.stringify(result.strengths),
        JSON.stringify(result.weaknesses),
        JSON.stringify(result.recommendations),
      ],
    },
  ]);
}

export async function getMockInterviewResult(sessionId: number) {
  const row = await get<{
    readiness_score: number;
    strengths_json: string;
    weaknesses_json: string;
    recommendations_json: string;
  }>(
    `SELECT * FROM mock_interview_results WHERE mock_interview_session_id = ? ORDER BY id DESC LIMIT 1`,
    [sessionId]
  );
  if (!row) return null;
  return {
    readinessScore: row.readiness_score,
    strengths: JSON.parse(row.strengths_json) as string[],
    weaknesses: JSON.parse(row.weaknesses_json) as string[],
    recommendations: JSON.parse(row.recommendations_json) as string[],
  };
}
