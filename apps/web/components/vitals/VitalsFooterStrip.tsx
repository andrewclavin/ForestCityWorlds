"use client";

import Link from "next/link";

import { ProfilerLaunchButton } from "@/components/profiler/ProfilerLaunchButton";
import { InlineGlossaryTip } from "./InlineGlossaryTip";
import { webVitalGlossary } from "./glossary";

function fmtMs(value: number | null) {
  if (value === null) return "—";
  return `${Math.round(value)} ms`;
}

function fmtCls(value: number | null) {
  if (value === null) return "—";
  return value.toFixed(3);
}

const tipLabelClass =
  "cursor-help border-b border-dotted border-forest-moss/70 bg-transparent p-0 font-inherit text-inherit underline-offset-2 hover:border-bioluminescent hover:text-bioluminescent";

const fieldTipClass =
  "cursor-help border-b border-dotted border-forest-moss/70 bg-transparent p-0 font-lineal font-inherit text-inherit text-forest-spring underline-offset-2 hover:border-bioluminescent hover:text-bioluminescent";

export function VitalsFooterStrip(props: {
  lcpP75: number | null;
  inpP75: number | null;
  clsP75: number | null;
  hasSamples: boolean;
}) {
  const { lcpP75, inpP75, clsP75, hasSamples } = props;
  const g = webVitalGlossary;

  return (
    <p
      className="text-center text-xs leading-relaxed text-forest-moss sm:text-left"
      aria-label="Field Web Vitals summary for the last 24 hours"
    >
      <span className="font-lineal text-forest-spring">
        <InlineGlossaryTip
          label="Field"
          heading={g.field.heading}
          lines={g.field.lines}
          labelClassName={fieldTipClass}
          panelPlacement="above"
        />{" "}
        <InlineGlossaryTip
          label="p75"
          heading={g.p75.heading}
          lines={g.p75.lines}
          labelClassName={fieldTipClass}
          panelPlacement="above"
        />
        <span aria-hidden> (24h):</span>
      </span>{" "}
      <span className="text-forest-moss">
        <InlineGlossaryTip
          label="LCP"
          heading={g.LCP.heading}
          lines={g.LCP.lines}
          labelClassName={tipLabelClass}
          panelPlacement="above"
        />
      </span>{" "}
      {fmtMs(lcpP75)}
      <span aria-hidden className="text-forest-canopy">
        {" "}
        ·{" "}
      </span>
      <span className="text-forest-moss">
        <InlineGlossaryTip
          label="INP"
          heading={g.INP.heading}
          lines={g.INP.lines}
          labelClassName={tipLabelClass}
          panelPlacement="above"
        />
      </span>{" "}
      {fmtMs(inpP75)}
      <span aria-hidden className="text-forest-canopy">
        {" "}
        ·{" "}
      </span>
      <span className="text-forest-moss">
        <InlineGlossaryTip
          label="CLS"
          heading={g.CLS.heading}
          lines={g.CLS.lines}
          labelClassName={tipLabelClass}
          panelPlacement="above"
        />
      </span>{" "}
      {fmtCls(clsP75)}
      <span aria-hidden className="text-forest-canopy">
        {" "}
        ·{" "}
      </span>
      <Link
        href="/status"
        className="text-bioluminescent underline-offset-4 hover:underline"
      >
        {hasSamples ? "Details" : "Status"}
      </Link>
      <span aria-hidden className="text-forest-canopy">
        {" "}
        ·{" "}
      </span>
      <ProfilerLaunchButton className="text-bioluminescent underline-offset-4 hover:underline">
        Profiler
      </ProfilerLaunchButton>
      {!hasSamples ? (
        <span className="block pt-1 text-forest-moss sm:inline sm:pl-2 sm:pt-0">
          (collecting baseline — visits populate the log)
        </span>
      ) : null}
    </p>
  );
}
