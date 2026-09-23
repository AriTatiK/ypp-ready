"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type ActionState } from "@/app/actions/auth";
import type { Dictionary } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import Button from "@/components/ui/Button";

const initialState: ActionState = { error: null };

export default function SignupForm({ dict, lang }: { dict: Dictionary; lang: Lang }) {
  const [state, formAction, isPending] = useActionState(signupAction, initialState);

  const errorMessage =
    state.error && state.error in dict.auth.errors
      ? dict.auth.errors[state.error as keyof typeof dict.auth.errors]
      : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={dict.auth.firstName} name="firstName" required autoComplete="given-name" />
        <Field label={dict.auth.lastName} name="lastName" required autoComplete="family-name" />
      </div>
      <Field label={dict.auth.email} name="email" type="email" required autoComplete="email" />
      <Field
        label={dict.auth.password}
        name="password"
        type="password"
        required
        autoComplete="new-password"
        hint={dict.auth.passwordHint}
      />
      <Field
        label={dict.auth.confirmPassword}
        name="confirmPassword"
        type="password"
        required
        autoComplete="new-password"
      />

      <div>
        <label htmlFor="preferredLanguage" className="mb-1 block text-sm font-medium text-ink">
          {dict.auth.preferredLanguage}
        </label>
        <select
          id="preferredLanguage"
          name="preferredLanguage"
          defaultValue={lang}
          className="w-full min-h-11 rounded-md border border-border-subtle bg-white px-3 py-2 text-ink focus:border-navy-700"
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-md bg-terracotta-100 px-3 py-2 text-sm text-terracotta-600">
          {errorMessage}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? dict.common.loading : dict.auth.signupCta}
      </Button>

      <p className="text-center text-sm text-ink-soft">
        {dict.auth.alreadyHaveAccount}{" "}
        <Link href="/login" className="font-medium text-navy-900 underline underline-offset-2">
          {dict.nav.login}
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-ink">
        {label}
        {required && <span aria-hidden> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-describedby={hint ? `${name}-hint` : undefined}
        className="w-full min-h-11 rounded-md border border-border-subtle bg-white px-3 py-2 text-ink placeholder:text-ink-soft/50 focus:border-navy-700"
      />
      {hint && (
        <p id={`${name}-hint`} className="mt-1 text-xs text-ink-soft">
          {hint}
        </p>
      )}
    </div>
  );
}
