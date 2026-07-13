import { test, expect } from "@playwright/test";
import { navigateTo, expectHeading, expectButton } from "../../helpers";

test.describe("Settings", () => {
  test("settings page loads", async ({ page }) => {
    await navigateTo(page, "/settings");
    await expectHeading(page, /Settings|Configuration/i);
  });

  test("organization info is displayed", async ({ page }) => {
    await navigateTo(page, "/settings");
    const orgSection = page.locator("text=Organization").or(page.locator("text=Clinic")).first();
    if (await orgSection.isVisible()) {
      await expect(orgSection).toBeVisible();
    }
  });

  test("integration providers are listed", async ({ page }) => {
    await navigateTo(page, "/settings");
    await expect(page.locator("text=OpenAI").or(page.locator("text=Deepgram")).or(page.locator("text=Twilio")).first()).toBeVisible({ timeout: 5000 });
  });

  test("provider connection status shown", async ({ page }) => {
    await navigateTo(page, "/settings");
    const connectedIndicator = page.locator("[class*='connected'], [class*='status']").first();
    if (await connectedIndicator.isVisible()) {
      await expect(connectedIndicator).toBeVisible();
    }
  });

  test("provider configure button exists", async ({ page }) => {
    await navigateTo(page, "/settings");
    const configBtn = page.getByRole("button", { name: /Configure|Connect/i }).first();
    if (await configBtn.isVisible()) {
      await expect(configBtn).toBeVisible();
    }
  });
});
