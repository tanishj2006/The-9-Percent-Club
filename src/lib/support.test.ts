import { afterEach, describe, expect, it, vi } from "vitest";
import { upiConfig, upiLink } from "./support";

describe("upiConfig", () => {
  it("is off unless both the ID and the name are set", () => {
    expect(upiConfig(undefined, undefined)).toBeNull();
    expect(upiConfig("someone@okbank", undefined)).toBeNull();
    expect(upiConfig(undefined, "Tanish Jain")).toBeNull();
    expect(upiConfig("  ", "Tanish Jain")).toBeNull();
    expect(upiConfig("someone@okbank", "  ")).toBeNull();
  });

  it("treats a malformed ID as unset", () => {
    expect(upiConfig("not-a-vpa", "Tanish Jain")).toBeNull();
    expect(upiConfig("a@b c", "Tanish Jain")).toBeNull();
  });

  it("trims what it keeps", () => {
    expect(upiConfig(" someone@okbank ", " Tanish Jain ")).toEqual({ pa: "someone@okbank", pn: "Tanish Jain" });
  });
});

describe("upiLink", () => {
  it("carries pa, pn and cu=INR, and nothing else: no amount", () => {
    const link = upiLink({ pa: "someone@okbank", pn: "Tanish Jain" });
    expect(link).toBe("upi://pay?pa=someone@okbank&pn=Tanish%20Jain&cu=INR");
    const params = new URLSearchParams(link.split("?")[1]);
    expect([...params.keys()]).toEqual(["pa", "pn", "cu"]);
    expect(params.get("pn")).toBe("Tanish Jain");
  });
});

describe("the sitemap follows the page", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("leaves /support out when the variables are missing", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_UPI_ID", undefined as unknown as string);
    vi.stubEnv("NEXT_PUBLIC_UPI_NAME", undefined as unknown as string);
    const { SITE_HREFS } = await import("./site");
    expect(SITE_HREFS).not.toContain("/support");
  });

  it("lists /support when both are set", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_UPI_ID", "someone@okbank");
    vi.stubEnv("NEXT_PUBLIC_UPI_NAME", "Tanish Jain");
    const { SITE_HREFS } = await import("./site");
    expect(SITE_HREFS).toContain("/support");
  });
});
