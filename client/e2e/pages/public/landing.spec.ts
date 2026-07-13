import { test, expect } from "@playwright/test";
import { navigateTo, expectHeading, expectText, expectButton } from "../../helpers";

test.describe("Landing Page", () => {
  test("displays hero section with CTA buttons", async ({ page }) => {
    await navigateTo(page, "/");
    await expect(page.locator("text=Intelligence Platform").or(page.locator("text=Oriveo")).first()).toBeVisible({ timeout: 10000 });
    await expectButton(page, /Request a Demo/i);
    await expect(page.getByRole("button", { name: /Schedule a Demo/i }).or(page.getByRole("button", { name: /Explore Platform/i })).first()).toBeVisible();
  });

  test("shows trust bar with certification badges", async ({ page }) => {
    await navigateTo(page, "/");
    await expect(page.locator("text=HIPAA").first()).toBeVisible();
    await expect(page.locator("text=SOC 2").first()).toBeVisible();
    await expect(page.locator("text=HITRUST").first()).toBeVisible();
  });

  test("shows feature cards on landing", async ({ page }) => {
    await navigateTo(page, "/");
    await expect(page.locator("text=Intelligent Call Center").first()).toBeVisible();
    await expect(page.locator("text=Patient Engagement").first()).toBeVisible();
    await expect(page.locator("text=Clinical Intelligence").first()).toBeVisible();
    await expect(page.locator("text=Enterprise Security").first()).toBeVisible();
  });

  test("footer has working links", async ({ page }) => {
    await navigateTo(page, "/");
    await expect(page.locator("a[href='/features']").first()).toBeVisible();
    await expect(page.locator("a[href='/pricing']").first()).toBeVisible();
    await expect(page.locator("a[href='/contact']").first()).toBeVisible();
  });

  test("navigation bar has platform, pricing, contact", async ({ page }) => {
    await navigateTo(page, "/");
    await expect(page.locator("header a, nav a").filter({ hasText: "Platform" }).or(page.locator("header a, nav a").filter({ hasText: "Features" })).first()).toBeVisible();
    await expect(page.locator("header a, nav a").filter({ hasText: "Pricing" }).first()).toBeVisible();
    await expect(page.locator("header a, nav a").filter({ hasText: "Contact" }).first()).toBeVisible();
  });
});

test.describe("Features Page", () => {
  test("has feature cards", async ({ page }) => {
    await navigateTo(page, "/features");
    await expectHeading(page, /Features/i);
    const featureCards = page.locator("h2, h3").filter({ hasText: /AI|Voice|Clinical|Patient|Live|Human|Quality|Monitoring|Scheduling|Documentation/i });
    const count = await featureCards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("has request demo button", async ({ page }) => {
    await navigateTo(page, "/features");
    await expectButton(page, /Request a Demo/i);
  });
});

test.describe("Pricing Page", () => {
  test("shows plan tiers", async ({ page }) => {
    await navigateTo(page, "/pricing");
    await expect(page.locator("text=Starter").first()).toBeVisible();
    await expect(page.locator("text=Professional").first()).toBeVisible();
    await expect(page.locator("text=Enterprise").first()).toBeVisible();
  });

  test("has comparison table", async ({ page }) => {
    await navigateTo(page, "/pricing");
    await expect(page.locator("table, [class*='comparison'], [class*='table']").first()).toBeVisible({ timeout: 5000 });
  });

  test("has FAQ section", async ({ page }) => {
    await navigateTo(page, "/pricing");
    await expect(page.locator("text=FAQ").first()).toBeVisible();
  });
});

test.describe("Contact Page", () => {
  test("displays form with all fields", async ({ page }) => {
    await navigateTo(page, "/contact");
    await expectHeading(page, /Contact|Get in Touch/i);
    await expect(page.locator('input[placeholder*="Dr."], input[placeholder*="Name"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[placeholder*="Phone"], input[placeholder*="555"]').first()).toBeVisible();
    await expect(page.locator('textarea').first()).toBeVisible();
    await expectButton(page, /Send Message/i);
  });

  test("submits form successfully", async ({ page }) => {
    await navigateTo(page, "/contact");
    await page.locator('input[placeholder*="Dr."], input[placeholder*="Name"]').first().fill("Test User");
    await page.locator('input[type="email"]').first().fill("test@example.com");
    const phone = page.locator('input[placeholder*="Phone"], input[placeholder*="555"]').first();
    if (await phone.isVisible()) await phone.fill("+1234567890");
    await page.locator('input[placeholder*="Organization"], input[placeholder*="Health"]').first().fill("Test Clinic");
    await page.locator('textarea').first().fill("This is a test message");
    await page.getByRole("button", { name: /Send Message/i }).first().click();
    await expect(page.getByText(/Message sent|success|thank you|received/i).first()).toBeVisible({ timeout: 5000 });
  });
});
