import type { Dictionary } from "@/lib/i18n";
import type { Lesson, LessonCategory, OrgLessonScope } from "@/lib/types";
import Button from "@/components/ui/Button";
import { saveLessonAction } from "@/app/actions/admin";
import { inputClass, textareaClass, labelClass } from "./formStyles";

const CATEGORIES: LessonCategory[] = ["Development Knowledge", "Organization Knowledge"];
const ORG_SCOPES: OrgLessonScope[] = ["AfDB", "World Bank", "IMF", "UN"];
const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export default function LessonForm({ dict, lesson }: { dict: Dictionary; lesson?: Lesson | null }) {
  const quiz = lesson?.quiz[0];
  const source = lesson?.sources[0];
  const optionValue = (key: (typeof OPTION_KEYS)[number], lang: "en" | "fr") =>
    quiz?.options.find((o) => o.key === key)?.[lang] ?? "";

  return (
    <form action={saveLessonAction} className="space-y-6">
      <input type="hidden" name="id" defaultValue={lesson?.id ?? ""} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="category">
            {dict.admin.category}
          </label>
          <select id="category" name="category" defaultValue={lesson?.category ?? CATEGORIES[0]} className={inputClass}>
            {CATEGORIES.map((c) => (
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
          <select id="org_scope" name="org_scope" defaultValue={lesson?.org_scope ?? ""} className={inputClass}>
            <option value="">{dict.common.general}</option>
            {ORG_SCOPES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="last_updated">
            {dict.admin.lastUpdated}
          </label>
          <input
            id="last_updated"
            name="last_updated"
            defaultValue={lesson?.last_updated ?? ""}
            placeholder="2026-01"
            className={inputClass}
          />
        </div>
      </div>

      {(["en", "fr"] as const).map((lang) => (
        <fieldset key={lang} className="rounded-lg border border-border-subtle p-4">
          <legend className="px-1 text-sm font-semibold text-ink">
            {lang === "en" ? dict.admin.englishVersion : dict.admin.frenchVersion}
          </legend>
          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor={`title_${lang}`}>
                {dict.admin.title}
              </label>
              <input
                id={`title_${lang}`}
                name={`title_${lang}`}
                defaultValue={lesson?.title[lang] ?? ""}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={`simple_definition_${lang}`}>
                {dict.admin.simpleDefinition}
              </label>
              <textarea
                id={`simple_definition_${lang}`}
                name={`simple_definition_${lang}`}
                defaultValue={lesson?.simple_definition[lang] ?? ""}
                required
                rows={2}
                className={textareaClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={`why_it_matters_${lang}`}>
                {dict.admin.whyItMatters}
              </label>
              <textarea
                id={`why_it_matters_${lang}`}
                name={`why_it_matters_${lang}`}
                defaultValue={(lesson?.why_it_matters[lang] ?? []).join("\n")}
                rows={4}
                className={textareaClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={`why_you_should_know_${lang}`}>
                {dict.admin.whyYouShouldKnow}
              </label>
              <textarea
                id={`why_you_should_know_${lang}`}
                name={`why_you_should_know_${lang}`}
                defaultValue={lesson?.why_you_should_know[lang] ?? ""}
                rows={2}
                className={textareaClass}
              />
            </div>
          </div>
        </fieldset>
      ))}

      <fieldset className="rounded-lg border border-border-subtle p-4">
        <legend className="px-1 text-sm font-semibold text-ink">{dict.admin.quizQuestion}</legend>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="quiz_question_en">
                {dict.admin.englishVersion}
              </label>
              <textarea
                id="quiz_question_en"
                name="quiz_question_en"
                defaultValue={quiz?.question.en ?? ""}
                rows={2}
                className={textareaClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="quiz_question_fr">
                {dict.admin.frenchVersion}
              </label>
              <textarea
                id="quiz_question_fr"
                name="quiz_question_fr"
                defaultValue={quiz?.question.fr ?? ""}
                rows={2}
                className={textareaClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {OPTION_KEYS.map((key) => (
              <div key={key} className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass} htmlFor={`quiz_option_${key}_en`}>
                    {dict.admin.optionLabel} {key} — {dict.admin.englishVersion}
                  </label>
                  <input
                    id={`quiz_option_${key}_en`}
                    name={`quiz_option_${key}_en`}
                    defaultValue={optionValue(key, "en")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor={`quiz_option_${key}_fr`}>
                    {dict.admin.optionLabel} {key} — {dict.admin.frenchVersion}
                  </label>
                  <input
                    id={`quiz_option_${key}_fr`}
                    name={`quiz_option_${key}_fr`}
                    defaultValue={optionValue(key, "fr")}
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className={labelClass} htmlFor="quiz_correct_answer">
              {dict.admin.correctAnswer}
            </label>
            <select
              id="quiz_correct_answer"
              name="quiz_correct_answer"
              defaultValue={quiz?.correct_answer ?? "A"}
              className={inputClass}
            >
              {OPTION_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="quiz_explanation_en">
                {dict.admin.explanation} — {dict.admin.englishVersion}
              </label>
              <textarea
                id="quiz_explanation_en"
                name="quiz_explanation_en"
                defaultValue={quiz?.explanation.en ?? ""}
                rows={2}
                className={textareaClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="quiz_explanation_fr">
                {dict.admin.explanation} — {dict.admin.frenchVersion}
              </label>
              <textarea
                id="quiz_explanation_fr"
                name="quiz_explanation_fr"
                defaultValue={quiz?.explanation.fr ?? ""}
                rows={2}
                className={textareaClass}
              />
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-border-subtle p-4">
        <legend className="px-1 text-sm font-semibold text-ink">{dict.admin.source}</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="source_title">
              {dict.admin.sourceTitle}
            </label>
            <input
              id="source_title"
              name="source_title"
              defaultValue={source?.title ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="source_url">
              {dict.admin.sourceUrl}
            </label>
            <input
              id="source_url"
              name="source_url"
              type="url"
              defaultValue={source?.url ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      <div className="flex gap-3">
        <Button type="submit">{dict.common.save}</Button>
        <Button href="/admin/lessons" variant="ghost">
          {dict.common.cancel}
        </Button>
      </div>
    </form>
  );
}
