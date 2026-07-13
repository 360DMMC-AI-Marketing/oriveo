import { chromium, FullConfig } from "@playwright/test";
import path from "path";

const CLINIC_EMAIL = "anassamiri87@gmail.com";
const CLINIC_PASSWORD = "demo123";
const SUPER_ADMIN_EMAIL = "admin@oriveo.io";
const SUPER_ADMIN_PASSWORD = "OriveoAdmin2026!";
const BASE = "http://localhost:5173";

async function loginAndSaveState(email: string, password: string, savePath: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard|\/admin/, { timeout: 15000 });
  await page.context().storageState({ path: savePath });
  await browser.close();
}

async function setupPublicState(savePath: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${BASE}/`);
  await page.context().storageState({ path: savePath });
  await browser.close();
}

export default async function globalSetup(_config: FullConfig) {
  const fixturesDir = path.resolve(process.cwd(), "e2e", "fixtures");
  await loginAndSaveState(
    CLINIC_EMAIL,
    CLINIC_PASSWORD,
    path.join(fixturesDir, "auth-clinic-admin.json")
  );
  await loginAndSaveState(
    SUPER_ADMIN_EMAIL,
    SUPER_ADMIN_PASSWORD,
    path.join(fixturesDir, "auth-super-admin.json")
  );
  await setupPublicState(path.join(fixturesDir, "auth-not-signed-in.json"));
}
