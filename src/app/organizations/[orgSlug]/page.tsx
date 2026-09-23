import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLang, getDictionary, format } from "@/lib/i18n";
import { getLessonsByOrgScope, getUserLessonProgress } from "@/lib/db/lessons";
import { orgFromSlug } from "@/lib/slug";
import { ORG_OPTIONS } from "@/lib/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import FormatNotice from "@/components/organizations/FormatNotice";

export default async function OrgLessonsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug: slug } = await params;
  const org = orgFromSlug(slug);
  const lang = await getLang();
  const dict = getDictionary(lang);

  if (!org) {
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

  const user = await requireUser(`/organizations/${slug}`);
  const lessons = await getLessonsByOrgScope(org);
  const progress = await getUserLessonProgress(user.id);
  const orgLabel = ORG_OPTIONS.find((o) => o.code === org)?.label[lang] ?? org;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/organizations"
        className="inline-flex min-h-11 items-center text-sm font-medium text-navy-900 hover:underline"
      >
        ← {dict.organizations.backToOrganizations}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {format(dict.organizations.in5Minutes, { org: orgLabel })}
      </h1>

      {org === "AfDB" && (
        <div className="mt-6">
          <FormatNotice dict={dict} />
        </div>
      )}

      {lessons.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={dict.organizations.noOrgLessons} />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {lessons.map((lesson) => {
            const done = progress.has(lesson.id);
            return (
              <Link key={lesson.id} href={`/organizations/${slug}/${lesson.id}`} className="block">
                <Card className="flex items-center justify-between gap-3 transition-shadow hover:shadow-md">
                  <span className="font-medium text-ink">{lesson.title[lang]}</span>
                  {done && <Badge tone="green">{dict.learn.lessonComplete}</Badge>}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
