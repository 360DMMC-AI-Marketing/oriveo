import { chromium } from "playwright-core";
const b = await chromium.launch({headless:true, args:["--no-sandbox"]});
const p = await b.newPage();
await p.goto("http://localhost:5173", {waitUntil:"networkidle", timeout:20000});
// Should land on login
await p.waitForFunction(() => document.title.includes("Oriveo") || document.querySelector("button, input"), {timeout:15000});
const html = await p.evaluate(() => document.body.innerHTML.substring(0, 2000));
console.log("=== LANDING PAGE HTML ===");
console.log(html);
const links = await p.evaluate(() => Array.from(document.querySelectorAll("a")).map(a => a.textContent.trim() + " | href=" + a.getAttribute("href")).slice(0,15));
console.log("=== LINKS ===");
links.forEach(l => console.log(l));
await b.close();
