/**
 * Heuristic STAR-answer feedback.
 *
 * This MVP does not call an external AI model — it scores answers with
 * transparent, rule-based heuristics (structure completeness, presence of
 * quantified results, length, and generic-language detection). The shape of
 * the return value is designed so a future `AI Interview Coach` (see product
 * spec §46) can replace `scoreStarAnswer` with a real LLM call without
 * touching any calling code: same input, same output shape.
 *
 * This is preparation guidance only — never an official recruitment score.
 */

export type StarInput = {
  situation: string;
  task: string;
  action: string;
  result: string;
};

export type StarFeedback = {
  score: number; // 0-100
  strengths: string[];
  improve: string[];
};

const GENERIC_PHRASES = [
  "i am a hard worker",
  "i am a team player",
  "i work well under pressure",
  "responsible for",
  "helped with",
  "various tasks",
  "a lot of",
  "je suis quelqu'un de",
  "j'ai aidé",
  "diverses tâches",
  "beaucoup de",
];

const HAS_NUMBER = /\d/;
const HAS_PERCENT = /%|\bpercent\b|pourcent/i;

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function scoreStarAnswer(input: StarInput): StarFeedback {
  const { situation, task, action, result } = input;
  const strengths: string[] = [];
  const improve: string[] = [];
  let score = 0;

  // Structure completeness (40 points)
  const fields = [situation, task, action, result];
  const filled = fields.filter((f) => wordCount(f) >= 8).length;
  score += filled * 10;
  if (filled === 4) {
    strengths.push("Your answer follows the full STAR structure.");
  } else {
    improve.push("Fill in every STAR section with at least a sentence or two — a missing section reads as incomplete.");
  }

  // Specificity / length (20 points)
  const totalWords = fields.reduce((sum, f) => sum + wordCount(f), 0);
  if (totalWords >= 120) {
    score += 20;
    strengths.push("Good level of detail — the example feels concrete.");
  } else if (totalWords >= 60) {
    score += 10;
    improve.push("Add a bit more specific detail to make the example more vivid.");
  } else {
    improve.push("Your answer is quite short — add more concrete detail about what happened.");
  }

  // Quantified result (20 points)
  const resultText = result.toLowerCase();
  if (HAS_NUMBER.test(resultText) || HAS_PERCENT.test(resultText)) {
    score += 20;
    strengths.push("You quantified the impact of your result — this makes it more convincing.");
  } else {
    improve.push("Quantify your impact where possible (a percentage, a timeframe, a number of people affected).");
  }

  // Generic language penalty (up to -15, floor at 0 contribution)
  const combinedText = fields.join(" ").toLowerCase();
  const genericHits = GENERIC_PHRASES.filter((p) => combinedText.includes(p)).length;
  if (genericHits === 0) {
    score += 15;
    strengths.push("Clear, specific language rather than generic phrasing.");
  } else {
    improve.push("Reduce generic language (e.g. \"responsible for\", \"team player\") in favor of specific actions you took.");
  }

  // Ownership of action (5 points) — does the Action section use first-person action verbs?
  if (/\bi\s+\w+ed\b|\bj'ai\s+\w+/i.test(action)) {
    score += 5;
  } else {
    improve.push("Make sure the Action section clearly describes what you personally did, not just the team.");
  }

  score = Math.max(0, Math.min(100, score));

  if (strengths.length === 0) strengths.push("You have a starting draft to build on.");
  if (improve.length === 0) improve.push("Strengthen the connection between your result and the organization's priorities.");

  return { score, strengths: strengths.slice(0, 3), improve: improve.slice(0, 3) };
}

export function scoreMockInterview(answers: StarInput[]): {
  readinessScore: number;
  strengths: string[];
  weaknesses: string[];
} {
  if (answers.length === 0) {
    return { readinessScore: 0, strengths: [], weaknesses: [] };
  }
  const feedbacks = answers.map(scoreStarAnswer);
  const avg = Math.round(feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length);
  const strengths = Array.from(new Set(feedbacks.flatMap((f) => f.strengths))).slice(0, 3);
  const weaknesses = Array.from(new Set(feedbacks.flatMap((f) => f.improve))).slice(0, 3);
  return { readinessScore: avg, strengths, weaknesses };
}
