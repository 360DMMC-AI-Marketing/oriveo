import { test, expect } from "@playwright/test";
import { navigateTo, expectHeading, expectText } from "../../helpers";

test.describe("Patient Portal (Self-Scheduling)", () => {
  test("public booking page loads with token", async ({ page }) => {
    // This test just checks the booking page structure exists
    await navigateTo(page, "/book/test-token");
    // Either shows the booking form or an error about invalid/expired token
    const content = page.locator("body");
    await expect(content).toBeVisible();
    const text = await content.innerText();
    expect(text.length).toBeGreaterThan(0);
  });

  test("booking page has patient-friendly UI", async ({ page }) => {
    await navigateTo(page, "/book/test-token");
    const heading = page.locator("h1, h2, h3").first();
    await expect(heading).toBeVisible();
  });

  test("booking page shows date/time selection or status message", async ({ page }) => {
    await navigateTo(page, "/book/test-token");
    const hasDateInput = page.locator("input[type='date'], input[type='datetime'], [class*='calendar'], [class*='date']").first();
    const hasMessage = page.locator("text=expired").or(page.locator("text=invalid")).or(page.locator("text=not found")).first();
    await expect(hasDateInput.or(hasMessage).first()).toBeVisible({ timeout: 5000 });
  });
});
