import { chromium } from "playwright-core";
const b = await chromium.launch({headless:true, args:["--no-sandbox"]});
const p = await b.newPage();
await p.goto("http://localhost:5173/login", {waitUntil:"networkidle", timeout:20000});
await p.waitForFunction(() => document.querySelectorAll("input").length > 1, {timeout:10000});
await p.fill('input[type="email"]', "anassamiri87@gmail.com");
await p.fill('input[type="password"]', "demo123");
await p.click("button");
await p.waitForURL("**/dashboard", {timeout:15000});
await p.waitForTimeout(2000);
// Get dashboard heading
const heading = await p.evaluate(() => {
  const h1 = document.querySelector("h1");
  if (h1) return "h1: " + h1.textContent;
  const h2 = document.querySelector("h2");
  if (h2) return "h2: " + h2.textContent;
  return "no heading found";
});
console.log("HEADING:", heading);
// Check for stat cards
const stats = await p.evaluate(() => {
  const all = document.querySelectorAll("h1, h2, h3, h4, .text-2xl, .text-lg.font-bold");
  return Array.from(all).map(e => e.tagName + "." + (e.className||"").substring(0,40) + " = " + (e.textContent||"").trim()).slice(0,10);
});
console.log("TITLES:");
stats.forEach(s => console.log("  " + s));
// Check stat card classes
const cardDivs = await p.evaluate(() => {
  const all = document.querySelectorAll("div.rounded-xl");
  return Array.from(all).map(d => d.className.substring(0,80) + " text=" + (d.textContent||"").trim().substring(0,40)).slice(0,10);
});
console.log("CARD DIVS:");
cardDivs.forEach(c => console.log("  " + c));
await b.close();
