import { ASSESSMENT_CATEGORIES } from "@/lib/types";
import type { CategoryScore, Lang } from "@/lib/types";

export function categoryDisplayLabel(category: string, lang: Lang): string {
  return ASSESSMENT_CATEGORIES.find((c) => c.key === category)?.label[lang] ?? category;
}

export function categoryToneFor(percent: number): "green" | "terracotta" | "navy" {
  if (percent >= 70) return "green";
  if (percent < 50) return "terracotta";
  return "navy";
}

/** Strengths are categories scored at 70%+, needs-improvement is under 50% — per product spec. */
export function splitByPerformance(scores: CategoryScore[]): {
  strengths: CategoryScore[];
  needsImprovement: CategoryScore[];
} {
  return {
    strengths: scores.filter((s) => s.percent >= 70),
    needsImprovement: scores.filter((s) => s.percent < 50),
  };
}
