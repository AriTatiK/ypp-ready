import type { Dictionary } from "@/lib/i18n";
import type { InterviewQuestion, OrganizationScope } from "@/lib/types";
import { INTERVIEW_CATEGORIES } from "@/lib/types";
import Button from "@/components/ui/Button";
import { saveInterviewAction } from "@/app/actions/admin";
import { inputClass, textareaClass, labelClass } from "./formStyles";

const ORG_SCOPES: OrganizationScope[] = ["General", "AfDB", "World Bank", "IMF", "UN", "Other"];

export default function InterviewForm({
  dict,
  question,
}: {
  dict: Dictionary;
  question?: InterviewQuestion | null;
}) {
  return (
    <form action={saveInterviewAction} className="space-y-6">
      <input type="hidden" name="id" defaultValue={question?.id ?? ""} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="category">
            {dict.admin.category}
          </label>
          <select
            id="category"
            name="category"
            defaultValue={question?.category ?? INTERVIEW_CATEGORIES[0]}
            className={inputClass}
          >
            {INTERVIEW_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="org_scope">
            {dict.admin.organizationScope}
          </label>
          <select
            id="org_scope"
            name="org_scope"
            defaultValue={question?.org_scope ?? "General"}
            className={inputClass}
          >
            {ORG_SCOPES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="label">
            {dict.admin.label}
          </label>
          <input
            id="label"
            name="label"
            defaultValue={question?.label ?? "Practice Interview Question"}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="question_en">
            {dict.admin.englishVersion} — {dict.admin.questionText}
          </label>
          <textarea
            id="question_en"
            name="question_en"
            defaultValue={question?.question.en ?? ""}
            required
            rows={3}
            className={textareaClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="question_fr">
            {dict.admin.frenchVersion} — {dict.admin.questionText}
          </label>
          <textarea
            id="question_fr"
            name="question_fr"
            defaultValue={question?.question.fr ?? ""}
            required
            rows={3}
            className={textareaClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="tip_en">
            {dict.admin.englishVersion} — {dict.admin.tip}
          </label>
          <textarea
            id="tip_en"
            name="tip_en"
            defaultValue={question?.tip.en ?? ""}
            rows={3}
            className={textareaClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="tip_fr">
            {dict.admin.frenchVersion} — {dict.admin.tip}
          </label>
          <textarea
            id="tip_fr"
            name="tip_fr"
            defaultValue={question?.tip.fr ?? ""}
            rows={3}
            className={textareaClass}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit">{dict.common.save}</Button>
        <Button href="/admin/interview" variant="ghost">
          {dict.common.cancel}
        </Button>
      </div>
    </form>
  );
}
