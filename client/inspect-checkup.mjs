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
// Search for the text
const el = await p.evaluate(() => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  const results = [];
  while (node = walker.nextNode()) {
    if (node.textContent.includes("Schedule Automated Checkup")) {
      results.push({
        text: node.textContent.trim().substring(0, 80),
        tag: node.parentElement?.tagName,
        class: node.parentElement?.className?.substring(0, 60),
        html: node.parentElement?.outerHTML?.substring(0, 200)
      });
    }
  }
  return results;
});
console.log("FOUND:", JSON.stringify(el, null, 2));
if (el.length === 0) console.log("NOT FOUND on page");
await b.close();
