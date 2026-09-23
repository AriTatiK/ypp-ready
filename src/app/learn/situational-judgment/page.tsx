import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLang, getDictionary } from "@/lib/i18n";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export const metadata = { title: "Situational Judgment — YPPReady" };

export default async function SituationalJudgmentGuidePage() {
  await requireUser("/learn/situational-judgment");
  const lang = await getLang();
  const dict = getDictionary(lang);
  const g = dict.situationalGuide;

  const themes = [
    { title: g.theme1Title, body: g.theme1Body },
    { title: g.theme2Title, body: g.theme2Body },
    { title: g.theme3Title, body: g.theme3Body },
    { title: g.theme4Title, body: g.theme4Body },
    { title: g.theme5Title, body: g.theme5Body },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/learn" className="inline-flex min-h-11 items-center text-sm font-medium text-navy-900 hover:underline">
        ← {g.backToLearn}
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{g.title}</h1>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{g.whatItIsTitle}</h2>
        <p className="mt-2 text-ink">{g.whatItIsBody}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{g.themesTitle}</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {themes.map((t, i) => (
            <Card key={i} className="p-4">
              <h3 className="font-medium text-ink">{t.title}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{t.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{g.methodTitle}</h2>

        <Card className="mt-3 border-navy-800/20 bg-navy-900/5">
          <h3 className="font-medium text-ink">{g.preferTitle}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
            <li>{g.preferItem1}</li>
            <li>{g.preferItem2}</li>
            <li>{g.preferItem3}</li>
          </ul>
        </Card>

        <Card className="mt-3 border-terracotta-100 bg-terracotta-100/10">
          <h3 className="font-medium text-ink">{g.avoidTitle}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
            <li>{g.avoidItem1}</li>
            <li>{g.avoidItem2}</li>
          </ul>
        </Card>
      </section>

      <div className="mt-8">
        <Button href="/assessment/practice/situational-judgment" variant="accent">
          {g.ctaPractice}
        </Button>
      </div>
    </div>
  );
}
