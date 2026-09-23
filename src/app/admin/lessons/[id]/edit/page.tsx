import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { getLessonById } from "@/lib/db/lessons";
import LessonForm from "../../../_components/LessonForm";
import AdminTabs from "../../../_components/AdminTabs";

export const metadata = { title: "Edit Lesson — Admin — YPPReady" };

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const lang = await getLang();
  const dict = getDictionary(lang);
  const { id } = await params;

  const lesson = await getLessonById(id);
  if (!lesson) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <AdminTabs active="lessons" dict={dict} />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">
        {dict.admin.lessonsTab} — {dict.admin.edit}
      </h1>
      <div className="mt-6">
        <LessonForm dict={dict} lesson={lesson} />
      </div>
    </div>
  );
}
