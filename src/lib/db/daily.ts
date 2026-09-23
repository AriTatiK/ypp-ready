import { all, get, run } from "./index";

export type DailyChallengeItem = {
  type: "numerical" | "verbal" | "development" | "organization" | "interview";
  refId: string | null;
  completed: boolean;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getOrCreateTodayChallenge(
  userId: number,
  buildItems: () => Promise<DailyChallengeItem[]> | DailyChallengeItem[]
): Promise<{ date: string; items: DailyChallengeItem[]; completedCount: number }> {
  const date = today();
  const existing = await get<{ items_json: string; completed_count: number }>(
    `SELECT * FROM daily_challenge_progress WHERE user_id = ? AND challenge_date = ?`,
    [userId, date]
  );

  if (existing) {
    return { date, items: JSON.parse(existing.items_json), completedCount: existing.completed_count };
  }

  const items = await buildItems();
  await run(
    `INSERT INTO daily_challenge_progress (user_id, challenge_date, items_json, completed_count) VALUES (?, ?, ?, 0)`,
    [userId, date, JSON.stringify(items)]
  );
  return { date, items, completedCount: 0 };
}

export async function markChallengeItemComplete(
  userId: number,
  itemType: DailyChallengeItem["type"]
): Promise<void> {
  const date = today();
  const row = await get<{ items_json: string }>(
    `SELECT items_json FROM daily_challenge_progress WHERE user_id = ? AND challenge_date = ?`,
    [userId, date]
  );
  if (!row) return;
  const items = JSON.parse(row.items_json) as DailyChallengeItem[];
  let changed = false;
  for (const item of items) {
    if (item.type === itemType && !item.completed) {
      item.completed = true;
      changed = true;
    }
  }
  if (!changed) return;
  const completedCount = items.filter((i) => i.completed).length;
  await run(
    `UPDATE daily_challenge_progress SET items_json = ?, completed_count = ? WHERE user_id = ? AND challenge_date = ?`,
    [JSON.stringify(items), completedCount, userId, date]
  );
}

/** Counts consecutive days (ending today or yesterday) with at least one completed challenge item. */
export async function getPreparationStreak(userId: number): Promise<number> {
  const rows = await all<{ challenge_date: string }>(
    `SELECT challenge_date FROM daily_challenge_progress
     WHERE user_id = ? AND completed_count > 0
     ORDER BY challenge_date DESC`,
    [userId]
  );

  if (rows.length === 0) return 0;

  const dates = new Set(rows.map((r) => r.challenge_date));
  let streak = 0;
  const cursor = new Date();
  // allow the streak to still "count" today even if today isn't done yet
  if (!dates.has(today())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dates.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
