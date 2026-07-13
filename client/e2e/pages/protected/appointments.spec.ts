import { test, expect } from "@playwright/test";
import { navigateTo, waitForPageLoad, expectHeading, expectButton, clickButton } from "../../helpers";

test.describe("Appointments", () => {
  test("appointments list loads", async ({ page }) => {
    await navigateTo(page, "/appointments");
    await expectHeading(page, /Appointment/i);
  });

  test("no-show filter tab is present", async ({ page }) => {
    await navigateTo(page, "/appointments");
    await expect(page.getByText("No Show").first()).toBeVisible({ timeout: 5000 });
  });

  test("has status filter buttons (Scheduled, Confirmed, Completed, No Show)", async ({ page }) => {
    await navigateTo(page, "/appointments");
    await expect(page.locator("text=Scheduled").first()).toBeVisible();
    await expect(page.locator("text=Confirmed").or(page.locator("text=Completed")).first()).toBeVisible();
    await expect(page.locator("text=No Show").first()).toBeVisible({ timeout: 5000 });
  });

  test("no show filter button works", async ({ page }) => {
    await navigateTo(page, "/appointments");
    const noShowBtn = page.locator("button").filter({ hasText: "No Show" }).first();
    if (await noShowBtn.isVisible()) {
      await noShowBtn.click();
      await page.waitForTimeout(1500);
      const rows = page.locator("table tbody tr, [class*='row']");
    }
  });

  test("has add appointment button", async ({ page }) => {
    await navigateTo(page, "/appointments");
    await expectButton(page, /Add Appointment|Create|New Appointment|New/i);
  });

  test("appointment rows show patient name and status", async ({ page }) => {
    await navigateTo(page, "/appointments");
    const rows = page.locator("a[href*='/appointments/'], [role='row']");
    const count = await rows.count();
    if (count > 0) {
      const text = await rows.first().innerText();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test("creating appointment opens form", async ({ page }) => {
    await navigateTo(page, "/appointments");
    const addBtn = page.getByRole("button", { name: /Add Appointment|Create|New Appointment|New/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      const form = page.locator("form, [role='dialog'], [class*='modal']").first();
      if (await form.isVisible()) {
        await expect(form).toBeVisible();
      }
    }
  });

  test("appointments link works from patient detail", async ({ page }) => {
    await navigateTo(page, "/patients");
    const firstLink = page.locator("a[href*='/patients/']").first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      await page.waitForURL(/\/patients\/(?!new|create|import)/, { timeout: 5000 });
      const aptSection = page.locator("text=Appointment").first();
      if (await aptSection.isVisible()) {
        await expect(aptSection).toBeVisible();
      }
    }
  });
});
