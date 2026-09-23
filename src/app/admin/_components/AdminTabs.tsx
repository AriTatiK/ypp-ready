import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";

type TabKey = "questions" | "lessons" | "interview";

export default function AdminTabs({ active, dict }: { active: TabKey; dict: Dictionary }) {
  const tabs: { key: TabKey; href: string; label: string }[] = [
    { key: "questions", href: "/admin/questions", label: dict.admin.questionsTab },
    { key: "lessons", href: "/admin/lessons", label: dict.admin.lessonsTab },
    { key: "interview", href: "/admin/interview", label: dict.admin.interviewTab },
  ];

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border-subtle">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            active === tab.key
              ? "border-navy-900 text-navy-900"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
