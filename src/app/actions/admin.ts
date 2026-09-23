"use server";

import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { upsertQuestion, deleteQuestion } from "@/lib/db/questions";
import { upsertLesson, deleteLesson } from "@/lib/db/lessons";
import { upsertInterviewQuestion, deleteInterviewQuestion } from "@/lib/db/interview";
import { toSlug } from "@/lib/slug";
import type {
  Question,
  QuestionOption,
  Lesson,
  LessonQuizQuestion,
  InterviewQuestion,
  Difficulty,
  OrganizationScope,
  OrgLessonScope,
} from "@/lib/types";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

function generateId(seed: string): string {
  const base = toSlug(seed) || "item";
  const suffix = `${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
  return `${base}-${suffix}`;
}

function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optStr(formData: FormData, name: string): string | null {
  const value = str(formData, name);
  return value.length > 0 ? value : null;
}

// ---- Questions ----

export async function saveQuestionAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const existingId = str(formData, "id");
  const category = str(formData, "category");
  const id = existingId || generateId(category || "question");

  const options: QuestionOption[] = OPTION_KEYS.map((key) => ({
    key,
    en: str(formData, `option_${key}_en`),
    fr: str(formData, `option_${key}_fr`),
  }));

  const skillTestedEn = str(formData, "skill_tested_en");
  const skillTestedFr = str(formData, "skill_tested_fr");

  const question: Question = {
    id,
    organization_scope: str(formData, "organization_scope") as OrganizationScope,
    category,
    subcategory: optStr(formData, "subcategory"),
    difficulty: str(formData, "difficulty") as Difficulty,
    question: { en: str(formData, "question_en"), fr: str(formData, "question_fr") },
    options,
    correct_answer: str(formData, "correct_answer"),
    explanation: { en: str(formData, "explanation_en"), fr: str(formData, "explanation_fr") },
    skill_tested: skillTestedEn || skillTestedFr ? { en: skillTestedEn, fr: skillTestedFr } : undefined,
    source: optStr(formData, "source"),
  };

  await upsertQuestion(question);
  redirect("/admin/questions?saved=1");
}

export async function deleteQuestionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  if (id) await deleteQuestion(id);
  redirect("/admin/questions?deleted=1");
}

// ---- Lessons ----

export async function saveLessonAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const existingId = str(formData, "id");
  const category = str(formData, "category");
  const id = existingId || generateId(category || "lesson");

  const orgScopeRaw = str(formData, "org_scope");
  const org_scope = (orgScopeRaw ? orgScopeRaw : null) as OrgLessonScope | null;

  const whyItMattersEn = str(formData, "why_it_matters_en")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const whyItMattersFr = str(formData, "why_it_matters_fr")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const options: QuestionOption[] = OPTION_KEYS.map((key) => ({
    key,
    en: str(formData, `quiz_option_${key}_en`),
    fr: str(formData, `quiz_option_${key}_fr`),
  }));

  const quiz: LessonQuizQuestion[] = [
    {
      question: { en: str(formData, "quiz_question_en"), fr: str(formData, "quiz_question_fr") },
      options,
      correct_answer: str(formData, "quiz_correct_answer"),
      explanation: { en: str(formData, "quiz_explanation_en"), fr: str(formData, "quiz_explanation_fr") },
    },
  ];

  const sourceTitle = str(formData, "source_title");
  const sourceUrl = str(formData, "source_url");
  const sources = sourceTitle || sourceUrl ? [{ title: sourceTitle, url: sourceUrl }] : [];

  const lesson: Lesson = {
    id,
    category,
    org_scope,
    title: { en: str(formData, "title_en"), fr: str(formData, "title_fr") },
    simple_definition: { en: str(formData, "simple_definition_en"), fr: str(formData, "simple_definition_fr") },
    why_it_matters: { en: whyItMattersEn, fr: whyItMattersFr },
    why_you_should_know: {
      en: str(formData, "why_you_should_know_en"),
      fr: str(formData, "why_you_should_know_fr"),
    },
    quiz,
    sources,
    last_updated: optStr(formData, "last_updated"),
  };

  await upsertLesson(lesson);
  redirect("/admin/lessons?saved=1");
}

export async function deleteLessonAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  if (id) await deleteLesson(id);
  redirect("/admin/lessons?deleted=1");
}

// ---- Interview questions ----

export async function saveInterviewAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const existingId = str(formData, "id");
  const category = str(formData, "category");
  const id = existingId || generateId(category || "interview");

  const q: InterviewQuestion = {
    id,
    category,
    org_scope: str(formData, "org_scope") as OrganizationScope,
    question: { en: str(formData, "question_en"), fr: str(formData, "question_fr") },
    tip: { en: str(formData, "tip_en"), fr: str(formData, "tip_fr") },
    label: str(formData, "label") || "Practice Interview Question",
  };

  await upsertInterviewQuestion(q);
  redirect("/admin/interview?saved=1");
}

export async function deleteInterviewAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  if (id) await deleteInterviewQuestion(id);
  redirect("/admin/interview?deleted=1");
}
