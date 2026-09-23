export default function ProgressBar({
  percent,
  label,
  tone = "navy",
}: {
  percent: number;
  label?: string;
  tone?: "navy" | "green" | "terracotta";
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const barColor =
    tone === "green" ? "bg-green-600" : tone === "terracotta" ? "bg-terracotta-600" : "bg-navy-800";

  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-ink-soft">{label}</span>
          <span className="font-semibold text-ink">{clamped}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2.5 w-full overflow-hidden rounded-full bg-paper-alt"
      >
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
