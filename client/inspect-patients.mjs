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
// Patient list
await p.goto("http://localhost:5173/patients");
await p.waitForTimeout(3000);
const patHTML = await p.evaluate(() => {
  const m = document.querySelector("main");
  return m ? m.innerHTML.substring(0, 4000) : "no main";
});
console.log("=== PATIENTS FULL ===");
console.log(patHTML);
await b.close();
