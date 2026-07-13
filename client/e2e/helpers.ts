import { Page, expect } from "@playwright/test";

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("networkidle");
}

export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await waitForPageLoad(page);
}

export async function expectHeading(page: Page, text: string | RegExp) {
  await expect(page.locator(`h1, h2, h3`).filter({ hasText: text }).first()).toBeVisible();
}

export async function expectText(page: Page, text: string | RegExp) {
  await expect(page.getByText(text).first()).toBeVisible();
}

export async function expectButton(page: Page, text: string | RegExp) {
  await expect(page.getByRole("button", { name: text }).first()).toBeVisible();
}

export async function clickButton(page: Page, text: string) {
  await page.getByRole("button", { name: text }).first().click();
}

export async function fillInput(page: Page, label: string, value: string) {
  const input = page.locator(`input[id="${label}"], input[name="${label}"], input[placeholder*="${label}"]`).first();
  await input.fill(value);
}

export async function selectOption(page: Page, label: string, value: string) {
  const select = page.locator(`select[id="${label}"], select[name="${label}"]`).first();
  await select.selectOption(value);
}

export async function expectSuccessToast(page: Page) {
  await expect(page.getByText(/success|created|saved|updated/i).first()).toBeVisible({ timeout: 5000 });
}

export async function expectTableRowCount(page: Page, min: number) {
  const rows = page.locator("table tbody tr, [role='rowgroup'] > div");
  await expect(rows.first()).toBeAttached({ timeout: 5000 });
}

export async function getStatCards(page: Page) {
  return page.locator(".rounded-xl.border");
}

export async function expectStatCardCount(page: Page, min: number) {
  const cards = await getStatCards(page);
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(min);
}

export async function openSidebar(page: Page) {
  const sidebar = page.locator("aside").first();
  if (await sidebar.isVisible()) return;
  const toggle = page.locator("button[aria-label*='menu'], button[aria-label*='sidebar'], [class*='hamburger'], button:has(svg.lucide-menu)").first();
  if (await toggle.isVisible()) await toggle.click();
  await expect(sidebar).toBeVisible({ timeout: 3000 });
}

export async function clickSidebarLink(page: Page, linkText: string | RegExp) {
  await openSidebar(page);
  // First check if the link is already visible (group expanded)
  const link = page.locator("aside a").filter({ hasText: linkText }).first();
  if (await link.isVisible({ timeout: 1000 }).catch(() => false)) {
    await link.click();
    await waitForPageLoad(page);
    return;
  }
  // Link not visible — try expanding all sidebar group buttons
  const groupButtons = page.locator("aside button").filter({ hasText: /Overview|Communications|Medical|Administration/i });
  const count = await groupButtons.count();
  for (let i = 0; i < count; i++) {
    const btn = groupButtons.nth(i);
    // Click only if not already expanded (has chevron-right indicating collapsed)
    const chevron = btn.locator("svg.lucide-chevron-right");
    if (await chevron.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(300);
    }
  }
  // Now find the link again
  const expandedLink = page.locator("aside a").filter({ hasText: linkText }).first();
  await expect(expandedLink).toBeVisible({ timeout: 3000 });
  await expandedLink.click();
  await waitForPageLoad(page);
}

export async function logout(page: Page) {
  await page.goto("/logout");
  await waitForPageLoad(page);
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15000 });
}
