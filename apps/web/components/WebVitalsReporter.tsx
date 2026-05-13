"use client";

import { useEffect } from "react";
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

const STORAGE_KEY = "fcw.rum.vid";

function getVisitorId(): string {
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id || id.length < 8) {
      id = crypto.randomUUID();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function getConnectionType(): string | undefined {
  const c = (
    navigator as Navigator & {
      connection?: { effectiveType?: string };
    }
  ).connection;
  if (c && typeof c.effectiveType === "string") {
    return c.effectiveType;
  }
  return undefined;
}

function send(metric: Metric) {
  if (process.env.NEXT_PUBLIC_VITALS_INGEST === "0") {
    return;
  }

  const visitorId = getVisitorId();
  if (!visitorId) {
    return;
  }

  const payload = {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
    metricId: metric.id,
    visitorId,
    pathname: window.location.pathname,
    connectionType: getConnectionType(),
  };

  const body = JSON.stringify(payload);
  const url = "/api/vitals";

  if (navigator.sendBeacon) {
    const ok = navigator.sendBeacon(
      url,
      new Blob([body], { type: "application/json" }),
    );
    if (ok) {
      return;
    }
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // best-effort RUM
  });
}

export function WebVitalsReporter() {
  useEffect(() => {
    onCLS(send);
    onFCP(send);
    onINP(send);
    onLCP(send);
    onTTFB(send);
  }, []);

  return null;
}
