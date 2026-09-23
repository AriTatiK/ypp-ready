function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Persistent, readable countdown display — no flashing, just a calm color shift once time is low. */
export default function Timer({
  remainingSeconds,
  label,
  warning,
}: {
  remainingSeconds: number;
  label: string;
  warning?: boolean;
}) {
  return (
    <div
      role="timer"
      aria-live="off"
      className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium tabular-nums ${
        warning
          ? "border-terracotta-600 bg-terracotta-100/50 text-terracotta-600"
          : "border-border-subtle bg-white text-ink"
      }`}
    >
      <span aria-hidden>⏱</span>
      <span>
        {formatClock(remainingSeconds)} {label}
      </span>
    </div>
  );
}
