import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120000,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4321",actionTimeout:15000 },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    // Test the published directory index for exports under public/.
    command: "npm run preview -- --port 4321 --strictPort",
    url: "http://127.0.0.1:4321/",
    reuseExistingServer: false,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
});
