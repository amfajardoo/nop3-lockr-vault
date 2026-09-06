import { defineConfig, devices } from "@playwright/test";

const env = process.env as NodeJS.ProcessEnv & { CI?: string };

export default defineConfig({
  projects: [
    {
      name: "components",
      testDir: "./tests/components",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:5173/playwright/gallery/index.html",
        serviceWorkers: "block",
        reuseContext: true,
      },
    },
  ],
  webServer: {
    command: "pnpm exec vite --config vite.ct.config.ts",
    url: "http://localhost:5173/playwright/gallery/index.html",
    reuseExistingServer: !env.CI,
  },
});
