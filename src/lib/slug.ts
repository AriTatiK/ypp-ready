import { ASSESSMENT_CATEGORIES, ORG_LESSON_SCOPES, INTERVIEW_CATEGORIES } from "./types";

/**
 * Route-safe slugs for values that contain spaces or punctuation
 * ("Numerical Reasoning" -> "numerical-reasoning", "World Bank" -> "world-bank",
 * "Failure & Learning" -> "failure-learning"). Use these for every dynamic
 * route segment instead of raw category/org strings.
 */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function assessmentCategorySlug(category: string): string {
  return toSlug(category);
}

export function assessmentCategoryFromSlug(slug: string): string | null {
  const match = ASSESSMENT_CATEGORIES.find((c) => toSlug(c.key) === slug);
  return match ? match.key : null;
}

export function orgSlug(org: string): string {
  return toSlug(org);
}

export function orgFromSlug(slug: string): (typeof ORG_LESSON_SCOPES)[number] | null {
  const match = ORG_LESSON_SCOPES.find((o) => toSlug(o) === slug);
  return match ?? null;
}

export function interviewCategorySlug(category: string): string {
  return toSlug(category);
}

export function interviewCategoryFromSlug(slug: string): string | null {
  const match = INTERVIEW_CATEGORIES.find((c) => toSlug(c) === slug);
  return match ?? null;
}
