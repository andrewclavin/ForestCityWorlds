"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useId, useLayoutEffect, useMemo, useRef } from "react";

import {
  MYCELIUM_GRAPH_PRESETS,
  type MyceliumGraphPresetId,
} from "./myceliumGraphPresets";

type Node = { id: string; x: number; y: number };
type Edge = { from: string; to: string };

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Procedural layout; undirected unique edges; nodes may have several links. */
function proceduralGraph(seed: number, count: number) {
  const rng = mulberry32(seed);
  const nodes: Node[] = Array.from({ length: count }, (_, i) => ({
    id: `n${i}`,
    x: 8 + rng() * 84,
    y: 8 + rng() * 84,
  }));
  const seen = new Set<string>();
  const edges: Edge[] = [];
  for (let i = 0; i < count; i++) {
    const links = 1 + Math.floor(rng() * 4);
    for (let j = 0; j < links; j++) {
      const t = Math.floor(rng() * count);
      if (t === i) continue;
      const a = nodes[i]?.id;
      const b = nodes[t]?.id;
      if (!a || !b) continue;
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: a, to: b });
    }
  }
  return { nodes, edges };
}

function edgeRng(seed: number, from: string, to: string, index: number) {
  let h = seed ^ (index * 2654435761);
  for (const ch of from) h = Math.imul(h ^ ch.charCodeAt(0), 1597334677);
  for (const ch of to) h = Math.imul(h ^ ch.charCodeAt(0), 3812015801);
  return mulberry32(h >>> 0);
}

