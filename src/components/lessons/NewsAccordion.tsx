"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Lang, Lesson } from "@/lib/types";
import Badge from "@/components/ui/Badge";

/**
 * Collapsible index for the 8 "International Development News" sub-themes.
 * Native <details>/<summary> semantics (keyboard- and screen-reader-friendly
 * out of the box), lightly controlled via React state so "Expand all /
 * Collapse all" can drive every item at once.
 */
export default function NewsAccordion({
  lessons,
  lang,
  dict,
  completedIds,
}: {
  lessons: Lesson[];
  lang: Lang;
  dict: Dictionary;
  completedIds: Set<string>;
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function toggle(id: string, open: boolean) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-3 flex justify-end gap-4 text-sm">
        <button
          type="button"
          className="min-h-11 font-medium text-navy-900 underline underline-offset-2 hover:text-navy-700"
          onClick={() => setOpenIds(new Set(lessons.map((l) => l.id)))}
        >
          {dict.learn.expandAll}
        </button>
        <button
          type="button"
          className="min-h-11 font-medium text-navy-900 underline underline-offset-2 hover:text-navy-700"
          onClick={() => setOpenIds(new Set())}
        >
          {dict.learn.collapseAll}
        </button>
      </div>

      <div className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-white/60 shadow-sm">
        {lessons.map((lesson) => {
          const done = completedIds.has(lesson.id);
          return (
            <details
              key={lesson.id}
              open={openIds.has(lesson.id)}
              onToggle={(e) => toggle(lesson.id, e.currentTarget.open)}
              className="group"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-6">
                <span className="flex items-center gap-2 font-medium text-ink">
                  {lesson.title[lang]}
                  {done && <Badge tone="green">{dict.learn.lessonComplete}</Badge>}
                </span>
                <span
                  aria-hidden
                  className="text-ink-soft transition-transform group-open:rotate-180"
                >
                  ▾
                </span>
              </summary>
              <div className="px-4 pb-5 sm:px-6">
                <p className="text-sm text-ink">{lesson.simple_definition[lang]}</p>
                {lesson.african_context && (
                  <p className="mt-3 text-sm text-ink-soft">
                    <span className="font-medium text-ink">{dict.learn.africanContextLabel} : </span>
                    {lesson.african_context[lang]}
                  </p>
                )}
                {lesson.one_line_summary && (
                  <p className="mt-3 rounded-lg border border-navy-800/20 bg-navy-900/5 p-3 text-sm font-medium text-ink">
                    {lesson.one_line_summary[lang]}
                  </p>
                )}
                <Link
                  href={`/learn/${lesson.id}`}
                  className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-navy-900 underline underline-offset-2 hover:text-navy-700"
                >
                  {dict.common.seeDetails} →
                </Link>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
