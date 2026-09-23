"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLanguageAction } from "@/app/actions/language";
import type { Lang } from "@/lib/types";

export default function LanguageSwitcher({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Lang) {
    if (next === lang) return;
    startTransition(async () => {
      await setLanguageAction(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Language selector / Sélecteur de langue"
      className="flex items-center gap-1 rounded-md border border-border-subtle bg-white/70 p-0.5 text-sm font-semibold"
    >
      <button
        type="button"
        onClick={() => switchTo("en")}
        aria-pressed={lang === "en"}
        disabled={isPending}
        className={`rounded px-2 py-1 transition-colors ${
          lang === "en" ? "bg-navy-900 text-paper" : "text-ink-soft hover:bg-paper-alt"
        }`}
      >
        EN
      </button>
      <span aria-hidden className="text-border-subtle">
        |
      </span>
      <button
        type="button"
        onClick={() => switchTo("fr")}
        aria-pressed={lang === "fr"}
        disabled={isPending}
        className={`rounded px-2 py-1 transition-colors ${
          lang === "fr" ? "bg-navy-900 text-paper" : "text-ink-soft hover:bg-paper-alt"
        }`}
      >
        FR
      </button>
    </div>
  );
}
