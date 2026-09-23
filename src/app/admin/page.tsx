import { requireAdmin } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { getAllQuestions } from "@/lib/db/questions";
import { getAllLessons } from "@/lib/db/lessons";
import { getAllInterviewQuestions } from "@/lib/db/interview";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export const metadata = { title: "Admin — YPPReady" };

export default async function AdminHomePage() {
  await requireAdmin();
  const lang = await getLang();
  const dict = getDictionary(lang);

  const [allQuestions, allLessons, allInterviewQuestions] = await Promise.all([
    getAllQuestions(),
    getAllLessons(),
    getAllInterviewQuestions(),
  ]);

  const sections = [
    { href: "/admin/questions", label: dict.admin.questionsTab, count: allQuestions.length },
    { href: "/admin/lessons", label: dict.admin.lessonsTab, count: allLessons.length },
    { href: "/admin/interview", label: dict.admin.interviewTab, count: allInterviewQuestions.length },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{dict.admin.title}</h1>
      <p className="mt-2 text-ink-soft">{dict.admin.subtitle}</p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {sections.map((s) => (
          <Card key={s.href}>
            <p className="text-3xl font-semibold text-navy-900">{s.count}</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">{s.label}</h2>
            <Button href={s.href} variant="secondary" size="sm" className="mt-4">
              {dict.common.viewAll}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
