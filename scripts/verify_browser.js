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

async function run() {
  console.log("=======================================================");
  console.log("       BROWSER AUTOMATION VERIFICATION FLOW           ");
  console.log("=======================================================\n");

  console.log("[Browser] Launching browser (msedge headless)...");
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  console.log("[Browser] Navigating to http://localhost:5173/ ...");
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });

  // 1. Check title and initial form
  const pageTitle = await page.title();
  console.log(`[Browser] Page title: "${pageTitle}"`);
  if (!pageTitle.includes("WedPlan AI")) {
    throw new Error(`Unexpected page title: ${pageTitle}`);
  }

  // 2. Test Tight Timeline notice (under 14 days)
  console.log("[Browser] Testing tight timeline notice (<14 days)...");
  const tightDate = new Date();
  tightDate.setDate(tightDate.getDate() + 7);
  const tightDateStr = tightDate.toISOString().split("T")[0];

  await page.fill("#weddingDate", tightDateStr);
  await page.waitForTimeout(400);

  const tightNotice = page.locator(".notice-box");
  const isTightVisible = await tightNotice.isVisible();
  console.log(`[Browser] Tight timeline notice visible: ${isTightVisible}`);
  if (!isTightVisible) {
    throw new Error("Tight timeline notice was expected but not visible!");
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "01-tight-timeline-notice.png") });
  console.log("  Saved: screenshots/01-tight-timeline-notice.png");

  // 3. Fill the Intake Form with realistic test data:
  // 150 guests, 8,00,000 INR budget, Tier-2 city, 3 functions, a vibe, 3 priorities
  console.log("\n[Browser] Filling intake form with realistic wedding scenario...");
  const realisticDate = new Date();
  realisticDate.setMonth(realisticDate.getMonth() + 5);
  const realisticDateStr = realisticDate.toISOString().split("T")[0];

  await page.fill("#coupleName", "Rhea & Advait");
  await page.fill("#weddingDate", realisticDateStr);
  await page.fill("#city", "Lucknow");
  await page.selectOption("#cityTier", "Tier-2");
  await page.fill("#totalBudget", "800000");
  await page.fill("#guestCount", "150");
  await page.selectOption("#style", "Traditional");

  // Select 3 functions: Haldi, Sangeet, Wedding (toggle others off/on as needed)
  console.log("[Browser] Configuring 3 functions (Haldi, Sangeet, Wedding)...");
  // Default selected: Haldi, Mehendi, Sangeet, Wedding. Deselect Mehendi:
  const mehendiBtn = page.locator('button.chip-btn:has-text("Mehendi")');
  await mehendiBtn.click();

  // Select 3 priorities: Food, Venue & Decor, Photography
  console.log("[Browser] Configuring 3 priorities (Food, Venue & Decor, Photography)...");
  // Default has Food and Venue & Decor. Click Photography:
  const photoBtn = page.locator('button.chip-btn:has-text("Photography")');
  await photoBtn.click();

  await page.fill("#specialRequests", "Awadhi vegetarian royal feast, sunset Phere");

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "02-intake-form-filled.png") });
  console.log("  Saved: screenshots/02-intake-form-filled.png");

  // 4. Submit form and verify dashboard loads
  console.log("[Browser] Submitting intake form...");
  await page.click('button[type="submit"]');

  // Wait for Dashboard to appear
  await page.waitForSelector(".dashboard-container", { timeout: 10000 });
  console.log("[Browser] Dashboard loaded successfully!");

  // TAB 1: Overview
  console.log("[Browser] Inspecting Tab 1: Overview...");
  const budgetText = await page.locator(".stat-value >> nth=0").innerText();
  const healthBadge = await page.locator(".stat-card >> nth=1").innerText();
  const perGuest = await page.locator(".stat-value >> nth=1").innerText();
  console.log(`  Budget displayed: ${budgetText}`);
  console.log(`  Health status: ${healthBadge.trim().replace(/\n/g, " ")}`);
  console.log(`  Spend per guest: ${perGuest}`);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03-tab1-overview.png") });
  console.log("  Saved: screenshots/03-tab1-overview.png");

  // TAB 2: Budget & What-If Simulator
  console.log("\n[Browser] Switching to Tab 2: Budget & What-If...");
  await page.click('#tab-budget');
  await page.waitForSelector(".budget-table-wrapper");

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "04-tab2-budget-initial.png") });
  console.log("  Saved: screenshots/04-tab2-budget-initial.png");

  // Test What-If slider change
  console.log("[Browser] Adjusting What-If budget slider to 12,00,000...");
  await page.fill("#budgetSlider", "1200000");
  await page.dispatchEvent("#budgetSlider", "change");

  // Wait for debounced recalculation (300ms + request)
  await page.waitForTimeout(600);

  const updatedBudgetTotal = await page.locator(".budget-table tfoot td >> nth=1").innerText();
  console.log(`  Updated total budget in table: ${updatedBudgetTotal}`);
  if (!updatedBudgetTotal.includes("12,00,000")) {
    throw new Error(`Expected table to show 12,00,000, but got: ${updatedBudgetTotal}`);
  }

  // Test guest stepper
  console.log("[Browser] Clicking guest stepper (+25 guests)...");
  await page.click('button.stepper-btn:has-text("+")');
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "05-tab2-budget-what-if.png") });
  console.log("  Saved: screenshots/05-tab2-budget-what-if.png");

  // TAB 3: Timeline
  console.log("\n[Browser] Switching to Tab 3: Timeline...");
  await page.click('#tab-timeline');
  await page.waitForSelector(".timeline-phase-group");

  console.log("[Browser] Checking first timeline task checkbox...");
  const firstCheckbox = page.locator(".task-checkbox >> nth=0");
  await firstCheckbox.check();
  const isChecked = await firstCheckbox.isChecked();
  console.log(`  Checkbox is checked: ${isChecked}`);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "06-tab3-timeline.png") });
  console.log("  Saved: screenshots/06-tab3-timeline.png");

  // TAB 4: Vendors
  console.log("\n[Browser] Switching to Tab 4: Vendors...");
  await page.click('#tab-vendors');
  await page.waitForSelector(".vendor-card");

  console.log("[Browser] Changing first vendor status to 'Booked'...");
  const firstVendorSelect = page.locator(".vendor-status-select >> nth=0");
  await firstVendorSelect.selectOption("Booked");
  const selectedStatus = await firstVendorSelect.inputValue();
  console.log(`  Selected status: ${selectedStatus}`);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "07-tab4-vendors.png") });
  console.log("  Saved: screenshots/07-tab4-vendors.png");

  // TAB 5: Ideas
  console.log("\n[Browser] Switching to Tab 5: Ideas...");
  await page.click('#tab-ideas');
  await page.waitForSelector(".ideas-card-grid");

  const sourceBadge = await page.locator(".ideas-source-badge").innerText();
  console.log(`  Ideas Source Badge: "${sourceBadge.trim()}"`);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "08-tab5-ideas.png") });
  console.log("  Saved: screenshots/08-tab5-ideas.png");

  // 5. Test localStorage Persistence across Page Reload
  console.log("\n[Browser] Testing persistence across page reload...");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".dashboard-container");

  // Switch back to timeline tab and check if task is still checked
  await page.click('#tab-timeline');
  await page.waitForSelector(".task-checkbox");
  const persistedCheckbox = page.locator(".task-checkbox >> nth=0");
  const persistedChecked = await persistedCheckbox.isChecked();
  console.log(`  Persisted task checkbox after reload: ${persistedChecked}`);
  if (!persistedChecked) {
    throw new Error("Task checkbox state did not persist in localStorage!");
  }

  // Switch to vendors tab and check if vendor status is still Booked
  await page.click('#tab-vendors');
  await page.waitForSelector(".vendor-status-select");
  const persistedVendorSelect = page.locator(".vendor-status-select >> nth=0");
  const persistedStatus = await persistedVendorSelect.inputValue();
  console.log(`  Persisted vendor status after reload: "${persistedStatus}"`);
  if (persistedStatus !== "Booked") {
    throw new Error(`Vendor status did not persist in localStorage! Got "${persistedStatus}"`);
  }

  // 6. Test Unrealistic Budget Warning with a tiny budget
  console.log("\n[Browser] Testing tiny budget for Unrealistic warning...");
  await page.click('button:has-text("Edit Details")');
  await page.waitForSelector("#totalBudget");

  // 50,000 INR for 500 guests in Metro -> 100 INR/guest (Unrealistic)
  await page.fill("#totalBudget", "50000");
  await page.fill("#guestCount", "500");
  await page.selectOption("#cityTier", "Metro");
  await page.click('button[type="submit"]');

  await page.waitForSelector(".dashboard-container");
  const healthBadgeTiny = await page.locator(".stat-card >> nth=1").innerText();
  console.log(`  Tiny budget health badge: ${healthBadgeTiny.trim().replace(/\n/g, " ")}`);
  if (!healthBadgeTiny.includes("Unrealistic")) {
    throw new Error(`Expected Unrealistic badge, got: ${healthBadgeTiny}`);
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "09-tiny-budget-unrealistic.png") });
  console.log("  Saved: screenshots/09-tiny-budget-unrealistic.png");

  await browser.close();

  console.log("\n=======================================================");
  console.log("    ALL BROWSER AUTOMATION TESTS PASSED 100%!         ");
  console.log("=======================================================\n");
}

run().catch((err) => {
  console.error("Browser verification failed:", err);
  process.exit(1);
});
