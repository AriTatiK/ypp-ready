import { run } from "./index";

/**
 * Minimal server-side event log. No third-party analytics SDK, no PII beyond
 * the internal numeric user id (nullable for pre-signup events like
 * `language_changed` on the landing page).
 */
export type AnalyticsEventName =
  | "user_signed_up"
  | "diagnostic_started"
  | "diagnostic_completed"
  | "question_answered"
  | "mock_started"
  | "mock_completed"
  | "afdb_real_started"
  | "afdb_real_completed"
  | "lesson_completed"
  | "interview_question_started"
  | "interview_answer_saved"
  | "language_changed"
  | "organization_selected";

export async function trackEvent(
  eventName: AnalyticsEventName,
  userId: number | null,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    await run(`INSERT INTO analytics_events (user_id, event_name, properties_json) VALUES (?, ?, ?)`, [
      userId,
      eventName,
      properties ? JSON.stringify(properties) : null,
    ]);
  } catch {
    // Analytics must never break the user-facing flow.
  }
}
