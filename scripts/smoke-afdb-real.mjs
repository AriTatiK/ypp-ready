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

const uniq = Date.now();
const email = `afdbsmoke${uniq}@example.com`;

// Signup, select AfDB as target org during onboarding
await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
await page.fill("#firstName", "Afdb");
await page.fill("#lastName", "Smoke");
await page.fill("#email", email);
await page.fill("#password", "SmokeTest2026!");
await page.fill("#confirmPassword", "SmokeTest2026!");
await page.click('button[type="submit"]');
await page.waitForURL("**/onboarding", { timeout: 10000 });

// Onboarding renders one checkbox per ORG_OPTIONS entry: <input type="checkbox" name="organizations" value="AfDB">
await page.check('main input[value="AfDB"]');
await page.locator('main button[type="submit"]').first().click();
await page.waitForLoadState("networkidle");

// Dashboard should show the AfDB format teaser
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
const dashboardText = await page.locator("main").innerText();
ok("dashboard shows AfDB format teaser", /real test format|format réel confirmé/i.test(dashboardText));

// Assessment hub shows the full format notice + AfDB real card
await page.goto(`${BASE}/assessment`, { waitUntil: "networkidle" });
const hubText = await page.locator("main").innerText();
ok("assessment hub shows format notice", /45 minutes/i.test(hubText));
ok("assessment hub shows AfDB Real Simulation card", /AfDB Real Assessment Simulation|Simulation réelle BAD/i.test(hubText));

// Start the AfDB real simulation
await page.goto(`${BASE}/assessment/afdb-real`, { waitUntil: "networkidle" });
const startText = await page.locator("main").innerText();
ok("afdb-real start page loads", /45/.test(startText));
await Promise.all([
  page.waitForURL(/\/assessment\/afdb-real\/run\/\d+/, { timeout: 10000 }),
  page.locator("main form button[type=submit]").first().click(),
]);
ok("afdb-real session started", /\/assessment\/afdb-real\/run\//.test(page.url()), page.url());

const questionText = await page.locator("main").innerText();
ok("afdb-real run page shows a question", questionText.length > 20);

await browser.close();

// --- Learn hub: tabs + accordion + situational judgment guide ---
const browser2 = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page2 = await browser2.newPage();
await page2.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page2.fill("#email", "demo@yppready.app");
await page2.fill("#password", "Demo2026!");
await page2.click('button[type="submit"]');
await page2.waitForURL("**/dashboard", { timeout: 10000 });

await page2.goto(`${BASE}/learn`, { waitUntil: "networkidle" });
const learnText = await page2.locator("main").innerText();
ok("learn hub shows situational judgment guide link", /Situational Judgment: the method|Jugement situationnel/i.test(learnText));

await page2.goto(`${BASE}/learn?cat=news`, { waitUntil: "networkidle" });
const newsText = await page2.locator("main").innerText();
ok("news tab loads without error", !/Application error/i.test(newsText));
const detailsCount = await page2.locator("main details").count();
console.log("news accordion item count:", detailsCount);

await page2.goto(`${BASE}/learn/situational-judgment`, { waitUntil: "networkidle" });
const guideText = await page2.locator("main").innerText();
ok("situational judgment guide page loads", /tight deadline|délai serré/i.test(guideText));
ok("guide has practice CTA", /Practice Situational Judgment|jugement situationnel/i.test(guideText));

await browser2.close();

console.log(failures === 0 ? "\nALL AFDB-REAL/LEARN CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exitCode = failures === 0 ? 0 : 1;
