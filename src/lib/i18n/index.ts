import en from "./en";
import fr from "./fr";
import type { Lang } from "../types";

export type Dictionary = typeof en;

export function getDictionary(lang: Lang): Dictionary {
  return lang === "fr" ? fr : en;
}

/** Very small {token} interpolation helper for translated template strings. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`
  );
}

export { getLang, setLangCookie, LANG_COOKIE } from "./lang";
export type { Lang } from "../types";
