import type {
  StoredVitalEvent,
  VitalMetricName,
  VitalRollupRow,
} from "./types";

export function quantileSorted(
  sorted: readonly number[],
  q: number,
): number | null {
  if (sorted.length === 0) return null;
  const clampedQ = Math.min(1, Math.max(0, q));
  const pos = (sorted.length - 1) * clampedQ;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) {
    const v = sorted[lo];
    return v === undefined ? null : v;
  }
  const vLo = sorted[lo];
  const vHi = sorted[hi];
  if (vLo === undefined || vHi === undefined) return null;
  return vLo + (pos - lo) * (vHi - vLo);
}

export function quantile(values: readonly number[], q: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return quantileSorted(sorted, q);
}

export function filterEventsByAge(
  events: readonly StoredVitalEvent[],
  nowMs: number,
  windowMs: number,
): StoredVitalEvent[] {
  const cutoff = nowMs - windowMs;
  return events.filter((e) => {
    const t = Date.parse(e.receivedAt);
    return Number.isFinite(t) && t >= cutoff;
  });
}

type GroupKey = `${string}\t${VitalMetricName}`;

function groupKey(pathname: string, metric: VitalMetricName): GroupKey {
  return `${pathname}\t${metric}`;
}

export function rollupEvents(
  events: readonly StoredVitalEvent[],
): VitalRollupRow[] {
  const buckets = new Map<GroupKey, number[]>();

  for (const e of events) {
    const key = groupKey(e.pathname, e.metric);
    const list = buckets.get(key);
    if (list) {
      list.push(e.value);
    } else {
      buckets.set(key, [e.value]);
    }
  }

  const rows: VitalRollupRow[] = [];

  for (const [key, vals] of buckets.entries()) {
    const [pathname, metric] = key.split("\t") as [string, VitalMetricName];
    const sorted = [...vals].sort((a, b) => a - b);
    rows.push({
      pathname,
      metric,
      count: sorted.length,
      p50: quantileSorted(sorted, 0.5),
      p75: quantileSorted(sorted, 0.75),
      p95: quantileSorted(sorted, 0.95),
    });
  }

  rows.sort((a, b) => {
    if (a.pathname !== b.pathname) {
      return a.pathname.localeCompare(b.pathname);
    }
    return a.metric.localeCompare(b.metric);
  });

  return rows;
}

export function globalSummaryFromEvents(events: readonly StoredVitalEvent[]): {
  totalEvents: number;
  lcpP75: number | null;
  inpP75: number | null;
  clsP75: number | null;
} {
  const lcp = events.filter((e) => e.metric === "LCP").map((e) => e.value);
  const inp = events.filter((e) => e.metric === "INP").map((e) => e.value);
  const cls = events.filter((e) => e.metric === "CLS").map((e) => e.value);

  return {
    totalEvents: events.length,
    lcpP75: quantile(lcp, 0.75),
    inpP75: quantile(inp, 0.75),
    clsP75: quantile(cls, 0.75),
  };
}
