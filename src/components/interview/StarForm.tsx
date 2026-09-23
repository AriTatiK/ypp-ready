"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  saveStarAnswerAction,
  getFeedbackAction,
  type StarSaveState,
  type StarFeedbackState,
} from "@/app/actions/interview";
import type { Dictionary } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import Button from "@/components/ui/Button";

type StarAnswerValues = { situation: string; task: string; action: string; result: string };

const emptyValues: StarAnswerValues = { situation: "", task: "", action: "", result: "" };

const initialSaveState: StarSaveState = {
  status: "idle",
  savedAt: null,
  error: null,
  values: emptyValues,
};

const initialFeedbackState: StarFeedbackState = {
  status: "idle",
  score: null,
  strengths: [],
  improve: [],
  error: null,
};

/**
 * The STAR answer form: reused by the standalone STAR Answer Builder page and
 * by the Mock Interview run flow (one instance per question — pass a `key`
 * keyed on questionId from the parent so each question gets a fresh instance).
 */
export default function StarForm({
  dict,
  lang,
  questionId,
  initialAnswer,
  onSaved,
}: {
  dict: Dictionary;
  lang: Lang;
  questionId: string;
  initialAnswer: StarAnswerValues | null;
  onSaved?: () => void;
}) {
  const boundSave = saveStarAnswerAction.bind(null, questionId);
  const boundFeedback = getFeedbackAction.bind(null, questionId);

  const [saveState, submitSave, isSaving] = useActionState<StarSaveState, FormData>(boundSave, {
    ...initialSaveState,
    values: initialAnswer ?? emptyValues,
  });
  const [feedbackState, submitFeedback, isFetchingFeedback] = useActionState<StarFeedbackState, FormData>(
    boundFeedback,
    initialFeedbackState
  );

  const notifiedSavedAt = useRef<string | null>(null);
  useEffect(() => {
    if (saveState.status === "success" && saveState.savedAt && saveState.savedAt !== notifiedSavedAt.current) {
      notifiedSavedAt.current = saveState.savedAt;
      onSaved?.();
    }
  }, [saveState, onSaved]);

  const values = saveState.values;
  const formattedSavedAt = saveState.savedAt
    ? new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(saveState.savedAt))
    : null;

  return (
    <div className="space-y-8">
      <form action={submitSave} className="space-y-6" noValidate>
        <StarField
          id={`situation-${questionId}`}
          name="situation"
          label={dict.interview.situationLabel}
          hint={dict.interview.situationHint}
          defaultValue={values.situation}
        />
        <StarField
          id={`task-${questionId}`}
          name="task"
          label={dict.interview.taskLabel}
          hint={dict.interview.taskHint}
          defaultValue={values.task}
        />
        <StarField
          id={`action-${questionId}`}
          name="action"
          label={dict.interview.actionLabel}
          hint={dict.interview.actionHint}
          defaultValue={values.action}
        />
        <StarField
          id={`result-${questionId}`}
          name="result"
          label={dict.interview.resultLabel}
          hint={dict.interview.resultHint}
          defaultValue={values.result}
        />

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? dict.common.loading : dict.interview.saveAnswer}
          </Button>
          {formattedSavedAt && (
            <p className="text-sm text-ink-soft" role="status">
              {dict.interview.savedAt} · {formattedSavedAt}
            </p>
          )}
        </div>
      </form>

      <form action={submitFeedback} className="space-y-3">
        <Button type="submit" variant="secondary" disabled={isFetchingFeedback}>
          {isFetchingFeedback ? dict.common.loading : dict.interview.getAiFeedback}
        </Button>

        {feedbackState.status === "error" && (
          <p role="alert" className="text-sm text-terracotta-600">
            {dict.interview.noAnswerYet}
          </p>
        )}

        {feedbackState.status === "success" && (
          <div className="rounded-xl border border-border-subtle bg-paper-alt/60 p-5">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-ink-soft">{dict.interview.aiScoreLabel}</span>
              <span className="text-2xl font-semibold text-ink">{feedbackState.score}/100</span>
            </div>
            <p className="mt-2 text-xs text-ink-soft">{dict.interview.aiEvaluationNote}</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold text-ink">{dict.interview.strengthsLabel}</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
                  {feedbackState.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink">{dict.interview.improveLabel}</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
                  {feedbackState.improve.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

function StarField({
  id,
  name,
  label,
  hint,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  hint: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <p className="mt-1 text-xs text-ink-soft">{hint}</p>
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        rows={4}
        className="mt-2 min-h-24 w-full rounded-md border border-border-subtle bg-white px-3 py-2.5 text-sm text-ink focus:border-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-800/20"
      />
    </div>
  );
}
