import { all, get, run, batch } from "./index";
import type { Lang, User } from "../types";

type UserRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  preferred_language: string;
  is_admin: number;
  created_at: string;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    preferred_language: (row.preferred_language as Lang) ?? "en",
    is_admin: !!row.is_admin,
    created_at: row.created_at,
  };
}

export async function createUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  preferredLanguage: Lang;
}): Promise<User> {
  const { lastInsertRowid } = await run(
    `INSERT INTO users (first_name, last_name, email, password_hash, preferred_language)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.firstName,
      input.lastName,
      input.email.toLowerCase().trim(),
      input.passwordHash,
      input.preferredLanguage,
    ]
  );
  return (await getUserById(Number(lastInsertRowid)))!;
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const row = await get<UserRow>(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
  if (!row) return null;
  return { ...toUser(row), password_hash: row.password_hash };
}

export async function getUserById(id: number): Promise<User | null> {
  const row = await get<UserRow>(`SELECT * FROM users WHERE id = ?`, [id]);
  return row ? toUser(row) : null;
}

export async function setUserAdmin(userId: number, isAdmin: boolean): Promise<void> {
  await run(`UPDATE users SET is_admin = ? WHERE id = ?`, [isAdmin ? 1 : 0, userId]);
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  await run(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, userId]);
}

export async function updateUserLanguage(userId: number, lang: Lang): Promise<void> {
  await run(`UPDATE users SET preferred_language = ? WHERE id = ?`, [lang, userId]);
}

export async function setUserOrganizations(
  userId: number,
  orgCodes: string[],
  otherText?: string | null
): Promise<void> {
  await batch([
    { sql: `DELETE FROM user_organizations WHERE user_id = ?`, args: [userId] },
    ...orgCodes.map((code) => ({
      sql: `INSERT INTO user_organizations (user_id, organization_code, other_text) VALUES (?, ?, ?)`,
      args: [userId, code, code === "Other" ? otherText ?? null : null],
    })),
  ]);
}

export async function getUserOrganizations(
  userId: number
): Promise<{ code: string; otherText: string | null }[]> {
  const rows = await all<{ organization_code: string; other_text: string | null }>(
    `SELECT organization_code, other_text FROM user_organizations WHERE user_id = ?`,
    [userId]
  );
  return rows.map((r) => ({ code: r.organization_code, otherText: r.other_text }));
}

export async function createPasswordResetToken(
  userId: number,
  token: string,
  expiresAt: string
): Promise<void> {
  await run(`INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`, [
    userId,
    token,
    expiresAt,
  ]);
}

export async function consumePasswordResetToken(token: string): Promise<number | null> {
  const row = await get<{ id: number; user_id: number; expires_at: string; used: number }>(
    `SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = ?`,
    [token]
  );
  if (!row) return null;
  if (row.used) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  await run(`UPDATE password_reset_tokens SET used = 1 WHERE id = ?`, [row.id]);
  return row.user_id;
}
