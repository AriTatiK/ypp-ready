"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ActionState } from "@/app/actions/auth";
import type { Dictionary } from "@/lib/i18n";
import Button from "@/components/ui/Button";

const initialState: ActionState = { error: null };

export default function ForgotPasswordForm({ dict }: { dict: Dictionary }) {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);

  if (state.resetLink) {
    return (
      <div className="space-y-4">
        <p className="rounded-md bg-green-100 px-3 py-2 text-sm text-green-700">{dict.auth.resetLinkNote}</p>
        <Link
          href={state.resetLink}
          className="block rounded-md bg-navy-900 px-4 py-3 text-center text-sm font-medium text-paper hover:bg-navy-800"
        >
          {dict.auth.resetPasswordTitle} →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <p className="text-sm text-ink-soft">{dict.auth.forgotPasswordSubtitle}</p>
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
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? dict.common.loading : dict.auth.forgotPasswordCta}
      </Button>
    </form>
  );
}
