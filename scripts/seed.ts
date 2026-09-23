/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Seeds the database with MVP practice content and a demo admin account.
 * Safe to re-run: questions/lessons/interview questions are upserted by id,
 * and the admin user is only created if it doesn't exist.
 *
 * Works against either a local SQLite file (default, zero-config) or a
 * hosted Turso database if TURSO_DATABASE_URL is set — see src/lib/db/index.ts.
 *
 * Usage: npm run seed
 */
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { ready } from "../src/lib/db";
import { upsertQuestion } from "../src/lib/db/questions";
import { upsertLesson } from "../src/lib/db/lessons";
import { upsertInterviewQuestion } from "../src/lib/db/interview";
import { createUser, getUserByEmail, setUserOrganizations, setUserAdmin } from "../src/lib/db/users";
import type { Question, Lesson, InterviewQuestion } from "../src/lib/types";

const SEED_DIR = path.join(process.cwd(), "src", "data", "seed");

function loadJson<T>(file: string): T {
  const p = path.join(SEED_DIR, file);
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

async function seedQuestions() {
  const files = [
    "questions-numerical-verbal.json",
    "questions-logical-sjt.json",
    "questions-development.json",
    "questions-afdb-knowledge.json",
    "questions-analytical-reasoning.json",
    "questions-development-news.json",
  ];
  let count = 0;
  for (const file of files) {
    const questions = loadJson<Question[]>(file);
    for (const q of questions) {
      await upsertQuestion(q);
      count++;
    }
  }
  console.log(`Seeded ${count} assessment questions.`);
}

async function seedLessons() {
  const files = [
    "lessons-development.json",
    "lessons-development-news.json",
    "lessons-afdb.json",
    "lessons-worldbank.json",
    "lessons-imf.json",
    "lessons-un.json",
  ];
  let count = 0;
  for (const file of files) {
    const lessons = loadJson<Lesson[]>(file);
    for (const l of lessons) {
      await upsertLesson(l);
      count++;
    }
  }
  console.log(`Seeded ${count} lessons.`);
}

async function seedInterviewQuestions() {
  const questions = loadJson<InterviewQuestion[]>("interview-questions.json");
  for (const q of questions) {
    await upsertInterviewQuestion(q);
  }
  console.log(`Seeded ${questions.length} interview questions.`);
}

async function seedAdminUser() {
  const email = "admin@yppready.app";
  const existing = await getUserByEmail(email);
  if (existing) {
    console.log("Admin account already exists (admin@yppready.app).");
    return;
  }
  const passwordHash = await bcrypt.hash("YppReady2026!", 10);
  const user = await createUser({
    firstName: "YPPReady",
    lastName: "Admin",
    email,
    passwordHash,
    preferredLanguage: "en",
  });
  await setUserAdmin(user.id, true);
  await setUserOrganizations(user.id, ["AfDB", "World Bank"]);
  console.log("Created admin account: admin@yppready.app / YppReady2026!");
}

async function seedDemoUser() {
  const email = "demo@yppready.app";
  const existing = await getUserByEmail(email);
  if (existing) {
    console.log("Demo account already exists (demo@yppready.app).");
    return;
  }
  const passwordHash = await bcrypt.hash("Demo2026!", 10);
  const user = await createUser({
    firstName: "Amina",
    lastName: "Demo",
    email,
    passwordHash,
    preferredLanguage: "en",
  });
  await setUserOrganizations(user.id, ["AfDB", "UN"]);
  console.log("Created demo account: demo@yppready.app / Demo2026!");
}

async function main() {
  await ready(); // ensures schema is bootstrapped
  await seedQuestions();
  await seedLessons();
  await seedInterviewQuestions();
  await seedAdminUser();
  await seedDemoUser();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
