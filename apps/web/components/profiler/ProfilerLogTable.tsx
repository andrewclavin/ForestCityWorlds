"use client";

import { InlineGlossaryTip } from "@/components/vitals/InlineGlossaryTip";
import { glossary } from "@/components/vitals/glossary";

import type { ProfilerCommitRow } from "./profilerTypes";

export function ProfilerLogTable({
  rows,
}: { rows: readonly ProfilerCommitRow[] }) {
  const g = glossary;

  if (rows.length === 0) {
    return (
      <p className="font-display text-sm text-forest-moss">
        Interact with the page (or use Synthetic bump) to populate commits.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-forest-canopy/40">
      <table className="min-w-full border-collapse text-left text-xs text-forest-spring">
        <thead className="bg-forest-deep/60 font-lineal text-mycelium-cream">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              <InlineGlossaryTip
                label="id"
                heading={g.profilerTreeId.heading}
                lines={g.profilerTreeId.lines}
              />
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              <InlineGlossaryTip
                label="phase"
                heading={g.renderPhase.heading}
                lines={g.renderPhase.lines}
              />
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              <InlineGlossaryTip
                label="actual ms"
                heading={g.actualMs.heading}
                lines={g.actualMs.lines}
              />
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              <InlineGlossaryTip
                label="base ms"
                heading={g.baseMs.heading}
                lines={g.baseMs.lines}
              />
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              <InlineGlossaryTip
                label="commit"
                heading={g.commitWallTime.heading}
                lines={g.commitWallTime.lines}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              className="border-t border-forest-canopy/30 odd:bg-forest-deep/20"
            >
              <th scope="row" className="px-3 py-2 font-normal">
                {r.id}
              </th>
              <td className="px-3 py-2">{r.phase}</td>
              <td className="px-3 py-2">{r.actualDuration.toFixed(2)}</td>
              <td className="px-3 py-2">{r.baseDuration.toFixed(2)}</td>
              <td className="px-3 py-2">{r.commitTime.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
