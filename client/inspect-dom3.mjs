import { chromium } from "playwright-core";
const b = await chromium.launch({headless:true});
const p = await b.newPage();
await p.goto("http://localhost:5173/dashboard");
await p.waitForTimeout(5000);
// Wait for page to be fully rendered
await p.waitForFunction(() => document.querySelectorAll("a").length > 5, {timeout:15000});
const links = await p.evaluate(() => {
  return Array.from(document.querySelectorAll("a")).map(a => a.textContent.trim().substring(0,30) + " | href=" + a.getAttribute("href")).slice(0,25);
});
console.log("=== ALL LINKS ===");
links.forEach(l => console.log(l));
const body = await p.evaluate(() => {
  return document.body.innerHTML.substring(0, 3000);
});
console.log("=== BODY HTML (first 3000) ===");
console.log(body);
await b.close();
