/** Large readiness score gauge. Never relies on color alone — the numeric
 * percentage and text rating are always shown alongside the ring. */
export default function ReadinessGauge({
  percent,
  ratingLabel,
  size = 168,
}: {
  percent: number;
  ratingLabel: string;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const color =
    clamped >= 70 ? "var(--color-green-700)" : clamped >= 40 ? "var(--color-terracotta-600)" : "var(--color-navy-700)";

  return (
    <div className="inline-flex flex-col items-center gap-2" role="img" aria-label={`${ratingLabel}: ${clamped} percent`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-paper-alt)"
            strokeWidth={12}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 700ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-semibold text-ink">{clamped}%</span>
        </div>
      </div>
      <span className="text-sm font-medium text-ink-soft">{ratingLabel}</span>
    </div>
  );
}
