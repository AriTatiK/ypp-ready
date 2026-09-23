import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLang, getDictionary } from "@/lib/i18n";
import { getLessonsByCategory, getUserLessonProgress } from "@/lib/db/lessons";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import LearnTabs from "./_components/LearnTabs";
import NewsAccordion from "@/components/lessons/NewsAccordion";

export const metadata = { title: "Learn — YPPReady" };

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const user = await requireUser("/learn");
  const lang = await getLang();
  const dict = getDictionary(lang);
  const { cat } = await searchParams;
  const showNews = cat === "news";

  const lessons = await getLessonsByCategory(showNews ? "International Development News" : "Development Knowledge");
  const progress = await getUserLessonProgress(user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{dict.learn.hubTitle}</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          {showNews ? dict.learn.newsHubIntro : dict.learn.hubIntro}
        </p>
      </div>

      <Card className="mb-6 flex flex-col gap-3 border-terracotta-100 bg-terracotta-100/10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink">{dict.situationalGuide.title}</p>
        <Link
          href="/learn/situational-judgment"
          className="inline-flex min-h-11 items-center text-sm font-medium text-navy-900 underline underline-offset-2 hover:text-navy-700"
        >
          {dict.learn.tabSituationalGuide} →
        </Link>
      </Card>

      <LearnTabs active={showNews ? "news" : "development"} dict={dict} />

      <div className="mt-6">
        {lessons.length === 0 ? (
          <EmptyState title={dict.empty.noLessons} />
        ) : showNews ? (
          <NewsAccordion lessons={lessons} lang={lang} dict={dict} completedIds={new Set(progress.keys())} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson) => {
              const done = progress.has(lesson.id);
              return (
                <Link key={lesson.id} href={`/learn/${lesson.id}`} className="block h-full">
                  <Card className="flex h-full flex-col gap-3 transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold text-ink">{lesson.title[lang]}</h2>
                      {done && <Badge tone="green">{dict.learn.lessonComplete}</Badge>}
                    </div>
                    <p className="line-clamp-3 text-sm text-ink-soft">{lesson.simple_definition[lang]}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
