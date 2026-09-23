import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const lang = await getLang();
  const dict = getDictionary(lang);
  const { landing } = dict;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950 text-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-terracotta-600/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-green-600/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="text-sm font-medium uppercase tracking-widest text-terracotta-500">
            {landing.positioningTagline}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {landing.heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-paper/75 sm:text-lg">{landing.heroSubtitle}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/signup" variant="accent" size="lg">
              {landing.ctaPrimary}
            </Button>
            <Button href="/signup" variant="ghost" size="lg" className="text-paper hover:bg-white/10">
              {landing.ctaSecondary}
            </Button>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {landing.problemHeadline}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-ink-soft">{landing.problemBody}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Card className="border-terracotta-100 bg-terracotta-100/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-terracotta-600">{landing.beforeLabel}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{landing.beforeFlow}</p>
          </Card>
          <Card className="border-green-100 bg-green-100/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{landing.afterLabel}</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-ink">{landing.afterFlow}</p>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-border-subtle bg-paper-alt/60">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {landing.howItWorksTitle}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {landing.steps.map((step) => (
              <div key={step.number} className="text-center sm:text-left">
                <span className="text-3xl font-semibold text-terracotta-500">{step.number}</span>
                <h3 className="mt-2 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prepare for */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {landing.prepareForTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-ink-soft">{landing.prepareForNote}</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {landing.categories.map((cat) => (
            <Card key={cat.title}>
              <span aria-hidden className="text-3xl">
                {cat.icon}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-ink">{cat.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{cat.examples}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Framework */}
      <section className="border-y border-border-subtle bg-navy-900 text-paper">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">{landing.frameworkTitle}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {landing.frameworkAreas.map((area) => (
              <div key={area.title} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <span aria-hidden className="text-2xl">
                  {area.icon}
                </span>
                <h3 className="mt-3 font-semibold">{area.title}</h3>
                <p className="mt-1 text-sm text-paper/70">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{landing.finalTitle}</h2>
        <p className="mt-4 text-ink-soft">{landing.finalBody}</p>
        <div className="mt-8 flex justify-center">
          <Button href="/signup" size="lg">
            {landing.ctaPrimary}
          </Button>
        </div>
        <p className="mx-auto mt-6 max-w-lg text-xs text-ink-soft">{landing.disclaimerNote}</p>
      </section>
    </div>
  );
}
