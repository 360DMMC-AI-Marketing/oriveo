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
// Notifications
await p.goto("http://localhost:5173/notifications");
await p.waitForTimeout(3000);
const notHTML = await p.evaluate(() => {
  const m = document.querySelector("main");
  return m ? m.innerHTML.substring(0, 2000) : "no main";
});
console.log("=== NOTIFICATIONS ===");
console.log(notHTML);
// Live monitoring
await p.goto("http://localhost:5173/live-monitoring");
await p.waitForTimeout(3000);
const liveHTML = await p.evaluate(() => {
  const m = document.querySelector("main");
  return m ? m.innerHTML.substring(0, 2000) : "no main";
});
console.log("=== LIVE MONITORING ===");
console.log(liveHTML);
await b.close();
