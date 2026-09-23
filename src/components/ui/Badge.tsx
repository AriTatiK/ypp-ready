type Tone = "navy" | "green" | "terracotta" | "neutral";

const tones: Record<Tone, string> = {
  navy: "bg-navy-900/10 text-navy-900",
  green: "bg-green-100 text-green-700",
  terracotta: "bg-terracotta-100 text-terracotta-600",
  neutral: "bg-paper-alt text-ink-soft",
};

export default function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function difficultyTone(difficulty: string): Tone {
  if (difficulty === "Easy") return "green";
  if (difficulty === "Hard") return "terracotta";
  return "navy";
}
