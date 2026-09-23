import { chromium } from "playwright";
const BASE = "http://localhost:3000";
let failures = 0;
function ok(label, cond, extra = "") {
  console.log((cond ? "PASS" : "FAIL") + `: ${label}` + (extra ? " " + extra : ""));
  if (!cond) failures++;
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

// --- Mobile viewport / no horizontal overflow check ---
const mobile = await browser.newPage({ viewport: { width: 375, height: 667 } });
await mobile.goto(`${BASE}/`, { waitUntil: "networkidle" });
for (const path of ["/", "/login", "/signup"]) {
  await mobile.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(`no horizontal overflow on ${path} (375px)`, overflow <= 1, `overflow=${overflow}px`);
}

// Log in as demo, check authenticated pages at mobile width incl. bottom nav clearance
await mobile.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await mobile.fill("#email", "demo@yppready.app");
await mobile.fill("#password", "Demo2026!");
await mobile.locator("main").getByRole("button", { name: /log in/i }).click();
await mobile.waitForURL("**/dashboard", { timeout: 10000 });
for (const path of ["/dashboard", "/assessment", "/learn", "/organizations", "/interview", "/progress", "/today"]) {
  await mobile.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(`no horizontal overflow on ${path} (375px)`, overflow <= 1, `overflow=${overflow}px`);
  const navVisible = await mobile.locator("nav[aria-label='Mobile']").isVisible();
  ok(`mobile bottom nav visible on ${path}`, navVisible);
}
await mobile.close();

// --- French completeness spot-check ---
const fr = await browser.newPage();
await fr.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await fr.fill("#email", "demo@yppready.app");
await fr.fill("#password", "Demo2026!");
await fr.locator("main").getByRole("button", { name: /log in/i }).click();
await fr.waitForURL("**/dashboard", { timeout: 10000 });
await fr.locator("header").getByRole("button", { name: "FR" }).click();
await fr.waitForTimeout(800);

const frChecks = [
  { path: "/dashboard", mustContain: ["Tableau de bord", "préparation"] },
  { path: "/assessment", mustContain: ["Évaluation"] },
  { path: "/learn", mustContain: ["Apprendre"] },
  { path: "/organizations", mustContain: ["organisation"] },
  { path: "/interview", mustContain: ["Entretien"] },
  { path: "/progress", mustContain: ["progression", "Progression"] },
  { path: "/today", mustContain: ["défi", "jour", "Aujourd"] },
];
for (const check of frChecks) {
  await fr.goto(`${BASE}${check.path}`, { waitUntil: "networkidle" });
  const text = await fr.locator("body").innerText();
  const htmlLang = await fr.getAttribute("html", "lang");
  const found = check.mustContain.some((s) => text.includes(s));
  ok(`${check.path} shows French content`, htmlLang === "fr" && found, `lang=${htmlLang} found=${found}`);
}
await fr.close();

await browser.close();
console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exitCode = failures === 0 ? 0 : 1;
