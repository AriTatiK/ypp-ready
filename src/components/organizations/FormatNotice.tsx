import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

/**
 * "The real format of the AfDB online assessment" — confirmed by the YPP
 * coordinator (45 minutes once started, QCM only, 4 domains). Shown in full
 * on the Assessment hub and the AfDB organization page; shown as a short
 * teaser (linking to the full version) on the dashboard for users who
 * selected AfDB as a target organization.
 */
export default function FormatNotice({
  dict,
  compact = false,
}: {
  dict: Dictionary;
  compact?: boolean;
}) {
  const n = dict.formatNotice;

  if (compact) {
    return (
      <Card className="border-terracotta-100 bg-terracotta-100/10">
        <p className="text-sm text-ink">{n.dashboardTeaser}</p>
        <Link
          href="/assessment#afdb-real"
          className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-navy-900 underline underline-offset-2 hover:text-navy-700"
        >
          {n.title} →
        </Link>
      </Card>
    );
  }

  const domains = [n.domain1, n.domain2, n.domain3, n.domain4];

  return (
    <Card id="afdb-real" className="border-navy-800/20 bg-navy-900/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">{n.title}</h2>
        <Badge tone="navy">{n.durationValue}</Badge>
      </div>
      <p className="mt-2 text-sm text-ink-soft">{n.intro}</p>

      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{n.durationLabel}</dt>
          <dd className="mt-1 text-sm text-ink">{n.durationValue}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{n.formatLabel}</dt>
          <dd className="mt-1 text-sm text-ink">{n.formatValue}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{n.domainsLabel}</h3>
        <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {domains.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink">
              <span aria-hidden className="mt-0.5 text-green-700">✓</span>
              {d}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-green-700/20 bg-green-100/40 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-green-700">{n.includedTitle}</h3>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {domains.map((d, i) => (
              <li key={i}>• {d}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-terracotta-100 bg-terracotta-100/10 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-terracotta-600">{n.notIncludedTitle}</h3>
          <p className="mt-1 text-xs text-ink-soft">{n.notIncludedIntro}</p>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            <li>• {n.notIncludedItem1}</li>
            <li>• {n.notIncludedItem2}</li>
            <li>• {n.notIncludedItem3}</li>
          </ul>
        </div>
      </div>

      <div className="mt-5">
        <Link
          href="/assessment/afdb-real"
          className="inline-flex min-h-11 items-center rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-paper hover:bg-navy-700"
        >
          {n.ctaLabel}
        </Link>
      </div>
    </Card>
  );
}
