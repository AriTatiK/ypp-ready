import { chromium } from "playwright";

const BASE = "http://localhost:3000";
let failures = 0;
function ok(label, cond, extra = "") {
  console.log((cond ? "PASS" : "FAIL") + `: ${label}` + (extra ? " " + extra : ""));
  if (!cond) failures++;
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();
page.on("response", (r) => {
  if (r.status() >= 500) console.log("SERVER ERROR:", r.status(), r.url());
});

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "demo@yppready.app");
await page.fill("#password", "Demo2026!");
await page.locator("main").getByRole("button", { name: /log in/i }).click();
await page.waitForURL("**/dashboard", { timeout: 10000 });

// Go straight to a known category
await page.goto(`${BASE}/interview/motivation`, { waitUntil: "networkidle" });
ok("interview category page loads", (await page.locator("main a[href^='/interview/question/']").count()) > 0, page.url());

const qLink = page.locator("main a[href^='/interview/question/']").first();
const qHref = await qLink.getAttribute("href");
await Promise.all([page.waitForURL(`**${qHref}`, { timeout: 10000 }), qLink.click()]);
await page.waitForLoadState("networkidle");
ok("interview question page loads", /\/interview\/question\//.test(page.url()), page.url());

const starLink = page.locator("main a[href^='/interview/star/']").first();
ok("has STAR builder link", (await starLink.count()) > 0);
const starHref = await starLink.getAttribute("href");
await Promise.all([page.waitForURL(`**${starHref}`, { timeout: 10000 }), starLink.click()]);
await page.waitForLoadState("networkidle");
ok("STAR builder page loads", /\/interview\/star\//.test(page.url()), page.url());

const textareas = page.locator("main textarea");
const n = await textareas.count();
ok("STAR form has 4 textareas", n === 4, `found ${n}`);
const sample = [
  "Our regional team faced a tight reporting deadline with conflicting priorities across three departments.",
  "As project lead, I was responsible for aligning the departments and delivering the consolidated report on time.",
  "I organized a joint working session, reassigned two analysts to the bottleneck task, and set a shared tracker so everyone could see daily progress.",
  "We delivered the report two days early and the new tracker was adopted for all future reporting cycles, cutting delays by about 30%.",
];
for (let i = 0; i < n; i++) await textareas.nth(i).fill(sample[i] ?? sample[0]);

const saveBtn = page.locator("main").getByRole("button", { name: /save/i }).first();
ok("has save button", (await saveBtn.count()) > 0);
await saveBtn.click();
await page.waitForTimeout(1000);
const bodyAfterSave = await page.locator("main").innerText();
ok("shows saved confirmation", /saved|enregistr/i.test(bodyAfterSave));

const feedbackBtn = page.locator("main").getByRole("button", { name: /feedback/i }).first();
if (await feedbackBtn.count()) {
  await feedbackBtn.click();
  await page.waitForTimeout(1200);
  const bodyAfterFeedback = await page.locator("main").innerText();
  ok("shows score after feedback request", /\d{1,3}\s*\/\s*100/.test(bodyAfterFeedback), bodyAfterFeedback.slice(0, 200));
} else {
  ok("feedback button present", false, "no button found matching /feedback/i");
}

// reload the page to confirm persistence
await page.reload({ waitUntil: "networkidle" });
const reloadedValue = await page.locator("main textarea").first().inputValue();
ok("STAR answer persists after reload", reloadedValue.length > 10, reloadedValue.slice(0, 60));

// Mock interview quick mode
await page.goto(`${BASE}/interview/mock`, { waitUntil: "networkidle" });
const quickButtons = page.locator("main form button[type=submit], main button[type=submit]");
ok("mock mode buttons present", (await quickButtons.count()) > 0);
// Click the first start button (Quick Question card, assuming DOM order matches mode order)
await quickButtons.first().click();
await page.waitForURL(/\/interview\/mock\/run\//, { timeout: 10000 }).catch(() => {});
ok("mock interview run started", /\/interview\/mock\/run\//.test(page.url()), page.url());

if (/\/interview\/mock\/run\//.test(page.url())) {
  for (let i = 0; i < 12; i++) {
    const tAreas = page.locator("main textarea");
    const cnt = await tAreas.count();
    if (cnt === 0) break;
    for (let j = 0; j < cnt; j++) await tAreas.nth(j).fill(sample[j % sample.length]);
    // The Finish/Next button is disabled until the current answer is saved — save first.
    const saveFirst = page.locator("main").getByRole("button", { name: /^save/i }).first();
    if (await saveFirst.count()) {
      await saveFirst.click();
      await page.waitForTimeout(700);
    }
    // Prefer "finish/see results" over "next" over "save" — check most-terminal action first.
    const finishBtn = page.locator("main").getByRole("button", { name: /finish|see (my )?results/i }).first();
    const nextBtn = page.locator("main").getByRole("button", { name: /next question|next/i }).first();
    const saveBtn2 = saveFirst;
    if ((await finishBtn.count()) && (await finishBtn.isEnabled())) {
      await Promise.all([
        page.waitForURL(/\/interview\/mock\/results\//, { timeout: 10000 }).catch(() => {}),
        finishBtn.click(),
      ]);
      await page.waitForTimeout(500);
      break;
    } else if (await nextBtn.count()) {
      await nextBtn.click();
      await page.waitForTimeout(600);
    } else if (await saveBtn2.count()) {
      await saveBtn2.click();
      await page.waitForTimeout(600);
    } else break;
  }
  await page.waitForURL(/\/interview\/mock\/results\//, { timeout: 15000 }).catch(() => {});
  ok("mock interview completed -> results", /\/interview\/mock\/results\//.test(page.url()), page.url());
}

await browser.close();
console.log(failures === 0 ? "\nALL INTERVIEW CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exitCode = failures === 0 ? 0 : 1;
