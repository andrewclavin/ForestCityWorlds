import type { VitalMetricName } from "./types";

export const VITAL_METRICS = new Set<VitalMetricName>([
  "CLS",
  "FCP",
  "INP",
  "LCP",
  "TTFB",
]);

export const VITAL_RATINGS = new Set([
  "good",
  "needs-improvement",
  "poor",
] as const);

export const NAVIGATION_TYPES = new Set<string>([
  "navigate",
  "reload",
  "back-forward",
  "back-forward-cache",
  "prerender",
  "restore",
]);
