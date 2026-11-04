import { defineConfig, devices } from "@playwright/test";

// E2E_DEV=1 runs against `next dev`, where React strict mode double-invokes
// effects. That is the environment the useGSAP rule exists for.
const dev = process.env.E2E_DEV === "1";
const port = dev ? 3101 : 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: dev ? 2 : undefined,
  timeout: dev ? 60_000 : 30_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    // PW_CHANNEL=chrome uses the installed browser instead of the bundled one.
    channel: process.env.PW_CHANNEL,
  },
  webServer: {
    command: dev
      ? `npx next dev -p ${port}`
      : `npx next build && npx next start -p ${port}`,
    url: `http://localhost:${port}/en`,
    timeout: 180_000,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
