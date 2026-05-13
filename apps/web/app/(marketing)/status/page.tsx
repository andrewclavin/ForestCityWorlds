import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";

import { StatusPageContent } from "@/components/vitals/StatusPageContent";
import { getGlobalVitalsSummary, getVitalsRollups } from "@/lib/vitals/store";

export const metadata: Metadata = {
  title: "Status · Forest City Worlds",
  description:
    "Field Web Vitals aggregates from self-hosted RUM (last 24 hours).",
};

export const revalidate = 0;

const WINDOW_MS = 24 * 60 * 60 * 1000;

export default async function StatusPage() {
  noStore();
  const [summary, rows] = await Promise.all([
    getGlobalVitalsSummary({ windowMs: WINDOW_MS }),
    getVitalsRollups({ windowMs: WINDOW_MS }),
  ]);

  return (
    <main
      id="main-content"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
    >
      <StatusPageContent summary={summary} rows={rows} />
    </main>
  );
}
