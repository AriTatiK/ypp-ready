"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/app/actions/auth";
import type { Dictionary } from "@/lib/i18n";
import Button from "@/components/ui/Button";

const initialState: ActionState = { error: null };

export default function LoginForm({ dict, next }: { dict: Dictionary; next?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const errorMessage =
    state.error && state.error in dict.auth.errors
      ? dict.auth.errors[state.error as keyof typeof dict.auth.errors]
      : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
          {dict.auth.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full min-h-11 rounded-md border border-border-subtle bg-white px-3 py-2 text-ink focus:border-navy-700"
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-ink">
            {dict.auth.password}
          </label>
          <Link href="/forgot-password" className="text-xs font-medium text-navy-900 underline underline-offset-2">
            {dict.auth.forgotPasswordLink}
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full min-h-11 rounded-md border border-border-subtle bg-white px-3 py-2 text-ink focus:border-navy-700"
        />
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-md bg-terracotta-100 px-3 py-2 text-sm text-terracotta-600">
          {errorMessage}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? dict.common.loading : dict.auth.loginCta}
      </Button>

      <p className="text-center text-sm text-ink-soft">
        {dict.auth.noAccount}{" "}
        <Link href="/signup" className="font-medium text-navy-900 underline underline-offset-2">
          {dict.nav.signup}
        </Link>
      </p>
    </form>
  );
}
