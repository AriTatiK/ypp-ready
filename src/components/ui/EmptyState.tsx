import type { ReactNode } from "react";

export default function EmptyState({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border-subtle bg-paper-alt/50 px-6 py-10 text-center">
      <p className="text-ink-soft">{title}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
