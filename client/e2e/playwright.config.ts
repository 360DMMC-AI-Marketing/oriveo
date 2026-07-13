import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  globalSetup: "./fixtures/global-setup.ts",
  reporter: [
    ["list"],
    ["html", { outputFolder: "../playwright-report" }],
  ],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "public",
      use: {
        storageState: "e2e/fixtures/auth-not-signed-in.json",
      },
      testMatch: "pages/public/*.spec.ts",
    },
    {
      name: "authenticated",
      use: {
        storageState: "e2e/fixtures/auth-clinic-admin.json",
      },
      testMatch: ["pages/protected/*.spec.ts", "integration.spec.ts"],
    },
    {
      name: "super-admin",
      use: {
        storageState: "e2e/fixtures/auth-super-admin.json",
      },
      testMatch: "pages/super-admin/*.spec.ts",
    },
  ],
});
