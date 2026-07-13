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
// Appointments
await p.goto("http://localhost:5173/appointments");
await p.waitForTimeout(3000);
const html = await p.evaluate(() => {
  const m = document.querySelector("main");
  return m ? m.innerHTML.substring(0, 3000) : "no main";
});
console.log("=== APPOINTMENTS ===");
console.log(html);
await b.close();
