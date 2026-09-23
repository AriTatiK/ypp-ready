import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLang, getDictionary } from "@/lib/i18n";
import { getLessonById, getUserLessonProgress } from "@/lib/db/lessons";
import { orgFromSlug } from "@/lib/slug";
import LessonDetail from "@/components/lessons/LessonDetail";

export default async function OrgLessonDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; lessonId: string }>;
}) {
  const { orgSlug: slug, lessonId } = await params;
  const org = orgFromSlug(slug);
  const lang = await getLang();
  const dict = getDictionary(lang);

  const lesson = await getLessonById(lessonId);
  if (!org || !lesson || lesson.org_scope !== org) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-ink-soft">{dict.errors.notFound}</p>
        <Link
          href="/organizations"
          className="mt-4 inline-block min-h-11 text-navy-900 underline underline-offset-2"
        >
          {dict.organizations.backToOrganizations}
        </Link>
      </div>
    );
  }

  const user = await requireUser(`/organizations/${slug}/${lessonId}`);
  const progress = (await getUserLessonProgress(user.id)).get(lesson.id) ?? null;

  return (
    <LessonDetail
      lesson={lesson}
      dict={dict}
      lang={lang}
      backHref={`/organizations/${slug}`}
      backLabel={dict.organizations.backToOrganizations}
      progress={progress}
      showLastUpdatedAndDisclaimer
    />
  );
}
