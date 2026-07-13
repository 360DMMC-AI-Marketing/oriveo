import { chromium } from "playwright-core";
const b = await chromium.launch({headless:true});
const p = await b.newPage();
await p.goto("http://localhost:5173/dashboard");
await p.waitForTimeout(4000);
const info = await p.evaluate(() => {
  const r = {};
  const sidebar = document.querySelector("nav") || document.querySelector("aside") || document.querySelector("[class*='sidebar']");
  if (sidebar) {
    r.sidebarTag = sidebar.tagName;
    r.sidebarClass = sidebar.className;
    r.sidebarLinks = Array.from(sidebar.querySelectorAll("a")).slice(0,10).map(a => a.textContent.trim() + " href=" + a.getAttribute("href"));
  }
  const main = document.querySelector("main") || document.querySelector("[class*='main']") || document.querySelector("[class*='content']");
  if (main) {
    r.mainClass = main.className;
    r.mainChildren = Array.from(main.children).slice(0,5).map(c => c.className?.substring(0,80) + " tag=" + c.tagName + " text=" + (c.textContent||"").trim().substring(0,50));
  }
  r.allWithCard = Array.from(document.querySelectorAll("[class*='card']")).slice(0,5).map(c => c.className?.substring(0,80) + " text=" + (c.textContent||"").trim().substring(0,40));
  return r;
});
console.log(JSON.stringify(info, null, 2));
await b.close();
