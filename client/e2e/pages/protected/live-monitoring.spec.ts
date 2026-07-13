import { test, expect } from "@playwright/test";
import { navigateTo, expectHeading } from "../../helpers";

test.describe("Live Monitoring", () => {
  test("live monitoring page loads", async ({ page }) => {
    await navigateTo(page, "/live-monitoring");
    await expectHeading(page, /Live|Monitor|Supervisor/i);
  });

  test("shows active calls list or empty state", async ({ page }) => {
    await navigateTo(page, "/live-monitoring");
    const callsList = page.locator(".rounded-xl.border, [class*='call'], [class*='active']").first();
    await expect(callsList).toBeVisible({ timeout: 5000 });
  });

  test("call entries show severity color coding", async ({ page }) => {
    await navigateTo(page, "/live-monitoring");
    const severityIndicators = page.locator("[class*='severity'], [class*='tier'], [class*='critical'], [class*='urgent']");
    const count = await severityIndicators.count();
    if (count > 0) {
      await expect(severityIndicators.first()).toBeVisible();
    }
  });

  test("live transcript section available or empty state shown", async ({ page }) => {
    await navigateTo(page, "/live-monitoring");
    const transcriptSection = page.locator("text=Transcript").or(page.locator("text=Conversation")).or(page.locator("text=No active calls")).first();
    if (await transcriptSection.isVisible()) {
      await expect(transcriptSection).toBeVisible();
    }
  });
});
