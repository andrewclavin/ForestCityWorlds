"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Profiler, type ProfilerOnRenderCallback } from "react";
import { createPortal } from "react-dom";

import { ProfilerLogTable } from "./ProfilerLogTable";
import {
  PROFILER_STRESS_EVENT,
  ProfilerStressProbe,
} from "./ProfilerStressProbe";
import {
  ProfilerPanelContext,
  type ProfilerPanelControls,
} from "./profilerPanelContext";

import { InlineGlossaryTip } from "@/components/vitals/InlineGlossaryTip";
import { glossary } from "@/components/vitals/glossary";

import type { ProfilerCommitRow } from "./profilerTypes";

function ProfilerChrome(props: {
  panelOpen: boolean;
  rows: ProfilerCommitRow[];
  onOpen: () => void;
  onClose: () => void;
  onClear: () => void;
}) {
  const { panelOpen, rows, onOpen, onClose, onClear } = props;
  const g = glossary;
  const titleId = "fcw-profiler-panel-title";
  const panelRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!panelOpen || !panelRef.current) return;
    const el = panelRef.current.querySelector<HTMLElement>(
      "button, [href], input",
    );
    el?.focus();
  }, [panelOpen]);

  return (
    <>
      {!panelOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className="fixed bottom-4 right-4 z-[100] rounded-full border border-forest-canopy/60 bg-forest-deep/95 px-4 py-2 text-xs font-lineal font-medium text-mycelium-cream shadow-lg backdrop-blur-sm transition hover:border-bioluminescent hover:text-bioluminescent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bioluminescent"
        >
          Profiler
        </button>
      ) : null}

      {panelOpen ? (
        <dialog
          ref={panelRef}
          open
          aria-labelledby={titleId}
          className="fixed top-14 right-4 z-[100] flex max-h-[min(36rem,calc(100dvh-5rem))] w-[min(28rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-forest-canopy/60 bg-forest-deep/98 p-0 shadow-2xl backdrop-blur-md supports-[height:100dvh]:max-h-[min(36rem,calc(100dvh-5rem))]"
        >
          <div className="flex items-start justify-between gap-3 border-b border-forest-canopy/40 px-4 py-3">
            <h2
              id={titleId}
              className="font-lineal text-sm font-semibold tracking-tight text-mycelium-cream"
            >
              <InlineGlossaryTip
                label="Commit log (newest first)"
                heading={g.commitLogSection.heading}
                lines={g.commitLogSection.lines}
              />
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-sm px-2 py-1 text-xs text-forest-spring transition hover:text-bioluminescent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bioluminescent"
            >
              Close
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto px-4 py-3">
            <p className="font-display text-xs leading-relaxed text-forest-spring">
              <InlineGlossaryTip
                label="Overview"
                heading={g.profilerOverlay.heading}
                lines={g.profilerOverlay.lines}
              />
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-forest-moss/60 px-3 py-1.5 text-xs font-medium text-forest-spring transition hover:border-bioluminescent hover:text-bioluminescent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bioluminescent"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent(PROFILER_STRESS_EVENT));
                }}
              >
                Synthetic bump
              </button>
              <button
                type="button"
                className="rounded-md border border-forest-moss/60 px-3 py-1.5 text-xs font-medium text-forest-spring transition hover:border-bioluminescent hover:text-bioluminescent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bioluminescent"
                onClick={onClear}
              >
                Clear log
              </button>
            </div>
            <ProfilerLogTable rows={rows} />
          </div>
        </dialog>
      ) : null}
    </>
  );
}

export function AppProfilerRoot({ children }: { children: React.ReactNode }) {
  const [portalReady, setPortalReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [rows, setRows] = useState<ProfilerCommitRow[]>([]);
  const pending = useRef<ProfilerCommitRow[]>([]);
  const rafId = useRef<number | null>(null);
  const recordingRef = useRef(false);

  useLayoutEffect(() => {
    recordingRef.current = panelOpen;
  }, [panelOpen]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const flush = useCallback(() => {
    rafId.current = null;
    const batch = pending.current;
    pending.current = [];
    if (batch.length === 0) return;
    setRows((prev) => [...batch, ...prev].slice(0, 200));
  }, []);

  const onRender = useCallback<ProfilerOnRenderCallback>(
    (id, phase, actualDuration, baseDuration, _startTime, commitTime) => {
      if (!recordingRef.current) return;
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

  const open = useCallback(() => {
    setRows([]);
    setPanelOpen(true);
  }, []);

  const close = useCallback(() => {
    setPanelOpen(false);
  }, []);

  const clearLog = useCallback(() => {
    setRows([]);
  }, []);

  const controls: ProfilerPanelControls = { open, close, clearLog };

  useEffect(() => {
    if (!panelOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, close]);

  return (
    <ProfilerPanelContext.Provider value={controls}>
      <Profiler id="ForestCityApp" onRender={onRender}>
        <>
          {children}
          <ProfilerStressProbe />
        </>
      </Profiler>
      {portalReady
        ? createPortal(
            <ProfilerChrome
              panelOpen={panelOpen}
              rows={rows}
              onOpen={open}
              onClose={close}
              onClear={clearLog}
            />,
            document.body,
          )
        : null}
    </ProfilerPanelContext.Provider>
  );
}
