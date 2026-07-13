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
// Go to analytics
await p.goto("http://localhost:5173/analytics");
await p.waitForTimeout(3000);
// Find all buttons
const btns = await p.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  return btns.map(b => b.textContent.trim().substring(0, 40)).slice(0, 10);
});
console.log("BUTTONS:", JSON.stringify(btns));
// Click generate report button
const genBtns = await p.evaluate(() => {
  return Array.from(document.querySelectorAll("button"))
    .filter(b => /generate|report/i.test(b.textContent))
    .map(b => b.textContent.trim());
});
console.log("GEN BUTTONS:", JSON.stringify(genBtns));
// Try clicking the first matching button
const result = await p.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const genBtn = btns.find(b => /generate/i.test(b.textContent));
  if (genBtn) {
    genBtn.click();
    return "clicked: " + genBtn.textContent.trim();
  }
  return "not found";
});
console.log("CLICK RESULT:", result);
await p.waitForTimeout(1000);
// Check for modal
const modal = await p.evaluate(() => {
  return document.querySelector("[role='dialog'], [class*='modal'], [class*='overlay']")?.className?.substring(0,80) || "no modal";
});
console.log("MODAL:", modal);
// Check body for new elements
const bodyHTML = await p.evaluate(() => document.body.innerHTML.substring(3000, 5000));
console.log("BODY EXTRA:", bodyHTML.substring(0, 1000));
await b.close();
