"use client";

import { useActionState, useState } from "react";
import { saveOnboardingAction, type OnboardingState } from "@/app/actions/onboarding";
import type { Dictionary } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { ORG_OPTIONS } from "@/lib/types";
import Button from "@/components/ui/Button";

const initialState: OnboardingState = { error: null };

export default function OnboardingForm({ dict, lang }: { dict: Dictionary; lang: Lang }) {
  const [state, formAction, isPending] = useActionState(saveOnboardingAction, initialState);
  const [showOther, setShowOther] = useState(false);

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <fieldset>
        <legend className="text-base font-semibold text-ink">{dict.onboarding.orgQuestion}</legend>
        <p className="mt-1 text-sm text-ink-soft">{dict.onboarding.orgHint}</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ORG_OPTIONS.map((org) => (
            <label
              key={org.code}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border-subtle bg-white px-3 py-2.5 has-[:checked]:border-navy-800 has-[:checked]:bg-navy-900/5"
            >
              <input type="checkbox" name="organizations" value={org.code} className="h-4 w-4 accent-navy-900" />
              <span className="text-sm text-ink">{org.label[lang]}</span>
            </label>
          ))}
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border-subtle bg-white px-3 py-2.5 has-[:checked]:border-navy-800 has-[:checked]:bg-navy-900/5">
            <input
              type="checkbox"
              name="organizations"
              value="Other"
              className="h-4 w-4 accent-navy-900"
              onChange={(e) => setShowOther(e.target.checked)}
            />
            <span className="text-sm text-ink">{lang === "fr" ? "Autre" : "Other"}</span>
          </label>
        </div>
        {showOther && (
          <input
            type="text"
            name="otherText"
            placeholder={dict.onboarding.otherPlaceholder}
            className="mt-3 w-full min-h-11 rounded-md border border-border-subtle bg-white px-3 py-2 text-ink"
          />
        )}
      </fieldset>

      <fieldset>
        <legend className="text-base font-semibold text-ink">{dict.onboarding.languageQuestion}</legend>
        <div className="mt-3 flex gap-3">
          <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-border-subtle bg-white px-3 py-2.5 has-[:checked]:border-navy-800 has-[:checked]:bg-navy-900/5">
            <input type="radio" name="preferredLanguage" value="en" defaultChecked={lang === "en"} className="accent-navy-900" />
            <span className="text-sm text-ink">English</span>
          </label>
          <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-border-subtle bg-white px-3 py-2.5 has-[:checked]:border-navy-800 has-[:checked]:bg-navy-900/5">
            <input type="radio" name="preferredLanguage" value="fr" defaultChecked={lang === "fr"} className="accent-navy-900" />
            <span className="text-sm text-ink">Français</span>
          </label>
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-md bg-terracotta-100 px-3 py-2 text-sm text-terracotta-600">
          {dict.common.requiredField}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? dict.common.loading : dict.onboarding.continueCta}
      </Button>
      <p className="text-center text-xs text-ink-soft">{dict.onboarding.skipHint}</p>
    </form>
  );
}