function clamp255(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/** Parse `rgb(r g b)` from node/edge fill strings. */
function parseRgbCss(s: string): { r: number; g: number; b: number } | null {
  const m = s.match(/rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\)/i);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

function mixTowardWhite(
  rgb: { r: number; g: number; b: number },
  t: number,
): string {
  const f = clamp01(t);
  const r = clamp255(rgb.r + (255 - rgb.r) * f);
  const g = clamp255(rgb.g + (255 - rgb.g) * f);
  const b = clamp255(rgb.b + (255 - rgb.b) * f);
  return `rgb(${r} ${g} ${b})`;
}

function smoothstep01(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/** ~0.2s blend for node fill lift and idle opacity (exp decay + smoothstep). */
const NODE_LIFT_BLEND_TAU_MS = 44;

function liftEaseAlpha(dtMs: number): number {
  const u = 1 - Math.exp(-Math.max(dtMs, 0.5) / NODE_LIFT_BLEND_TAU_MS);
  return smoothstep01(u);
}

/** ~150ms ease for node/edge opacity toward lit vs idle (exp + smoothstep). */
const OPACITY_EASE_15_MS_TAU = 50;

function opacityEase15(dtMs: number): number {
  const u = 1 - Math.exp(-Math.max(dtMs, 0.5) / OPACITY_EASE_15_MS_TAU);
  return smoothstep01(u);
}

/** Node circle radius (viewBox units). */
const NODE_CIRCLE_R = 1.05;
/** Edge stroke width on the `<g>` that draws links. */
const MYCE_EDGE_STROKE_W = 0.52;
/** Opaque disk behind each node so edge strokes can meet centers without visible overlap. */
const NODE_LINE_MASK_R = NODE_CIRCLE_R + MYCE_EDGE_STROKE_W * 0.55 + 0.11;
/** Independent traveling dashes per edge (render slots). */
const EDGE_PULSE_SLOTS = 12;

/** Opacity floor for animated nodes — strong baseline so the mesh reads on hero. */
const NODE_OPACITY_MIN = 0.52;
/** Chance a pulse may reach full 1.0 opacity / stroke until window ends. */
const FULL_BRIGHT_P = 0.04;
const FULL_BRIGHT_MS_MIN = 320;
const FULL_BRIGHT_MS_MAX = 720;

/** After this gap (ms) without pulse/wake, node opacity eases toward idle target. */
const IDLE_DIM_GRACE_MS = 2200;
/** Absolute node opacity when idle; eased in/out with `liftEaseAlpha` (~0.2s). */
const NODE_IDLE_OPACITY_TARGET = 0.2;
/** Idle base stroke-opacity for edges (no heat / travel). */
const EDGE_IDLE_OPACITY_TARGET = 0.2;
/** Min time between spawn waves (ms); next wave picks a burst of 1–12 walkers. */
const SPAWN_WAVE_MIN_MS = 4800;
const SPAWN_WAVE_MAX_MS = 16_000;
/** Stagger between walkers inside one burst (ms). */
const BURST_STAGGER_MIN_MS = 80;
const BURST_STAGGER_MAX_MS = 340;
/** Global rhythm period for subtle system-wide pulse (ms). */
const GLOBAL_BEAT_PERIOD_MS = 520;

function heatToNodeOpacity(
  heat: number,
  fullUntil: number,
  now: number,
): number {
  const h = Math.max(0, heat);
  const t = 1 - Math.exp(-h * 0.92);
  const soft = now < fullUntil ? 1 : 0.94;
  return clamp01(
    NODE_OPACITY_MIN + (1 - NODE_OPACITY_MIN) * Math.min(1, t * soft),
  );
}

function heatToEdgeStrokeOpacity(
  baseOp: number,
  heat: number,
  fullUntil: number,
  now: number,
): number {
  const h = Math.max(0, heat);
  const t = 1 - Math.exp(-h * 0.72);
  const soft = now < fullUntil ? 1 : 0.93;
  const mod = 0.76 + 0.24 * Math.min(1, t * soft);
  const boost = now < fullUntil && t > 0.78 ? 1.08 : 1;
  return clamp01(baseOp * mod * boost);
}

function edgeStrokeRgb(rng: () => number): string {
  const g = 58 + rng() * 38;
  const halfR = 0.11 * 1.5;
  const halfB = 0.1 * 1.5;
  const kR = 0.36 + (rng() - 0.5) * (halfR * 2);
  const kB = 0.38 + (rng() - 0.5) * (halfB * 2);
  let r = g * kR;
  let b = g * kB;
  const chromR = (rng() - 0.5) * g * 0.18;
  const chromB = (rng() - 0.5) * g * 0.18;
  r += chromR;
  b += chromB;
  r = Math.min(r, g * 0.95);
  b = Math.min(b, g * 0.93);
  r = Math.max(r, g * 0.2);
  b = Math.max(b, g * 0.22);
  const d = 10 + rng() * 12;
  const r2 = clamp255(r - d * (0.55 + rng() * 0.1));
  const g2 = clamp255(g - d * (0.32 + rng() * 0.08));
  const b2 = clamp255(b - d * (0.52 + rng() * 0.1));
  return `rgb(${r2} ${g2} ${b2})`;
}

function nodeFillRgb(rng: () => number): string {
  const g = 70 + rng() * 34;
  const halfR = 0.1 * 1.5;
  const halfB = 0.09 * 1.5;
  const kR = 0.39 + (rng() - 0.5) * (halfR * 2);
  const kB = 0.41 + (rng() - 0.5) * (halfB * 2);
  let r = g * kR;
  let b = g * kB;
  const chromR = (rng() - 0.5) * g * 0.16;
  const chromB = (rng() - 0.5) * g * 0.16;
  r += chromR;
  b += chromB;
  r = Math.min(r, g * 0.96);
  b = Math.min(b, g * 0.94);
  r = Math.max(r, g * 0.24);
  b = Math.max(b, g * 0.26);
  const d = 5 + rng() * 9;
  const r2 = clamp255(r - d * (0.5 + rng() * 0.1));
  const g2 = clamp255(g - d * (0.28 + rng() * 0.08));
  const b2 = clamp255(b - d * (0.48 + rng() * 0.1));
  return `rgb(${r2} ${g2} ${b2})`;
}

type AdjEntry = { to: string; edgeIdx: number };

type Walker = {
  phase: "riseNode" | "traverseEdge";
  timer: number;
  atNode: string;
  edgeIdx: number;
  toNode: string;
  riseMs: number;
  traverseMs: number;
  energy: number;
  /** Fixed at traverse start — no RNG in rAF */
  traverseCurvePow: number;
  traversePeak: number;
};

export type MyceliumGraphProps = {
  className?: string;
  "aria-hidden"?: boolean;
  /** Opaque fill behind node markers; match page background (e.g. forest deep). */
  nodeLineMaskFill?: string;
  /**
   * Animation density / coupling. `sparseCorridors` (default) keeps multi-pulse dashes on
   * active walker links only; `fullNetworkRhythm` restores network-wide pulse-slot activity.
   * @see {@link MYCELIUM_GRAPH_PRESETS} in `myceliumGraphPresets.ts`
   */
  preset?: MyceliumGraphPresetId;
  /**
   * SVG `preserveAspectRatio`. Default `slice` fills ambient hero crops; use `meet`
   * in tight frames so the full graph stays in view without top/bottom clipping.
   */
  preserveAspectRatio?: string;
};

export function MyceliumGraph({
  className,
  "aria-hidden": ariaHidden = true,
  nodeLineMaskFill = "#0f2a1f",
  preset: presetId = "sparseCorridors",
  preserveAspectRatio = "xMidYMid slice",
}: MyceliumGraphProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const { nodes, edges } = useMemo(() => proceduralGraph(42, 18), []);

  const nodeById = useMemo(() => {
    const m = new Map<string, Node>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const nodeIndex = useMemo(() => {
    const m = new Map<string, number>();
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n) m.set(n.id, i);
    }
    return m;
  }, [nodes]);

  const adjacency = useMemo(() => {
    const m = new Map<string, AdjEntry[]>();
    const add = (from: string, to: string, edgeIdx: number) => {
      const list = m.get(from) ?? [];
      list.push({ to, edgeIdx });
      m.set(from, list);
    };
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      if (!e) continue;
      add(e.from, e.to, i);
      add(e.to, e.from, i);
    }
    return m;
  }, [edges]);

  const nodeColors = useMemo(() => {
    const rng = mulberry32(90210);
    return new Map(nodes.map((n) => [n.id, nodeFillRgb(rng)]));
  }, [nodes]);

  const nodeBaseRgb = useMemo(
    () =>
      nodes.map((n) => {
        const s = nodeColors.get(n.id);
        return s ? parseRgbCss(s) : null;
      }),
    [nodes, nodeColors],
  );

  const circleRefs = useRef<(SVGCircleElement | null)[]>([]);
  /** Full-length edge (always drawn); pulse layer uses traveling dash on top. */
  const pathBaseRefs = useRef<(SVGPathElement | null)[]>([]);
  const pathPulseSlotRefs = useRef<(SVGPathElement | null)[]>([]);
  const pathLens = useRef<number[]>([]);

  useLayoutEffect(() => {
    const lens: number[] = [];
    for (let i = 0; i < edges.length; i++) {
      const el = pathBaseRefs.current[i];
      lens[i] = el?.getTotalLength() ?? 0;
    }
    pathLens.current = lens;
  }, [edges]);

  useEffect(() => {
    if (reduceMotion) return;

    const preset =
      MYCELIUM_GRAPH_PRESETS[presetId] ??
      MYCELIUM_GRAPH_PRESETS.sparseCorridors;
    const rng = mulberry32(314159);
    const nCount = nodes.length;
    const eCount = edges.length;
    const nodeHeat = new Float32Array(nCount);
    const edgeHeat = new Float32Array(eCount);
    const edgeTravel = new Float32Array(eCount);
    const nodeFullUntil = new Float64Array(nCount);
    const edgeFullUntil = new Float64Array(eCount);

    const walkers: Walker[] = [];
    let nextWaveAt = performance.now() + 900 + rng() * 2200;
    let burstRemaining = 0;
    let nextBurstSpawnAt = 0;
    let burstOriginId: string | null = null;
    let last = performance.now();
    let raf = 0;

    const lastWakeAt = new Float64Array(nCount);
    /** -1 = uninitialized; then smoothed toward heat-based or idle opacity. */
    const nodeOpacitySmooth = new Float32Array(nCount);
    nodeOpacitySmooth.fill(-1);
    const boot = performance.now();
    for (let i = 0; i < nCount; i++) {
      lastWakeAt[i] = boot;
    }

    const nodeLiftSmooth = new Float32Array(nCount);
    nodeLiftSmooth.fill(0);

    const edgeStrokeOpacitySmooth = new Float32Array(eCount);
    edgeStrokeOpacitySmooth.fill(-1);

    const edgePulseTarget = new Int8Array(eCount);
    for (let ei = 0; ei < eCount; ei++) {
      edgePulseTarget[ei] = 1 + Math.floor(rng() * EDGE_PULSE_SLOTS);
    }
    const epActive = new Uint8Array(eCount * EDGE_PULSE_SLOTS);
    const epU = new Float32Array(eCount * EDGE_PULSE_SLOTS);
    const epSpeed = new Float32Array(eCount * EDGE_PULSE_SLOTS);
    const epSegFrac = new Float32Array(eCount * EDGE_PULSE_SLOTS);

    const corridorHoldUntil = new Float64Array(eCount);
    const edgeHeatAcc = new Float32Array(eCount);
    const nodeRecvAcc = new Float32Array(nCount);

    const maxWalkers = preset.maxWalkers;
    const nodeDecay = 0.989;
    const edgeDecay = 0.986;

    /** Only the node on the pulse path gets opacity grace — no whole-neighbor halo. */
    function wakeNode(i: number | undefined, now: number) {
      if (i === undefined || i < 0 || i >= nCount) return;
      lastWakeAt[i] = Math.max(lastWakeAt[i] ?? 0, now);
    }

    function tryFullBrightWindow(until: Float64Array, i: number, now: number) {
      if (rng() >= FULL_BRIGHT_P) return;
      const ms =
        FULL_BRIGHT_MS_MIN + rng() * (FULL_BRIGHT_MS_MAX - FULL_BRIGHT_MS_MIN);
      until[i] = Math.max(until[i] ?? 0, now + ms);
    }

    function addNodeHeat(i: number | undefined, amt: number, now: number) {
      if (i === undefined || amt <= 0) return;
      nodeHeat[i] = Math.min(9, (nodeHeat[i] ?? 0) + amt);
      tryFullBrightWindow(nodeFullUntil, i, now);
      wakeNode(i, now);
    }

    function addEdgeHeat(i: number | undefined, amt: number, now: number) {
      if (i === undefined || amt <= 0) return;
      edgeHeat[i] = Math.min(9, (edgeHeat[i] ?? 0) + amt);
      tryFullBrightWindow(edgeFullUntil, i, now);
      const e = edges[i];
      if (e) {
        wakeNode(nodeIndex.get(e.from), now);
        wakeNode(nodeIndex.get(e.to), now);
      }
    }

    function spawnWalker(now: number, startOverride: string | null) {
      if (walkers.length >= maxWalkers) return;
      const start =
        startOverride ??
        nodes[Math.floor(rng() * nodes.length)]?.id ??
        undefined;
      if (!start) return;
      const energy = 0.45 + rng() * 0.52;
      walkers.push({
        phase: "riseNode",
        timer: 0,
        atNode: start,
        edgeIdx: -1,
        toNode: "",
        riseMs: 300 + rng() * 320,
        traverseMs: 0,
        energy,
        traverseCurvePow: 0.9,
        traversePeak: 0.4,
      });
      addNodeHeat(nodeIndex.get(start), 0.2 + rng() * 0.16, now);
    }

    function pickNextEdge(fromId: string, energy: number): AdjEntry | null {
      const outs = adjacency.get(fromId);
      if (!outs?.length) return null;
      const shuffled = [...outs].sort(() => rng() - 0.5);
      for (const cand of shuffled) {
        if (rng() > 0.34 + energy * 0.22) continue;
        return cand;
      }
      if (rng() < 0.42) {
        const first = shuffled[0];
        return first ?? null;
      }
      return null;
    }

    spawnWalker(performance.now(), null);

    function tick(now: number) {
      const dt = Math.min(48, now - last);
      last = now;
      const beatWave =
        0.5 +
        0.5 *
          Math.sin(
            ((now % GLOBAL_BEAT_PERIOD_MS) / GLOBAL_BEAT_PERIOD_MS) *
              Math.PI *
              2,
          );

      for (let i = 0; i < nCount; i++) {
        nodeHeat[i] = (nodeHeat[i] ?? 0) * nodeDecay;
      }
      for (let i = 0; i < eCount; i++) {
        edgeHeat[i] = (edgeHeat[i] ?? 0) * edgeDecay;
        edgeTravel[i] = 0;
      }

      if (preset.bundleEdgeHeatPerTick) {
        edgeHeatAcc.fill(0);
        nodeRecvAcc.fill(0);
      }

      if (burstRemaining <= 0 && now >= nextWaveAt) {
        burstRemaining = 1 + Math.floor(rng() * 12);
        const origin = nodes[Math.floor(rng() * nodes.length)]?.id ?? null;
        burstOriginId = origin;
        nextWaveAt =
          now +
          SPAWN_WAVE_MIN_MS +
          rng() * (SPAWN_WAVE_MAX_MS - SPAWN_WAVE_MIN_MS);
        nextBurstSpawnAt = now;
      }

      if (
        burstRemaining > 0 &&
        now >= nextBurstSpawnAt &&
        walkers.length < maxWalkers
      ) {
        spawnWalker(now, burstOriginId);
        burstRemaining -= 1;
        nextBurstSpawnAt =
          now +
          BURST_STAGGER_MIN_MS +
          rng() * (BURST_STAGGER_MAX_MS - BURST_STAGGER_MIN_MS);
        if (burstRemaining <= 0) {
          burstOriginId = null;
        }
      }

      for (let w = walkers.length - 1; w >= 0; w--) {
        const walker = walkers[w];
        if (!walker) continue;
        walker.timer += dt;

        if (walker.phase === "riseNode") {
          const u = clamp01(walker.timer / walker.riseMs);
          const idx = nodeIndex.get(walker.atNode);
          if (idx !== undefined) {
            wakeNode(idx, now);
            const riseAdd =
              walker.energy * smoothstep01(u) * 0.085 * (dt / 16.67);
            nodeHeat[idx] = Math.min(9, (nodeHeat[idx] ?? 0) + riseAdd);
          }

          if (walker.timer >= walker.riseMs) {
            const next = pickNextEdge(walker.atNode, walker.energy);
            if (!next) {
              walkers.splice(w, 1);
              continue;
            }
            const fromI = nodeIndex.get(walker.atNode);
            addNodeHeat(fromI, walker.energy * (0.09 + rng() * 0.1), now);
            walker.phase = "traverseEdge";
            walker.timer = 0;
            walker.edgeIdx = next.edgeIdx;
            walker.toNode = next.to;
            walker.traverseMs = 720 + rng() * 900;
            walker.energy *= 0.55 + rng() * 0.38;
            walker.traverseCurvePow = 0.78 + rng() * 0.22;
            walker.traversePeak = 0.22 + rng() * 0.28;
            addEdgeHeat(walker.edgeIdx, walker.energy * 0.32, now);
          }
        } else if (walker.phase === "traverseEdge") {
          const u = clamp01(walker.timer / walker.traverseMs);
          const ei = walker.edgeIdx;
          if (ei >= 0 && ei < eCount) {
            const fromI = nodeIndex.get(walker.atNode);
            const toI = nodeIndex.get(walker.toNode);
            wakeNode(fromI, now);
            wakeNode(toI, now);
            const pow = walker.traverseCurvePow;
            const envelope =
              walker.energy *
              walker.traversePeak *
              Math.sin(Math.PI * u ** pow);
            const heatAdd = envelope * 0.24;
            if (preset.bundleEdgeHeatPerTick) {
              edgeHeatAcc[ei] = Math.max(edgeHeatAcc[ei] ?? 0, heatAdd);
            } else {
              edgeHeat[ei] = Math.min(9, (edgeHeat[ei] ?? 0) + heatAdd);
            }
            edgeTravel[ei] = Math.max(edgeTravel[ei] ?? 0, u);

            if (preset.corridorHoldMs > 0) {
              corridorHoldUntil[ei] = now + preset.corridorHoldMs;
            }

            if (toI !== undefined) {
              const pre = clamp01((u - 0.28) / 0.72);
              const recv = walker.energy * smoothstep01(pre) * (dt / 17) * 0.1;
              if (preset.bundleEdgeHeatPerTick) {
                nodeRecvAcc[toI] = Math.max(nodeRecvAcc[toI] ?? 0, recv);
              } else {
                nodeHeat[toI] = Math.min(9, (nodeHeat[toI] ?? 0) + recv);
              }
            }
          }

          if (walker.timer >= walker.traverseMs) {
            if (walker.energy > 0.14 && rng() < 0.72) {
              const arrived = nodeIndex.get(walker.toNode);
              addNodeHeat(arrived, walker.energy * (0.14 + rng() * 0.14), now);
              walker.phase = "riseNode";
              walker.timer = 0;
              walker.atNode = walker.toNode;
              walker.edgeIdx = -1;
              walker.toNode = "";
              walker.riseMs = 260 + rng() * 340;
            } else {
              walkers.splice(w, 1);
            }
          }
        }
      }

      if (preset.bundleEdgeHeatPerTick) {
        for (let i = 0; i < eCount; i++) {
          const a = edgeHeatAcc[i] ?? 0;
          if (a > 0) {
            edgeHeat[i] = Math.min(9, (edgeHeat[i] ?? 0) + a);
          }
        }
        for (let i = 0; i < nCount; i++) {
          const a = nodeRecvAcc[i] ?? 0;
          if (a > 0) {
            nodeHeat[i] = Math.min(9, (nodeHeat[i] ?? 0) + a);
          }
        }
      }

      const activeWalkerEdgeSet = new Set<number>();
      for (const w of walkers) {
        if (
          w.phase === "traverseEdge" &&
          w.edgeIdx >= 0 &&
          w.edgeIdx < eCount
        ) {
          activeWalkerEdgeSet.add(w.edgeIdx);
        }
      }

      const edgeInCorridor = (ei: number) =>
        !preset.pulseSlotsCorridorOnly ||
        activeWalkerEdgeSet.has(ei) ||
        now < (corridorHoldUntil[ei] ?? 0);

      for (let ei = 0; ei < eCount; ei++) {
        if (preset.wakeFromCorridorEdgesOnly && !edgeInCorridor(ei)) continue;
        const hWake = edgeHeat[ei] ?? 0;
        const tWake = edgeTravel[ei] ?? 0;
        if (hWake > 0.036 || tWake > 0.012) {
          const ed = edges[ei];
          if (ed) {
            wakeNode(nodeIndex.get(ed.from), now);
            wakeNode(nodeIndex.get(ed.to), now);
          }
        }
      }

      for (let ei = 0; ei < eCount; ei++) {
        if (preset.pulseSlotsCorridorOnly && !edgeInCorridor(ei)) {
          const off = ei * EDGE_PULSE_SLOTS;
          for (let k = 0; k < EDGE_PULSE_SLOTS; k++) {
            epActive[off + k] = 0;
          }
          continue;
        }
        const lenP = pathLens.current[ei] ?? 0;
        if (lenP < 0.5) continue;
        const base = ei * EDGE_PULSE_SLOTS;
        const hP = edgeHeat[ei] ?? 0;
        const tP = edgeTravel[ei] ?? 0;
        let activeC = 0;
        for (let k = 0; k < EDGE_PULSE_SLOTS; k++) {
          if (epActive[base + k]) activeC++;
        }
        const target = edgePulseTarget[ei] ?? 1;
        const heatDrive = Math.min(1.15, hP * 0.92) + (tP > 0.015 ? 0.38 : 0);
        const spawnP =
          (preset.pulseSpawnCoeff0 +
            preset.pulseSpawnCoeffHeat * heatDrive +
            preset.pulseSpawnCoeffFill * (target - activeC)) *
          dt;
        if (activeC < target && rng() < spawnP) {
          for (let k = 0; k < EDGE_PULSE_SLOTS; k++) {
            const ix = base + k;
            if (!epActive[ix]) {
              epActive[ix] = 1;
              epU[ix] = rng();
              epSpeed[ix] = 0.00009 + rng() * 0.00135;
              epSegFrac[ix] = 0.015 + rng() * 0.1;
              break;
            }
          }
        }
        if (rng() < preset.pulseRetargetBase * dt) {
          edgePulseTarget[ei] = 1 + Math.floor(rng() * EDGE_PULSE_SLOTS);
        }
        for (let k = 0; k < EDGE_PULSE_SLOTS; k++) {
          const ix = base + k;
          if (!epActive[ix]) continue;
          let u = epU[ix] ?? 0;
          u += (epSpeed[ix] ?? 0) * dt;
          while (u >= 1) u -= 1;
          epU[ix] = u;
        }
      }

      const pulseAtNode = new Int32Array(nCount);
      for (const w of walkers) {
        if (w.phase === "riseNode") {
          const ix = nodeIndex.get(w.atNode);
          if (ix !== undefined) {
            pulseAtNode[ix] = (pulseAtNode[ix] ?? 0) + 1;
          }
        } else {
          const a = nodeIndex.get(w.atNode);
          const b = nodeIndex.get(w.toNode);
          if (a !== undefined) {
            pulseAtNode[a] = (pulseAtNode[a] ?? 0) + 1;
          }
          if (b !== undefined) {
            pulseAtNode[b] = (pulseAtNode[b] ?? 0) + 1;
          }
        }
      }

      const beatPulse = 0.972 + preset.beatNodeOpacity * beatWave;

      for (let i = 0; i < nCount; i++) {
        const el = circleRefs.current[i];
        if (!el) continue;
        const nd = nodes[i];
        if (!nd) continue;
        const h = nodeHeat[i] ?? 0;
        const rgbBase = nodeBaseRgb[i];
        const nPulse = pulseAtNode[i] ?? 0;
        const targetLift = Math.min(0.15, nPulse * 0.037);
        const curLift = nodeLiftSmooth[i] ?? 0;
        const liftAlpha = liftEaseAlpha(dt);
        nodeLiftSmooth[i] = curLift + (targetLift - curLift) * liftAlpha;
        const fillLift = nodeLiftSmooth[i] ?? 0;
        if (rgbBase) {
          el.setAttribute("fill", mixTowardWhite(rgbBase, fillLift));
        }
        const opacityBase = heatToNodeOpacity(h, nodeFullUntil[i] ?? 0, now);
        const opacityHiRaw = clamp01(opacityBase * beatPulse);
        const wakeT = lastWakeAt[i] ?? 0;
        const inPulseGrace =
          (pulseAtNode[i] ?? 0) > 0 || now - wakeT <= IDLE_DIM_GRACE_MS;
        const opacityHi = inPulseGrace
          ? Math.max(opacityHiRaw, 0.55)
          : opacityHiRaw;
        const opacityTarget = inPulseGrace
          ? opacityHi
          : NODE_IDLE_OPACITY_TARGET;
        let curOp = nodeOpacitySmooth[i] ?? -1;
        if (curOp < 0) curOp = opacityTarget;
        else {
          const oAlpha = opacityEase15(dt);
          curOp = curOp + (opacityTarget - curOp) * oAlpha;
        }
        nodeOpacitySmooth[i] = curOp;
        const opacity = clamp01(curOp);
        const scale =
          0.94 +
          ((opacityBase - NODE_OPACITY_MIN) / (1 - NODE_OPACITY_MIN)) * 0.1;
        el.setAttribute("opacity", String(opacity));
        el.setAttribute(
          "transform",
          `translate(${nd.x} ${nd.y}) scale(${scale}) translate(${-nd.x} ${-nd.y})`,
        );
      }

      for (let ei = 0; ei < eCount; ei++) {
        const baseEl = pathBaseRefs.current[ei];
        const baseOp = (() => {
          const raw = baseEl?.dataset.baseOpacity;
          return raw ? Number.parseFloat(raw) : 0.72;
        })();
        const h = edgeHeat[ei] ?? 0;
        const t = edgeTravel[ei] ?? 0;
        const len = pathLens.current[ei] ?? 0;
        const fullUntil = edgeFullUntil[ei] ?? 0;

        const heated = heatToEdgeStrokeOpacity(
          baseOp,
          h * 0.68,
          fullUntil,
          now,
        );
        const bodyFloor = baseOp * 0.34;
        const bodyOpRaw = Math.max(bodyFloor, heated * 0.94);
        const bodyOpLit = clamp01(
          bodyOpRaw * (0.962 + preset.beatStrokeOpacity * beatWave),
        );
        const edgeHasSignal = h > 0.036 || t > 0.012;
        const bodyTarget = edgeHasSignal ? bodyOpLit : EDGE_IDLE_OPACITY_TARGET;
        let curEb = edgeStrokeOpacitySmooth[ei] ?? -1;
        if (curEb < 0) curEb = bodyTarget;
        else {
          curEb = curEb + (bodyTarget - curEb) * opacityEase15(dt);
        }
        edgeStrokeOpacitySmooth[ei] = curEb;
        const bodyOp = clamp01(curEb);
        if (baseEl) {
          baseEl.setAttribute("stroke-opacity", String(bodyOp));
        }

        for (let k = 0; k < EDGE_PULSE_SLOTS; k++) {
          const ix = ei * EDGE_PULSE_SLOTS + k;
          const slotEl = pathPulseSlotRefs.current[ix];
          if (!slotEl) continue;
          if (!epActive[ix]) {
            slotEl.removeAttribute("stroke-dasharray");
            slotEl.removeAttribute("stroke-dashoffset");
            slotEl.setAttribute("stroke-opacity", "0");
            continue;
          }
          if (len < 0.5) {
            slotEl.removeAttribute("stroke-dasharray");
            slotEl.removeAttribute("stroke-dashoffset");
            slotEl.setAttribute("stroke-opacity", "0");
            continue;
          }
          const uf = epU[ix] ?? 0;
          const seg = len * (epSegFrac[ix] ?? 0.05);
          slotEl.setAttribute("stroke-dasharray", `${seg} ${len}`);
          slotEl.setAttribute("stroke-dashoffset", String(len * (1 - uf)));
          const trip = Math.sin(Math.PI * clamp01(uf) ** 0.88);
          let pulseOp = trip * (0.26 + 0.52 * Math.min(1.2, h * 1.05 + 0.28));
          if (now < fullUntil) pulseOp *= 1.08;
          if (bodyOp > 0.78) pulseOp *= 0.62;
          else if (bodyOp < 0.52) pulseOp *= 1.14;
          pulseOp = clamp01(pulseOp);
          if (pulseOp < 0.02) {
            slotEl.removeAttribute("stroke-dasharray");
            slotEl.removeAttribute("stroke-dashoffset");
            pulseOp = 0;
          }
          slotEl.setAttribute(
            "stroke-opacity",
            String(
              clamp01(
                pulseOp * (0.97 + preset.beatPulseSlotOpacity * beatWave),
              ),
            ),
          );
        }
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, nodes, edges, adjacency, nodeIndex, nodeBaseRgb, presetId]);

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio={preserveAspectRatio}
      aria-hidden={ariaHidden}
      role={ariaHidden ? undefined : "img"}
      aria-labelledby={ariaHidden ? undefined : `${id}-title`}
    >
      <title id={`${id}-title`}>Branching network visualization</title>
      <g
        strokeWidth={0.52}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {edges.map((e, i) => {
          const a = nodeById.get(e.from);
          const b = nodeById.get(e.to);
          if (!a || !b) return null;
          const rng = edgeRng(7919, e.from, e.to, i);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const px = -uy;
          const py = ux;
          const sag =
            (4 + rng() * 10) * (i % 2 === 0 ? 1 : -1) * (0.75 + (i % 5) * 0.06);
          const w1 = 0.28 + rng() * 0.12;
          const w2 = 0.72 - rng() * 0.12;
          const c1x = a.x + dx * w1 + px * sag * 0.95;
          const c1y = a.y + dy * w1 + py * sag * 0.95;
          const c2x = a.x + dx * w2 - px * sag * 0.88;
          const c2y = a.y + dy * w2 - py * sag * 0.88;
          const d = `M ${a.x} ${a.y} C ${c1x} ${c1y} ${c2x} ${c2y} ${b.x} ${b.y}`;
          const stroke = edgeStrokeRgb(rng);
          const strokeOpacity = 0.68 + rng() * 0.22;
          if (reduceMotion) {
            return (
              <path
                key={`${e.from}-${e.to}-${i}`}
                d={d}
                stroke={stroke}
                strokeOpacity={strokeOpacity}
              />
            );
          }
          const opData = String(strokeOpacity);
          return (
            <g key={`${e.from}-${e.to}-${i}`}>
              <path
                ref={(el) => {
                  pathBaseRefs.current[i] = el;
                }}
                d={d}
                stroke={stroke}
                data-base-opacity={opData}
                strokeOpacity={strokeOpacity * 0.62}
              />
              {Array.from({ length: EDGE_PULSE_SLOTS }, (_, k) => (
                <path
                  key={`${e.from}-${e.to}-${i}-p-${k}`}
                  ref={(el) => {
                    pathPulseSlotRefs.current[i * EDGE_PULSE_SLOTS + k] = el;
                  }}
                  d={d}
                  stroke={stroke}
                  data-base-opacity={opData}
                  strokeOpacity={0}
                />
              ))}
            </g>
          );
        })}
      </g>
      {!reduceMotion ? (
        <g className="pointer-events-none" aria-hidden>
          {nodes.map((n) => (
            <circle
              key={`line-mask-${n.id}`}
              cx={n.x}
              cy={n.y}
              r={NODE_LINE_MASK_R}
              fill={nodeLineMaskFill}
            />
          ))}
        </g>
      ) : null}
      <g>
        {nodes.map((n, i) => {
          const fill = nodeColors.get(n.id) ?? "rgb(42 78 52)";
          if (reduceMotion) {
            return (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r={NODE_CIRCLE_R}
                fill={fill}
                opacity={0.72}
              />
            );
          }
          return (
            <circle
              key={n.id}
              ref={(el) => {
                circleRefs.current[i] = el;
              }}
              cx={n.x}
              cy={n.y}
              r={NODE_CIRCLE_R}
              fill={fill}
              opacity={NODE_OPACITY_MIN}
            />
          );
        })}
      </g>
    </svg>
  );
}
