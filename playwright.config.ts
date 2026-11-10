import { defineConfig, devices } from "@playwright/test";

// E2E_DEV=1 runs against `next dev`, where React strict mode double-invokes
// effects. That is the environment the useGSAP rule exists for.
const dev = process.env.E2E_DEV === "1";
const port = dev ? 3101 : 3100;
const SUPPORT_PORT = 3104;

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
  webServer: [
    {
      command: dev
        ? `npx next dev -p ${port}`
        : `npx next build && npx next start -p ${port}`,
      url: `http://localhost:${port}/en`,
      timeout: 180_000,
      reuseExistingServer: false,
      // No UPI variables here, so this build checks that /support stays hidden.
      env: { NEXT_DIST_DIR: ".next-e2e", NEXT_PUBLIC_SITE_URL: "https://e2e.example" },
    },
    // A second production build with test-only UPI details, for the support page.
    ...(dev
      ? []
      : [
          {
            command: `npx next build && npx next start -p ${SUPPORT_PORT}`,
            url: `http://localhost:${SUPPORT_PORT}/en/support`,
            timeout: 240_000,
            reuseExistingServer: false,
            env: {
              NEXT_DIST_DIR: ".next-e2e-support",
              NEXT_PUBLIC_SITE_URL: "https://e2e.example",
              NEXT_PUBLIC_UPI_ID: "ninepercent.e2e@okexample",
              NEXT_PUBLIC_UPI_NAME: "Tanish Jain",
            },
          },
        ]),
  ],
  projects: [
    {
      name: "desktop",
      testIgnore: "**/support-enabled.spec.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    { name: "mobile", testIgnore: "**/support-enabled.spec.ts", use: { ...devices["Pixel 7"] } },
    // The build with UPI details. Only the support spec runs against it.
    ...(dev
      ? []
      : [
          {
            name: "support-desktop",
            testMatch: "**/support-enabled.spec.ts",
            use: {
              ...devices["Desktop Chrome"],
              viewport: { width: 1280, height: 800 },
              baseURL: `http://localhost:${SUPPORT_PORT}`,
            },
          },
          {
            name: "support-mobile",
            testMatch: "**/support-enabled.spec.ts",
            use: { ...devices["Pixel 7"], baseURL: `http://localhost:${SUPPORT_PORT}` },
          },
        ]),
  ],
});
