"use client";

import Link from "next/link";

import { ProfilerLaunchButton } from "@/components/profiler/ProfilerLaunchButton";
import { InlineGlossaryTip } from "@/components/vitals/InlineGlossaryTip";
import { glossary, metricGlossary } from "@/components/vitals/glossary";
import type {
  GlobalVitalsSummary,
  VitalMetricName,
  VitalRollupRow,
} from "@/lib/vitals/types";

function formatMetricValue(metric: VitalMetricName, value: number | null) {
  if (value === null) return "—";
  if (metric === "CLS") return value.toFixed(3);
  return `${Math.round(value)} ms`;
}

function MetricCell({ metric }: { metric: VitalMetricName }) {
  const entry = metricGlossary[metric];
  return (
    <InlineGlossaryTip
      label={metric}
      heading={entry.heading}
      lines={entry.lines}
    />
  );
}

export function StatusPageContent(props: {
  summary: GlobalVitalsSummary;
  rows: VitalRollupRow[];
}) {
  const { summary, rows } = props;
  const g = glossary;

  return (
    <>
      <h1 className="font-lineal text-3xl font-semibold tracking-tight text-mycelium-cream sm:text-4xl">
        Field performance
      </h1>
      <p className="mt-4 max-w-3xl font-display leading-relaxed text-forest-spring">
        Numbers below are aggregated from real visits (
        <InlineGlossaryTip
          label="RUM"
          heading={g.rum.heading}
          lines={g.rum.lines}
        />
        ), not lab synthetic runs. They update as events land in the self-hosted
        log.
      </p>

      <section
        aria-labelledby="rum-global-heading"
        className="mt-12 rounded-lg border border-forest-canopy/40 bg-forest-deep/40 p-6"
      >
        <h2
          id="rum-global-heading"
          className="font-lineal text-xl font-semibold tracking-tight text-mycelium-cream"
        >
          Last 24 hours (all routes)
        </h2>
        <dl className="mt-6 grid gap-4 font-display text-forest-spring sm:grid-cols-3">
          <div>
            <dt className="text-sm text-forest-moss">
              <InlineGlossaryTip
                label="LCP"
                heading={g.LCP.heading}
                lines={g.LCP.lines}
              />{" "}
              <InlineGlossaryTip
                label="p75"
                heading={g.p75.heading}
                lines={g.p75.lines}
              />
            </dt>
            <dd className="mt-1 text-lg font-medium text-mycelium-cream">
              {summary.lcpP75 === null
                ? "—"
                : `${Math.round(summary.lcpP75)} ms`}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-forest-moss">
              <InlineGlossaryTip
                label="INP"
                heading={g.INP.heading}
                lines={g.INP.lines}
              />{" "}
              <InlineGlossaryTip
                label="p75"
                heading={g.p75.heading}
                lines={g.p75.lines}
              />
            </dt>
            <dd className="mt-1 text-lg font-medium text-mycelium-cream">
              {summary.inpP75 === null
                ? "—"
                : `${Math.round(summary.inpP75)} ms`}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-forest-moss">
              <InlineGlossaryTip
                label="CLS"
                heading={g.CLS.heading}
                lines={g.CLS.lines}
              />{" "}
              <InlineGlossaryTip
                label="p75"
                heading={g.p75.heading}
                lines={g.p75.lines}
              />
            </dt>
            <dd className="mt-1 text-lg font-medium text-mycelium-cream">
              {summary.clsP75 === null ? "—" : summary.clsP75.toFixed(3)}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-forest-moss">
          Events recorded: {summary.totalEvents}.{" "}
          <InlineGlossaryTip
            label="Percentiles"
            heading={g.percentileInterpolation.heading}
            lines={g.percentileInterpolation.lines}
          />{" "}
          use a simple linear interpolation across stored samples.
        </p>
      </section>

      <section aria-labelledby="rum-by-route-heading" className="mt-12">
        <h2
          id="rum-by-route-heading"
          className="font-lineal text-xl font-semibold tracking-tight text-mycelium-cream"
        >
          By route and metric
        </h2>
        {rows.length === 0 ? (
          <p className="mt-4 font-display text-forest-spring">
            No rows yet. As visitors load pages, rollups will appear here.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-forest-canopy/40">
            <table className="min-w-full border-collapse text-left text-sm text-forest-spring">
              <thead className="bg-forest-deep/60 font-lineal text-mycelium-cream">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    <InlineGlossaryTip
                      label="Route"
                      heading={g.route.heading}
                      lines={g.route.lines}
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    <InlineGlossaryTip
                      label="Metric"
                      heading={g.metricColumn.heading}
                      lines={g.metricColumn.lines}
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    <InlineGlossaryTip
                      label="n"
                      heading={g.sampleN.heading}
                      lines={g.sampleN.lines}
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    <InlineGlossaryTip
                      label="p50"
                      heading={g.p50.heading}
                      lines={g.p50.lines}
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    <InlineGlossaryTip
                      label="p75"
                      heading={g.p75.heading}
                      lines={g.p75.lines}
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    <InlineGlossaryTip
                      label="p95"
                      heading={g.p95.heading}
                      lines={g.p95.lines}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={`${row.pathname}-${row.metric}`}
                    className="border-t border-forest-canopy/30 odd:bg-forest-deep/20"
                  >
                    <th scope="row" className="px-4 py-3 font-normal">
                      <code className="text-xs text-forest-spring sm:text-sm">
                        {row.pathname}
                      </code>
                    </th>
                    <td className="px-4 py-3">
                      <MetricCell metric={row.metric} />
                    </td>
                    <td className="px-4 py-3">{row.count}</td>
                    <td className="px-4 py-3">
                      {formatMetricValue(row.metric, row.p50)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMetricValue(row.metric, row.p75)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMetricValue(row.metric, row.p95)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        aria-labelledby="rum-privacy-heading"
        className="mt-16 max-w-3xl"
      >
        <h2
          id="rum-privacy-heading"
          className="font-lineal text-xl font-semibold tracking-tight text-mycelium-cream"
        >
          What we collect
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 font-display leading-relaxed text-forest-spring">
          <li>
            Core Web Vitals-style metrics (
            <InlineGlossaryTip
              label="LCP"
              heading={g.LCP.heading}
              lines={g.LCP.lines}
            />
            ,{" "}
            <InlineGlossaryTip
              label="INP"
              heading={g.INP.heading}
              lines={g.INP.lines}
            />
            ,{" "}
            <InlineGlossaryTip
              label="CLS"
              heading={g.CLS.heading}
              lines={g.CLS.lines}
            />
            ,{" "}
            <InlineGlossaryTip
              label="FCP"
              heading={g.FCP.heading}
              lines={g.FCP.lines}
            />
            ,{" "}
            <InlineGlossaryTip
              label="TTFB"
              heading={g.TTFB.heading}
              lines={g.TTFB.lines}
            />
            ),{" "}
            <InlineGlossaryTip
              label="route"
              heading={g.route.heading}
              lines={g.route.lines}
            />{" "}
            pathname, anonymous visitor id, navigation type, and optional
            connection effective type.
          </li>
          <li>
            No free-text fields, account identifiers, or page titles—only what
            is needed for route-level aggregates.
          </li>
          <li>
            Events append to a self-hosted log (JSON lines). Retention and
            backup are environment-specific; treat the log as operational
            telemetry, not product analytics profiles.
          </li>
        </ul>
        <p className="mt-6 text-sm text-forest-moss">
          For synthetic lab checks, use{" "}
          <a
            className="text-bioluminescent underline-offset-4 hover:underline"
            href="https://pagespeed.web.dev/"
          >
            PageSpeed Insights
          </a>{" "}
          or{" "}
          <a
            className="text-bioluminescent underline-offset-4 hover:underline"
            href="https://www.webpagetest.org/"
          >
            WebPageTest
          </a>
          ; this page stays field-only.
        </p>
        <p className="mt-8">
          <Link
            href="/"
            className="text-sm font-medium text-bioluminescent underline-offset-4 hover:underline"
          >
            Back to home
          </Link>
          <span aria-hidden className="text-forest-canopy">
            {" "}
            ·{" "}
          </span>
          <ProfilerLaunchButton className="text-sm font-medium text-bioluminescent underline-offset-4 hover:underline">
            React profiler
          </ProfilerLaunchButton>
        </p>
      </section>
    </>
  );
}
