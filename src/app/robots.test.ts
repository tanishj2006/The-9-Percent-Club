import { afterEach, describe, expect, it, vi } from "vitest";

async function robotsFor(vercelEnv: string | undefined) {
  vi.resetModules();
  if (vercelEnv === undefined) vi.stubEnv("VERCEL_ENV", undefined as unknown as string);
  else vi.stubEnv("VERCEL_ENV", vercelEnv);
  const { default: robots } = await import("./robots");
  return robots();
}

afterEach(() => vi.unstubAllEnvs());

describe("robots.txt", () => {
  it("allows everything, with the sitemap, on production", async () => {
    const r = await robotsFor("production");
    expect(r.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(r.sitemap).toMatch(/\/sitemap\.xml$/);
  });

  it("allows everything outside Vercel, so local and CI builds match production", async () => {
    expect((await robotsFor(undefined)).rules).toEqual({ userAgent: "*", allow: "/" });
  });

  for (const env of ["preview", "development"]) {
    it(`blocks everything on a ${env} deploy`, async () => {
      const r = await robotsFor(env);
      expect(r.rules).toEqual({ userAgent: "*", disallow: "/" });
      expect(r.sitemap).toBeUndefined();
    });
  }
});
