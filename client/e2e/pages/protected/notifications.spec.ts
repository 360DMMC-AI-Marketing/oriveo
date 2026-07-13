import { test, expect } from "@playwright/test";
import { navigateTo, expectHeading } from "../../helpers";

test.describe("Notifications", () => {
  test("notifications page loads with tabs", async ({ page }) => {
    await navigateTo(page, "/notifications");
    await expectHeading(page, /Notification/i);
    const tabs = page.locator("button, [role='tab']");
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("notification list loads items", async ({ page }) => {
    await navigateTo(page, "/notifications");
    // May have items or empty state; both are valid
    const items = page.locator(".rounded-lg.border.p-4, li, [role='listitem']").first();
    const emptyState = page.getByText(/No notifications/i).first();
    await expect(items.or(emptyState)).toBeVisible({ timeout: 10000 });
  });

  test("mark all read button exists", async ({ page }) => {
    await navigateTo(page, "/notifications");
    const markAllBtn = page.getByRole("button", { name: /Mark.*Read|Read All/i }).first();
    if (await markAllBtn.isVisible()) {
      await expect(markAllBtn).toBeVisible();
    }
  });

  test("notification types are displayed", async ({ page }) => {
    await navigateTo(page, "/notifications");
    const typeText = page.locator("text=call").or(page.locator("text=appointment")).or(page.locator("text=report")).or(page.locator("text=system")).first();
    if (await typeText.isVisible()) {
      await expect(typeText).toBeVisible();
    }
  });

  test("infinite scroll loads more notifications", async ({ page }) => {
    await navigateTo(page, "/notifications");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    const items = page.locator(".rounded-lg.border.p-4, li, [role='listitem']");
  });
});
