import type { Dictionary } from "@/lib/i18n";
import type { Question, Difficulty, OrganizationScope } from "@/lib/types";
import { ASSESSMENT_CATEGORIES } from "@/lib/types";
import Button from "@/components/ui/Button";
import { saveQuestionAction } from "@/app/actions/admin";
import { inputClass, textareaClass, labelClass } from "./formStyles";

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const ORG_SCOPES: OrganizationScope[] = ["General", "AfDB", "World Bank", "IMF", "UN", "Other"];
const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export default function QuestionForm({ dict, question }: { dict: Dictionary; question?: Question | null }) {
  const optionValue = (key: (typeof OPTION_KEYS)[number], lang: "en" | "fr") =>
    question?.options.find((o) => o.key === key)?.[lang] ?? "";

  return (
    <form action={saveQuestionAction} className="space-y-6">
      <input type="hidden" name="id" defaultValue={question?.id ?? ""} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="category">
            {dict.admin.category}
          </label>
          <input
            id="category"
            name="category"
            list="category-options"
            defaultValue={question?.category ?? ""}
            required
            className={inputClass}
          />
          <datalist id="category-options">
            {ASSESSMENT_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelClass} htmlFor="subcategory">
            {dict.admin.subcategory}
          </label>
          <input
            id="subcategory"
            name="subcategory"
            defaultValue={question?.subcategory ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="difficulty">
            {dict.admin.difficulty}
          </label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={question?.difficulty ?? "Easy"}
            className={inputClass}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="organization_scope">
            {dict.admin.organizationScope}
          </label>
          <select
            id="organization_scope"
            name="organization_scope"
            defaultValue={question?.organization_scope ?? "General"}
            className={inputClass}
          >
            {ORG_SCOPES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <LanguageSection
        lang="en"
        title={dict.admin.englishVersion}
        dict={dict}
        question={question}
        optionValue={optionValue}
      />
      <LanguageSection
        lang="fr"
        title={dict.admin.frenchVersion}
        dict={dict}
        question={question}
        optionValue={optionValue}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="correct_answer">
            {dict.admin.correctAnswer}
          </label>
          <select
            id="correct_answer"
            name="correct_answer"
            defaultValue={question?.correct_answer ?? "A"}
            className={inputClass}
          >
            {OPTION_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="source">
            {dict.admin.source}
          </label>
          <input id="source" name="source" defaultValue={question?.source ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit">{dict.common.save}</Button>
        <Button href="/admin/questions" variant="ghost">
          {dict.common.cancel}
        </Button>
      </div>
    </form>
  );
}

function LanguageSection({
  lang,
  title,
  dict,
  question,
  optionValue,
}: {
  lang: "en" | "fr";
  title: string;
  dict: Dictionary;
  question?: Question | null;
  optionValue: (key: (typeof OPTION_KEYS)[number], lang: "en" | "fr") => string;
}) {
  return (
    <fieldset className="rounded-lg border border-border-subtle p-4">
      <legend className="px-1 text-sm font-semibold text-ink">{title}</legend>
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor={`question_${lang}`}>
            {dict.admin.questionText}
          </label>
          <textarea
            id={`question_${lang}`}
            name={`question_${lang}`}
            defaultValue={question?.question[lang] ?? ""}
            required
            rows={2}
            className={textareaClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {OPTION_KEYS.map((key) => (
            <div key={key}>
              <label className={labelClass} htmlFor={`option_${key}_${lang}`}>
                {dict.admin.optionLabel} {key}
              </label>
              <input
                id={`option_${key}_${lang}`}
                name={`option_${key}_${lang}`}
                defaultValue={optionValue(key, lang)}
                required
                className={inputClass}
              />
            </div>
          ))}
        </div>

        <div>
          <label className={labelClass} htmlFor={`explanation_${lang}`}>
            {dict.admin.explanation}
          </label>
          <textarea
            id={`explanation_${lang}`}
            name={`explanation_${lang}`}
            defaultValue={question?.explanation[lang] ?? ""}
            required
            rows={2}
            className={textareaClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor={`skill_tested_${lang}`}>
            {dict.admin.skillTested}
          </label>
          <input
            id={`skill_tested_${lang}`}
            name={`skill_tested_${lang}`}
            defaultValue={question?.skill_tested?.[lang] ?? ""}
            className={inputClass}
          />
        </div>
      </div>
    </fieldset>
  );
}
