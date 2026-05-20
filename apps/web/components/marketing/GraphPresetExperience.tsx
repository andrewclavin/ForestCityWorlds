"use client";

import {
  MYCELIUM_GRAPH_PRESETS,
  MyceliumGraph,
  type MyceliumGraphPresetId,
  type MyceliumGraphRuntimePreset,
} from "@fcw/ui";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

function clonePreset(id: MyceliumGraphPresetId): MyceliumGraphRuntimePreset {
  const base = MYCELIUM_GRAPH_PRESETS[id];
  return { ...base };
}

function PresetGraphIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <title>Preset link icon</title>
      <rect
        x="1"
        y="1"
        width="20"
        height="20"
        rx="5"
        className="stroke-slate-400/90"
        strokeWidth="1.25"
        fill="rgb(15 23 42 / 0.92)"
      />
      <circle cx="6.5" cy="11" r="2.35" className="fill-sky-400/95" />
      <circle cx="15.5" cy="11" r="2.35" className="fill-sky-400/95" />
      <path
        d="M 8.85 11 H 13.15"
        className="stroke-sky-200/90"
        strokeWidth="1.35"
        strokeLinecap="square"
      />
    </svg>
  );
}

type RangeFieldProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  format?: (n: number) => string;
};

function RangeField({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (n) => String(n),
}: RangeFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-slate-200">
          {label}
        </label>
        <span
          className="tabular-nums text-xs text-slate-400"
          aria-live="polite"
        >
          {format(value)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="w-full accent-sky-500"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

type BoolFieldProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
};

function BoolField({ id, label, checked, onChange }: BoolFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        className="size-4 shrink-0 rounded border-slate-500 accent-sky-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id} className="text-xs text-slate-200">
        {label}
      </label>
    </div>
  );
}

