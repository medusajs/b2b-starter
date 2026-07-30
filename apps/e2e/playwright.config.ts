import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against an already-running stack:
 *   backend    http://localhost:9000  (override: BACKEND_URL)
 *   storefront http://localhost:8000  (override: STOREFRONT_URL)
 * See DEVELOPMENT.md for how to boot both.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"]],
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.STOREFRONT_URL ?? "http://localhost:8000",
    trace: "on-first-retry",
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
