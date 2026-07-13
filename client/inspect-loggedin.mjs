import { chromium } from "playwright-core";
const b = await chromium.launch({headless:true, args:["--no-sandbox"]});
const p = await b.newPage();
await p.goto("http://localhost:5173/login", {waitUntil:"networkidle", timeout:20000});
await p.waitForFunction(() => document.querySelectorAll("input, button").length > 2, {timeout:10000});
await p.fill('input[type="email"]', "anassamiri87@gmail.com");
await p.fill('input[type="password"]', "demo123");
// Find login button
const btns = await p.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  return btns.map(b => b.textContent.trim() + " class=" + b.className.substring(0,50));
});
console.log("BUTTONS:", JSON.stringify(btns));
// Click the login button
await p.click('button:has-text("Sign in")');
await p.waitForURL("**/dashboard", {timeout:15000});
console.log("LOGGED IN! URL:", p.url());
// Dump dashboard structure
const dom = await p.evaluate(() => {
  const root = document.getElementById("root");
  if (!root) return "no root";
  return root.innerHTML.substring(0, 5000);
});
console.log("=== DASHBOARD DOM ===");
console.log(dom);
await b.close();
