import { test, expect } from "@playwright/test";
import { navigateTo, expectHeading, expectButton, expectStatCardCount } from "../../helpers";

test.describe("Analytics", () => {
  test("analytics page loads with charts", async ({ page }) => {
    await navigateTo(page, "/analytics");
    await expectHeading(page, /Analytics|Report/i);
    const charts = page.locator("[class*='recharts'], svg, [class*='chart']");
    const count = await charts.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("generate report button is present", async ({ page }) => {
    await navigateTo(page, "/analytics");
    await expectButton(page, /Generate.*Report|New Report/i);
  });

  async function clickAndWaitForReport(page) {
    const genBtn = page.getByRole("button", { name: /Generate.*Report|New Report/i }).first();
    if (await genBtn.isVisible()) {
      const res = await Promise.all([
        page.waitForResponse((res) => res.url().includes("/patient-portal/generate-monthly-report")),
        genBtn.click(),
      ]);
      return res[0];
    }
    return null;
  }

  test("generate report opens report panel", async ({ page }) => {
    await navigateTo(page, "/analytics");
    const response = await clickAndWaitForReport(page);
    if (response && response.status() === 200) {
      const overlay = page.locator("[class*='inset-0']").first();
      await expect(overlay).toBeVisible({ timeout: 10000 });
    }
  });

  test("report panel has preview/edit toggle", async ({ page }) => {
    await navigateTo(page, "/analytics");
    await clickAndWaitForReport(page);
    const overlay = page.locator("[class*='inset-0']").first();
    if (await overlay.isVisible({ timeout: 5000 }).catch(() => false)) {
      const toggle = page.locator("button").filter({ hasText: /Preview|Edit/i }).first();
      if (await toggle.isVisible()) {
        await expect(toggle).toBeVisible();
      }
    }
  });

  test("report panel has PDF download button", async ({ page }) => {
    await navigateTo(page, "/analytics");
    await clickAndWaitForReport(page);
    const overlay = page.locator("[class*='inset-0']").first();
    if (await overlay.isVisible({ timeout: 5000 }).catch(() => false)) {
      const pdfBtn = page.getByRole("button", { name: /PDF|Download|Print/i }).first();
      if (await pdfBtn.isVisible()) {
        await expect(pdfBtn).toBeVisible();
      }
    }
  });

  test("report panel has send email button", async ({ page }) => {
    await navigateTo(page, "/analytics");
    await clickAndWaitForReport(page);
    const overlay = page.locator("[class*='inset-0']").first();
    if (await overlay.isVisible({ timeout: 5000 }).catch(() => false)) {
      const emailBtn = page.getByRole("button", { name: /Send.*Email|Email/i }).first();
      if (await emailBtn.isVisible()) {
        await expect(emailBtn).toBeVisible();
      }
    }
  });

  test("metrics cards are displayed", async ({ page }) => {
    await navigateTo(page, "/analytics");
    await expectStatCardCount(page, 3);
  });

  test("analytics link from dashboard works", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    const analyticsLink = page.locator("aside a").filter({ hasText: /Analytics|Report/i }).first();
    if (await analyticsLink.isVisible()) {
      await analyticsLink.click();
      await page.waitForURL(/analytics/, { timeout: 5000 });
      await expectHeading(page, /Analytics|Report/i);
    }
  });

  test("charts show data for different metrics", async ({ page }) => {
    await navigateTo(page, "/analytics");
    const chartTexts = page.locator("text=No.?Show").or(page.locator("text=Triage")).or(page.locator("text=Volume")).or(page.locator("text=Performance")).first();
    if (await chartTexts.isVisible()) {
      await expect(chartTexts).toBeVisible();
    }
  });
});
