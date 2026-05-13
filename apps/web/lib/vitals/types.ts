export type VitalMetricName = "CLS" | "FCP" | "INP" | "LCP" | "TTFB";

export type VitalRating = "good" | "needs-improvement" | "poor";

export type StoredVitalEvent = {
  receivedAt: string;
  metric: VitalMetricName;
  value: number;
  rating: VitalRating;
  navigationType: string;
  metricId: string;
  visitorId: string;
  pathname: string;
  connectionType?: string;
};

export type VitalsIngressBody = {
  metric: VitalMetricName;
  value: number;
  rating: VitalRating;
  navigationType: string;
  metricId: string;
  visitorId: string;
  pathname: string;
  connectionType?: string;
};

export type VitalRollupRow = {
  pathname: string;
  metric: VitalMetricName;
  count: number;
  p50: number | null;
  p75: number | null;
  p95: number | null;
};

export type GlobalVitalsSummary = {
  windowMs: number;
  totalEvents: number;
  lcpP75: number | null;
  inpP75: number | null;
  clsP75: number | null;
};
