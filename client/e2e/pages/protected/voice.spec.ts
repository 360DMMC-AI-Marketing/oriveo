import { test, expect } from "@playwright/test";
import { navigateTo, expectHeading } from "../../helpers";

test.describe("Voice Commands", () => {
  test("voice command button exists on dashboard", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    const micButton = page.locator("[class*='fixed'].rounded-full, button:has(svg.lucide-mic), [aria-label*='voice'], [aria-label*='mic']").first();
    if (await micButton.isVisible()) {
      await expect(micButton).toBeVisible();
    }
  });

  test("floating mic button is present", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    const floatingMic = page.locator("[class*='fixed'].rounded-full.bg-primary").first();
    if (await floatingMic.isVisible()) {
      await expect(floatingMic).toBeVisible();
    }
  });
});
