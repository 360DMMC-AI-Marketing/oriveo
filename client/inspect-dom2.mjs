import { chromium } from "playwright-core";
const b = await chromium.launch({headless:true});
const p = await b.newPage();
await p.goto("http://localhost:5173/dashboard");
await p.waitForTimeout(5000);
await p.waitForSelector("main, [class*='content'], [class*='layout'], section", {timeout:10000});
const allClasses = await p.evaluate(() => {
  const els = document.querySelectorAll("main > *, section > *, div > div > div");
  return Array.from(els).slice(0,20).map(e => e.tagName + " class=" + (e.className||"").substring(0,100) +  " text=" + (e.textContent||"").trim().substring(0,60));
});
console.log("=== MAIN CHILDREN ===");
allClasses.forEach(c => console.log(c));
const sidebarEl = await p.evaluate(() => {
  const all = document.querySelectorAll("a");
  return Array.from(all).slice(0,20).map(a => a.textContent.trim() + " href=" + a.getAttribute("href") + " parent=" + (a.parentElement?.tagName||""));
});
console.log("=== LINKS ===");
sidebarEl.forEach(c => console.log(c));
await b.close();
