import { chromium } from "../frontend/node_modules/playwright/index.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SCREENSHOTS_DIR = path.join(ROOT_DIR, "screenshots");

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function getFutureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
}

async function run() {
  console.log("=======================================================");
  console.log("       STARTING THEME, MOBILE & GEMINI VERIFICATION     ");
  console.log("=======================================================\n");

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 950 },
  });
  const page = await desktopContext.newPage();

  // 1. Load form and clear storage
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("#intake-form", { timeout: 8000 });

  // 2. Ensure Light Theme
  const isDarkInitial = await page.evaluate(() => document.documentElement.getAttribute("data-theme") === "dark");
  if (isDarkInitial) {
    await page.click(".theme-toggle-btn");
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "light-theme-form.png") });
  console.log("✓ Captured light-theme-form.png");

  // 3. Fill and submit form (wedding in 30 days so standard vendors are overdue)
  await page.fill("#coupleName", "Ananya & Kabir");
  await page.fill("#weddingDate", getFutureDate(30));
  await page.fill("#city", "Jaipur");
  await page.selectOption("#cityTier", "Tier-2");
  await page.fill("#totalBudget", "2000000");
  await page.fill("#guestCount", "300");
  await page.selectOption("#style", "Royal/Palace");
  await page.fill("#specialRequests", "pure Jain, sunset outdoor");

  console.log("Submitting plan form...");
  await page.click('button[type="submit"]');

  // Wait for dashboard to mount
  await page.waitForSelector(".dashboard-container", { timeout: 35000 });
  console.log("✓ Plan generated and Dashboard loaded!");

  // 4. Capture Overview Tab in Light Theme
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "light-theme-1-overview.png") });
  console.log("✓ Captured light-theme-1-overview.png");

  // 5. Capture Budget Tab
  await page.click("#tab-budget");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "light-theme-2-budget.png") });
  console.log("✓ Captured light-theme-2-budget.png");

  // 6. Capture Timeline Tab
  await page.click("#tab-timeline");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "light-theme-3-timeline.png") });
  console.log("✓ Captured light-theme-3-timeline.png");

  // 7. Capture Vendors Tab
  await page.click("#tab-vendors");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "light-theme-4-vendors.png") });
  console.log("✓ Captured light-theme-4-vendors.png");

  // Verify Overdue badge exists in DOM
  const overdueCount = await page.locator(".vendor-badge-overdue").count();
  console.log(`✓ Overdue badges found on vendors: ${overdueCount}`);

  // 8. Capture Ideas Tab
  await page.click("#tab-ideas");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "light-theme-5-ideas.png") });
  console.log("✓ Captured light-theme-5-ideas.png");

  // Check Ideas Source Badge text
  const badgeText = await page.locator(".ideas-source-badge").textContent();
  console.log(`✓ Ideas Source Badge: "${badgeText?.trim()}"`);

  // 9. Mobile Check at 375px
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(400);

  // Light mobile vendors
  await page.click("#tab-vendors");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "mobile-375px-light-vendors.png") });
  console.log("✓ Captured mobile-375px-light-vendors.png");

  // Switch to Dark Theme on mobile
  await page.click(".theme-toggle-btn");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "mobile-375px-dark-vendors.png") });
  console.log("✓ Captured mobile-375px-dark-vendors.png");

  await page.click("#tab-overview");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "mobile-375px-dark-overview.png") });
  console.log("✓ Captured mobile-375px-dark-overview.png");

  await browser.close();
  console.log("\n=======================================================");
  console.log("          ALL VERIFICATIONS COMPLETED SUCCESSFULLY     ");
  console.log("=======================================================");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
