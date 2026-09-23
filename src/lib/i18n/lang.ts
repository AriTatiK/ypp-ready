import { cookies } from "next/headers";
import type { Lang } from "../types";

export const LANG_COOKIE = "ypp_lang";

/** Reads the active UI language from the cookie set by the header switcher. Defaults to 'en'. */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return value === "fr" ? "fr" : "en";
}

export async function setLangCookie(lang: Lang): Promise<void> {
  const store = await cookies();
  store.set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
