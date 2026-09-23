"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";

export default function MobileNav({ dict }: { dict: Dictionary }) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: dict.nav.home, icon: "🏠" },
    { href: "/assessment", label: dict.nav.practice, icon: "🧠" },
    { href: "/learn", label: dict.nav.learn, icon: "📘" },
    { href: "/interview", label: dict.nav.interview, icon: "🎤" },
    { href: "/progress", label: dict.nav.progress, icon: "📈" },
  ];

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-between border-t border-border-subtle bg-paper/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              active ? "text-navy-900" : "text-ink-soft"
            }`}
          >
            <span aria-hidden className="text-lg leading-none">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
