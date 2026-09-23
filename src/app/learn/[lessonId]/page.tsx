import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLang, getDictionary } from "@/lib/i18n";
import { getLessonById, getUserLessonProgress } from "@/lib/db/lessons";
import LessonDetail from "@/components/lessons/LessonDetail";

export default async function LearnLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const user = await requireUser(`/learn/${lessonId}`);
  const lang = await getLang();
  const dict = getDictionary(lang);

  const lesson = await getLessonById(lessonId);
  const isNews = lesson?.category === "International Development News";
  if (!lesson || (lesson.category !== "Development Knowledge" && !isNews)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-ink-soft">{dict.errors.notFound}</p>
        <Link href="/learn" className="mt-4 inline-block min-h-11 text-navy-900 underline underline-offset-2">
          {dict.learn.backToLearn}
        </Link>
      </div>
    );
  }

  const progress = (await getUserLessonProgress(user.id)).get(lesson.id) ?? null;
  const backHref = isNews ? "/learn?cat=news" : "/learn";

  return (
    <LessonDetail
      lesson={lesson}
      dict={dict}
      lang={lang}
      backHref={backHref}
      backLabel={dict.learn.backToLearn}
      progress={progress}
    />
  );
}
