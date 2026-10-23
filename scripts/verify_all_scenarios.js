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
  console.log("       STARTING ALL REQUIRED BROWSER SCENARIOS         ");
  console.log("=======================================================\n");

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await desktopContext.newPage();

  // Helper to fill intake form
  async function fillAndSubmitForm({
    coupleName = "Priya & Rohan",
    daysAhead = 90,
    city = "Jaipur",
    cityTier = "Tier-2",
    totalBudget = "2500000",
    guestCount = "350",
    style = "Royal/Palace",
    functionsToKeep = ["Haldi", "Mehendi", "Sangeet", "Wedding"],
    priorities = ["Food", "Venue & Decor"],
    specialRequests = "",
  }) {
    await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("#intake-form", { timeout: 8000 });

    if (coupleName) await page.fill("#coupleName", coupleName);
    await page.fill("#weddingDate", getFutureDate(daysAhead));
    await page.fill("#city", city);
    await page.selectOption("#cityTier", cityTier);
    await page.fill("#totalBudget", totalBudget);
    await page.fill("#guestCount", guestCount);
    await page.selectOption("#style", style);

    // Default functions are Haldi, Mehendi, Sangeet, Wedding
    const allFunctions = ["Engagement", "Haldi", "Mehendi", "Sangeet", "Wedding", "Reception"];
    for (const fn of allFunctions) {
      const btn = page.locator(`.chip-btn:has-text("${fn}")`);
      const isSelected = (await btn.getAttribute("aria-pressed")) === "true";
      const shouldBeSelected = functionsToKeep.includes(fn);
      if (isSelected !== shouldBeSelected) {
        await btn.click();
      }
    }

    // Priorities
    const allPriorities = ["Food", "Venue & Decor", "Photography", "Music & Entertainment", "Attire & Jewellery", "Guest Experience"];
    for (const prio of allPriorities) {
      const btn = page.locator(`.chip-btn:has-text("${prio}")`);
      const isSelected = (await btn.getAttribute("aria-pressed")) === "true";
      const shouldBeSelected = priorities.includes(prio);
      if (isSelected !== shouldBeSelected) {
        await btn.click();
      }
    }

    if (specialRequests) {
      await page.fill("#specialRequests", specialRequests);
    }

    await page.evaluate(() => {
      const form = document.getElementById("intake-form");
      if (form) form.requestSubmit();
    });
    await page.waitForSelector(".dashboard-container", { timeout: 30000 });
  }

  // --- SCENARIO (D): Wedding date 10 days away (Tight timeline notice) ---
  console.log("\n[Test D] Testing wedding date 10 days away...");
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.fill("#weddingDate", getFutureDate(10));
  await page.waitForTimeout(400);
  const noticeLocator = page.locator(".notice-box.notice-warning");
  const noticeVisible = await noticeLocator.isVisible();
  console.log(`  Tight timeline notice visible: ${noticeVisible}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "scenario-d-tight-10days.png") });
  console.log("  Saved: screenshots/scenario-d-tight-10days.png");

  // --- SCENARIO (A): Rs 25,00,000, 350 guests, Tier-2, Royal, 4 functions ---
  console.log("\n[Test A] Testing Rs 25,00,000, 350 guests, Tier-2, Royal, 4 functions...");
  await fillAndSubmitForm({
    coupleName: "Ananya & Kabir",
    daysAhead: 150,
    city: "Jaipur",
    cityTier: "Tier-2",
    totalBudget: "2500000",
    guestCount: "350",
    style: "Royal/Palace",
    functionsToKeep: ["Haldi", "Mehendi", "Sangeet", "Wedding"],
    priorities: ["Food", "Venue & Decor", "Photography"],
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "scenario-a-royal-tier2-25l.png") });
  console.log("  Saved: screenshots/scenario-a-royal-tier2-25l.png");

  // --- SCENARIO (B): Rs 6,40,000, 300 guests, Metro, Royal, 6 functions ---
  console.log("\n[Test B] Testing Rs 6,40,000, 300 guests, Metro, Royal, 6 functions...");
  await fillAndSubmitForm({
    coupleName: "Simran & Raj",
    daysAhead: 120,
    city: "pune", // Lowercase city to test normalization as well
    cityTier: "Metro",
    totalBudget: "640000",
    guestCount: "300",
    style: "Royal/Palace",
    functionsToKeep: ["Engagement", "Haldi", "Mehendi", "Sangeet", "Wedding", "Reception"],
    priorities: ["Food", "Venue & Decor"],
    specialRequests: "Pure Jain vegetarian, sunset outdoor ceremony",
  });
  await page.waitForTimeout(500);

  // (B1) Light Theme: check alerts readability
  console.log("  Capturing Light theme alerts card...");
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "scenario-b1-royal-metro-tight-light.png") });
  console.log("  Saved: screenshots/scenario-b1-royal-metro-tight-light.png");

  // (B2) Dark Theme: toggle theme and check dark mode alerts readability
  console.log("  Toggling to Dark theme...");
  await page.click(".theme-toggle-btn");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "scenario-b2-royal-metro-tight-dark.png") });
  console.log("  Saved: screenshots/scenario-b2-royal-metro-tight-dark.png");

  // Switch back to light theme
  await page.click(".theme-toggle-btn");
  await page.waitForTimeout(300);

  // (B3) Switch to Ideas Tab to verify no premium items and budget band line
  console.log("  Switching to Ideas Tab to verify no premium items and budget band line...");
  await page.click('button[role="tab"]:has-text("Personalized Ideas")');
  await page.waitForSelector(".ideas-container", { timeout: 5000 });
  const budgetBandNote = await page.locator(".band-text").innerText();
  console.log(`  Ideas budget band line: "${budgetBandNote}"`);
  const ideasContent = await page.locator(".ideas-container").innerText();
  console.log(`  Contains 'chef-curated live gourmet': ${ideasContent.toLowerCase().includes("chef-curated live gourmet")}`);
  console.log(`  Contains 'royal look on a budget': ${ideasContent.toLowerCase().includes("royal look on a budget")}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "scenario-b3-ideas-no-premium.png") });
  console.log("  Saved: screenshots/scenario-b3-ideas-no-premium.png");

  // --- SCENARIO (C): Budget-smart, Rs 8,00,000, 150 guests ---
  console.log("\n[Test C] Testing Budget-smart, Rs 8,00,000, 150 guests...");
  await fillAndSubmitForm({
    coupleName: "Pooja & Amit",
    daysAhead: 90,
    city: "Ahmedabad",
    cityTier: "Tier-2",
    totalBudget: "800000",
    guestCount: "150",
    style: "Budget-smart",
    functionsToKeep: ["Haldi", "Mehendi", "Wedding"],
    priorities: ["Food"],
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "scenario-c-budget-smart.png") });
  console.log("  Saved: screenshots/scenario-c-budget-smart.png");

  // --- SCENARIO (E): Special request 'pure jain vegetarian, sunset outdoor ceremony' ---
  console.log("\n[Test E] Testing special requests in Ideas tab...");
  await fillAndSubmitForm({
    coupleName: "Diya & Siddharth",
    daysAhead: 100,
    city: "Mumbai",
    cityTier: "Metro",
    totalBudget: "2000000",
    guestCount: "250",
    style: "Traditional",
    functionsToKeep: ["Haldi", "Sangeet", "Wedding"],
    priorities: ["Food", "Venue & Decor"],
    specialRequests: "pure jain vegetarian, sunset outdoor ceremony",
  });
  await page.click('button[role="tab"]:has-text("Personalized Ideas")');
  await page.waitForSelector(".ideas-container", { timeout: 5000 });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "scenario-e-special-requests-jain-sunset.png") });
  console.log("  Saved: screenshots/scenario-e-special-requests-jain-sunset.png");

  // --- SCENARIO (F): City typed in lowercase ("navi mumbai") ---
  console.log("\n[Test F] Testing city typed in lowercase ('navi mumbai')...");
  await fillAndSubmitForm({
    coupleName: "Meera & Arjun",
    daysAhead: 110,
    city: "navi mumbai",
    cityTier: "Metro",
    totalBudget: "1500000",
    guestCount: "200",
    style: "Modern Minimal",
    functionsToKeep: ["Mehendi", "Wedding"],
    priorities: ["Photography"],
  });
  const headerSubtitle = await page.locator(".dashboard-subtitle").innerText();
  console.log(`  Dashboard subtitle city: "${headerSubtitle}" (Contains 'Navi Mumbai': ${headerSubtitle.includes("Navi Mumbai")})`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "scenario-f-lowercase-city.png") });
  console.log("  Saved: screenshots/scenario-f-lowercase-city.png");

  // --- SCENARIO (G): Print preview with all sections ---
  console.log("\n[Test G] Testing print layout (#print-root)...");
  // Temporarily show #print-root and hide screen container to capture print layout rendering
  await page.evaluate(() => {
    const printRoot = document.getElementById("print-root");
    const interactive = document.getElementById("interactive-dashboard-root");
    if (printRoot && interactive) {
      interactive.style.display = "none";
      printRoot.style.display = "block";
    }
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "scenario-g-print-preview.png"), fullPage: true });
  console.log("  Saved: screenshots/scenario-g-print-preview.png");

  // Restore screen layout
  await page.evaluate(() => {
    const printRoot = document.getElementById("print-root");
    const interactive = document.getElementById("interactive-dashboard-root");
    if (printRoot && interactive) {
      interactive.style.display = "";
      printRoot.style.display = "";
    }
  });

  await desktopContext.close();

  // --- SCENARIO (H): 375px mobile in both themes ---
  console.log("\n[Test H] Testing 375px mobile viewport in Light and Dark themes...");
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await mobilePage.evaluate(() => localStorage.clear());
  await mobilePage.reload({ waitUntil: "networkidle" });
  await mobilePage.waitForSelector("#intake-form", { timeout: 8000 });

  // Quick fill mobile form
  await mobilePage.fill("#city", "Jaipur");
  await mobilePage.fill("#totalBudget", "1500000");
  await mobilePage.fill("#guestCount", "200");
  await mobilePage.evaluate(() => {
    const form = document.getElementById("intake-form");
    if (form) form.requestSubmit();
  });
  await mobilePage.waitForSelector(".dashboard-container", { timeout: 30000 });

  // (H1) Mobile Light theme
  await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, "scenario-h1-mobile-375px-light.png") });
  console.log("  Saved: screenshots/scenario-h1-mobile-375px-light.png");

  // (H2) Mobile Dark theme
  await mobilePage.click(".theme-toggle-btn");
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, "scenario-h2-mobile-375px-dark.png") });
  console.log("  Saved: screenshots/scenario-h2-mobile-375px-dark.png");

  await mobileContext.close();
  await browser.close();

  console.log("\n=======================================================");
  console.log("     ALL 8 REQUIRED BROWSER SCENARIOS CAPTURED!        ");
  console.log("=======================================================\n");
}

run().catch((err) => {
  console.error("Browser verification error:", err);
  process.exit(1);
});
