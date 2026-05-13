"use client";

import { InlineGlossaryTip } from "@/components/vitals/InlineGlossaryTip";
import { glossary } from "@/components/vitals/glossary";

export function ProfilePageIntro() {
  const g = glossary;
  return (
    <p className="mt-4 max-w-3xl font-display leading-relaxed text-forest-spring">
      This page is a{" "}
      <InlineGlossaryTip
        label="local instrument"
        heading={g.localInstrument.heading}
        lines={g.localInstrument.lines}
      />
      : it does not ship field data. Use it to watch how often the profiled
      subtree{" "}
      <InlineGlossaryTip
        label="commits"
        heading={g.reactCommit.heading}
        lines={g.reactCommit.lines}
      />{" "}
      and how expensive those passes are. Production pages can adopt the same
      pattern behind a feature flag or staff-only route so visitors are not
      taxed by default.
    </p>
  );
}
