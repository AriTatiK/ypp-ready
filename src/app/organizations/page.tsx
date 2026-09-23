import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLang, getDictionary } from "@/lib/i18n";
import { getLessonsByOrgScope, countCompletedLessons } from "@/lib/db/lessons";
import { ORG_LESSON_SCOPES, ORG_OPTIONS } from "@/lib/types";
import { orgSlug } from "@/lib/slug";
import Card from "@/components/ui/Card";
import { OrgDisclaimer } from "@/components/ui/DisclaimerBanner";

export const metadata = { title: "Know Your Organization — YPPReady" };

export default async function OrganizationsPage() {
  const user = await requireUser("/organizations");
  const lang = await getLang();
  const dict = getDictionary(lang);

  const orgCards = await Promise.all(
    ORG_LESSON_SCOPES.map(async (org) => {
      const lessons = await getLessonsByOrgScope(org);
      const lessonIds = lessons.map((l) => l.id);
      const completed = await countCompletedLessons(user.id, lessonIds);
      const label = ORG_OPTIONS.find((o) => o.code === org)?.label[lang] ?? org;
      return { org, label, total: lessons.length, completed, slug: orgSlug(org) };
    })
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{dict.organizations.hubTitle}</h1>
        <p className="mt-2 max-w-prose text-ink-soft">{dict.organizations.hubIntro}</p>
      </div>

      <OrgDisclaimer dict={dict} className="mb-8" />

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
        {dict.organizations.chooseOrg}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {orgCards.map((card) => (
          <Link key={card.org} href={`/organizations/${card.slug}`} className="block h-full">
            <Card className="flex h-full flex-col justify-between gap-4 transition-shadow hover:shadow-md">
              <h3 className="font-semibold text-ink">{card.label}</h3>
              <p className="text-sm text-ink-soft">
                {card.completed}/{card.total}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
