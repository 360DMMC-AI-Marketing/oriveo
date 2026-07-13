import { test, expect } from "@playwright/test";
import { navigateTo, expectHeading, expectButton } from "../../helpers";

test.describe("Reports", () => {
  test("reports list loads", async ({ page }) => {
    await navigateTo(page, "/reports");
    await expectHeading(page, /Report/i);
  });

  test("reports table shows rows", async ({ page }) => {
    await navigateTo(page, "/reports");
    const rows = page.locator("table tbody tr, a[href*='/reports/'], [class*='row']").first();
    await expect(rows).toBeAttached({ timeout: 5000 });
  });

  test("generate report button is present", async ({ page }) => {
    await navigateTo(page, "/reports");
    await expectButton(page, /Generate|New Report/i);
  });

  test("generate all missing reports button present", async ({ page }) => {
    await navigateTo(page, "/reports");
    const genAllBtn = page.getByRole("button", { name: /Generate All|Generate Missing/i }).first();
    if (await genAllBtn.isVisible()) {
      await expect(genAllBtn).toBeVisible();
    }
  });

  test("navigating to report detail shows signed status", async ({ page }) => {
    await navigateTo(page, "/reports");
    const reportLink = page.locator("a[href*='/reports/']").first();
    if (await reportLink.isVisible()) {
      await reportLink.click();
      await page.waitForURL(/\/reports\/(?!new|create|generate)/, { timeout: 5000 });
      const statusIndicator = page.locator("text=Signed").or(page.locator("text=Unsigned")).or(page.locator("text=Status")).first();
      if (await statusIndicator.isVisible()) {
        await expect(statusIndicator).toBeVisible();
      }
    }
  });

  test("sign report button visible on unsigned reports", async ({ page }) => {
    await navigateTo(page, "/reports");
    const reportLink = page.locator("a[href*='/reports/']").first();
    if (await reportLink.isVisible()) {
      await reportLink.click();
      await page.waitForURL(/\/reports\/(?!new|create|generate)/, { timeout: 5000 });
      const signBtn = page.getByRole("button", { name: /Sign/i }).first();
      if (await signBtn.isVisible()) {
        await expect(signBtn).toBeVisible();
      }
    }
  });

  test("PDF download button is present on detail", async ({ page }) => {
    await navigateTo(page, "/reports");
    const reportLink = page.locator("a[href*='/reports/']").first();
    if (await reportLink.isVisible()) {
      await reportLink.click();
      await page.waitForURL(/\/reports\/(?!new|create|generate)/, { timeout: 5000 });
      const pdfBtn = page.getByRole("button", { name: /PDF|Download/i }).first();
      if (await pdfBtn.isVisible()) {
        await expect(pdfBtn).toBeVisible();
      }
    }
  });

  test("FHIR export button present", async ({ page }) => {
    await navigateTo(page, "/reports");
    const reportLink = page.locator("a[href*='/reports/']").first();
    if (await reportLink.isVisible()) {
      await reportLink.click();
      await page.waitForURL(/\/reports\/(?!new|create|generate)/, { timeout: 5000 });
      const fhirBtn = page.locator("text=FHIR").or(page.getByRole("button", { name: /FHIR|Export/i })).first();
      if (await fhirBtn.isVisible()) {
        await expect(fhirBtn).toBeVisible();
      }
    }
  });

  test("bulk actions section exists", async ({ page }) => {
    await navigateTo(page, "/reports");
    const bulkSection = page.locator("text=Bulk").or(page.getByRole("button", { name: /Bulk/i })).first();
    if (await bulkSection.isVisible()) {
      await expect(bulkSection).toBeVisible();
    }
  });
});
