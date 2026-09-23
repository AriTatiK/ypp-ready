"use server";

import { redirect } from "next/navigation";
import crypto from "node:crypto";
import {
  createUser,
  getUserByEmail,
  updateUserPassword,
  createPasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/db/users";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations";
import { trackEvent } from "@/lib/db/analytics";
import type { Lang } from "@/lib/types";

export type ActionState = { error: string | null; resetLink?: string };

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    preferredLanguage: (String(formData.get("preferredLanguage") ?? "en") as Lang),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message === "passwordMismatch" ? "passwordMismatch" : "missingFields" };
  }

  const existing = await getUserByEmail(parsed.data.email);
  if (existing) {
    return { error: "emailTaken" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await createUser({
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email: parsed.data.email,
    passwordHash,
    preferredLanguage: parsed.data.preferredLanguage,
  });

  await createSession(user.id);
  await trackEvent("user_signed_up", user.id, { preferredLanguage: parsed.data.preferredLanguage });

  redirect("/onboarding");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "missingFields" };
  }

  const user = await getUserByEmail(parsed.data.email);
  if (!user) {
    return { error: "invalidCredentials" };
  }
  const valid = await verifyPassword(parsed.data.password, user.password_hash);
  if (!valid) {
    return { error: "invalidCredentials" };
  }

  await createSession(user.id);

  const nextPath = String(formData.get("next") ?? "");
  redirect(nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = { email: String(formData.get("email") ?? "") };
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "missingFields" };
  }

  const user = await getUserByEmail(parsed.data.email);
  if (!user) {
    // Don't reveal whether the email exists.
    return { error: null };
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour
  await createPasswordResetToken(user.id, token, expiresAt);

  // This MVP has no email delivery configured, so the reset link is
  // surfaced directly in the UI rather than emailed.
  return { error: null, resetLink: `/reset-password?token=${token}` };
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message === "passwordMismatch" ? "passwordMismatch" : "weakPassword" };
  }

  const userId = await consumePasswordResetToken(parsed.data.token);
  if (!userId) {
    return { error: "tokenInvalid" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await updateUserPassword(userId, passwordHash);

  return { error: null };
}
