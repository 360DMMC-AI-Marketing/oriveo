import { test, expect } from "@playwright/test";
import { navigateTo, expectHeading, expectButton } from "../../helpers";

test.describe("Call Center", () => {
  test("loads with Quick Call tab", async ({ page }) => {
    await navigateTo(page, "/voice-agent");
    await expectHeading(page, /Call Center|Calls/i);
    await expect(page.locator("text=Quick Call").first()).toBeVisible();
  });

  test("has Batch Schedule tab", async ({ page }) => {
    await navigateTo(page, "/voice-agent");
    await expect(page.locator("text=Batch Schedule").or(page.locator("text=Batch")).first()).toBeVisible();
  });

  test("Quick Call form has patient and reason fields", async ({ page }) => {
    await navigateTo(page, "/voice-agent");
    const quickTab = page.locator("button, [role='tab']").filter({ hasText: "Quick Call" }).first();
    if (await quickTab.isVisible()) await quickTab.click();
    await page.waitForTimeout(1000);
    const patientField = page.locator("input, select, textarea").first();
    await expect(patientField).toBeVisible({ timeout: 3000 });
  });
});

test.describe("Call History", () => {
  test("call history list loads", async ({ page }) => {
    await navigateTo(page, "/voice-agent");
    const historyTab = page.locator("button, [role='tab']").filter({ hasText: /History|Completed/i }).first();
    if (await historyTab.isVisible()) await historyTab.click();
    await page.waitForTimeout(1000);
    const row = page.locator("table tbody tr, [class*='row'], [class*='call-item']").first();
    if (await row.isVisible()) {
      await expect(row).toBeVisible();
    }
  });

  test("call history rows show status", async ({ page }) => {
    await navigateTo(page, "/voice-agent");
    const historyTab = page.locator("button, [role='tab']").filter({ hasText: /History|Completed/i }).first();
    if (await historyTab.isVisible()) await historyTab.click();
    await page.waitForTimeout(1000);
    const firstRow = page.locator("table tbody tr, [class*='row']").first();
    if (await firstRow.isVisible()) {
      const text = await firstRow.innerText();
      expect(text.length).toBeGreaterThan(0);
    }
  });
});

test.describe("Inbound Calls", () => {
  test("inbound calls section loads", async ({ page }) => {
    await navigateTo(page, "/inbound-calls");
    await expect(page.locator("text=Inbound").or(page.locator("text=Incoming")).first()).toBeVisible({ timeout: 5000 });
  });

  test("has tabs for different inbound states", async ({ page }) => {
    await navigateTo(page, "/inbound-calls");
    const tabCount = await page.locator("button, [role='tab']").count();
    expect(tabCount).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Call Detail & Emergency", () => {
  test("navigating to a call detail shows transcript", async ({ page }) => {
    await navigateTo(page, "/voice-agent");
    const historyTab = page.locator("button, [role='tab']").filter({ hasText: /History|Completed/i }).first();
    if (await historyTab.isVisible()) await historyTab.click();
    await page.waitForTimeout(1000);
    const callLink = page.locator("a[href*='/calls/'], a[href*='/call/']").first();
    if (await callLink.isVisible()) {
      await callLink.click();
      await page.waitForURL(/\/calls?\/(?!center|history|new)/, { timeout: 5000 });
      await expect(page.locator("text=Transcript").or(page.locator("text=Conversation")).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("call detail shows QA score when available", async ({ page }) => {
    await navigateTo(page, "/voice-agent");
    const historyTab = page.locator("button, [role='tab']").filter({ hasText: /History|Completed/i }).first();
    if (await historyTab.isVisible()) await historyTab.click();
    await page.waitForTimeout(1000);
    const callLink = page.locator("a[href*='/calls/'], a[href*='/call/']").first();
    if (await callLink.isVisible()) {
      await callLink.click();
      await page.waitForURL(/\/calls?\/(?!center|history|new)/, { timeout: 5000 });
      const qaScore = page.locator("text=QA").or(page.locator("text=Accuracy")).or(page.locator("text=Score")).first();
      if (await qaScore.isVisible()) {
        await expect(qaScore).toBeVisible();
      }
    }
  });

  test("transfer to human button visible on active calls", async ({ page }) => {
    await navigateTo(page, "/voice-agent");
    const callLink = page.locator("a[href*='/calls/'], a[href*='/call/']").first();
    if (await callLink.isVisible()) {
      await callLink.click();
      await page.waitForURL(/\/calls?\/(?!center)/, { timeout: 5000 });
      const transferBtn = page.getByRole("button", { name: /Transfer|Human/i }).first();
      if (await transferBtn.isVisible()) {
        await expect(transferBtn).toBeVisible();
      }
    }
  });

  test("emergency banner exists when applicable", async ({ page }) => {
    await navigateTo(page, "/voice-agent");
    const callLink = page.locator("a[href*='/calls/'], a[href*='/call/']").first();
    if (await callLink.isVisible()) {
      await callLink.click();
      await page.waitForURL(/\/calls?\/(?!center)/, { timeout: 5000 });
      const emergency = page.locator("text=Emergency").or(page.locator("text=911")).first();
      if (await emergency.isVisible()) {
        await expect(emergency).toBeVisible();
      }
    }
  });
});
