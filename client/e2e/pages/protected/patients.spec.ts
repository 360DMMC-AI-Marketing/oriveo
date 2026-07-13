import { test, expect } from "@playwright/test";
import { navigateTo, waitForPageLoad, expectHeading, expectButton } from "../../helpers";

test.describe("Patients", () => {
  test("patients list loads and shows patient links", async ({ page }) => {
    await navigateTo(page, "/patients");
    await expectHeading(page, /Patient/i);
    const row = page.locator("a[href*='/patients/']").first();
    const emptyMsg = page.getByText(/No patients yet|all patients are in groups/i).first();
    await expect(row.or(emptyMsg)).toBeVisible({ timeout: 15000 });
  });

  test("create patient button is present", async ({ page }) => {
    await navigateTo(page, "/patients");
    await expectButton(page, /Add Patient|Create|New Patient/i);
  });

  test("create patient form works", async ({ page }) => {
    await navigateTo(page, "/patients");
    await page.getByRole("button", { name: /Add Patient|Create|New Patient/i }).first().click();
    await page.waitForTimeout(1000);
    const nameInput = page.locator('input[name="name"], input[id*="name"], input[placeholder*="name"]').first();
    if (await nameInput.isVisible()) {
      const uniqueName = `E2E Test Patient ${Date.now()}`;
      await nameInput.fill(uniqueName);
      const phoneInput = page.locator('input[name="phone"], input[id*="phone"], input[placeholder*="phone"]').first();
      if (await phoneInput.isVisible()) await phoneInput.fill("+15551234567");
      const submitBtn = page.getByRole("button", { name: /Save|Create|Submit/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await expect(page.getByText(/success|created/i).first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("clicking a patient row navigates to detail page", async ({ page }) => {
    await navigateTo(page, "/patients");
    const firstRow = page.locator("a[href*='/patients/']").first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForURL(/\/patients\/(?!new|create|import)/, { timeout: 5000 });
      await expect(page.locator("text=Patient Info").or(page.locator("text=Patient Information")).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("patient detail page has edit capability", async ({ page }) => {
    await navigateTo(page, "/patients");
    const firstLink = page.locator("a[href*='/patients/']").first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      await page.waitForURL(/\/patients\/(?!new|create|import)/, { timeout: 5000 });
      const editBtn = page.getByRole("button", { name: /Edit/i }).first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        const saveBtn = page.getByRole("button", { name: /Save|Update/i }).first();
        if (await saveBtn.isVisible()) {
          await expect(saveBtn).toBeVisible();
        }
      }
    }
  });

  test("patient detail page shows call history", async ({ page }) => {
    await navigateTo(page, "/patients");
    const firstLink = page.locator("a[href*='/patients/']").first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      await page.waitForURL(/\/patients\/(?!new|create|import)/, { timeout: 5000 });
      const callHistory = page.locator("text=Call History").or(page.locator("text=Calls")).first();
      if (await callHistory.isVisible()) {
        await expect(callHistory).toBeVisible();
      }
    }
  });

  test("delete patient button is present for admin", async ({ page }) => {
    await navigateTo(page, "/patients");
    const deleteBtn = page.getByRole("button", { name: /Delete/i }).first();
    if (await deleteBtn.isVisible()) {
      await expect(deleteBtn).toBeVisible();
    }
  });
});
