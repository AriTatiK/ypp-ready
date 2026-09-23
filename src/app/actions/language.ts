"use server";

import { setLangCookie } from "@/lib/i18n/lang";
import { getCurrentUser } from "@/lib/auth";
import { updateUserLanguage } from "@/lib/db/users";
import { trackEvent } from "@/lib/db/analytics";
import type { Lang } from "@/lib/types";

export async function setLanguageAction(lang: Lang) {
  await setLangCookie(lang);
  const user = await getCurrentUser();
  if (user) {
    await updateUserLanguage(user.id, lang);
  }
  await trackEvent("language_changed", user?.id ?? null, { lang });
}
