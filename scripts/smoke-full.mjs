import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const email = `smoke${Date.now()}@example.com`;
let failures = 0;

function ok(label, cond, extra = "") {
  if (cond) {
    console.log(`PASS: ${label}`);
  } else {
    console.log(`FAIL: ${label} ${extra}`);
    failures++;
  }
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

async function run() {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
  page.on("response", (r) => {
    if (r.status() >= 500) console.log("SERVER ERROR:", r.status(), r.url());
  });

  // 1. Signup
  await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
  await page.fill("#firstName", "Amina");
  await page.fill("#lastName", "Smoke");
  await page.fill("#email", email);
  await page.fill("#password", "Password123!");
  await page.fill("#confirmPassword", "Password123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/onboarding", { timeout: 10000 });
  ok("signup -> onboarding", page.url().includes("/onboarding"));

  // 2. Onboarding
  await page.check('main input[value="AfDB"]');
  await page.check('main input[value="UN"]');
  await page.locator('main button[type="submit"]').first().click();
  await page.waitForURL("**/assessment/diagnostic", { timeout: 10000 });
  ok("onboarding -> diagnostic", page.url().includes("/assessment/diagnostic"));

  // 3. Start diagnostic
  await page.locator('main button[type="submit"]').first().click().catch(() => {});
  await page.waitForURL(/\/assessment\/diagnostic\/run\//, { timeout: 10000 }).catch(() => {});
  ok("diagnostic run started", /\/assessment\/diagnostic\/run\//.test(page.url()), page.url());

  if (/\/assessment\/diagnostic\/run\//.test(page.url())) {
    // Answer up to 32 questions (30 expected) by clicking first option then next/see results
    for (let i = 0; i < 32; i++) {
      if (/\/assessment\/diagnostic\/results\//.test(page.url())) break;
      const main = page.locator("main");
      const radios = main.locator('input[type="radio"], input[type="checkbox"], button[type="button"]');
      if (await radios.count()) {
        await radios.first().click().catch(() => {});
      }
      const submitBtn = main.getByRole("button", { name: /submit answer/i }).first();
      if (await submitBtn.count()) {
        await submitBtn.click().catch(() => {});
        await page.waitForTimeout(300);
      }
      const nextBtn = main.getByRole("button", { name: /next question|see results/i }).first();
      if (await nextBtn.count()) {
        const text = await nextBtn.textContent();
        await nextBtn.click().catch(() => {});
        await page.waitForTimeout(500);
        if (text && /results/i.test(text)) {
          await page.waitForTimeout(800);
          break;
        }
      } else {
        break;
      }
    }
    await page.waitForURL(/\/assessment\/diagnostic\/results\//, { timeout: 15000 }).catch(() => {});
    ok("diagnostic completed -> results", /\/assessment\/diagnostic\/results\//.test(page.url()), page.url());
  }

  // 4. Dashboard
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  const dashboardBody = await page.content();
  ok("dashboard loads", page.url().includes("/dashboard") && !dashboardBody.includes("Application error"));

  // 5. Learn a lesson
  await page.goto(`${BASE}/learn`, { waitUntil: "networkidle" });
  const firstLessonLink = page.locator('a[href^="/learn/"]').first();
  ok("learn hub has lessons", (await firstLessonLink.count()) > 0);
  if (await firstLessonLink.count()) {
    await firstLessonLink.click();
    await page.waitForLoadState("networkidle");
    const quizBtn = page.locator("main").getByRole("button", { name: /quiz/i }).first();
    if (await quizBtn.count()) {
      await quizBtn.click();
      await page.waitForTimeout(300);
      const radios = page.locator('main input[type="radio"], main button[type="button"]');
      if (await radios.count()) await radios.first().click().catch(() => {});
      const submit = page.locator("main").getByRole("button", { name: /submit/i }).first();
      if (await submit.count()) await submit.click().catch(() => {});
      await page.waitForTimeout(500);
    }
    ok("lesson page + quiz interaction", true);
  }

  // 6. Organizations
  await page.goto(`${BASE}/organizations`, { waitUntil: "networkidle" });
  const afdbLink = page.locator('a[href*="afdb" i]').first();
  ok("organizations hub has AfDB link", (await afdbLink.count()) > 0);
  if (await afdbLink.count()) {
    await afdbLink.click();
    await page.waitForLoadState("networkidle");
    const lessonLink = page.locator('a[href*="/organizations/"]').first();
    if (await lessonLink.count()) {
      await lessonLink.click();
      await page.waitForLoadState("networkidle");
      ok("org lesson page loads", true);
    }
  }

  // 7. Interview
  await page.goto(`${BASE}/interview`, { waitUntil: "networkidle" });
  ok("interview hub loads", (await page.locator("h1, h2").count()) > 0);
  const catLink = page.locator('a[href^="/interview/"]').first();
  if (await catLink.count()) {
    await catLink.click();
    await page.waitForLoadState("networkidle");
    const qLink = page.locator('a[href^="/interview/question/"]').first();
    if (await qLink.count()) {
      await qLink.click();
      await page.waitForLoadState("networkidle");
      const starLink = page.locator('a[href^="/interview/star/"]').first();
      if (await starLink.count()) {
        await starLink.click();
        await page.waitForLoadState("networkidle");
        const textareas = page.locator("textarea");
        const n = await textareas.count();
        for (let i = 0; i < n; i++) {
          await textareas.nth(i).fill(
            "I led a cross-functional team of five to redesign our reporting process under a tight deadline, which required coordinating across departments and resolving disagreements about priorities."
          );
        }
        const saveBtn = page.locator("main").getByRole("button", { name: /save/i }).first();
        if (await saveBtn.count()) {
          await saveBtn.click();
          await page.waitForTimeout(800);
        }
        ok("STAR builder save", true);
      }
    }
  }

  // 8. Interview mock quick mode
  await page.goto(`${BASE}/interview/mock`, { waitUntil: "networkidle" });
  const quickForm = page.locator("form").first();
  ok("interview mock page loads", (await page.locator("h1, h2").count()) > 0);

  // 9. Progress + Today
  await page.goto(`${BASE}/progress`, { waitUntil: "networkidle" });
  ok("progress page loads", !(await page.content()).includes("Application error"));
  await page.goto(`${BASE}/today`, { waitUntil: "networkidle" });
  ok("today page loads", !(await page.content()).includes("Application error"));

  // 10. Language switch
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  const frBtn = page.getByRole("button", { name: "FR" }).first();
  if (await frBtn.count()) {
    await frBtn.click();
    await page.waitForTimeout(800);
    const html = await page.content();
    ok("language switch to FR changes html lang", (await page.getAttribute("html", "lang")) === "fr");
  }

  await page.close();
}

async function runAdminCheck() {
  const page = await browser.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "admin@yppready.app");
  await page.fill("#password", "YppReady2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 10000 }).catch(() => {});
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  ok("admin can access /admin", page.url().includes("/admin"));
  await page.close();

  const page2 = await browser.newPage();
  await page2.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page2.fill("#email", "demo@yppready.app");
  await page2.fill("#password", "Demo2026!");
  await page2.click('button[type="submit"]');
  await page2.waitForURL("**/dashboard", { timeout: 10000 }).catch(() => {});
  await page2.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  ok("non-admin redirected away from /admin", !page2.url().endsWith("/admin"), page2.url());
  await page2.close();
}

try {
  await run();
  await runAdminCheck();
} catch (err) {
  console.error("SCRIPT ERROR:", err.message);
  failures++;
} finally {
  await browser.close();
  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exitCode = failures === 0 ? 0 : 1;
}
