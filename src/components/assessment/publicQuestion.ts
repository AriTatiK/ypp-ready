import type { Question, QuestionOption, Bilingual, Difficulty } from "@/lib/types";

/**
 * The subset of a Question safe to send to the browser before the user has
 * submitted an answer. Never include `correct_answer` or `explanation` here —
 * those are only revealed via submitAnswerAction's return value, after the
 * user has answered that specific question.
 */
export type PublicQuestion = {
  id: string;
  category: string;
  subcategory?: string | null;
  difficulty: Difficulty;
  question: Bilingual;
  options: QuestionOption[];
  skill_tested?: Bilingual;
};

export function toPublicQuestion(q: Question): PublicQuestion {
  return {
    id: q.id,
    category: q.category,
    subcategory: q.subcategory ?? null,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
    skill_tested: q.skill_tested,
  };
}
