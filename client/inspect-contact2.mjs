import { chromium } from "playwright-core";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://localhost:5173/contact");
await page.waitForTimeout(4000);
console.log("Page loaded");
const body = await page.innerText("body");
console.log("TEXT:", body.substring(0, 500));
await browser.close();
