import { requireAdmin } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import InterviewForm from "../../_components/InterviewForm";
import AdminTabs from "../../_components/AdminTabs";

export const metadata = { title: "New Interview Question — Admin — YPPReady" };

export default async function NewInterviewQuestionPage() {
  await requireAdmin();
  const lang = await getLang();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <AdminTabs active="interview" dict={dict} />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">
        {dict.admin.interviewTab} — {dict.admin.addNew}
      </h1>
      <div className="mt-6">
        <InterviewForm dict={dict} />
      </div>
    </div>
  );
}
