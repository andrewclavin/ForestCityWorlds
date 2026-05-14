/**
 * Tunable “modes” for {@link MyceliumGraph}. Use `fullNetworkRhythm` to restore the
 * previous look (pulse slots on every edge, stronger global beat, wakes from any warm edge).
 * Default in the component is `sparseCorridors`: only 1–2 active links at a time for calmer hero use.
 */
export type MyceliumGraphRuntimePreset = {
  readonly id: string;
  readonly description: string;
  /** Max simultaneous walkers (signals). */
  readonly maxWalkers: number;
  /**
   * When true, multi-slot dash pulses only simulate on edges that currently have a walker
   * traversing them, or still within `corridorHoldMs` after the walker left.
   */
  readonly pulseSlotsCorridorOnly: boolean;
  /**
   * When true (and {@link corridorHoldMs} &gt; 0), pulse slots use the same **walker or hold**
   * window as `pulseSlotsCorridorOnly`, but you can keep {@link pulseSlotsCorridorOnly} false so
   * spawn coefficients stay “full mesh” on those active edges. Off-corridor edges clear their slots.
   */
  readonly gatePulseSlotsToWalkerOrHold: boolean;
  /** Keep an edge “live” for pulse slots this long after the last traverse sample on it. */
  readonly corridorHoldMs: number;
  /**
   * When pulse slots are restricted ({@link pulseSlotsCorridorOnly} or
   * {@link gatePulseSlotsToWalkerOrHold}): max number of **new** pulse-slot activations allowed on
   * an edge **after** the walker has left but while `corridorHoldMs` still keeps the edge live.
   * `-1` = unlimited. Ignored when neither restriction flag is set.
   */
  readonly maxCorridorPulseReplay: number;
  /**
   * Multiplier on `spawnP` during **hold-only** (walker gone, still within `corridorHoldMs`) when
   * slots are corridor-restricted. Use &gt; 1 to match denser “full network” pulsing on that edge.
   */
  readonly corridorHoldPulseSpawnBoost: number;
  /**
   * When true, only edges in the active corridor can extend `lastWakeAt` via the per-edge
   * heat/travel wake pass (avoids stale heat lighting the whole mesh).
   */
  readonly wakeFromCorridorEdgesOnly: boolean;
  /**
   * When true, co-timed heat on the same edge from the same tick uses max() instead of sum,
   * and receive heat into the far node is max() per tick — reads as one bundled pulse for the rest of the graph.
   */
  readonly bundleEdgeHeatPerTick: boolean;
  /** `beatPulse = 0.972 + this * sin(global phase)` on nodes. */
  readonly beatNodeOpacity: number;
  /** Extra factor on lit edge stroke: `… * (0.962 + this * sin(global phase))`. */
  readonly beatStrokeOpacity: number;
  /** Pulse-slot stroke opacity wobble: `… * (0.97 + this * sin(global phase))`. */
  readonly beatPulseSlotOpacity: number;
  /** Baseline term in `spawnP` (before heat / fill). */
  readonly pulseSpawnCoeff0: number;
  readonly pulseSpawnCoeffHeat: number;
  readonly pulseSpawnCoeffFill: number;
  /** `rng() < this * dt` retargets desired slot count per edge. */
  readonly pulseRetargetBase: number;
};

/** Snapshot of the “busy everywhere” pulse-slot tuning (for reuse on demos / dense layouts). */
export const MYCELIUM_GRAPH_PRESET_FULL_NETWORK_RHYTHM: MyceliumGraphRuntimePreset =
  {
    id: "fullNetworkRhythm",
    description:
      "Independent pulse slots on every edge; global beat strongly modulates opacity; wakes any edge with residual heat/travel.",
    maxWalkers: 2,
    pulseSlotsCorridorOnly: false,
    gatePulseSlotsToWalkerOrHold: false,
    corridorHoldMs: 0,
    maxCorridorPulseReplay: -1,
    corridorHoldPulseSpawnBoost: 1,
    wakeFromCorridorEdgesOnly: false,
    bundleEdgeHeatPerTick: false,
    beatNodeOpacity: 0.056,
    beatStrokeOpacity: 0.078,
    beatPulseSlotOpacity: 0.06,
    pulseSpawnCoeff0: 0.00055,
    pulseSpawnCoeffHeat: 0.001,
    pulseSpawnCoeffFill: 0.00018,
    pulseRetargetBase: 0.00006,
  };

/** Calm hero default: only the walker link(s) show the dense multi-pulse rhythm; rest of graph idles faster. */
export const MYCELIUM_GRAPH_PRESET_SPARSE_CORRIDORS: MyceliumGraphRuntimePreset =
  {
    id: "sparseCorridors",
    description:
      "Pulse slots + bundled heat only on walker edges + 800ms hold (gated), boosted spawn during hold; weak global beat.",
    maxWalkers: 6,
    pulseSlotsCorridorOnly: false,
    gatePulseSlotsToWalkerOrHold: true,
    corridorHoldMs: 800,
    maxCorridorPulseReplay: -1,
    corridorHoldPulseSpawnBoost: 5,
    wakeFromCorridorEdgesOnly: false,
    bundleEdgeHeatPerTick: true,
    beatNodeOpacity: 0.218,
    beatStrokeOpacity: 0.32,
    beatPulseSlotOpacity: 0.118,
    pulseSpawnCoeff0: 0.00055,
    pulseSpawnCoeffHeat: 0.001,
    pulseSpawnCoeffFill: 0.00018,
    pulseRetargetBase: 0.00006,
  };

export const MYCELIUM_GRAPH_PRESETS = {
  fullNetworkRhythm: MYCELIUM_GRAPH_PRESET_FULL_NETWORK_RHYTHM,
  sparseCorridors: MYCELIUM_GRAPH_PRESET_SPARSE_CORRIDORS,
} as const;

export type MyceliumGraphPresetId = keyof typeof MYCELIUM_GRAPH_PRESETS;
