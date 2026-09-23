import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary, format } from "@/lib/i18n";
import { buildTodayChallenge } from "@/lib/recommendations";
import { getPreparationStreak, type DailyChallengeItem } from "@/lib/db/daily";
import { getQuestionById } from "@/lib/db/questions";
import { getLessonById, getUserLessonProgress } from "@/lib/db/lessons";
import { get } from "@/lib/db";
import { assessmentCategorySlug, orgSlug } from "@/lib/slug";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export const metadata = { title: "Today's Challenge — YPPReady" };

const ICONS: Record<DailyChallengeItem["type"], string> = {
  numerical: "🔢",
  verbal: "🗣️",
  development: "🌍",
  organization: "🏛",
  interview: "🎤",
};

async function isQuestionAttemptedToday(userId: number, questionId: string): Promise<boolean> {
  const row = await get(
    `SELECT 1 FROM question_attempts WHERE user_id = ? AND question_id = ? AND date(created_at) = date('now') LIMIT 1`,
    [userId, questionId]
  );
  return !!row;
}

async function isInterviewDoneToday(userId: number): Promise<boolean> {
  const answered = await get(
    `SELECT 1 FROM interview_answers WHERE user_id = ? AND date(updated_at) = date('now') LIMIT 1`,
    [userId]
  );
  if (answered) return true;
  const mocked = await get(
    `SELECT 1 FROM mock_interview_sessions WHERE user_id = ? AND date(started_at) = date('now') LIMIT 1`,
    [userId]
  );
  return !!mocked;
}

export default async function TodayPage() {
  const user = await requireUser("/today");
  const lang = await getLang();
  const dict = getDictionary(lang);

  const challenge = await buildTodayChallenge(user.id);
  const streak = await getPreparationStreak(user.id);
  const lessonProgress = await getUserLessonProgress(user.id);
  const interviewDoneToday = await isInterviewDoneToday(user.id);

  const rows = await Promise.all(
    challenge.items.map(async (item) => {
      let completed = false;
      let href: string | null = null;
      let available = true;

      if (item.type === "numerical" || item.type === "verbal" || item.type === "development") {
        if (item.refId) {
          completed = await isQuestionAttemptedToday(user.id, item.refId);
          const question = await getQuestionById(item.refId);
          if (question) {
            href = `/assessment/practice/${assessmentCategorySlug(question.category)}`;
          } else {
            available = false;
          }
        } else {
          available = false;
        }
      } else if (item.type === "organization") {
        if (item.refId) {
          completed = lessonProgress.has(item.refId);
          const lesson = await getLessonById(item.refId);
          if (lesson && lesson.org_scope) {
            href = `/organizations/${orgSlug(lesson.org_scope)}/${lesson.id}`;
          } else {
            available = false;
          }
        } else {
          available = false;
        }
      } else {
        completed = interviewDoneToday;
        href = "/interview";
      }

      return { ...item, completed, href, available };
    })
  );

  const completedCount = rows.filter((r) => r.completed).length;
  const allDone = completedCount === rows.length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{dict.today.title}</h1>
      <p className="mt-2 text-ink-soft">{dict.today.subtitle}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Badge tone="navy">{format(dict.today.completedTemplate, { completed: completedCount, total: rows.length })}</Badge>
        <Badge tone="terracotta">
          {dict.today.streakLabel}: {format(dict.today.streakDays, { days: streak })}
        </Badge>
      </div>

      {allDone && (
        <Card className="mt-6 text-center">
          <h2 className="text-lg font-semibold text-ink">{dict.today.allDoneTitle}</h2>
          <p className="mt-2 text-ink-soft">{dict.today.allDoneBody}</p>
        </Card>
      )}

      <div className="mt-6 space-y-3">
        {rows.map((row) => (
          <Card key={row.type} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span aria-hidden className="text-2xl">
                {ICONS[row.type]}
              </span>
              <span className={`text-ink ${row.completed ? "line-through decoration-ink-soft" : ""}`}>
                {dict.today.activities[row.type]}
              </span>
            </div>
            {row.completed ? (
              <Badge tone="green">
                <span aria-hidden>✓ </span>
                {dict.today.completedLabel}
              </Badge>
            ) : row.available && row.href ? (
              <Button href={row.href} size="sm" variant="secondary">
                {dict.common.continue}
              </Button>
            ) : (
              <span className="text-sm text-ink-soft">{dict.today.unavailable}</span>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
