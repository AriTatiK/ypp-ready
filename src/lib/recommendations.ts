import "server-only";
import { pickRandomQuestionIds } from "./db/questions";
import { getAllLessons } from "./db/lessons";
import { getUserOrganizations } from "./db/users";
import { ORG_LESSON_SCOPES } from "./types";
import type { ReadinessBreakdown } from "./types";
import { getOrCreateTodayChallenge, type DailyChallengeItem } from "./db/daily";

export async function buildTodayChallenge(userId: number) {
  return getOrCreateTodayChallenge(userId, async () => {
    const items: DailyChallengeItem[] = [];

    const [numerical] = await pickRandomQuestionIds({ category: "Numerical Reasoning", count: 1 });
    items.push({ type: "numerical", refId: numerical ?? null, completed: false });

    const [verbal] = await pickRandomQuestionIds({ category: "Verbal Reasoning", count: 1 });
    items.push({ type: "verbal", refId: verbal ?? null, completed: false });

    const [development] = await pickRandomQuestionIds({ category: "Development Knowledge", count: 1 });
    items.push({ type: "development", refId: development ?? null, completed: false });

    const selectedOrgs = (await getUserOrganizations(userId))
      .map((o) => o.code)
      .filter((c): c is (typeof ORG_LESSON_SCOPES)[number] => ORG_LESSON_SCOPES.includes(c as never));
    const orgScope = selectedOrgs[0] ?? ORG_LESSON_SCOPES[0];
    const orgLessons = (await getAllLessons()).filter((l) => l.org_scope === orgScope);
    const orgLesson = orgLessons[Math.floor(Math.random() * Math.max(orgLessons.length, 1))];
    items.push({ type: "organization", refId: orgLesson?.id ?? null, completed: false });

    items.push({ type: "interview", refId: null, completed: false });

    return items;
  });
}

/**
 * Priority-area routing: given the readiness breakdown's weakest component,
 * decide where "today's" primary recommended action should point.
 */
export function priorityAreaRoute(priorityKey: string): { href: string; ctaKey: "ctaDiagnostic" | "ctaPractice" | "ctaContinue" } {
  switch (priorityKey) {
    case "assessment":
      return { href: "/assessment", ctaKey: "ctaDiagnostic" };
    case "development":
      return { href: "/learn", ctaKey: "ctaContinue" };
    case "organization":
      return { href: "/organizations", ctaKey: "ctaContinue" };
    case "interview":
      return { href: "/interview", ctaKey: "ctaPractice" };
    case "consistency":
    default:
      return { href: "/today", ctaKey: "ctaContinue" };
  }
}

export function hasAnyActivity(r: ReadinessBreakdown): boolean {
  return r.assessment + r.development + r.organization + r.interview + r.consistency > 0;
}
