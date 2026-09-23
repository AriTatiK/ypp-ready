"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type ActionState } from "@/app/actions/auth";
import type { Dictionary } from "@/lib/i18n";
import Button from "@/components/ui/Button";

const initialState: ActionState = { error: null };

export default function ResetPasswordForm({ dict, token }: { dict: Dictionary; token: string }) {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);
  const errorMessage =
    state.error && state.error in dict.auth.errors
      ? dict.auth.errors[state.error as keyof typeof dict.auth.errors]
      : null;

  if (state.error === null && state !== initialState) {
    return (
      <div className="space-y-4">
        <p className="rounded-md bg-green-100 px-3 py-2 text-sm text-green-700">{dict.auth.resetSuccess}</p>
        <Link
          href="/login"
          className="block rounded-md bg-navy-900 px-4 py-3 text-center text-sm font-medium text-paper hover:bg-navy-800"
        >
          {dict.nav.login} →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
          {dict.auth.newPassword}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="w-full min-h-11 rounded-md border border-border-subtle bg-white px-3 py-2 text-ink focus:border-navy-700"
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-ink">
          {dict.auth.confirmPassword}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="w-full min-h-11 rounded-md border border-border-subtle bg-white px-3 py-2 text-ink focus:border-navy-700"
        />
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-md bg-terracotta-100 px-3 py-2 text-sm text-terracotta-600">
          {errorMessage}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? dict.common.loading : dict.auth.resetCta}
      </Button>
    </form>
  );
}
