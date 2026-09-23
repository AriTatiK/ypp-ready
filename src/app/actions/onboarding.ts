"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { setUserOrganizations, updateUserLanguage } from "@/lib/db/users";
import { onboardingSchema } from "@/lib/validations";
import { trackEvent } from "@/lib/db/analytics";
import { setLangCookie } from "@/lib/i18n/lang";
import type { Lang } from "@/lib/types";

export type OnboardingState = { error: string | null };

export async function saveOnboardingAction(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const user = await requireUser("/onboarding");

  const organizations = formData.getAll("organizations").map(String);
  const otherText = String(formData.get("otherText") ?? "");
  const preferredLanguage = String(formData.get("preferredLanguage") ?? "en") as Lang;

  const parsed = onboardingSchema.safeParse({ organizations, otherText, preferredLanguage });
  if (!parsed.success) {
    return { error: "missingFields" };
  }

  await setUserOrganizations(user.id, parsed.data.organizations, parsed.data.otherText);
  await updateUserLanguage(user.id, parsed.data.preferredLanguage);
  await setLangCookie(parsed.data.preferredLanguage);

  await trackEvent("organization_selected", user.id, { organizations: parsed.data.organizations });

  redirect("/assessment/diagnostic");
}
