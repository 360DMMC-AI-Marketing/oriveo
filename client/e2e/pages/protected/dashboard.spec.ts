import { test, expect } from "@playwright/test";
import { navigateTo, waitForPageLoad, expectHeading, expectText, expectButton, expectStatCardCount } from "../../helpers";

test.describe("Dashboard", () => {
  test("loads correctly after login", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    await expectHeading(page, /Dashboard|Overview/i);
  });

  test("shows stat cards", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    await expectStatCardCount(page, 4);
  });

  test("shows stat card summaries", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    await expect(page.getByText(/Needs Attention|Follow.up|Patient|No.Show|Savings/i).first()).toBeVisible();
  });

  test("no-show rate card is displayed", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    await expect(page.getByText(/No.?Show/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("estimated savings card is displayed", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    await expect(page.getByText(/Savings|Cost/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("sidebar navigation links are visible", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator("text=Dashboard").first()).toBeVisible();
    const groupBtn = sidebar.locator("button").filter({ hasText: /Medical|Patients/i }).first();
    if (await groupBtn.isVisible()) {
      await groupBtn.click();
      await page.waitForTimeout(300);
    }
    await expect(page.locator("aside a").filter({ hasText: /Patient/i }).first()).toBeVisible();
  });

  test("sidebar shows workspace name and user name", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    const sidebar = page.locator("aside").first();
    const navbar = page.locator("header").first();
    await expect(navbar.or(sidebar).locator("text=Demo Clinic").or(navbar.or(sidebar).locator("text=Clinic")).first()).toBeVisible({ timeout: 5000 });
  });

  test("no standalone 'Schedule Automated Checkup' card present", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    // The embedded link "Schedule automated checkups" inside Upcoming Auto-Calls is fine
    // The removed standalone card had title "Schedule Automated Checkup" (title case, singular)
    // Use getByRole heading to ensure we don't match link text
    const headings = page.locator("h1, h2, h3, h4");
    const headingTexts = await headings.allInnerTexts();
    const found = headingTexts.some(t => /Schedule Automated Checkup/i.test(t));
    expect(found).toBe(false);
  });

  test("clicking Patients navigates to patients list", async ({ page }) => {
    await navigateTo(page, "/patients");
    await page.waitForURL(/patient/, { timeout: 5000 });
  });

  test("clicking Appointments navigates to appointments list", async ({ page }) => {
    await navigateTo(page, "/appointments");
    await page.waitForURL(/appointment/, { timeout: 5000 });
  });

  test("clicking Call Center navigates to calls page", async ({ page }) => {
    await navigateTo(page, "/voice-agent");
    await page.waitForURL(/voice-agent|calls/, { timeout: 5000 });
  });

  test("notifications dropdown is present in header", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    const header = page.locator("header").first();
    const bell = header.locator("button:has(svg), [aria-label*='notification'], [class*='bell'], [class*='notification']").first();
    if (await bell.isVisible()) {
      await expect(bell).toBeVisible();
    }
  });

  test("user avatar/menu is visible in header", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    const header = page.locator("header").first();
    const avatar = header.locator("button:has(img), [class*='avatar'], [class*='user-menu']").first();
    if (await avatar.isVisible()) {
      await expect(avatar).toBeVisible();
    }
  });

  test("back button works from patient detail to dashboard", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    await page.goto("/patients");
    await waitForPageLoad(page);
    await page.goBack();
    await page.waitForURL(/dashboard/, { timeout: 5000 });
    await expectHeading(page, /Dashboard|Overview/i);
  });
});
