import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { getInterviewQuestionById } from "@/lib/db/interview";
import InterviewForm from "../../../_components/InterviewForm";
import AdminTabs from "../../../_components/AdminTabs";

export const metadata = { title: "Edit Interview Question — Admin — YPPReady" };

export default async function EditInterviewQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const lang = await getLang();
  const dict = getDictionary(lang);
  const { id } = await params;

  const question = await getInterviewQuestionById(id);
  if (!question) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <AdminTabs active="interview" dict={dict} />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">
        {dict.admin.interviewTab} — {dict.admin.edit}
      </h1>
      <div className="mt-6">
        <InterviewForm dict={dict} question={question} />
      </div>
    </div>
  );
}
