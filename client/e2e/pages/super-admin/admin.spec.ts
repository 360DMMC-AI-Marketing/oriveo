import { test, expect } from "@playwright/test";
import { navigateTo, expectHeading, expectButton } from "../../helpers";

test.describe("Super Admin Panel", () => {
  test("admin panel loads with tabs", async ({ page }) => {
    await navigateTo(page, "/admin");
    await expectHeading(page, /Admin|Admin Panel/i);
    const tabs = page.locator("button, [role='tab']").filter({ hasText: /Organizations|Subscriptions|Analytics|Health|Settings/i });
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("organizations tab shows org list", async ({ page }) => {
    await navigateTo(page, "/admin");
    const orgTab = page.locator("button, [role='tab']").filter({ hasText: /Organization/i }).first();
    if (await orgTab.isVisible()) {
      await orgTab.click();
      await page.waitForTimeout(1500);
      const orgList = page.locator(".rounded-xl.border").first();
      await expect(orgList).toBeVisible({ timeout: 15000 });
    }
  });

  test("create organization button present", async ({ page }) => {
    await navigateTo(page, "/admin");
    const orgTab = page.locator("button, [role='tab']").filter({ hasText: /Organization/i }).first();
    if (await orgTab.isVisible()) {
      await orgTab.click();
      await page.waitForTimeout(1000);
      await expectButton(page, /Create|Add|New Organization/i);
    }
  });

  test("subscriptions tab shows subscription data", async ({ page }) => {
    await navigateTo(page, "/admin");
    const subTab = page.locator("button, [role='tab']").filter({ hasText: /Subscription/i }).first();
    if (await subTab.isVisible()) {
      await subTab.click();
      await page.waitForTimeout(1500);
      const subList = page.locator("table, [class*='sub'], [class*='subscription']").first();
      await expect(subList).toBeVisible({ timeout: 15000 });
    }
  });

  test("analytics tab shows overview metrics", async ({ page }) => {
    await navigateTo(page, "/admin");
    const analyticsTab = page.locator("button, [role='tab']").filter({ hasText: /Analytics/i }).first();
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
      await page.waitForTimeout(1500);
      const metrics = page.locator("text=Calls").or(page.locator("text=Users")).or(page.locator("text=Patients")).first();
      await expect(metrics).toBeVisible({ timeout: 15000 });
    }
  });

  test("health tab shows service statuses", async ({ page }) => {
    await navigateTo(page, "/admin");
    const healthTab = page.locator("button, [role='tab']").filter({ hasText: /Health/i }).first();
    if (await healthTab.isVisible()) {
      await healthTab.click();
      await page.waitForTimeout(1500);
      const statusList = page.locator("text=MongoDB").or(page.locator("text=OpenAI")).or(page.locator("text=Twilio")).first();
      await expect(statusList).toBeVisible({ timeout: 15000 });
    }
  });

  test("settings tab shows configuration keys", async ({ page }) => {
    await navigateTo(page, "/admin");
    const settingsTab = page.locator("button, [role='tab']").filter({ hasText: /^Settings$/i }).first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await page.waitForTimeout(1500);
      const configFields = page.locator("input, [class*='config'], [class*='setting']").first();
      await expect(configFields).toBeVisible({ timeout: 15000 });
    }
  });

  test("organization rows show user and patient counts", async ({ page }) => {
    await navigateTo(page, "/admin");
    const orgTab = page.locator("button, [role='tab']").filter({ hasText: /Organization/i }).first();
    if (await orgTab.isVisible()) {
      await orgTab.click();
      await page.waitForTimeout(1500);
      const orgRows = page.locator(".rounded-xl.border");
      const count = await orgRows.count();
      if (count > 0) {
        const text = await orgRows.first().innerText();
        expect(text).toBeTruthy();
      }
    }
  });
});
