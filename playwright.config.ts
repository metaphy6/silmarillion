import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  timeout: 30000,
  workers: 1,
  use: {
    baseURL: process.env.SILMARILLION_DEV_TEST_URL ?? "http://127.0.0.1:5173",
    headless: true,
    launchOptions: {
      executablePath:
        process.env.SILMARILLION_BROWSER_EXECUTABLE ??
        "/snap/chromium/current/usr/lib/chromium-browser/chrome",
      args: ["--no-sandbox"],
    },
    viewport: { width: 1440, height: 1000 },
  },
  reporter: "list",
});
