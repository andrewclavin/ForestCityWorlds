import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import {
  filterEventsByAge,
  globalSummaryFromEvents,
  rollupEvents,
} from "./aggregate";
import type {
  GlobalVitalsSummary,
  StoredVitalEvent,
  VitalRollupRow,
  VitalsIngressBody,
} from "./types";

let writeWarned = false;

export function getVitalsLogPath(): string {
  const override = process.env.VITALS_JSONL_PATH;
  if (override && override.length > 0) {
    return path.resolve(override);
  }
  return path.join(process.cwd(), ".data", "vitals.jsonl");
}

async function ensureParentDir(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function appendVitalEvent(
  body: VitalsIngressBody,
): Promise<boolean> {
  const filePath = getVitalsLogPath();
  const row: StoredVitalEvent = {
    receivedAt: new Date().toISOString(),
    metric: body.metric,
    value: body.value,
    rating: body.rating,
    navigationType: body.navigationType,
    metricId: body.metricId,
    visitorId: body.visitorId,
    pathname: body.pathname,
    connectionType: body.connectionType,
  };

  const line = `${JSON.stringify(row)}\n`;

  try {
    await ensureParentDir(filePath);
    await appendFile(filePath, line, "utf8");
    return true;
  } catch (err) {
    if (!writeWarned) {
      writeWarned = true;
      console.warn(
        "[vitals] Could not append to log file; ingest accepted but not persisted.",
        err,
      );
    }
    return false;
  }
}

export async function readAllStoredEvents(): Promise<StoredVitalEvent[]> {
  const filePath = getVitalsLogPath();
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    throw err;
  }

  const lines = raw.split("\n");
  const out: StoredVitalEvent[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as StoredVitalEvent;
      if (
        typeof parsed.receivedAt === "string" &&
        typeof parsed.metric === "string" &&
        typeof parsed.value === "number" &&
        typeof parsed.pathname === "string"
      ) {
        out.push(parsed);
      }
    } catch {
      // skip corrupt line
    }
  }

  return out;
}

export async function getVitalsRollups(options: {
  windowMs: number;
  nowMs?: number;
}): Promise<VitalRollupRow[]> {
  const nowMs = options.nowMs ?? Date.now();
  const all = await readAllStoredEvents();
  const windowed = filterEventsByAge(all, nowMs, options.windowMs);
  return rollupEvents(windowed);
}

export async function getGlobalVitalsSummary(options: {
  windowMs: number;
  nowMs?: number;
}): Promise<GlobalVitalsSummary> {
  const nowMs = options.nowMs ?? Date.now();
  const all = await readAllStoredEvents();
  const windowed = filterEventsByAge(all, nowMs, options.windowMs);
  return {
    windowMs: options.windowMs,
    ...globalSummaryFromEvents(windowed),
  };
}
