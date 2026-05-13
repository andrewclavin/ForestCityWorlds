"use client";

import { useMemo } from "react";

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

function edgePathQuadratic(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  pathSeed: number,
): string {
  const rng = mulberry32(pathSeed);
  const mx = (ax + bx) * 0.5;
  const my = (ay + by) * 0.5;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const bulge = (rng() - 0.5) * len * (0.12 + rng() * 0.14);
  const cx = mx + px * bulge;
  const cy = my + py * bulge;
  return `M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
}

type CNode = { id: string; x: number; y: number; r: number; layer: number };

type CEdge = { from: string; to: string; pathSeed: number };

const LAYER_COUNT = 5;
const NODE_COUNT_BOTTOM = 28;
const RADIUS_BOTTOM = 0.34;
const RADIUS_TOP = RADIUS_BOTTOM * 2;
const X_MARGIN = 5;
const Y_BOTTOM = 86;
const Y_TOP = 14;
/** Inset core radius as fraction of outer radius. */
const CORE_R_FRAC = 0.54;

/** Forest deep `#0f2a1f` — core fill hides edge crossings under nodes. */
const DEFAULT_CORE_FILL = "rgb(15 42 31)";
/** Halfway between prior grey `rgb(27 33 31)` and forest deep — greener body ring. */
const NODE_OUTER_FILL = "rgb(21 38 31)";
const EDGE_STROKE = "rgb(21 38 31)";
const EDGE_STROKE_OPACITY = 0.55;
const EDGE_STROKE_W = 0.14;

function hashEdgeSeed(a: string, b: string): number {
  let h = 2166136261;
  const s = a < b ? `${a}|${b}` : `${b}|${a}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i) ?? 0;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildCorticalColumn(seed: number): { nodes: CNode[]; edges: CEdge[] } {
  const rng = mulberry32(seed);
  const nodes: CNode[] = [];
  const layers: CNode[][] = [];
  const usable = 100 - 2 * X_MARGIN;
  const minGap = 0.55;

  for (let l = 0; l < LAYER_COUNT; l++) {
    const count = Math.max(4, Math.round(NODE_COUNT_BOTTOM * 0.9 ** l));
    const t = LAYER_COUNT <= 1 ? 0 : l / (LAYER_COUNT - 1);
    const r = RADIUS_BOTTOM + (RADIUS_TOP - RADIUS_BOTTOM) * t;
    const yBase = Y_BOTTOM + (Y_TOP - Y_BOTTOM) * t;
    const layerNodes: CNode[] = [];

    const rawX: number[] = [];
    for (let i = 0; i < count; i++) {
      rawX.push(X_MARGIN + rng() * usable);
    }
    rawX.sort((p, q) => p - q);
    for (let i = 1; i < rawX.length; i++) {
      const cur = rawX[i];
      const prev = rawX[i - 1];
      if (cur === undefined || prev === undefined) continue;
      const g = cur - prev;
      if (g < minGap) {
        rawX[i] = prev + minGap;
      }
    }
    for (let i = rawX.length - 2; i >= 0; i--) {
      const cur = rawX[i];
      const next = rawX[i + 1];
      if (cur === undefined || next === undefined) continue;
      const g = next - cur;
      if (g < minGap) {
        rawX[i] = next - minGap;
      }
    }
    for (let i = 0; i < count; i++) {
      let x = rawX[i] ?? X_MARGIN + usable * 0.5;
      x = Math.max(X_MARGIN + r, Math.min(100 - X_MARGIN - r, x));
      const yJ = (rng() - 0.5) * (8.5 + rng() * 5);
      const y = Math.max(Y_TOP + r, Math.min(Y_BOTTOM - r, yBase + yJ));
      const id = `L${l}-N${i}`;
      const node: CNode = { id, x, y, r, layer: l };
      layerNodes.push(node);
      nodes.push(node);
    }
    layers.push(layerNodes);
  }

  const structuredCount = nodes.length;
  const floatCount = Math.max(1, Math.round(structuredCount * 0.1));
  for (let f = 0; f < floatCount; f++) {
    const r =
      RADIUS_BOTTOM +
      (RADIUS_TOP - RADIUS_BOTTOM) * rng() * (0.35 + rng() * 0.55);
    const x = Math.max(
      X_MARGIN + r,
      Math.min(100 - X_MARGIN - r, X_MARGIN + rng() * usable),
    );
    const y = Math.max(
      Y_TOP + r,
      Math.min(Y_BOTTOM - r, Y_TOP + rng() * (Y_BOTTOM - Y_TOP)),
    );
    const id = `F${f}`;
    nodes.push({ id, x, y, r, layer: -1 });
  }

  const seen = new Set<string>();
  const edges: CEdge[] = [];

  for (let l = 0; l < LAYER_COUNT - 1; l++) {
    const lower = layers[l];
    const upper = layers[l + 1];
    if (!lower?.length || !upper?.length) continue;

    for (const a of lower) {
      const ranked = [...upper].sort(
        (p, q) => Math.abs(p.x - a.x) - Math.abs(q.x - a.x),
      );
      const k = rng() < 0.38 ? 3 : 2;
      for (let j = 0; j < Math.min(k, ranked.length); j++) {
        const b = ranked[j];
        if (!b) continue;
        const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({
          from: a.id,
          to: b.id,
          pathSeed: hashEdgeSeed(a.id, b.id),
        });
      }
    }
  }

  const structured = nodes.filter((n) => n.layer >= 0);
  const floaters = nodes.filter((n) => n.layer < 0);
  for (const f of floaters) {
    const ranked = [...structured].sort(
      (p, q) =>
        Math.hypot(p.x - f.x, p.y - f.y) - Math.hypot(q.x - f.x, q.y - f.y),
    );
    const nLinks = 1 + (rng() < 0.45 ? 1 : 0);
    for (let j = 0; j < Math.min(nLinks, ranked.length); j++) {
      const t = ranked[j];
      if (!t) continue;
      const key = f.id < t.id ? `${f.id}|${t.id}` : `${t.id}|${f.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        from: f.id,
        to: t.id,
        pathSeed: hashEdgeSeed(f.id, t.id),
      });
    }
  }

  return { nodes, edges };
}

export type CorticalGraphProps = {
  className?: string;
  "aria-hidden"?: boolean;
  /** Inset disc fill — match page background so edges do not read through nodes. */
  coreFill?: string;
};

export function CorticalGraph({
  className,
  "aria-hidden": ariaHidden = true,
  coreFill = DEFAULT_CORE_FILL,
}: CorticalGraphProps) {
  const { nodes, edges, nodeById } = useMemo(() => {
    const built = buildCorticalColumn(224_011);
    const m = new Map<string, CNode>();
    for (const n of built.nodes) m.set(n.id, n);
    return { nodes: built.nodes, edges: built.edges, nodeById: m };
  }, []);

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden={ariaHidden}
      role={ariaHidden ? undefined : "img"}
    >
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={EDGE_STROKE}
      >
        {edges.map((e, i) => {
          const a = nodeById.get(e.from);
          const b = nodeById.get(e.to);
          if (!a || !b) return null;
          const d = edgePathQuadratic(a.x, a.y, b.x, b.y, e.pathSeed);
          return (
            <path
              key={`${e.from}-${e.to}-${i}`}
              d={d}
              fill="none"
              strokeWidth={EDGE_STROKE_W}
              strokeOpacity={EDGE_STROKE_OPACITY}
            />
          );
        })}
      </g>
      <g>
        {nodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={n.r} fill={NODE_OUTER_FILL} />
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r * CORE_R_FRAC}
              fill={coreFill}
              stroke="none"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
