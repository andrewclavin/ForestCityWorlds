"use client";

import { useReducedMotion } from "framer-motion";
import type { RefObject } from "react";
import { useId, useLayoutEffect, useMemo, useRef } from "react";

import type {
  MyceliumGraphPresetId,
  MyceliumGraphRuntimePreset,
} from "./myceliumGraphPresets";
import {
  EDGE_PULSE_SLOTS,
  type MyceliumSimAdjEntry,
  mulberry32,
  useMyceliumSim,
} from "./myceliumSimEngine";

type Node = { id: string; x: number; y: number };
type Edge = { from: string; to: string };

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

/** Parse `rgb(r g b)` from node/edge fill strings. */
function parseRgbCss(s: string): { r: number; g: number; b: number } | null {
  const m = s.match(/rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\)/i);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
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

/** Node circle radius (viewBox units). */
const NODE_CIRCLE_R = 1.05;
/** Edge stroke width on the `<g>` that draws links. */
const MYCE_EDGE_STROKE_W = 0.52;
/** Opaque disk behind each node so edge strokes can meet centers without visible overlap. */
const NODE_LINE_MASK_R = NODE_CIRCLE_R + MYCE_EDGE_STROKE_W * 0.55 + 0.11;

export type MyceliumGraphProps = {
  className?: string;
  "aria-hidden"?: boolean;
  /** Opaque fill behind node markers; match page background (e.g. forest deep). */
  nodeLineMaskFill?: string;
  /**
   * Named preset used when {@link runtimePresetRef} is unset or its `current` is null.
   * @see {@link MYCELIUM_GRAPH_PRESETS} in `myceliumGraphPresets.ts`.
   */
  preset?: MyceliumGraphPresetId;
  /**
   * Live tunables: when set, the simulation reads from this ref every frame (`ref.current` should
   * point at the latest {@link MyceliumGraphRuntimePreset}, e.g. assign each render from state).
   */
  runtimePresetRef?: RefObject<MyceliumGraphRuntimePreset | null>;
  /**
   * SVG `preserveAspectRatio`. Default `slice` fills ambient hero crops; use `meet`
   * in tight frames so the full graph stays in view without top/bottom clipping.
   */
  preserveAspectRatio?: string;
  /**
   * Paired layouts: `hero` (inset / “small” graph) runs first with faster reveal + propagation;
   * `ambient` (full-bleed background) delays simulation relative to the leader instance.
   */
  visualVariant?: "ambient" | "hero";
};

export function MyceliumGraph({
  className,
  "aria-hidden": ariaHidden = true,
  nodeLineMaskFill = "#0f2a1f",
  preset: presetId = "sparseCorridors",
  preserveAspectRatio = "xMidYMid slice",
  visualVariant = "ambient",
  runtimePresetRef,
}: MyceliumGraphProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const { nodes, edges } = useMemo(() => proceduralGraph(42, 18), []);

  const bootOriginNodeId = useMemo(() => {
    const pick = mulberry32(4242);
    const idx = Math.floor(pick() * nodes.length);
    return nodes[idx]?.id ?? nodes[0]?.id ?? "n0";
  }, [nodes]);

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
    const m = new Map<string, MyceliumSimAdjEntry[]>();
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
  /** Opaque caps behind strokes at each node — must track node opacity or every vertex reads as a dot. */
  const lineMaskRefs = useRef<(SVGCircleElement | null)[]>([]);
  /** Full-length edge (always drawn); pulse layer uses traveling dash on top. */
  const pathBaseRefs = useRef<(SVGPathElement | null)[]>([]);
  const pathPulseSlotRefs = useRef<(SVGPathElement | null)[]>([]);
  /** One `<g>` per edge — opacity gates base + pulse paths together (avoids hairlines at stroke-opacity 0). */
  const edgeGroupRefs = useRef<(SVGGElement | null)[]>([]);
  const pathLens = useRef<number[]>([]);

  useLayoutEffect(() => {
    const lens: number[] = [];
    for (let i = 0; i < edges.length; i++) {
      const el = pathBaseRefs.current[i];
      lens[i] = el?.getTotalLength() ?? 0;
    }
    pathLens.current = lens;
  }, [edges]);

  /** Before first paint / rAF, force the mesh fully invisible (React `strokeOpacity={0}` is not always enough). */
  useLayoutEffect(() => {
    if (reduceMotion) return;
    for (let i = 0; i < edges.length; i++) {
      edgeGroupRefs.current[i]?.setAttribute("opacity", "0");
      pathBaseRefs.current[i]?.setAttribute("stroke-opacity", "0");
    }
    for (let ix = 0; ix < edges.length * EDGE_PULSE_SLOTS; ix++) {
      pathPulseSlotRefs.current[ix]?.removeAttribute("stroke-dasharray");
      pathPulseSlotRefs.current[ix]?.removeAttribute("stroke-dashoffset");
      pathPulseSlotRefs.current[ix]?.setAttribute("stroke-opacity", "0");
    }
    for (let i = 0; i < nodes.length; i++) {
      circleRefs.current[i]?.setAttribute("opacity", "0");
      lineMaskRefs.current[i]?.setAttribute("opacity", "0");
    }
  }, [edges, nodes.length, reduceMotion]);

  useMyceliumSim({
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
  });

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
            <g
              key={`${e.from}-${e.to}-${i}`}
              ref={(el) => {
                edgeGroupRefs.current[i] = el;
              }}
              opacity={0}
            >
              <path
                ref={(el) => {
                  pathBaseRefs.current[i] = el;
                }}
                d={d}
                stroke={stroke}
                data-base-opacity={opData}
                strokeOpacity={0}
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
          {nodes.map((n, i) => (
            <circle
              key={`line-mask-${n.id}`}
              ref={(el) => {
                lineMaskRefs.current[i] = el;
              }}
              cx={n.x}
              cy={n.y}
              r={NODE_LINE_MASK_R}
              fill={nodeLineMaskFill}
              opacity={0}
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
              opacity={0}
            />
          );
        })}
      </g>
    </svg>
  );
}
