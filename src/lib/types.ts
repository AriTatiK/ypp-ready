// Shared domain types for YPPReady.
// These mirror the bilingual JSON shape produced by the content pipeline
// (src/data/seed/*.json) and stored in SQLite as *_json text columns.

export type Lang = "en" | "fr";

export type Bilingual = { en: string; fr: string };
export type BilingualList = { en: string[]; fr: string[] };

export type Difficulty = "Easy" | "Medium" | "Hard";

export type OrganizationScope =
  | "General"
  | "AfDB"
  | "World Bank"
  | "IMF"
  | "UN"
  | "Other";

export type AssessmentCategory =
  | "Numerical Reasoning"
  | "Verbal Reasoning"
  | "Logical Reasoning"
  | "Abstract Reasoning"
  | "Data Interpretation"
  | "Critical Reasoning"
  | "Situational Judgment"
  | "Development Knowledge"
  | "AfDB Institutional Knowledge"
  | "International Development News"
  | "Analytical & Problem-Solving Reasoning";

export type QuestionOption = { key: "A" | "B" | "C" | "D"; en: string; fr: string };

export type Question = {
  id: string;
  organization_scope: OrganizationScope;
  category: AssessmentCategory | string;
  subcategory?: string | null;
  difficulty: Difficulty;
  question: Bilingual;
  options: QuestionOption[];
  correct_answer: string;
  explanation: Bilingual;
  skill_tested?: Bilingual;
  source?: string | null;
};

export type LessonQuizQuestion = {
  question: Bilingual;
  options: QuestionOption[];
  correct_answer: string;
  explanation: Bilingual;
};

export type LessonSource = { title: string; url: string };

export type LessonCategory = "Development Knowledge" | "Organization Knowledge" | "International Development News";

export type OrgLessonScope = "AfDB" | "World Bank" | "IMF" | "UN";

export type TechnicalTerm = { term: Bilingual; explanation: Bilingual };

/** One labeled section in an ordered pedagogical walkthrough (e.g. "Why? / What? / How?"). */
export type LessonSection = { heading: Bilingual; body: Bilingual };

export type Lesson = {
  id: string;
  category: LessonCategory | string;
  org_scope: OrgLessonScope | null;
  title: Bilingual;
  simple_definition: Bilingual;
  why_it_matters: BilingualList;
  /** "Dans le contexte africain" — required focus for International Development News lessons. */
  african_context?: Bilingual;
  /** Glossary of technical terms used in this lesson, explained simply. */
  technical_terms?: TechnicalTerm[];
  concrete_example?: Bilingual;
  one_line_summary?: Bilingual;
  /** "Réflexe pour le QCM" — a quick strategy cue for recognizing this topic in a multiple-choice question. */
  qcm_reflex?: Bilingual;
  /** An ordered pedagogical walkthrough (e.g. why/what/how/attention points/money) — rendered as labeled sections between the definition and why_it_matters. */
  structured_sections?: LessonSection[];
  why_you_should_know: Bilingual;
  quiz: LessonQuizQuestion[];
  sources: LessonSource[];
  last_updated: string | null;
};

export type InterviewCategory =
  | "About You"
  | "Motivation"
  | "Leadership"
  | "Teamwork"
  | "Conflict"
  | "Failure & Learning"
  | "Problem Solving"
  | "Technical"
  | "Development"
  | "Organization-specific";

export type InterviewQuestion = {
  id: string;
  category: InterviewCategory | string;
  org_scope: OrganizationScope;
  question: Bilingual;
  tip: Bilingual;
  label: string;
};

export type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  preferred_language: Lang;
  is_admin: boolean;
  created_at: string;
};

export type AssessmentSessionType = "diagnostic" | "mock" | "practice" | "afdb_real";
export type AttemptContext = AssessmentSessionType;

export type AssessmentSession = {
  id: number;
  user_id: number;
  type: AssessmentSessionType;
  category: string | null;
  question_ids: string[];
  time_limit_seconds: number | null;
  status: "in_progress" | "completed" | "expired";
  started_at: string;
  completed_at: string | null;
};