export function GraphPresetExperience() {
  const panelId = useId();
  const uid = panelId.replace(/:/g, "");
  const titleId = `${panelId}-title`;
  const [open, setOpen] = useState(false);
  const [tuning, setTuning] = useState<MyceliumGraphRuntimePreset>(() =>
    clonePreset("sparseCorridors"),
  );
  const tuningRef = useRef(tuning);
  tuningRef.current = tuning;

  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const patch = useCallback((partial: Partial<MyceliumGraphRuntimePreset>) => {
    setTuning((prev) => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        queueMicrotask(() => openButtonRef.current?.focus());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const loadNamed = (id: MyceliumGraphPresetId) => {
    setTuning(clonePreset(id));
  };

  return (
    <section className="relative overflow-hidden border-b border-forest-canopy/30">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 opacity-[0.52]">
          <MyceliumGraph
            className="h-full w-full scale-110"
            visualVariant="ambient"
            preset="sparseCorridors"
            runtimePresetRef={tuningRef}
          />
        </div>
      </div>

      <aside
        id={panelId}
        aria-labelledby={titleId}
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(100%,32rem)] flex-col border-r border-slate-500/40 bg-slate-950/95 text-slate-100 shadow-2xl shadow-black/50 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none ${
          open ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-600/50 px-4 py-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-lineal text-sm font-semibold uppercase tracking-widest text-sky-200/95"
            >
              Graph tuning
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Sliders update the live simulation on both graphs without
              resetting the mesh.
            </p>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            className="shrink-0 rounded-md border border-slate-500/60 px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-sky-400/70 hover:text-sky-100"
            onClick={() => {
              setOpen(false);
              queueMicrotask(() => openButtonRef.current?.focus());
            }}
          >
            Close
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-700/50 px-4 py-2">
          <button
            type="button"
            className="rounded-md border border-slate-600/70 px-2 py-1 text-xs text-slate-200 hover:border-sky-500/50"
            onClick={() => loadNamed("sparseCorridors")}
          >
            Load sparse defaults
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-600/70 px-2 py-1 text-xs text-slate-200 hover:border-sky-500/50"
            onClick={() => loadNamed("fullNetworkRhythm")}
          >
            Load full-network defaults
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <RangeField
            id={`${uid}-mw`}
            label="Max walkers (ambient cap in engine)"
            value={tuning.maxWalkers}
            min={1}
            max={16}
            step={1}
            onChange={(maxWalkers) => patch({ maxWalkers })}
          />

          <RangeField
            id={`${uid}-dpr`}
            label="Diminishing pulse rate (0–100)"
            value={tuning.diminishingPulseRate}
            min={0}
            max={100}
            step={1}
            onChange={(diminishingPulseRate) => patch({ diminishingPulseRate })}
          />
          <RangeField
            id={`${uid}-psl`}
            label="Pulse stability longevity % (skip energy drop per hop)"
            value={tuning.pulseStabilityLongevity}
            min={0}
            max={100}
            step={1}
            onChange={(pulseStabilityLongevity) =>
              patch({ pulseStabilityLongevity })
            }
          />

          <BoolField
            id={`${uid}-psco`}
            label="Pulse slots corridor only"
            checked={tuning.pulseSlotsCorridorOnly}
            onChange={(pulseSlotsCorridorOnly) =>
              patch({ pulseSlotsCorridorOnly })
            }
          />
          <BoolField
            id={`${uid}-gate`}
            label="Gate pulse slots to walker or hold"
            checked={tuning.gatePulseSlotsToWalkerOrHold}
            onChange={(gatePulseSlotsToWalkerOrHold) =>
              patch({ gatePulseSlotsToWalkerOrHold })
            }
          />

          <RangeField
            id={`${uid}-hold`}
            label="Corridor hold (ms)"
            value={tuning.corridorHoldMs}
            min={0}
            max={4000}
            step={50}
            onChange={(corridorHoldMs) => patch({ corridorHoldMs })}
          />

          <div className="flex flex-col gap-2">
            <BoolField
              id={`${uid}-mcp-unl`}
              label="Unlimited max corridor pulse replay (−1)"
              checked={tuning.maxCorridorPulseReplay < 0}
              onChange={(unlimited) =>
                patch({
                  maxCorridorPulseReplay: unlimited ? -1 : 0,
                })
              }
            />
            {tuning.maxCorridorPulseReplay >= 0 ? (
              <RangeField
                id={`${uid}-mcp`}
                label="Max corridor pulse replay"
                value={tuning.maxCorridorPulseReplay}
                min={0}
                max={24}
                step={1}
                onChange={(maxCorridorPulseReplay) =>
                  patch({ maxCorridorPulseReplay })
                }
              />
            ) : null}
          </div>

          <RangeField
            id={`${uid}-boost`}
            label="Corridor hold pulse spawn boost"
            value={tuning.corridorHoldPulseSpawnBoost}
            min={1}
            max={8}
            step={0.05}
            onChange={(corridorHoldPulseSpawnBoost) =>
              patch({ corridorHoldPulseSpawnBoost })
            }
            format={(n) => n.toFixed(2)}
          />

          <BoolField
            id={`${uid}-wake`}
            label="Wake from corridor edges only"
            checked={tuning.wakeFromCorridorEdgesOnly}
            onChange={(wakeFromCorridorEdgesOnly) =>
              patch({ wakeFromCorridorEdgesOnly })
            }
          />
          <BoolField
            id={`${uid}-bundle`}
            label="Bundle edge heat per tick"
            checked={tuning.bundleEdgeHeatPerTick}
            onChange={(bundleEdgeHeatPerTick) =>
              patch({ bundleEdgeHeatPerTick })
            }
          />

          <RangeField
            id={`${uid}-bno`}
            label="Beat node opacity"
            value={tuning.beatNodeOpacity}
            min={0}
            max={0.35}
            step={0.002}
            onChange={(beatNodeOpacity) => patch({ beatNodeOpacity })}
            format={(n) => n.toFixed(3)}
          />
          <RangeField
            id={`${uid}-bso`}
            label="Beat stroke opacity"
            value={tuning.beatStrokeOpacity}
            min={0}
            max={0.45}
            step={0.002}
            onChange={(beatStrokeOpacity) => patch({ beatStrokeOpacity })}
            format={(n) => n.toFixed(3)}
          />
          <RangeField
            id={`${uid}-bpso`}
            label="Beat pulse-slot opacity"
            value={tuning.beatPulseSlotOpacity}
            min={0}
            max={0.22}
            step={0.002}
            onChange={(beatPulseSlotOpacity) => patch({ beatPulseSlotOpacity })}
            format={(n) => n.toFixed(3)}
          />

          <RangeField
            id={`${uid}-ps0`}
            label="Pulse spawn coeff 0"
            value={tuning.pulseSpawnCoeff0}
            min={0}
            max={0.002}
            step={0.00001}
            onChange={(pulseSpawnCoeff0) => patch({ pulseSpawnCoeff0 })}
            format={(n) => n.toFixed(5)}
          />
          <RangeField
            id={`${uid}-psh`}
            label="Pulse spawn coeff heat"
            value={tuning.pulseSpawnCoeffHeat}
            min={0}
            max={0.003}
            step={0.00001}
            onChange={(pulseSpawnCoeffHeat) => patch({ pulseSpawnCoeffHeat })}
            format={(n) => n.toFixed(5)}
          />
          <RangeField
            id={`${uid}-psf`}
            label="Pulse spawn coeff fill"
            value={tuning.pulseSpawnCoeffFill}
            min={0}
            max={0.001}
            step={0.00001}
            onChange={(pulseSpawnCoeffFill) => patch({ pulseSpawnCoeffFill })}
            format={(n) => n.toFixed(5)}
          />
          <RangeField
            id={`${uid}-prt`}
            label="Pulse retarget base"
            value={tuning.pulseRetargetBase}
            min={0}
            max={0.0002}
            step={1e-6}
            onChange={(pulseRetargetBase) => patch({ pulseRetargetBase })}
            format={(n) => n.toFixed(6)}
          />
        </div>
      </aside>

      <button
        type="button"
        ref={openButtonRef}
        className="fixed bottom-6 right-4 z-[60] flex size-12 items-center justify-center rounded-xl border border-slate-500/70 bg-slate-950/90 text-slate-100 shadow-lg shadow-black/40 motion-safe:transition hover:border-sky-400/60 hover:bg-slate-900 sm:bottom-8 sm:right-6"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (!next) {
              queueMicrotask(() => openButtonRef.current?.focus());
            }
            return next;
          });
        }}
      >
        <span className="sr-only">
          {open ? "Close graph tuning panel" : "Open graph tuning panel"}
        </span>
        <PresetGraphIcon />
      </button>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:grid-cols-2 sm:px-6 sm:py-28">
        <div className="max-w-xl">
          <p className="text-sm font-medium leading-snug tracking-wide text-forest-moss sm:text-[0.8125rem] sm:tracking-widest">
            Autonomously Learned Behaviors
          </p>
          <h1 className="mt-4 font-lineal text-3xl font-extralight leading-tight tracking-widest text-mycelium-cream sm:text-4xl sm:tracking-[0.14em]">
            forest city worlds
          </h1>
          <p className="mt-6 font-display text-lg leading-relaxed text-forest-spring">
            Experimenting with cognitive models for frontier pragmatics.
            Theoretical focus on a digitized cortical column as new paradigms
            continue to normalize. Aimed intelligence stays on a single
            pragmatic instance, with generalization explored in how it networks
            with other column-based world models. World models stay small and
            tied to a single implementation, experimentally linked towards
            generalization as evidence tunes the growing neural paradigms, while
            protecting data privacy with the same restraint in copy and
            discipline in build and review from sketch to ship.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/tools"
              className="inline-flex items-center justify-center rounded-md bg-forest-canopy px-5 py-2.5 text-sm font-medium text-mycelium-cream transition hover:bg-forest-leaf focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bioluminescent"
            >
              Tools
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md border border-forest-moss/60 px-5 py-2.5 text-sm font-medium text-forest-spring transition hover:border-bioluminescent hover:text-bioluminescent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bioluminescent"
            >
              Contact
            </Link>
          </div>
        </div>
        <div className="relative hidden min-h-[280px] sm:block" aria-hidden>
          <MyceliumGraph
            className="absolute inset-0 z-10 h-full w-full p-6"
            preserveAspectRatio="xMidYMid meet"
            visualVariant="hero"
            preset="sparseCorridors"
            runtimePresetRef={tuningRef}
          />
        </div>
      </div>
    </section>
  );
}
