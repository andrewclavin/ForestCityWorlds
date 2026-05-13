import { describe, expect, it } from "vitest";

import {
  filterEventsByAge,
  globalSummaryFromEvents,
  quantile,
  rollupEvents,
} from "./aggregate";
import type { StoredVitalEvent } from "./types";

describe("aggregate", () => {
  it("computes quantiles", () => {
    expect(quantile([10, 20, 30, 40], 0.5)).toBe(25);
    expect(quantile([4], 0.75)).toBe(4);
    expect(quantile([], 0.75)).toBeNull();
  });

  it("filters by receivedAt window", () => {
    const now = Date.parse("2026-05-13T12:00:00.000Z");
    const events: StoredVitalEvent[] = [
      {
        receivedAt: "2026-05-12T11:00:00.000Z",
        metric: "LCP",
        value: 1,
        rating: "good",
        navigationType: "navigate",
        metricId: "m1",
        visitorId: "visitor-uuid",
        pathname: "/",
      },
      {
        receivedAt: "2026-05-13T11:00:00.000Z",
        metric: "LCP",
        value: 2,
        rating: "good",
        navigationType: "navigate",
        metricId: "m2",
        visitorId: "visitor-uuid",
        pathname: "/",
      },
    ];
    const filtered = filterEventsByAge(events, now, 24 * 60 * 60 * 1000);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.value).toBe(2);
  });

  it("rolls up by pathname and metric", () => {
    const events: StoredVitalEvent[] = [
      {
        receivedAt: "2026-05-13T10:00:00.000Z",
        metric: "LCP",
        value: 100,
        rating: "good",
        navigationType: "navigate",
        metricId: "a",
        visitorId: "visitor-uuid",
        pathname: "/",
      },
      {
        receivedAt: "2026-05-13T10:00:00.000Z",
        metric: "LCP",
        value: 300,
        rating: "good",
        navigationType: "navigate",
        metricId: "b",
        visitorId: "visitor-uuid",
        pathname: "/",
      },
      {
        receivedAt: "2026-05-13T10:00:00.000Z",
        metric: "INP",
        value: 40,
        rating: "good",
        navigationType: "navigate",
        metricId: "c",
        visitorId: "visitor-uuid",
        pathname: "/",
      },
    ];
    const rows = rollupEvents(events);
    const lcp = rows.find((r) => r.metric === "LCP");
    expect(lcp?.count).toBe(2);
    expect(lcp?.p50).toBe(200);
    expect(rows.find((r) => r.metric === "INP")?.p50).toBe(40);
  });

  it("summarizes global p75 for headline metrics", () => {
    const events: StoredVitalEvent[] = [
      {
        receivedAt: "2026-05-13T10:00:00.000Z",
        metric: "LCP",
        value: 100,
        rating: "good",
        navigationType: "navigate",
        metricId: "a",
        visitorId: "visitor-uuid",
        pathname: "/",
      },
      {
        receivedAt: "2026-05-13T10:00:00.000Z",
        metric: "LCP",
        value: 500,
        rating: "good",
        navigationType: "navigate",
        metricId: "b",
        visitorId: "visitor-uuid",
        pathname: "/",
      },
      {
        receivedAt: "2026-05-13T10:00:00.000Z",
        metric: "CLS",
        value: 0.01,
        rating: "good",
        navigationType: "navigate",
        metricId: "c",
        visitorId: "visitor-uuid",
        pathname: "/",
      },
      {
        receivedAt: "2026-05-13T10:00:00.000Z",
        metric: "CLS",
        value: 0.09,
        rating: "needs-improvement",
        navigationType: "navigate",
        metricId: "d",
        visitorId: "visitor-uuid",
        pathname: "/",
      },
    ];
    const g = globalSummaryFromEvents(events);
    expect(g.totalEvents).toBe(4);
    expect(g.lcpP75).toBe(400);
    expect(g.clsP75).toBeCloseTo(0.07, 5);
  });
});
