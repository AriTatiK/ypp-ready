import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { startMockInterviewAction } from "@/app/actions/interview";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default async function MockInterviewSelectPage() {
  await requireUser("/interview/mock");
  const lang = await getLang();
  const dict = getDictionary(lang);

  const modes = [
    { mode: "quick" as const, title: dict.interview.modes.quick, desc: dict.interview.modes.quickDesc },
    { mode: "practice" as const, title: dict.interview.modes.practiceSession, desc: dict.interview.modes.practiceSessionDesc },
    { mode: "mock" as const, title: dict.interview.modes.mockInterview, desc: dict.interview.modes.mockInterviewDesc },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Button href="/interview" variant="ghost" size="sm">
        ← {dict.interview.backToInterview}
      </Button>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{dict.interview.mockHubTitle}</h1>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {modes.map(({ mode, title, desc }) => (
          <Card key={mode} className="flex flex-col">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-2 flex-1 text-sm text-ink-soft">{desc}</p>
            <form action={startMockInterviewAction.bind(null, mode)} className="mt-5">
              <Button type="submit" variant="accent" className="w-full">
                {dict.interview.startInterview}
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
