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
// Go to call center
await p.goto("http://localhost:5173/voice-agent");
await p.waitForTimeout(3000);
const ccHTML = await p.evaluate(() => document.body.querySelector("main")?.innerHTML?.substring(0, 2000) || "no main");
console.log("=== CALL CENTER ===");
console.log(ccHTML);
// Also check patients page
await p.goto("http://localhost:5173/patients");
await p.waitForTimeout(3000);
const patHTML = await p.evaluate(() => {
  const m = document.querySelector("main");
  return m ? m.innerHTML.substring(0, 2000) : "no main";
});
console.log("=== PATIENTS ===");
console.log(patHTML);
// Check settings
await p.goto("http://localhost:5173/settings");
await p.waitForTimeout(3000);
const setHTML = await p.evaluate(() => {
  const m = document.querySelector("main");
  return m ? m.innerHTML.substring(0, 2000) : "no main";
});
console.log("=== SETTINGS ===");
console.log(setHTML);
await b.close();
