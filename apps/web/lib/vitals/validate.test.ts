import { describe, expect, it } from "vitest";

import { isValidPathname, parseVitalsIngress } from "./validate";

describe("parseVitalsIngress", () => {
  it("accepts a valid payload", () => {
    const r = parseVitalsIngress({
      metric: "LCP",
      value: 1234,
      rating: "good",
      navigationType: "navigate",
      metricId: "v4-metric-id",
      visitorId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      pathname: "/tools",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.metric).toBe("LCP");
      expect(r.value.pathname).toBe("/tools");
    }
  });

  it("rejects invalid pathnames", () => {
    expect(
      parseVitalsIngress({
        metric: "LCP",
        value: 1,
        rating: "good",
        navigationType: "navigate",
        metricId: "metric-id",
        visitorId: "visitor-uuid-123456789",
        pathname: "no-leading-slash",
      }).ok,
    ).toBe(false);
    expect(
      parseVitalsIngress({
        metric: "LCP",
        value: 1,
        rating: "good",
        navigationType: "navigate",
        metricId: "metric-id",
        visitorId: "visitor-uuid-123456789",
        pathname: "/evil/../etc",
      }).ok,
    ).toBe(false);
  });

  it("rejects unknown metrics", () => {
    expect(
      parseVitalsIngress({
        metric: "FOO",
        value: 1,
        rating: "good",
        navigationType: "navigate",
        metricId: "metric-id",
        visitorId: "visitor-uuid-123456789",
        pathname: "/",
      }).ok,
    ).toBe(false);
  });
});

describe("isValidPathname", () => {
  it("allows normal app routes", () => {
    expect(isValidPathname("/")).toBe(true);
    expect(isValidPathname("/tools/build")).toBe(true);
  });
});
