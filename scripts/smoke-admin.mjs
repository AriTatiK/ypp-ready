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
await page.fill("#email", "admin@yppready.app");
await page.fill("#password", "YppReady2026!");
await page.locator("main").getByRole("button", { name: /log in/i }).click();
await page.waitForURL("**/dashboard", { timeout: 10000 });

// --- Interview question CRUD (simplest shape) ---
await page.goto(`${BASE}/admin/interview/new`, { waitUntil: "networkidle" });
ok("admin interview new form loads", (await page.locator("main form").count()) > 0);

const uniq = Date.now();
await page.selectOption("main select[name='category']", { label: "Motivation" }).catch(async () => {
  await page.selectOption("main select[name='category']", "Motivation").catch(() => {});
});
await page.locator("main textarea[name='question_en'], main input[name='question_en']").first().fill(`Smoke test EN question ${uniq}`);
await page.locator("main textarea[name='question_fr'], main input[name='question_fr']").first().fill(`Question de test FR ${uniq}`);
const tipEn = page.locator("main textarea[name='tip_en'], main input[name='tip_en']").first();
if (await tipEn.count()) await tipEn.fill("Smoke test tip EN");
const tipFr = page.locator("main textarea[name='tip_fr'], main input[name='tip_fr']").first();
if (await tipFr.count()) await tipFr.fill("Conseil de test FR");

await Promise.all([
  page.waitForURL(/\/admin\/interview\?saved=1/, { timeout: 10000 }).catch(() => {}),
  page.locator("main form button[type=submit]").first().click(),
]);
await page.waitForLoadState("networkidle");
ok("interview question created -> back to list", page.url().includes("/admin/interview") && page.url().includes("saved=1"), page.url());

const listText = await page.locator("main").innerText();
ok("new interview question appears in list", listText.includes(`${uniq}`));

// Edit it
const rowWithId = page.locator("main table tbody tr").filter({ hasText: `${uniq}` }).first();
const editLinkInRow = rowWithId.locator("a[href*='/edit']").first();
if (await editLinkInRow.count()) {
  await editLinkInRow.click();
  await page.waitForLoadState("networkidle");
  ok("edit form loads with prefilled data", (await page.locator(`main textarea[name='question_en'], main input[name='question_en']`).first().inputValue()).includes(`${uniq}`));
  // change tip and save
  const tipEnEdit = page.locator("main textarea[name='tip_en'], main input[name='tip_en']").first();
  if (await tipEnEdit.count()) await tipEnEdit.fill("Updated tip EN");
  await Promise.all([
    page.waitForURL(/\/admin\/interview\?saved=1/, { timeout: 10000 }).catch(() => {}),
    page.locator("main form button[type=submit]").first().click(),
  ]);
  await page.waitForLoadState("networkidle");
  ok("interview question edited -> back to list", page.url().includes("/admin/interview") && page.url().includes("saved=1"));
} else {
  ok("found edit link for created interview question", false);
}

// Delete it
const rowWithId2 = page.locator("main table tbody tr").filter({ hasText: `${uniq}` }).first();
const deleteForm = rowWithId2.locator("form button, button").filter({ hasText: /delete/i }).first();
if (await deleteForm.count()) {
  page.once("dialog", (d) => d.accept());
  await deleteForm.click();
  await page.waitForTimeout(1000);
  const listTextAfterDelete = await page.locator("main").innerText();
  ok("interview question deleted", !listTextAfterDelete.includes(`${uniq}`));
} else {
  ok("found delete control for created interview question", false);
}

await browser.close();
console.log(failures === 0 ? "\nALL ADMIN CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exitCode = failures === 0 ? 0 : 1;
