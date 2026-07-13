import { chromium } from "playwright-core";
const b = await chromium.launch({headless:true, args:["--no-sandbox"]});
const p = await b.newPage();
await p.goto("http://localhost:5173/login", {waitUntil:"networkidle", timeout:20000});
await p.waitForFunction(() => document.querySelectorAll("input").length > 1, {timeout:10000});
await p.fill('input[type="email"]', "anassamiri87@gmail.com");
await p.fill('input[type="password"]', "demo123");
await p.click("button");
await p.waitForURL("**/dashboard", {timeout:15000});
await p.waitForTimeout(1000);
await p.goto("http://localhost:5173/analytics");
await p.waitForTimeout(3000);
// Find Generate Report button and click it
const btns = await p.evaluate(() => Array.from(document.querySelectorAll("button")).filter(b => /generate/i.test(b.textContent)).map(b => b.textContent.trim()));
console.log("GEN BTNS:", btns);
await p.click("button:has-text('Generate')");
// Wait for API call to complete
await p.waitForTimeout(5000);
// Check for modal
const hasModal = await p.evaluate(() => {
  const dialogs = document.querySelectorAll("[role='dialog'], [class*='fixed'].inset-0, [class*='overlay']");
  return Array.from(dialogs).map(d => d.className.substring(0,80));
});
console.log("MODALS:", JSON.stringify(hasModal));
// Check body
const bodyEnd = await p.evaluate(() => document.body.innerHTML.slice(-2000));
console.log("BODY END:", bodyEnd.substring(0, 1000));
await b.close();
