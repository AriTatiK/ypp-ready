import type { Dictionary } from "@/lib/i18n";

/** The internal-indicator disclaimer required next to any score display (spec §14, §34). */
export function ScoreDisclaimer({ dict, text }: { dict: Dictionary; text?: string }) {
  return (
    <p className="mt-2 max-w-prose text-xs text-ink-soft">
      {text ?? dict.dashboard.readinessDisclaimer}
    </p>
  );
}

/** The organization-affiliation disclaimer (spec §37, §55). Used in the footer and org pages. */
export function OrgDisclaimer({ dict, className = "" }: { dict: Dictionary; className?: string }) {
  return (
    <div className={`rounded-lg border border-border-subtle bg-paper-alt/60 p-4 text-xs text-ink-soft ${className}`}>
      <p>{dict.footer.disclaimer}</p>
      <p className="mt-2">{dict.footer.practiceNotice}</p>
    </div>
  );
}
