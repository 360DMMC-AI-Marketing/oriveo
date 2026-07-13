import { chromium } from "playwright-core";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto("http://localhost:5173/contact");
await page.waitForTimeout(3000);

await page.locator('input[placeholder*="Dr."]').first().fill("Test User");
await page.locator('input[type="email"]').first().fill("test@example.com");
await page.locator('input[placeholder*="Phone"]').first().fill("+1234567890");
await page.locator('input[placeholder*="Health"]').first().fill("Test Clinic");
await page.locator("textarea").first().fill("This is a test message");
await page.getByRole("button", { name: /Send Message/i }).first().click();
await page.waitForTimeout(5000);

console.log("=== AFTER SUBMIT ===");
console.log((await page.innerText("body")).substring(0, 1000));

// Check for toast
const html = await page.innerHTML("body");
if (html.includes("sonner") || html.includes("toast") || html.includes("success")) {
  console.log("Toast/success found in HTML");
}

// Check specific elements
const toastCount = await page.locator("[data-sonner-toast], [data-toast], [role='status']").count();
console.log("Toast elements count:", toastCount);

const successTexts = await page.locator("text=/success|thank you|message sent|received/i").allTextContents();
console.log("Success texts:", successTexts);

await browser.close();
