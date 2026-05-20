import { describe, expect, it } from "vitest";

describe("MSW harness", () => {
  it("intercepts the configured API health URL", async () => {
    const base =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
      "http://127.0.0.1:8000";
    const res = await fetch(`${base}/health`);
    expect(res.ok).toBe(true);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
