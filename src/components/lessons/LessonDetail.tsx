import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Lang, Lesson } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import LessonQuiz from "@/components/lessons/LessonQuiz";

/**
 * Shared lesson detail layout — used by both /learn/[lessonId] (development
 * knowledge lessons) and /organizations/[orgSlug]/[lessonId] (organization
 * lessons). Org lessons additionally surface last-updated + a disclaimer note
 * next to their sources via `showLastUpdatedAndDisclaimer`.
 */
export default function LessonDetail({
  lesson,
  dict,
  lang,
  backHref,
  backLabel,
  progress,
  showLastUpdatedAndDisclaimer = false,
}: {
  lesson: Lesson;
  dict: Dictionary;
  lang: Lang;
  backHref: string;
  backLabel: string;
  progress?: { quizScore: number | null; completedAt: string } | null;
  showLastUpdatedAndDisclaimer?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href={backHref} className="inline-flex min-h-11 items-center text-sm font-medium text-navy-900 hover:underline">
        ← {backLabel}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{lesson.title[lang]}</h1>
        {progress && <Badge tone="green">{dict.learn.lessonComplete}</Badge>}
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{dict.learn.inSimpleTerms}</h2>
        <p className="mt-2 text-ink">{lesson.simple_definition[lang]}</p>
      </section>

      {lesson.structured_sections && lesson.structured_sections.length > 0 && (
        <section className="mt-6 space-y-5">
          {lesson.structured_sections.map((s, i) => (
            <div key={i} className="rounded-lg border border-border-subtle bg-paper-alt/40 p-4">
              <h2 className="text-sm font-semibold text-ink">{s.heading[lang]}</h2>
              <p className="mt-2 whitespace-pre-line text-ink">{s.body[lang]}</p>
            </div>
          ))}
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{dict.learn.whyItMatters}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink">
          {lesson.why_it_matters[lang].map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>

      {lesson.african_context && (
        <section className="mt-6 rounded-lg border border-terracotta-100 bg-terracotta-100/10 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {dict.learn.africanContextLabel}
          </h2>
          <p className="mt-2 text-ink">{lesson.african_context[lang]}</p>
        </section>
      )}

      {lesson.technical_terms && lesson.technical_terms.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {dict.learn.technicalTermsLabel}
          </h2>
          <dl className="mt-2 space-y-2">
            {lesson.technical_terms.map((t, i) => (
              <div key={i}>
                <dt className="font-medium text-ink">{t.term[lang]}</dt>
                <dd className="text-sm text-ink-soft">{t.explanation[lang]}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {lesson.concrete_example && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {dict.learn.concreteExampleLabel}
          </h2>
          <p className="mt-2 text-ink">{lesson.concrete_example[lang]}</p>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{dict.learn.whyYouShouldKnow}</h2>
        <p className="mt-2 text-ink">{lesson.why_you_should_know[lang]}</p>
      </section>

      {lesson.one_line_summary && (
        <section className="mt-6 rounded-lg border border-navy-800/20 bg-navy-900/5 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {dict.learn.oneLineSummaryLabel}
          </h2>
          <p className="mt-2 font-medium text-ink">{lesson.one_line_summary[lang]}</p>
        </section>
      )}

      {lesson.qcm_reflex && (
        <section className="mt-6 rounded-lg border border-terracotta-100 bg-terracotta-100/20 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {dict.learn.qcmReflexLabel}
          </h2>
          <p className="mt-2 text-ink">{lesson.qcm_reflex[lang]}</p>
        </section>
      )}

      {lesson.sources.length > 0 && (
        <section className="mt-6 rounded-lg border border-border-subtle bg-paper-alt/40 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {dict.organizations.sourcesLabel}
          </h2>
          <ul className="mt-2 space-y-1">
            {lesson.sources.map((source, i) => (
              <li key={i}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-navy-900 underline underline-offset-2 hover:text-navy-700"
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
          {showLastUpdatedAndDisclaimer && (
            <div className="mt-3 space-y-1.5 border-t border-border-subtle pt-3 text-xs text-ink-soft">
              {lesson.last_updated && (
                <p>
                  {dict.organizations.lastUpdatedLabel}: {lesson.last_updated}
                </p>
              )}
              <p>{dict.organizations.disclaimerNote}</p>
            </div>
          )}
        </section>
      )}

      <section className="mt-8 rounded-xl border border-border-subtle bg-paper-alt/40 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">{dict.learn.quickQuiz}</h2>
        <div className="mt-4">
          <LessonQuiz
            lessonId={lesson.id}
            quiz={lesson.quiz}
            lang={lang}
            dict={dict}
            backHref={backHref}
            backLabel={backLabel}
          />
        </div>
      </section>
    </div>
  );
}
