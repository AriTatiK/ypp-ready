import { chromium } from "playwright";

const email = `test${Date.now()}@example.com`;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();

try {
  await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle" });
  await page.fill("#firstName", "Test");
  await page.fill("#lastName", "User");
  await page.fill("#email", email);
  await page.fill("#password", "Password123!");
  await page.fill("#confirmPassword", "Password123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/onboarding", { timeout: 10000 });
  console.log("PASS: signup redirected to onboarding. URL =", page.url());
} catch (err) {
  console.error("FAIL:", err.message);
  console.log("Current URL:", page.url());
  console.log(await page.content());
  process.exitCode = 1;
} finally {
  await browser.close();
}
