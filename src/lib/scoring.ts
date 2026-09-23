import "server-only";
import { getUserAttemptStats, getUserPracticeDays } from "./db/assessments";
import { getAllLessons, getUserLessonProgress } from "./db/lessons";
import { getUserOrganizations } from "./db/users";
import { getUserStarAnswers, getMockInterviewResult } from "./db/interview";
import { all, get, run } from "./db";
import { ORG_LESSON_SCOPES, INTERVIEW_CATEGORIES, type Bilingual, type ReadinessBreakdown } from "./types";

/**
 * YPPReady Readiness Score — transparent internal preparation model.
 *
 * Overall = 35% Assessment + 20% Development Knowledge + 15% Organization
 * Knowledge + 20% Interview Readiness + 10% Practice Consistency.
 *
 * This is an internal preparation indicator only. It is never presented as,
 * and must never be confused with, an official recruitment score.
 */

const REASONING_CATEGORIES = [
  "Numerical Reasoning",
  "Verbal Reasoning",
  "Logical Reasoning",
  "Abstract Reasoning",
  "Data Interpretation",
  "Critical Reasoning",
  "Situational Judgment",
];
const DEV_QUESTION_CATEGORY = "Development Knowledge";

const AREA_LABELS: Record<string, Bilingual> = {
  assessment: { en: "Assessment Readiness", fr: "Préparation à l'évaluation" },
  development: { en: "Development Knowledge", fr: "Connaissances en développement" },
  organization: { en: "Organization Knowledge", fr: "Connaissance de l'organisation" },
  interview: { en: "Interview Readiness", fr: "Préparation à l'entretien" },
  consistency: { en: "Practice Consistency", fr: "Régularité d'entraînement" },
};

async function computeAssessmentReadiness(userId: number): Promise<number> {
  const stats = await getUserAttemptStats(userId);
  let weightedSum = 0;
  let totalWeight = 0;
  let coveredCategories = 0;

  for (const category of REASONING_CATEGORIES) {
    const s = stats.get(category);
    if (s && s.total > 0) {
      const weight = Math.min(s.total, 10) / 10;
      weightedSum += weight * (s.correct / s.total);
      totalWeight += weight;
      if (s.total >= 3) coveredCategories += 1;
    }
  }

  const accuracyComponent = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const coverageComponent = Math.min(1, coveredCategories / 5);
  return Math.round(100 * accuracyComponent * (0.6 + 0.4 * coverageComponent));
}

async function computeDevelopmentReadiness(userId: number): Promise<number> {
  const stats = await getUserAttemptStats(userId);
  const devStats = stats.get(DEV_QUESTION_CATEGORY);
  const devAccuracy = devStats && devStats.total > 0 ? devStats.correct / devStats.total : 0;

  const devLessons = (await getAllLessons()).filter((l) => l.category === "Development Knowledge");
  const progress = await getUserLessonProgress(userId);
  const completed = devLessons.filter((l) => progress.has(l.id)).length;
  const completionRatio = devLessons.length > 0 ? completed / devLessons.length : 0;

  return Math.round(100 * (0.6 * completionRatio + 0.4 * devAccuracy));
}

async function computeOrganizationReadiness(userId: number): Promise<number> {
  const selected = (await getUserOrganizations(userId)).map((o) => o.code);
  const targetScopes = ORG_LESSON_SCOPES.filter((scope) => selected.includes(scope));
  const scopesToUse = targetScopes.length > 0 ? targetScopes : ORG_LESSON_SCOPES;

  const allLessons = (await getAllLessons()).filter((l) => l.category === "Organization Knowledge");
  const progress = await getUserLessonProgress(userId);

  let ratioSum = 0;
  for (const scope of scopesToUse) {
    const lessons = allLessons.filter((l) => l.org_scope === scope);
    const completed = lessons.filter((l) => progress.has(l.id)).length;
    ratioSum += lessons.length > 0 ? completed / lessons.length : 0;
  }
  const avgRatio = scopesToUse.length > 0 ? ratioSum / scopesToUse.length : 0;
  return Math.round(100 * avgRatio);
}

async function computeInterviewReadiness(userId: number): Promise<number> {
  const starAnswers = await getUserStarAnswers(userId);
  const categoriesWithAnswers = new Set<string>();
  for (const a of starAnswers) {
    const row = await get<{ category: string }>(`SELECT category FROM interview_questions WHERE id = ?`, [
      a.interview_question_id,
    ]);
    if (row && a.situation && a.task && a.action && a.result) {
      categoriesWithAnswers.add(row.category);
    }
  }
  const starCoverage = categoriesWithAnswers.size / INTERVIEW_CATEGORIES.length;

  // Latest completed mock interview session's readiness score, if any.
  const latestSession = await get<{ id: number }>(
    `SELECT id FROM mock_interview_sessions WHERE user_id = ? AND status = 'completed' ORDER BY id DESC LIMIT 1`,
    [userId]
  );
  const mockResult = latestSession ? await getMockInterviewResult(latestSession.id) : null;
  const mockScore = mockResult ? mockResult.readinessScore / 100 : 0;

  return Math.round(100 * (0.5 * starCoverage + 0.5 * mockScore));
}

async function computePracticeConsistency(userId: number): Promise<number> {
  const activeDays = (await getUserPracticeDays(userId, 14)).length;
  return Math.round(100 * Math.min(1, activeDays / 7));
}

export async function computeReadiness(userId: number): Promise<ReadinessBreakdown> {
  const [assessment, development, organization, interview, consistency] = await Promise.all([
    computeAssessmentReadiness(userId),
    computeDevelopmentReadiness(userId),
    computeOrganizationReadiness(userId),
    computeInterviewReadiness(userId),
    computePracticeConsistency(userId),
  ]);

  const overall = Math.round(
    0.35 * assessment + 0.2 * development + 0.15 * organization + 0.2 * interview + 0.1 * consistency
  );

  const parts: [string, number][] = [
    ["assessment", assessment],
    ["development", development],
    ["organization", organization],
    ["interview", interview],
    ["consistency", consistency],
  ];
  const sorted = [...parts].sort((a, b) => b[1] - a[1]);
  const strongestKey = sorted[0][0];
  const priorityKey = sorted[sorted.length - 1][0];

  return {
    assessment,
    development,
    organization,
    interview,
    consistency,
    overall,
    strongestArea: { key: strongestKey, label: AREA_LABELS[strongestKey] },
    priorityArea: { key: priorityKey, label: AREA_LABELS[priorityKey] },
  };
}

export async function saveReadinessSnapshot(userId: number, r: ReadinessBreakdown): Promise<void> {
  await run(
    `INSERT INTO user_progress_snapshots
      (user_id, assessment_readiness, development_knowledge, organization_knowledge, interview_readiness, practice_consistency, overall_readiness)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, r.assessment, r.development, r.organization, r.interview, r.consistency, r.overall]
  );
}

export async function getReadinessHistory(userId: number, limit = 10) {
  return all(`SELECT * FROM user_progress_snapshots WHERE user_id = ? ORDER BY id DESC LIMIT ?`, [
    userId,
    limit,
  ]);
}

export function readinessRatingKey(overall: number): "ratingLow" | "ratingFair" | "ratingGood" | "ratingStrong" {
  if (overall >= 80) return "ratingStrong";
  if (overall >= 60) return "ratingGood";
  if (overall >= 35) return "ratingFair";
  return "ratingLow";
}
