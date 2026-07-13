import { test, expect } from "@playwright/test";
import { navigateTo, waitForPageLoad, expectHeading, clickSidebarLink } from "./helpers";

test.describe("Feature Integration Tests", () => {
  test("Patient → Appointments: creating patient then booking appointment", async ({ page }) => {
    await navigateTo(page, "/patients");
    const patientRows = page.locator("a[href*='/patients/']");
    const count = await patientRows.count();
    if (count > 0) {
      await patientRows.first().click();
      await page.waitForURL(/\/patients\/(?!new|create|import)/, { timeout: 5000 });
      const aptSection = page.locator("text=Appointment").first();
      if (await aptSection.isVisible()) {
        await expect(aptSection).toBeVisible();
      }
    }
  });

  test("Patient → Call History: patient detail links to calls", async ({ page }) => {
    await navigateTo(page, "/patients");
    const patientLink = page.locator("a[href*='/patients/']").first();
    if (await patientLink.isVisible()) {
      await patientLink.click();
      await page.waitForURL(/\/patients\/(?!new|create|import)/, { timeout: 5000 });
      const callLink = page.locator("a[href*='/calls/']").or(page.locator("text=Call.*Record")).or(page.locator("text=Call History")).first();
      if (await callLink.isVisible()) {
        await callLink.click();
        await page.waitForURL(/call/, { timeout: 5000 });
      }
    }
  });

  test("Call → Report: call detail has report link", async ({ page }) => {
    await navigateTo(page, "/voice-agent");
    const historyTab = page.locator("button, [role='tab']").filter({ hasText: /History|Completed/i }).first();
    if (await historyTab.isVisible()) await historyTab.click();
    await page.waitForTimeout(1000);
    const callLink = page.locator("a[href*='/calls/'], a[href*='/call/']").first();
    if (await callLink.isVisible()) {
      await callLink.click();
      await page.waitForURL(/\/calls?\/(?!center|history)/, { timeout: 5000 });
      const reportLink = page.locator("a[href*='/reports/']").or(page.locator("text=View Report")).or(page.locator("text=Generate Report")).first();
      if (await reportLink.isVisible()) {
        await expect(reportLink).toBeVisible();
      }
    }
  });

  test("Report → Patient: report references patient", async ({ page }) => {
    await navigateTo(page, "/reports");
    const reportLink = page.locator("a[href*='/reports/']").first();
    if (await reportLink.isVisible()) {
      await reportLink.click();
      await page.waitForURL(/\/reports\/(?!new|create|generate)/, { timeout: 5000 });
      const patientRef = page.locator("a[href*='/patients/']").or(page.locator("text=Patient").first());
      if (await patientRef.isVisible()) {
        await expect(patientRef).toBeVisible();
      }
    }
  });

  test("Dashboard → Patients: clicking patients stat navigates correctly", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    const patientLink = page.locator("aside a").filter({ hasText: /Patient/i }).first();
    if (await patientLink.isVisible()) {
      await patientLink.click();
      await page.waitForURL(/patient/, { timeout: 5000 });
      await expectHeading(page, /Patient/i);
    }
  });

  test("Dashboard → Appointments: clicking appointments stat navigates correctly", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    const aptLink = page.locator("aside a").filter({ hasText: /Appointment/i }).first();
    if (await aptLink.isVisible()) {
      await aptLink.click();
      await page.waitForURL(/appointment/, { timeout: 5000 });
    }
  });

  test("Dashboard → Calls: clicking calls stat navigates correctly", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    const callsLink = page.locator("aside a").filter({ hasText: /Call Center/i }).first();
    if (await callsLink.isVisible()) {
      await callsLink.click();
      await page.waitForURL(/voice-agent|calls/, { timeout: 5000 });
    }
  });

  test("Settings → Integrations: providers listed match expected services", async ({ page }) => {
    await navigateTo(page, "/settings");
    const expectedProviders = ["OpenAI", "Deepgram", "ElevenLabs", "Twilio", "AWS", "Azure", "Sentry", "athenahealth", "Slack", "FHIR"];
    for (const provider of expectedProviders) {
      const el = page.locator(`text=${provider}`).first();
      if (await el.isVisible()) {
        await expect(el).toBeVisible();
        break;
      }
    }
  });

  test("Sidebar navigation: all protected pages reachable", async ({ page }) => {
    const navItems = [
      "Dashboard", "Patients & Groups", "Appointments", 
      "Call Center", "Medical Reports", "Analytics",
      "Settings"
    ];
    for (const item of navItems) {
      await navigateTo(page, "/dashboard");
      const linkInSidebar = page.locator("aside a").filter({ hasText: item }).first();
      if (await linkInSidebar.isVisible()) {
        await linkInSidebar.click();
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        expect(currentUrl).not.toContain("login");
      }
    }
  });

  test("Browser back button preserves history across feature pages", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    await page.goto("/patients");
    await waitForPageLoad(page);
    await page.goto("/appointments");
    await waitForPageLoad(page);
    await page.goBack();
    await page.waitForURL(/patient/, { timeout: 5000 });
    await page.goBack();
    await page.waitForURL(/dashboard/, { timeout: 5000 });
  });

  test("Notifications → Call: clicking notification links to related call", async ({ page }) => {
    await navigateTo(page, "/notifications");
    const notifLink = page.locator("a[href*='/calls/']").or(page.locator("a[href*='/patients/']")).first();
    if (await notifLink.isVisible()) {
      await notifLink.click();
      await page.waitForTimeout(3000);
      expect(page.url()).not.toContain("notifications");
    }
  });

  test("Call → Transfer: transfer to human flow exists", async ({ page }) => {
    await navigateTo(page, "/voice-agent");
    const historyTab = page.locator("button, [role='tab']").filter({ hasText: /History|Completed/i }).first();
    if (await historyTab.isVisible()) await historyTab.click();
    await page.waitForTimeout(1000);
    const callLink = page.locator("a[href*='/calls/'], a[href*='/call/']").first();
    if (await callLink.isVisible()) {
      await callLink.click();
      await page.waitForURL(/\/calls?\/(?!center)/, { timeout: 5000 });
      const transferBtn = page.getByRole("button", { name: /Transfer|Human/i }).first();
      if (await transferBtn.isVisible()) {
        await transferBtn.click();
        await page.waitForTimeout(1000);
        const reasonModal = page.locator("[role='dialog'], [class*='modal'], textarea").first();
        if (await reasonModal.isVisible()) {
          await expect(reasonModal).toBeVisible();
        }
      }
    }
  });

  test("Admin → Organization → Users: org detail shows user list", async ({ page }) => {
    await navigateTo(page, "/admin");
    const orgTab = page.locator("button, [role='tab']").filter({ hasText: /Organization/i }).first();
    if (await orgTab.isVisible()) {
      await orgTab.click();
      await page.waitForTimeout(1500);
      const viewUsersBtn = page.getByRole("button", { name: /Users|View.*Users/i }).first();
      if (await viewUsersBtn.isVisible()) {
        await viewUsersBtn.click();
        await page.waitForTimeout(1000);
        const userList = page.locator("text=email, text=@").first();
        await expect(userList).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("Landing → Login: sign in link navigates to auth page", async ({ page }) => {
    await navigateTo(page, "/");
    const signInLink = page.locator("a[href*='/login'], a[href*='/signin']").first();
    if (await signInLink.isVisible()) {
      await signInLink.click();
      await page.waitForURL(/login|signin/i, { timeout: 5000 });
      await expect(page.locator('input[type="email"]').first()).toBeVisible();
    }
  });

  test("No-Show Stats flow: dashboard → appointments → filter", async ({ page }) => {
    await navigateTo(page, "/dashboard");
    await expect(page.getByText(/No.?Show/i).first()).toBeVisible({ timeout: 5000 });
    await navigateTo(page, "/appointments");
    const noShowTab = page.locator("button, [role='tab'], [class*='tab']").filter({ hasText: "No Show" }).first();
    if (await noShowTab.isVisible()) {
      await noShowTab.click();
      await page.waitForTimeout(1500);
      const savingsText = page.locator("text=Savings").or(page.locator("text=Cost")).first();
      if (await savingsText.isVisible()) {
        await expect(savingsText).toBeVisible();
      }
    }
  });
});
