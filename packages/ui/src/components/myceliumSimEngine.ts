import type { RefObject } from "react";
import { useEffect } from "react";

import {
  MYCELIUM_GRAPH_PRESETS,
  type MyceliumGraphPresetId,
  type MyceliumGraphRuntimePreset,
} from "./myceliumGraphPresets";

export function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp255(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function distPointToSegmentSq(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const ab2 = abx * abx + aby * aby;
  let t = ab2 > 1e-14 ? (apx * abx + apy * aby) / ab2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy;
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

const NODE_LIFT_BLEND_TAU_MS = 44;

function liftEaseAlpha(dtMs: number): number {
  const u = 1 - Math.exp(-Math.max(dtMs, 0.5) / NODE_LIFT_BLEND_TAU_MS);
  return smoothstep01(u);
}

const OPACITY_EASE_15_MS_TAU = 50;

function opacityEase15(dtMs: number): number {
  const u = 1 - Math.exp(-Math.max(dtMs, 0.5) / OPACITY_EASE_15_MS_TAU);
  return smoothstep01(u);
}

function easeInCubic01(t: number) {
  const x = clamp01(t);
  return x * x * x;
}

function easeInOutCubic01(t: number) {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

const NODE_OUTGOING_DELAY_MS = 0;
const REVEAL_EASE_LEADER_MS = 38;
const REVEAL_EASE_FOLLOWER_MS = 95;
const TIMELINE_FOLLOWER_OFFSET_MS = 1300;
const REVEAL_STEP_AMBIENT = 0.3;
const REVEAL_STEP_HERO = 0.65;

export const EDGE_PULSE_SLOTS = 12;

const NODE_OPACITY_MIN = 0.52;
const FULL_BRIGHT_P = 0.04;
const FULL_BRIGHT_MS_MIN = 320;
const FULL_BRIGHT_MS_MAX = 720;

const IDLE_DIM_GRACE_MS = 200;
const NODE_IDLE_OPACITY_TARGET = 0.42;
const EDGE_IDLE_OPACITY_TARGET = 0.32;
const NODE_RADIATION_REVEAL_CAP = NODE_IDLE_OPACITY_TARGET;
const EDGE_RADIATION_REVEAL_CAP = EDGE_IDLE_OPACITY_TARGET;
const RADIATION_CLOSE_FRAC = 0.15;
const RADIATION_FAR_FRAC = 0.15;
const RADIATION_CLOSE_DELTA = 0.06;
const RADIATION_MID_DELTA = 0.04;
const RADIATION_FAR_DELTA = 0.02;
const SPAWN_WAVE_MIN_MS = 4800;
const SPAWN_WAVE_MAX_MS = 16_000;
const BURST_STAGGER_MIN_MS = 36;
const BURST_STAGGER_MAX_MS = 140;
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

export type MyceliumSimAdjEntry = { to: string; edgeIdx: number };

type Walker = {
  phase: "riseNode" | "traverseEdge";
  timer: number;
  atNode: string;
  edgeIdx: number;
  toNode: string;
  riseMs: number;
  traverseMs: number;
  energy: number;
  traverseCurvePow: number;
  traversePeak: number;
  announcedMidtraverse: boolean;
};

export type MyceliumSimNode = { id: string; x: number; y: number };
export type MyceliumSimEdge = { from: string; to: string };

export type CreateMyceliumSimRuntimeParams = {
  nodes: readonly MyceliumSimNode[];
  edges: readonly MyceliumSimEdge[];
  adjacency: Map<string, MyceliumSimAdjEntry[]>;
  nodeIndex: Map<string, number>;
  nodeBaseRgb: Array<{ r: number; g: number; b: number } | null>;
  presetId: MyceliumGraphPresetId;
  bootOriginNodeId: string;
  visualVariant: "ambient" | "hero";
  pathLens: RefObject<number[]>;
  circleRefs: RefObject<(SVGCircleElement | null)[]>;
  lineMaskRefs: RefObject<(SVGCircleElement | null)[]>;
  pathBaseRefs: RefObject<(SVGPathElement | null)[]>;
  pathPulseSlotRefs: RefObject<(SVGPathElement | null)[]>;
  edgeGroupRefs: RefObject<(SVGGElement | null)[]>;
  /**
   * When set, the sim reads tunables from this ref on every tick (live updates).
   * Omit to use {@link presetId} and the static entries in {@link MYCELIUM_GRAPH_PRESETS}.
   */
  runtimePresetRef?: RefObject<MyceliumGraphRuntimePreset | null>;
};

export function createMyceliumSimRuntime(
  params: CreateMyceliumSimRuntimeParams,
): () => void {
  const {
    nodes,
    edges,
    adjacency,
    nodeIndex,
    nodeBaseRgb,
    presetId,
    bootOriginNodeId,
    visualVariant,
    pathLens,
    circleRefs,
    lineMaskRefs,
    pathBaseRefs,
    pathPulseSlotRefs,
    edgeGroupRefs,
    runtimePresetRef,
  } = params;

  function currentPreset(): MyceliumGraphRuntimePreset {
    const live = runtimePresetRef?.current;
    if (live) return live;
    return (
      MYCELIUM_GRAPH_PRESETS[presetId] ?? MYCELIUM_GRAPH_PRESETS.sparseCorridors
    );
  }

  function walkerCap(): number {
    const mw = currentPreset().maxWalkers;
    return visualVariant === "hero" ? Math.min(6, mw + 4) : mw;
  }
  const rng = mulberry32(314159);
  const nCount = nodes.length;
  const eCount = edges.length;
  const nodeHeat = new Float32Array(nCount);
  const edgeHeat = new Float32Array(eCount);
  const edgeTravel = new Float32Array(eCount);
  const nodeFullUntil = new Float64Array(nCount);
  const edgeFullUntil = new Float64Array(eCount);

  const walkers: Walker[] = [];
  const mountT0 = performance.now();
  const simOffsetMs =
    visualVariant === "ambient" ? TIMELINE_FOLLOWER_OFFSET_MS : 0;
  const revealStep =
    visualVariant === "hero" ? REVEAL_STEP_HERO : REVEAL_STEP_AMBIENT;
  const revealPeakSettleMs =
    visualVariant === "hero" ? REVEAL_EASE_LEADER_MS : REVEAL_EASE_FOLLOWER_MS;
  const isLeader = visualVariant === "hero";

  let nextWaveAt = 900 + rng() * 2200;
  let burstRemaining = 0;
  let nextBurstSpawnAt = 0;
  let burstOriginId: string | null = null;
  let last = performance.now();
  let raf = 0;
  let didBootSpawn = false;

  const lastWakeAt = new Float64Array(nCount);
  /** -1 = uninitialized; then smoothed toward heat-based or idle opacity. */
  const nodeOpacitySmooth = new Float32Array(nCount);
  nodeOpacitySmooth.fill(-1);
  for (let i = 0; i < nCount; i++) {
    lastWakeAt[i] = 0;
  }

  const nodeLiftSmooth = new Float32Array(nCount);
  nodeLiftSmooth.fill(0);

  const edgeStrokeOpacitySmooth = new Float32Array(eCount);
  edgeStrokeOpacitySmooth.fill(-1);

  const nodeOutgoingReadyAt = new Float64Array(nCount);
  nodeOutgoingReadyAt.fill(-1);
  const nodeForwardBlockUntil = new Float64Array(nCount);
  nodeForwardBlockUntil.fill(-1);
  const nodeRevealTarget = new Float32Array(nCount);
  const nodeRevealDisp = new Float32Array(nCount);
  const nodeRAnimStart = new Float64Array(nCount);
  nodeRAnimStart.fill(-1);
  const nodeRAnimFrom = new Float32Array(nCount);
  const nodeRAnimTo = new Float32Array(nCount);
  const nodeRAnimDur = new Float32Array(nCount);
  const nodeRAnimEase = new Uint8Array(nCount);
  const nodeMidtraverseIntroDone = new Uint8Array(nCount);

  const edgeRevealTarget = new Float32Array(eCount);
  const edgeRevealDisp = new Float32Array(eCount);
  const edgeRAnimStart = new Float64Array(eCount);
  edgeRAnimStart.fill(-1);
  const edgeRAnimFrom = new Float32Array(eCount);
  const edgeRAnimTo = new Float32Array(eCount);
  const edgeRAnimDur = new Float32Array(eCount);
  const edgeRAnimEase = new Uint8Array(eCount);
  const edgeSeenWalker = new Uint8Array(eCount);

  const nodeRevealFloor = new Float32Array(nCount);
  const edgeRevealFloor = new Float32Array(eCount);
  /** Cumulative reveal boost from A→B pulse radiation (capped toward dim steady state). */
  const nodeRadiationReveal = new Float32Array(nCount);
  const edgeRadiationReveal = new Float32Array(eCount);

  const edgePulseTarget = new Int8Array(eCount);
  for (let ei = 0; ei < eCount; ei++) {
    edgePulseTarget[ei] = 1 + Math.floor(rng() * EDGE_PULSE_SLOTS);
  }
  const epActive = new Uint8Array(eCount * EDGE_PULSE_SLOTS);
  const epU = new Float32Array(eCount * EDGE_PULSE_SLOTS);
  const epSpeed = new Float32Array(eCount * EDGE_PULSE_SLOTS);
  const epSegFrac = new Float32Array(eCount * EDGE_PULSE_SLOTS);

  const corridorHoldUntil = new Float64Array(eCount);
  /** New pulse-slot spawns during post-walker corridor hold (see `maxCorridorPulseReplay`). */
  const edgeCorridorPulseReplayCount = new Int32Array(eCount);
  const edgeHeatAcc = new Float32Array(eCount);
  const nodeRecvAcc = new Float32Array(nCount);

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

  function startRevealAnim(
    animStart: Float64Array,
    animFrom: Float32Array,
    animTo: Float32Array,
    animDur: Float32Array,
    animEase: Uint8Array,
    disp: Float32Array,
    target: Float32Array,
    i: number,
    toVal: number,
    durMs: number,
    easeMode: 1 | 2,
    simT: number,
  ) {
    const clamped = clamp01(toVal);
    target[i] = clamped;
    animFrom[i] = disp[i] ?? 0;
    animTo[i] = clamped;
    animStart[i] = simT;
    animDur[i] = durMs;
    animEase[i] = easeMode;
  }

  function advanceRevealAnim(
    animStart: Float64Array,
    animFrom: Float32Array,
    animTo: Float32Array,
    animDur: Float32Array,
    animEase: Uint8Array,
    disp: Float32Array,
    target: Float32Array,
    count: number,
    simT: number,
  ) {
    for (let i = 0; i < count; i++) {
      const st = animStart[i] ?? -1;
      if (st < 0) {
        disp[i] = target[i] ?? 0;
        continue;
      }
      const dur = animDur[i] ?? revealPeakSettleMs;
      const u = dur > 1e-6 ? clamp01((simT - st) / dur) : 1;
      const easeFn = animEase[i] === 2 ? easeInCubic01 : easeInOutCubic01;
      const v =
        (animFrom[i] ?? 0) +
        ((animTo[i] ?? 0) - (animFrom[i] ?? 0)) * easeFn(u);
      if (u >= 1) {
        animStart[i] = -1;
        disp[i] = animTo[i] ?? 0;
      } else {
        disp[i] = v;
      }
    }
  }

  function revealCapNode(i: number, beatMult: number, wallNow: number): number {
    if (i < 0 || i >= nCount) return 0;
    const h = nodeHeat[i] ?? 0;
    const ob = heatToNodeOpacity(h, nodeFullUntil[i] ?? 0, wallNow);
    return clamp01(ob * beatMult);
  }

  function revealCapEdge(ei: number, beatW: number, wallNow: number): number {
    if (ei < 0 || ei >= eCount) return 0;
    const h = edgeHeat[ei] ?? 0;
    const baseEl = pathBaseRefs.current[ei];
    const baseOp = baseEl?.dataset.baseOpacity
      ? Number.parseFloat(baseEl.dataset.baseOpacity)
      : 0.72;
    const heated = heatToEdgeStrokeOpacity(
      baseOp,
      h * 0.68,
      edgeFullUntil[ei] ?? 0,
      wallNow,
    );
    const bodyOpRaw = Math.max(baseOp * 0.34, heated * 0.94);
    return clamp01(
      bodyOpRaw * (0.962 + currentPreset().beatStrokeOpacity * beatW),
    );
  }

  function nodeRevealPeakFor(
    i: number,
    beatMult: number,
    wallNow: number,
  ): number {
    const M = revealCapNode(i, beatMult, wallNow);
    return clamp01(M);
  }

  function edgeRevealPeakFor(
    ei: number,
    beatW: number,
    wallNow: number,
  ): number {
    const M = revealCapEdge(ei, beatW, wallNow);
    return clamp01(M);
  }

  function discoverNode(
    i: number | undefined,
    simT: number,
    beatMult: number,
    wallNow: number,
  ) {
    if (i === undefined || i < 0 || i >= nCount) return;
    if ((nodeOutgoingReadyAt[i] ?? -1) >= 0) return;
    nodeOutgoingReadyAt[i] = simT + NODE_OUTGOING_DELAY_MS;
    const peak = nodeRevealPeakFor(i, beatMult, wallNow);
    startRevealAnim(
      nodeRAnimStart,
      nodeRAnimFrom,
      nodeRAnimTo,
      nodeRAnimDur,
      nodeRAnimEase,
      nodeRevealDisp,
      nodeRevealTarget,
      i,
      peak,
      revealPeakSettleMs,
      1,
      simT,
    );
  }

  function beginNodePulseWave(
    i: number | undefined,
    simT: number,
    beatMult: number,
    wallNow: number,
  ) {
    if (i === undefined || i < 0 || i >= nCount) return;
    if ((nodeRevealFloor[i] ?? 0) >= 1 - 1e-4) return;
    const peak = nodeRevealPeakFor(i, beatMult, wallNow);
    const disp = nodeRevealDisp[i] ?? 0;
    if (peak <= disp + 1e-3) return;
    startRevealAnim(
      nodeRAnimStart,
      nodeRAnimFrom,
      nodeRAnimTo,
      nodeRAnimDur,
      nodeRAnimEase,
      nodeRevealDisp,
      nodeRevealTarget,
      i,
      peak,
      revealPeakSettleMs,
      1,
      simT,
    );
  }

  function settleNodeAfterTraverse(
    i: number | undefined,
    beatMult: number,
    simT: number,
    wallNow: number,
  ) {
    if (i === undefined || i < 0 || i >= nCount) return;
    const M = revealCapNode(i, beatMult, wallNow);
    const floor = nodeRevealFloor[i] ?? 0;
    const target = clamp01(Math.min(M, floor + revealStep));
    nodeRevealFloor[i] = target;
    startRevealAnim(
      nodeRAnimStart,
      nodeRAnimFrom,
      nodeRAnimTo,
      nodeRAnimDur,
      nodeRAnimEase,
      nodeRevealDisp,
      nodeRevealTarget,
      i,
      target,
      revealPeakSettleMs,
      1,
      simT,
    );
  }

  function edgePulseRiseOnTraverseStart(
    ei: number,
    simT: number,
    beatW: number,
    wallNow: number,
  ) {
    if (ei < 0 || ei >= eCount) return;
    if (!edgeSeenWalker[ei]) edgeSeenWalker[ei] = 1;
    const peak = edgeRevealPeakFor(ei, beatW, wallNow);
    startRevealAnim(
      edgeRAnimStart,
      edgeRAnimFrom,
      edgeRAnimTo,
      edgeRAnimDur,
      edgeRAnimEase,
      edgeRevealDisp,
      edgeRevealTarget,
      ei,
      peak,
      revealPeakSettleMs,
      1,
      simT,
    );
  }

  function settleEdgeAfterTraverse(
    ei: number,
    simT: number,
    beatW: number,
    wallNow: number,
  ) {
    if (ei < 0 || ei >= eCount) return;
    const M = revealCapEdge(ei, beatW, wallNow);
    const floor = edgeRevealFloor[ei] ?? 0;
    const target = clamp01(Math.min(M, floor + revealStep));
    edgeRevealFloor[ei] = target;
    startRevealAnim(
      edgeRAnimStart,
      edgeRAnimFrom,
      edgeRAnimTo,
      edgeRAnimDur,
      edgeRAnimEase,
      edgeRevealDisp,
      edgeRevealTarget,
      ei,
      target,
      revealPeakSettleMs,
      1,
      simT,
    );
  }

  function onMidtraverseHalf(
    toI: number | undefined,
    simT: number,
    beatMult: number,
    wallNow: number,
  ) {
    if (toI === undefined || toI < 0 || toI >= nCount) return;
    if (nodeMidtraverseIntroDone[toI]) return;
    nodeMidtraverseIntroDone[toI] = 1;
    nodeForwardBlockUntil[toI] = simT + NODE_OUTGOING_DELAY_MS;
    if ((nodeOutgoingReadyAt[toI] ?? -1) < 0) {
      nodeOutgoingReadyAt[toI] = simT + NODE_OUTGOING_DELAY_MS;
    }
    if ((nodeRevealDisp[toI] ?? 0) < revealStep * 0.55 + 1e-4) {
      const peak = nodeRevealPeakFor(toI, beatMult, wallNow);
      startRevealAnim(
        nodeRAnimStart,
        nodeRAnimFrom,
        nodeRAnimTo,
        nodeRAnimDur,
        nodeRAnimEase,
        nodeRevealDisp,
        nodeRevealTarget,
        toI,
        peak,
        revealPeakSettleMs,
        1,
        simT,
      );
    }
  }

  function spawnWalker(
    now: number,
    simT: number,
    startOverride: string | null,
    beatMult: number,
  ) {
    if (walkers.length >= walkerCap()) return;
    const start =
      startOverride ?? nodes[Math.floor(rng() * nodes.length)]?.id ?? undefined;
    if (!start) return;
    const energy = 0.45 + rng() * 0.52;
    const startIdx = nodeIndex.get(start);
    discoverNode(startIdx, simT, beatMult, now);
    walkers.push({
      phase: "riseNode",
      timer: 0,
      atNode: start,
      edgeIdx: -1,
      toNode: "",
      riseMs: isLeader ? 48 + rng() * 52 : 140 + rng() * 120,
      traverseMs: 0,
      energy,
      traverseCurvePow: 0.9,
      traversePeak: 0.4,
      announcedMidtraverse: false,
    });
    addNodeHeat(
      startIdx,
      (isLeader ? 0.44 : 0.2) + rng() * (isLeader ? 0.18 : 0.16),
      now,
    );
  }

  function pickNextEdge(
    fromId: string,
    energy: number,
    simT: number,
  ): MyceliumSimAdjEntry | null {
    const fromIdx = nodeIndex.get(fromId);
    if (fromIdx !== undefined) {
      const ready = nodeOutgoingReadyAt[fromIdx] ?? -1;
      if (ready >= 0 && simT < ready) return null;
      const fwd = nodeForwardBlockUntil[fromIdx] ?? -1;
      if (fwd >= 0 && simT < fwd) return null;
    }
    const outs = adjacency.get(fromId);
    if (!outs?.length) return null;
    const shuffled = [...outs].sort(() => rng() - 0.5);
    const skipThresh = isLeader ? 0.05 + energy * 0.09 : 0.34 + energy * 0.22;
    for (const cand of shuffled) {
      if (rng() > skipThresh) continue;
      return cand;
    }
    if (rng() < (isLeader ? 0.94 : 0.42)) {
      const first = shuffled[0];
      return first ?? null;
    }
    return null;
  }

  function applyPulseRadiationFromAToB(fromI: number, toI: number) {
    if (fromI < 0 || fromI >= nCount || toI < 0 || toI >= nCount) return;
    if (fromI === toI) return;
    const na = nodes[fromI];
    const nb = nodes[toI];
    if (!na || !nb) return;
    const ax = na.x;
    const ay = na.y;
    const bx = nb.x;
    const by = nb.y;

    const ranked: { i: number; d2: number }[] = [];
    for (let i = 0; i < nCount; i++) {
      const nd = nodes[i];
      if (!nd) continue;
      ranked.push({
        i,
        d2: distPointToSegmentSq(nd.x, nd.y, ax, ay, bx, by),
      });
    }
    ranked.sort((a, b) => a.d2 - b.d2);
    const nR = ranked.length;
    if (nR === 0) return;

    const kClose = Math.min(
      nR,
      Math.max(1, Math.round(nR * RADIATION_CLOSE_FRAC)),
    );
    const kFar = Math.min(
      Math.max(0, nR - kClose),
      Math.max(0, Math.round(nR * RADIATION_FAR_FRAC)),
    );

    const nodeDelta = new Float32Array(nCount);
    for (let rank = 0; rank < nR; rank++) {
      const row = ranked[rank];
      if (!row) continue;
      const { i } = row;
      const tier =
        rank < kClose
          ? RADIATION_CLOSE_DELTA
          : kFar > 0 && rank >= nR - kFar
            ? RADIATION_FAR_DELTA
            : RADIATION_MID_DELTA;
      const cur = nodeRadiationReveal[i] ?? 0;
      if (cur >= NODE_RADIATION_REVEAL_CAP - 1e-8) continue;
      const add = Math.min(tier, NODE_RADIATION_REVEAL_CAP - cur);
      if (add > 0) {
        nodeRadiationReveal[i] = cur + add;
        nodeDelta[i] = add;
      }
    }

    for (let ei = 0; ei < eCount; ei++) {
      const e = edges[ei];
      if (!e) continue;
      const u = nodeIndex.get(e.from);
      const v = nodeIndex.get(e.to);
      if (u === undefined || v === undefined) continue;
      const da = nodeDelta[u] ?? 0;
      const db = nodeDelta[v] ?? 0;
      const avg = (da + db) * 0.5;
      if (avg <= 0) continue;
      const curE = edgeRadiationReveal[ei] ?? 0;
      if (curE >= EDGE_RADIATION_REVEAL_CAP - 1e-8) continue;
      const addE = Math.min(avg, EDGE_RADIATION_REVEAL_CAP - curE);
      edgeRadiationReveal[ei] = curE + addE;
    }
  }

  function tick(now: number) {
    const simT = Math.max(0, now - mountT0 - simOffsetMs);
    const dt = Math.min(48, now - last);
    last = now;
    const beatWave =
      0.5 +
      0.5 *
        Math.sin(
          ((now % GLOBAL_BEAT_PERIOD_MS) / GLOBAL_BEAT_PERIOD_MS) * Math.PI * 2,
        );
    const beatPulse = 0.972 + currentPreset().beatNodeOpacity * beatWave;

    if (!didBootSpawn && simT >= 0) {
      didBootSpawn = true;
      spawnWalker(now, simT, bootOriginNodeId, beatPulse);
    }

    for (let i = 0; i < nCount; i++) {
      nodeHeat[i] = (nodeHeat[i] ?? 0) * nodeDecay;
    }
    for (let i = 0; i < eCount; i++) {
      edgeHeat[i] = (edgeHeat[i] ?? 0) * edgeDecay;
      edgeTravel[i] = 0;
    }

    if (currentPreset().bundleEdgeHeatPerTick) {
      edgeHeatAcc.fill(0);
      nodeRecvAcc.fill(0);
    }

    if (burstRemaining <= 0 && simT >= nextWaveAt) {
      burstRemaining = 1 + Math.floor(rng() * 12);
      const origin = nodes[Math.floor(rng() * nodes.length)]?.id ?? null;
      burstOriginId = origin;
      nextWaveAt =
        simT +
        SPAWN_WAVE_MIN_MS +
        rng() * (SPAWN_WAVE_MAX_MS - SPAWN_WAVE_MIN_MS);
      nextBurstSpawnAt = simT;
    }

    if (
      burstRemaining > 0 &&
      simT >= nextBurstSpawnAt &&
      walkers.length < walkerCap()
    ) {
      spawnWalker(now, simT, burstOriginId, beatPulse);
      burstRemaining -= 1;
      nextBurstSpawnAt =
        simT +
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
          const fromIdx = nodeIndex.get(walker.atNode);
          if (fromIdx !== undefined) {
            const ready = nodeOutgoingReadyAt[fromIdx] ?? -1;
            if (ready >= 0 && simT < ready) {
              continue;
            }
          }
          const next = pickNextEdge(walker.atNode, walker.energy, simT);
          if (!next) {
            const outs = adjacency.get(walker.atNode);
            if (!outs?.length) {
              walkers.splice(w, 1);
              continue;
            }
            const fi = nodeIndex.get(walker.atNode);
            const blocked =
              fi !== undefined &&
              (((nodeOutgoingReadyAt[fi] ?? -1) >= 0 &&
                simT < (nodeOutgoingReadyAt[fi] ?? 0)) ||
                ((nodeForwardBlockUntil[fi] ?? -1) >= 0 &&
                  simT < (nodeForwardBlockUntil[fi] ?? 0)));
            if (blocked) {
              continue;
            }
            walkers.splice(w, 1);
            continue;
          }
          const fromI = nodeIndex.get(walker.atNode);
          addNodeHeat(fromI, walker.energy * (0.09 + rng() * 0.1), now);
          edgePulseRiseOnTraverseStart(next.edgeIdx, simT, beatWave, now);
          walker.phase = "traverseEdge";
          walker.timer = 0;
          walker.edgeIdx = next.edgeIdx;
          walker.toNode = next.to;
          walker.traverseMs = isLeader ? 165 + rng() * 155 : 380 + rng() * 420;
          const prHop = currentPreset();
          const skipDiminish =
            rng() < clamp01(prHop.pulseStabilityLongevity / 100);
          if (!skipDiminish) {
            const dpr = clamp01(prHop.diminishingPulseRate / 100);
            const rawMult = 0.55 + rng() * 0.38;
            const mult = 1 + (rawMult - 1) * dpr;
            walker.energy *= mult;
          }
          walker.traverseCurvePow = 0.78 + rng() * 0.22;
          walker.traversePeak = 0.22 + rng() * 0.28;
          walker.announcedMidtraverse = false;
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
            walker.energy * walker.traversePeak * Math.sin(Math.PI * u ** pow);
          const heatAdd = envelope * 0.24;
          if (currentPreset().bundleEdgeHeatPerTick) {
            edgeHeatAcc[ei] = Math.max(edgeHeatAcc[ei] ?? 0, heatAdd);
          } else {
            edgeHeat[ei] = Math.min(9, (edgeHeat[ei] ?? 0) + heatAdd);
          }
          edgeTravel[ei] = Math.max(edgeTravel[ei] ?? 0, u);

          if (currentPreset().corridorHoldMs > 0) {
            corridorHoldUntil[ei] = now + currentPreset().corridorHoldMs;
          }

          if (!walker.announcedMidtraverse && u >= 0.5) {
            walker.announcedMidtraverse = true;
            onMidtraverseHalf(toI, simT, beatPulse, now);
          }

          if (toI !== undefined) {
            const pre = clamp01((u - 0.28) / 0.72);
            const recv = walker.energy * smoothstep01(pre) * (dt / 17) * 0.1;
            if (currentPreset().bundleEdgeHeatPerTick) {
              nodeRecvAcc[toI] = Math.max(nodeRecvAcc[toI] ?? 0, recv);
            } else {
              nodeHeat[toI] = Math.min(9, (nodeHeat[toI] ?? 0) + recv);
            }
          }
        }

        if (walker.timer >= walker.traverseMs) {
          if (walker.energy > 0.14 && rng() < 0.72) {
            const fromIdxDone = nodeIndex.get(walker.atNode);
            const arrived = nodeIndex.get(walker.toNode);
            addNodeHeat(arrived, walker.energy * (0.14 + rng() * 0.14), now);
            const doneEdge = walker.edgeIdx;
            settleNodeAfterTraverse(fromIdxDone, beatPulse, simT, now);
            if (doneEdge >= 0 && doneEdge < eCount) {
              settleEdgeAfterTraverse(doneEdge, simT, beatWave, now);
            }
            const wasNew =
              arrived !== undefined && (nodeOutgoingReadyAt[arrived] ?? -1) < 0;
            discoverNode(arrived, simT, beatPulse, now);
            if (arrived !== undefined && !wasNew) {
              beginNodePulseWave(arrived, simT, beatPulse, now);
            }
            if (
              fromIdxDone !== undefined &&
              arrived !== undefined &&
              fromIdxDone >= 0 &&
              arrived >= 0
            ) {
              applyPulseRadiationFromAToB(fromIdxDone, arrived);
            }
            walker.phase = "riseNode";
            walker.timer = 0;
            walker.atNode = walker.toNode;
            walker.edgeIdx = -1;
            walker.toNode = "";
            walker.riseMs = isLeader ? 38 + rng() * 52 : 120 + rng() * 140;
          } else {
            walkers.splice(w, 1);
          }
        }
      }
    }

    if (currentPreset().bundleEdgeHeatPerTick) {
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
      if (w.phase === "traverseEdge" && w.edgeIdx >= 0 && w.edgeIdx < eCount) {
        activeWalkerEdgeSet.add(w.edgeIdx);
      }
    }

    const pulseSlotsRestricted =
      currentPreset().pulseSlotsCorridorOnly ||
      currentPreset().gatePulseSlotsToWalkerOrHold;

    if (pulseSlotsRestricted && currentPreset().maxCorridorPulseReplay >= 0) {
      for (const ei of activeWalkerEdgeSet) {
        if (ei >= 0 && ei < eCount) {
          edgeCorridorPulseReplayCount[ei] = 0;
        }
      }
    }

    const edgeInCorridor = (ei: number) => {
      if (!pulseSlotsRestricted) return true;
      return (
        activeWalkerEdgeSet.has(ei) ||
        (currentPreset().corridorHoldMs > 0 &&
          now < (corridorHoldUntil[ei] ?? 0))
      );
    };

    for (let ei = 0; ei < eCount; ei++) {
      if (currentPreset().wakeFromCorridorEdgesOnly && !edgeInCorridor(ei))
        continue;
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
      if (pulseSlotsRestricted && !edgeInCorridor(ei)) {
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
      const onWalkerEdge = activeWalkerEdgeSet.has(ei);
      const inCorridorHold =
        currentPreset().corridorHoldMs > 0 &&
        now < (corridorHoldUntil[ei] ?? 0);
      const holdOnlyReplay =
        pulseSlotsRestricted && !onWalkerEdge && inCorridorHold;
      const holdSpawnBoost =
        holdOnlyReplay && currentPreset().corridorHoldPulseSpawnBoost > 1
          ? currentPreset().corridorHoldPulseSpawnBoost
          : 1;
      const spawnP =
        (currentPreset().pulseSpawnCoeff0 +
          currentPreset().pulseSpawnCoeffHeat * heatDrive +
          currentPreset().pulseSpawnCoeffFill * (target - activeC)) *
        dt *
        holdSpawnBoost;
      const holdReplayPhase =
        pulseSlotsRestricted &&
        currentPreset().maxCorridorPulseReplay >= 0 &&
        !onWalkerEdge &&
        inCorridorHold;
      const spawnBlockedByReplayCap =
        holdReplayPhase &&
        (edgeCorridorPulseReplayCount[ei] ?? 0) >=
          currentPreset().maxCorridorPulseReplay;
      if (activeC < target && !spawnBlockedByReplayCap && rng() < spawnP) {
        for (let k = 0; k < EDGE_PULSE_SLOTS; k++) {
          const ix = base + k;
          if (!epActive[ix]) {
            epActive[ix] = 1;
            epU[ix] = rng();
            epSpeed[ix] = 0.00009 + rng() * 0.00135;
            epSegFrac[ix] = 0.015 + rng() * 0.1;
            if (holdReplayPhase) {
              edgeCorridorPulseReplayCount[ei] =
                (edgeCorridorPulseReplayCount[ei] ?? 0) + 1;
            }
            break;
          }
        }
      }
      if (rng() < currentPreset().pulseRetargetBase * dt) {
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

    advanceRevealAnim(
      nodeRAnimStart,
      nodeRAnimFrom,
      nodeRAnimTo,
      nodeRAnimDur,
      nodeRAnimEase,
      nodeRevealDisp,
      nodeRevealTarget,
      nCount,
      simT,
    );
    advanceRevealAnim(
      edgeRAnimStart,
      edgeRAnimFrom,
      edgeRAnimTo,
      edgeRAnimDur,
      edgeRAnimEase,
      edgeRevealDisp,
      edgeRevealTarget,
      eCount,
      simT,
    );

    for (let i = 0; i < nCount; i++) {
      const el = circleRefs.current[i];
      const maskEl = lineMaskRefs.current[i];
      const nd = nodes[i];
      if (!nd) continue;
      if (!el && !maskEl) continue;
      const h = nodeHeat[i] ?? 0;
      const rgbBase = nodeBaseRgb[i];
      const nPulse = pulseAtNode[i] ?? 0;
      const targetLift = Math.min(0.15, nPulse * 0.037);
      const curLift = nodeLiftSmooth[i] ?? 0;
      const liftAlpha = liftEaseAlpha(dt);
      nodeLiftSmooth[i] = curLift + (targetLift - curLift) * liftAlpha;
      const fillLift = nodeLiftSmooth[i] ?? 0;
      if (rgbBase && el) {
        el.setAttribute("fill", mixTowardWhite(rgbBase, fillLift));
      }
      const opacityBase = heatToNodeOpacity(h, nodeFullUntil[i] ?? 0, now);
      const opacityHiRaw = clamp01(opacityBase * beatPulse);
      const wakeT = lastWakeAt[i] ?? 0;
      const inPulseGrace =
        (pulseAtNode[i] ?? 0) > 0 ||
        (wakeT > 0 && now - wakeT <= IDLE_DIM_GRACE_MS);
      const opacityHi = inPulseGrace
        ? Math.max(opacityHiRaw, 0.55)
        : opacityHiRaw;
      const opacityTarget = inPulseGrace ? opacityHi : NODE_IDLE_OPACITY_TARGET;
      let curOp = nodeOpacitySmooth[i] ?? -1;
      if (curOp < 0) curOp = opacityTarget;
      else {
        const oAlpha = opacityEase15(dt);
        curOp = curOp + (opacityTarget - curOp) * oAlpha;
      }
      nodeOpacitySmooth[i] = curOp;
      // Reveal multiplier is for settled "mesh" dimming; during pulse/grace it
      // must not multiply heat opacity (curOp * reveal was never reaching 1).
      const revealMul = inPulseGrace
        ? 1
        : clamp01((nodeRevealDisp[i] ?? 0) + (nodeRadiationReveal[i] ?? 0));
      const opacityComb = inPulseGrace ? Math.max(curOp, opacityHi) : curOp;
      const opacity = clamp01(opacityComb * revealMul);
      const scale =
        0.94 +
        ((opacityBase - NODE_OPACITY_MIN) / (1 - NODE_OPACITY_MIN)) * 0.1;
      const opStr = String(opacity);
      if (el) {
        el.setAttribute("opacity", opStr);
        el.setAttribute(
          "transform",
          `translate(${nd.x} ${nd.y}) scale(${scale}) translate(${-nd.x} ${-nd.y})`,
        );
      }
      if (maskEl) {
        maskEl.setAttribute("opacity", opStr);
      }
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

      const heated = heatToEdgeStrokeOpacity(baseOp, h * 0.68, fullUntil, now);
      const bodyFloor = baseOp * 0.34;
      const bodyOpRaw = Math.max(bodyFloor, heated * 0.94);
      const bodyOpLit = clamp01(
        bodyOpRaw * (0.962 + currentPreset().beatStrokeOpacity * beatWave),
      );
      const edgeHasSignal = h > 0.036 || t > 0.012;
      const bodyTarget = edgeHasSignal ? bodyOpLit : EDGE_IDLE_OPACITY_TARGET;
      let curEb = edgeStrokeOpacitySmooth[ei] ?? -1;
      if (curEb < 0) curEb = bodyTarget;
      else {
        curEb = curEb + (bodyTarget - curEb) * opacityEase15(dt);
      }
      edgeStrokeOpacitySmooth[ei] = curEb;
      const edgeRevealMul = clamp01(
        (edgeRevealDisp[ei] ?? 0) + (edgeRadiationReveal[ei] ?? 0),
      );
      const edgeWalkerOn = activeWalkerEdgeSet.has(ei);
      const edgePulseBright = edgeWalkerOn || edgeHasSignal;
      const edgeGrpOp = edgePulseBright ? 1 : edgeRevealMul;
      const bodyOp = clamp01(
        edgePulseBright ? Math.max(curEb, bodyOpLit) : curEb,
      );
      if (baseEl) {
        baseEl.setAttribute("stroke-opacity", String(bodyOp));
      }
      const edgeGrp = edgeGroupRefs.current[ei];
      if (edgeGrp) {
        edgeGrp.setAttribute("opacity", String(edgeGrpOp));
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
              pulseOp *
                (0.97 + currentPreset().beatPulseSlotOpacity * beatWave),
            ),
          ),
        );
      }
    }

    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export type UseMyceliumSimParams = CreateMyceliumSimRuntimeParams & {
  reduceMotion: boolean | null;
};

export function useMyceliumSim(params: UseMyceliumSimParams): void {
  const {
    reduceMotion,
    nodes,
    edges,
    adjacency,
    nodeIndex,
    nodeBaseRgb,
    presetId,
    bootOriginNodeId,
    visualVariant,
    pathLens,
    circleRefs,
    lineMaskRefs,
    pathBaseRefs,
    pathPulseSlotRefs,
    edgeGroupRefs,
    runtimePresetRef,
  } = params;

  useEffect(() => {
    if (reduceMotion) return;
    return createMyceliumSimRuntime({
      nodes,
      edges,
      adjacency,
      nodeIndex,
      nodeBaseRgb,
      presetId,
      bootOriginNodeId,
      visualVariant,
      pathLens,
      circleRefs,
      lineMaskRefs,
      pathBaseRefs,
      pathPulseSlotRefs,
      edgeGroupRefs,
      runtimePresetRef,
    });
  }, [
    reduceMotion,
    nodes,
    edges,
    adjacency,
    nodeIndex,
    nodeBaseRgb,
    presetId,
    bootOriginNodeId,
    visualVariant,
    pathLens,
    circleRefs,
    lineMaskRefs,
    pathBaseRefs,
    pathPulseSlotRefs,
    edgeGroupRefs,
    runtimePresetRef,
  ]);
}
