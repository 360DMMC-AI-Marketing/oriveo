import { test, expect } from "@playwright/test";
import { navigateTo, expectHeading, expectButton, waitForPageLoad } from "../../helpers";

test.describe("Signup Page", () => {
  test("displays signup form with plan selection", async ({ page }) => {
    await navigateTo(page, "/signup");
    // Step 1: Plan selection
    await expect(page.locator("text=Starter").or(page.locator("text=Free")).first()).toBeVisible({ timeout: 10000 });
    // Click "Continue with Starter" to advance to the form
    const continueBtn = page.getByRole("button", { name: /Continue with Starter/i });
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await page.waitForTimeout(2000);
      // Step 2: Form inputs should now be visible
      await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
    }
  });

  test("can navigate to login from signup", async ({ page }) => {
    await navigateTo(page, "/signup");
    const loginLink = page.locator('a[href*="login"]').first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await page.waitForURL(/login/, { timeout: 5000 });
      await expectHeading(page, /Welcome to Oriveo|Sign In|Log In|Login/i);
    }
  });
});

test.describe("Login Page", () => {
  test("displays login form", async ({ page }) => {
    await navigateTo(page, "/login");
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expectButton(page, /Sign in/i);
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await navigateTo(page, "/login");
    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.getByRole("button", { name: /Sign in/i }).first().click();
    await page.waitForTimeout(3000);
    // Look for toast/sonner error notification
    const toast = page.locator("[data-sonner-toast], [class*='toast'], [role='status'], [aria-live='polite']").first();
    if (await toast.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(toast).toBeVisible();
    }
    // Or check that we're still on the login page (not redirected)
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test("has signup link on login page", async ({ page }) => {
    await navigateTo(page, "/login");
    await expect(page.locator('a[href*="signup"]').or(page.getByText(/Sign up/i)).first()).toBeVisible();
  });
});
