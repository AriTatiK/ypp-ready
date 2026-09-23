import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { getAllQuestions } from "@/lib/db/questions";
import Button from "@/components/ui/Button";
import Badge, { difficultyTone } from "@/components/ui/Badge";
import AdminTabs from "../_components/AdminTabs";
import DeleteButton from "../_components/DeleteButton";
import { deleteQuestionAction } from "@/app/actions/admin";

export const metadata = { title: "Questions — Admin — YPPReady" };

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requireAdmin();
  const lang = await getLang();
  const dict = getDictionary(lang);
  const { saved, deleted } = await searchParams;

  const questions = await getAllQuestions();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <AdminTabs active="questions" dict={dict} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{dict.admin.questionsTab}</h1>
        <Button href="/admin/questions/new" variant="accent" size="sm">
          {dict.admin.addNew}
        </Button>
      </div>

      {saved && (
        <p className="mt-4 rounded-md bg-green-100 px-3 py-2 text-sm text-green-700">{dict.admin.saved}</p>
      )}
      {deleted && (
        <p className="mt-4 rounded-md bg-green-100 px-3 py-2 text-sm text-green-700">{dict.admin.deleted}</p>
      )}

      {questions.length === 0 ? (
        <p className="mt-8 text-ink-soft">{dict.admin.noItemsYet}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-ink-soft">
                <th className="py-2 pr-4 font-medium">{dict.admin.id}</th>
                <th className="py-2 pr-4 font-medium">{dict.admin.category}</th>
                <th className="py-2 pr-4 font-medium">{dict.admin.difficulty}</th>
                <th className="py-2 pr-4 font-medium">{dict.admin.organizationScope}</th>
                <th className="py-2 pr-4 font-medium">{dict.admin.questionText}</th>
                <th className="py-2 pr-0 font-medium" />
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-b border-border-subtle/60">
                  <td className="py-2 pr-4 font-mono text-xs text-ink-soft">{q.id}</td>
                  <td className="py-2 pr-4 text-ink">{q.category}</td>
                  <td className="py-2 pr-4">
                    <Badge tone={difficultyTone(q.difficulty)}>{q.difficulty}</Badge>
                  </td>
                  <td className="py-2 pr-4 text-ink">{q.organization_scope}</td>
                  <td className="max-w-xs truncate py-2 pr-4 text-ink" title={q.question.en}>
                    {q.question.en}
                  </td>
                  <td className="py-2 pr-0 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/questions/${q.id}/edit`}
                        className="text-sm font-medium text-navy-900 underline underline-offset-2"
                      >
                        {dict.admin.edit}
                      </Link>
                      <DeleteButton
                        action={deleteQuestionAction}
                        id={q.id}
                        confirmMessage={dict.admin.confirmDelete}
                        label={dict.admin.delete}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
