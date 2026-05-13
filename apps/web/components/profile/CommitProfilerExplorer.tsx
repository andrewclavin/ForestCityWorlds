"use client";

import {
  Profiler,
  type ProfilerOnRenderCallback,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { InlineGlossaryTip } from "@/components/vitals/InlineGlossaryTip";
import { glossary } from "@/components/vitals/glossary";

type CommitRow = {
  key: string;
  id: string;
  phase: "mount" | "update" | "nested-update";
  actualDuration: number;
  baseDuration: number;
  commitTime: number;
};

const DemoTree = memo(function ProfiledDemoTree({ tick }: { tick: number }) {
  const rows = Math.min((tick % 5) + 3, 8);
  return (
    <div className="rounded-md border border-forest-canopy/40 bg-forest-deep/50 p-4">
      <p className="font-display text-sm text-forest-spring">
        List rows under the profiler:{" "}
        <span className="text-mycelium-cream">{rows}</span> (length follows tick
        so{" "}
        <InlineGlossaryTip
          label="commits"
          heading={glossary.reactCommit.heading}
          lines={glossary.reactCommit.lines}
        />{" "}
        show up in the log)
      </p>
      <ul className="mt-2 list-disc pl-5 text-xs text-forest-moss">
        {[1, 2, 3, 4, 5, 6, 7, 8].slice(0, rows).map((n) => (
          <li key={`demo-${tick}-n${n}`}>Demo row {n}</li>
        ))}
      </ul>
    </div>
  );
});

export function CommitProfilerExplorer() {
  const [tick, setTick] = useState(0);
  const [rows, setRows] = useState<CommitRow[]>([]);
  const pending = useRef<CommitRow[]>([]);
  const rafId = useRef<number | null>(null);
  const g = glossary;

  const flush = useCallback(() => {
    rafId.current = null;
    const batch = pending.current;
    pending.current = [];
    if (batch.length === 0) return;
    setRows((prev) => [...batch, ...prev].slice(0, 120));
  }, []);

  const onRender = useCallback<ProfilerOnRenderCallback>(
    (id, phase, actualDuration, baseDuration, _startTime, commitTime) => {
      pending.current.push({
        key: crypto.randomUUID(),
        id,
        phase,
        actualDuration,
        baseDuration,
        commitTime,
      });
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(flush);
      }
    },
    [flush],
  );

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return (
    <div className="space-y-8">
      <section aria-labelledby="profiler-demo-heading">
        <h2
          id="profiler-demo-heading"
          className="font-lineal text-xl font-semibold tracking-tight text-mycelium-cream"
        >
          Profiled subtree
        </h2>
        <p className="mt-3 max-w-3xl font-display text-sm leading-relaxed text-forest-spring">
          The React{" "}
          <InlineGlossaryTip
            label="Profiler"
            heading={g.reactProfiler.heading}
            lines={g.reactProfiler.lines}
          />{" "}
          below wraps only the memoized demo card. Table updates are{" "}
          <InlineGlossaryTip
            label="RAF-batched"
            heading={g.rafCoalescing.heading}
            lines={g.rafCoalescing.lines}
          />{" "}
          so bursty{" "}
          <InlineGlossaryTip
            label="commits"
            heading={g.reactCommit.heading}
            lines={g.reactCommit.lines}
          />{" "}
          in a single frame do not enqueue dozens of React updates.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-md bg-forest-canopy px-4 py-2 text-sm font-medium text-mycelium-cream transition hover:bg-forest-leaf focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bioluminescent"
            onClick={() => setTick((t) => t + 1)}
          >
            Trigger renders
          </button>
          <button
            type="button"
            className="rounded-md border border-forest-moss/60 px-4 py-2 text-sm font-medium text-forest-spring transition hover:border-bioluminescent hover:text-bioluminescent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bioluminescent"
            onClick={() => setRows([])}
          >
            Clear log
          </button>
        </div>
        <div className="mt-6">
          <Profiler id="DemoSubtree" onRender={onRender}>
            <DemoTree tick={tick} />
          </Profiler>
        </div>
      </section>

      <section aria-labelledby="profiler-log-heading">
        <h2
          id="profiler-log-heading"
          className="font-lineal text-xl font-semibold tracking-tight text-mycelium-cream"
        >
          <InlineGlossaryTip
            label="Commit log (newest first)"
            heading={g.commitLogSection.heading}
            lines={g.commitLogSection.lines}
          />
        </h2>
        <p className="mt-2 max-w-3xl font-display text-xs leading-relaxed text-forest-moss">
          <InlineGlossaryTip
            label="Why values move"
            heading={g.commitLogGrowth.heading}
            lines={g.commitLogGrowth.lines}
          />
        </p>
        {rows.length === 0 ? (
          <p className="mt-3 font-display text-sm text-forest-moss">
            Trigger renders to populate this table.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-forest-canopy/40">
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
        )}
      </section>
    </div>
  );
}
