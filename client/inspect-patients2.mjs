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
// Patient list - get the list/table part
await p.goto("http://localhost:5173/patients");
await p.waitForTimeout(3000);
const patRows = await p.evaluate(() => {
  const main = document.querySelector("main");
  if (!main) return "no main";
  const rows = main.querySelectorAll("a[href*='/patients/'], table, [role='grid'], [class*='row']");
  return Array.from(rows).slice(0,5).map(r => r.tagName + " " + (r.className||"").substring(0,60) + " " + (r.getAttribute("href")||"").substring(0,30));
});
console.log("=== PATIENT ROWS ===");
patRows.forEach(r => console.log(r));
console.log("=== MORE HTML ===");
const moreHTML = await p.evaluate(() => {
  const m = document.querySelector("main");
  if (!m) return "";
  // after search, get the list content
  const searchDiv = m.querySelector(".space-y-2");
  return searchDiv ? searchDiv.innerHTML.substring(0, 2000) : m.innerHTML.substring(2000, 4000);
});
console.log(moreHTML);
await b.close();