export type CategoryScore = { category: string; correct: number; total: number; percent: number };

export type AssessmentResult = {
  id: number;
  assessment_session_id: number;
  overall_score: number;
  category_scores: CategoryScore[];
  strongest_area: string | null;
  priority_area: string | null;
  created_at: string;
};

export type ReadinessBreakdown = {
  assessment: number;
  development: number;
  organization: number;
  interview: number;
  consistency: number;
  overall: number;
  strongestArea: { key: string; label: Bilingual } | null;
  priorityArea: { key: string; label: Bilingual } | null;
};

export const ORG_OPTIONS: { code: string; label: Bilingual }[] = [
  { code: "AfDB", label: { en: "African Development Bank", fr: "Banque africaine de développement" } },
  { code: "World Bank", label: { en: "World Bank Group", fr: "Groupe de la Banque mondiale" } },
  { code: "IMF", label: { en: "IMF", fr: "FMI" } },
  { code: "UN", label: { en: "United Nations", fr: "Nations Unies" } },
  { code: "Regional Development Banks", label: { en: "Regional Development Banks", fr: "Banques régionales de développement" } },
  { code: "Other International Organizations", label: { en: "Other International Organizations", fr: "Autres organisations internationales" } },
];

export const ASSESSMENT_CATEGORIES: { key: string; label: Bilingual; hasSeedContent: boolean }[] = [
  { key: "Numerical Reasoning", label: { en: "Numerical Reasoning", fr: "Raisonnement numérique" }, hasSeedContent: true },
  { key: "Verbal Reasoning", label: { en: "Verbal Reasoning", fr: "Raisonnement verbal" }, hasSeedContent: true },
  { key: "Logical Reasoning", label: { en: "Logical Reasoning", fr: "Raisonnement logique" }, hasSeedContent: true },
  { key: "Abstract Reasoning", label: { en: "Abstract Reasoning", fr: "Raisonnement abstrait" }, hasSeedContent: false },
  { key: "Data Interpretation", label: { en: "Data Interpretation", fr: "Interprétation de données" }, hasSeedContent: false },
  { key: "Critical Reasoning", label: { en: "Critical Reasoning", fr: "Raisonnement critique" }, hasSeedContent: false },
  { key: "Situational Judgment", label: { en: "Situational Judgment", fr: "Jugement situationnel" }, hasSeedContent: true },
  { key: "Development Knowledge", label: { en: "Development Knowledge", fr: "Connaissances en développement" }, hasSeedContent: true },
  { key: "AfDB Institutional Knowledge", label: { en: "AfDB Institutional Knowledge", fr: "Connaissances institutionnelles BAD" }, hasSeedContent: true },
  { key: "International Development News", label: { en: "International Development News", fr: "Actualité du développement international" }, hasSeedContent: true },
  { key: "Analytical & Problem-Solving Reasoning", label: { en: "Analytical & Problem-Solving Reasoning", fr: "Raisonnement analytique et résolution de problèmes" }, hasSeedContent: true },
];

export const ORG_LESSON_SCOPES: OrgLessonScope[] = ["AfDB", "World Bank", "IMF", "UN"];

/**
 * The 4 domains confirmed by the AfDB YPP coordinator as the REAL content of
 * the 45-minute online assessment — as opposed to the platform's general,
 * multi-organization practice categories above. Used by the "AfDB Real
 * Simulation" assessment mode (see src/app/actions/assessment.ts).
 */
export const AFDB_REAL_ASSESSMENT_CATEGORIES: string[] = [
  "AfDB Institutional Knowledge",
  "International Development News",
  "Situational Judgment",
  "Analytical & Problem-Solving Reasoning",
];
export const AFDB_REAL_TIME_LIMIT_SECONDS = 45 * 60;
export const AFDB_REAL_QUESTION_COUNT = 40;

export const INTERVIEW_CATEGORIES: string[] = [
  "About You",
  "Motivation",
  "Leadership",
  "Teamwork",
  "Conflict",
  "Failure & Learning",
  "Problem Solving",
  "Technical",
  "Development",
  "Organization-specific",
];
