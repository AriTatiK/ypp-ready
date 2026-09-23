import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import Card from "@/components/ui/Card";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

export const metadata = { title: "Personalize your preparation — YPPReady" };

export default async function OnboardingPage() {
  await requireUser("/onboarding");
  const lang = await getLang();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{dict.onboarding.title}</h1>
        <p className="mt-2 text-ink-soft">{dict.onboarding.subtitle}</p>
      </div>
      <Card>
        <OnboardingForm dict={dict} lang={lang} />
      </Card>
    </div>
  );
}
