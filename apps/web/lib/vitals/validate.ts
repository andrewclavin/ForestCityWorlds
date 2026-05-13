import { NAVIGATION_TYPES, VITAL_METRICS, VITAL_RATINGS } from "./constants";
import type { VitalMetricName, VitalRating, VitalsIngressBody } from "./types";

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function isValidPathname(pathname: string): boolean {
  if (pathname.length === 0 || pathname.length > 512) return false;
  if (!pathname.startsWith("/")) return false;
  if (pathname.includes("..")) return false;
  for (let i = 0; i < pathname.length; i++) {
    const c = pathname.charCodeAt(i);
    if (c < 0x20 || c === 0x7f) return false;
  }
  return true;
}

function isValidId(value: string, min: number, max: number): boolean {
  if (value.length < min || value.length > max) return false;
  return /^[0-9a-zA-Z._-]+$/.test(value);
}

export function parseVitalsIngress(
  input: unknown,
): ParseResult<VitalsIngressBody> {
  if (!isRecord(input)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const metric = input.metric;
  if (
    typeof metric !== "string" ||
    !VITAL_METRICS.has(metric as VitalMetricName)
  ) {
    return { ok: false, error: "Invalid metric" };
  }

  const value = input.value;
  if (!isFiniteNumber(value)) {
    return { ok: false, error: "Invalid value" };
  }

  const rating = input.rating;
  if (typeof rating !== "string" || !VITAL_RATINGS.has(rating as VitalRating)) {
    return { ok: false, error: "Invalid rating" };
  }

  const navigationType = input.navigationType;
  if (typeof navigationType !== "string" || navigationType.length > 48) {
    return { ok: false, error: "Invalid navigationType" };
  }
  if (!NAVIGATION_TYPES.has(navigationType)) {
    return { ok: false, error: "Unknown navigationType" };
  }

  const metricId = input.metricId;
  if (typeof metricId !== "string" || !isValidId(metricId, 4, 128)) {
    return { ok: false, error: "Invalid metricId" };
  }

  const visitorId = input.visitorId;
  if (typeof visitorId !== "string" || !isValidId(visitorId, 8, 64)) {
    return { ok: false, error: "Invalid visitorId" };
  }

  const pathname = input.pathname;
  if (typeof pathname !== "string" || !isValidPathname(pathname)) {
    return { ok: false, error: "Invalid pathname" };
  }

  let connectionType: string | undefined;
  if (input.connectionType !== undefined) {
    if (
      typeof input.connectionType !== "string" ||
      input.connectionType.length > 16
    ) {
      return { ok: false, error: "Invalid connectionType" };
    }
    if (!/^[0-9a-z-]+$/.test(input.connectionType)) {
      return { ok: false, error: "Invalid connectionType" };
    }
    connectionType = input.connectionType;
  }

  const boundedValue =
    metric === "CLS"
      ? Math.min(Math.max(value, 0), 100)
      : Math.min(Math.max(value, 0), 600_000);

  return {
    ok: true,
    value: {
      metric: metric as VitalMetricName,
      value: boundedValue,
      rating: rating as VitalRating,
      navigationType,
      metricId,
      visitorId,
      pathname,
      connectionType,
    },
  };
}
