/** Shared copy for InlineGlossaryTip (always exactly two sentences). */
export type GlossaryEntry = {
  heading: string;
  lines: readonly [string, string];
};

const field: GlossaryEntry = {
  heading: "Field data",
  lines: [
    "“Field” means measurements from real browsing sessions (RUM), not a synthetic lab run on one machine.",
    "They reflect real networks, devices, caches, and contention so you see what visitors tend to experience.",
  ],
};

const p50: GlossaryEntry = {
  heading: "50th percentile (p50)",
  lines: [
    "Half of recorded values were at least this good (for timings, lower is better).",
    "It is the median experience: a useful center point when you want a typical visitor rather than a tail.",
  ],
};

const p75: GlossaryEntry = {
  heading: "75th percentile (p75)",
  lines: [
    "At least three quarters of recorded values were this good or better (for timings, lower is better).",
    "It is more stable than a straight average when a few slow visits would otherwise skew the story.",
  ],
};

const p95: GlossaryEntry = {
  heading: "95th percentile (p95)",
  lines: [
    "At least 95% of values were this good or better; the slowest ~5% live beyond this point.",
    "Use p95 when you care about worst-case-ish behavior without letting a single extreme outlier dominate.",
  ],
};

const LCP: GlossaryEntry = {
  heading: "Largest Contentful Paint (LCP)",
  lines: [
    "LCP marks when the largest visible content element finishes rendering—often a hero image or headline block.",
    "It matters because people read “loaded” from what actually paints, not from the first byte alone.",
  ],
};

const INP: GlossaryEntry = {
  heading: "Interaction to Next Paint (INP)",
  lines: [
    "INP captures how long it takes from a tap, click, or key press until the browser can paint the next frame in response.",
    "It replaced First Input Delay in Core Web Vitals because it better reflects post-hydration responsiveness.",
  ],
};

const CLS: GlossaryEntry = {
  heading: "Cumulative Layout Shift (CLS)",
  lines: [
    "CLS sums unexpected layout movement as the page loads—content jumping under the user’s eyes or pointer.",
    "Stable layouts protect reading flow and prevent mis-taps; high CLS usually means images, fonts, or ads reserving space too late.",
  ],
};

const FCP: GlossaryEntry = {
  heading: "First Contentful Paint (FCP)",
  lines: [
    "FCP is when the browser first paints any text, image, or non-white canvas from your document.",
    "It is an early milestone in perceived load, though it does not guarantee the main content is ready yet.",
  ],
};

const TTFB: GlossaryEntry = {
  heading: "Time to First Byte (TTFB)",
  lines: [
    "TTFB measures how long after navigation the first byte of the HTML response arrives from the network stack.",
    "High TTFB often points to server, CDN, or routing latency before the client can even start parsing.",
  ],
};

const rum: GlossaryEntry = {
  heading: "Real User Monitoring (RUM)",
  lines: [
    "RUM collects timing signals from real sessions in the field, as opposed to synthetic tests in a controlled lab.",
    "Aggregates here are built from those beacons so you see distributions by route, not a single Lighthouse score.",
  ],
};

const route: GlossaryEntry = {
  heading: "Route",
  lines: [
    "The pathname we recorded with each beacon (for example `/` or `/status`).",
    "Rollups group all events for the same route and metric so you can spot which pages drive slow experiences.",
  ],
};

const sampleN: GlossaryEntry = {
  heading: "Sample count (n)",
  lines: [
    "n is how many raw metric events fell into this bucket after filtering to the selected time window.",
    "Small n means percentiles are noisy; read them as directional until enough visits accumulate.",
  ],
};

const percentileInterpolation: GlossaryEntry = {
  heading: "Percentile interpolation",
  lines: [
    "We sort the samples for a route + metric, then pick p50 / p75 / p95 using linear interpolation between neighbors.",
    "That matches common observability tooling; it is not the same as a histogram approximation.",
  ],
};

const reactProfiler: GlossaryEntry = {
  heading: "React Profiler",
  lines: [
    "The Profiler component wraps part of your tree and runs a callback whenever React commits an update inside that subtree.",
    "It is meant for diagnostics: it adds some overhead, so keep it off for most production traffic unless heavily sampled.",
  ],
};

const profilerTreeId: GlossaryEntry = {
  heading: "Profiler id (table column)",
  lines: [
    'This string is the id prop you passed to <Profiler id="..."> so multiple wrapped regions stay distinguishable in logs.',
    "It is not a git commit hash or a fiber id—only the label you chose for this subtree.",
  ],
};

const reactCommit: GlossaryEntry = {
  heading: "Commit (React)",
  lines: [
    "A commit is one pass where React applies the result of rendering—updating the DOM, effects scheduling, etc.",
    "The Profiler’s onRender callback fires once per commit of the wrapped subtree, not once per JavaScript event.",
  ],
};

const renderPhase: GlossaryEntry = {
  heading: "Render phase (mount / update)",
  lines: [
    "mount means the subtree’s first paint after appearing; update means a later re-render driven by new props or state.",
    "nested-update labels work React does while already inside another update, such as some layout paths.",
  ],
};

const actualMs: GlossaryEntry = {
  heading: "Actual duration (ms)",
  lines: [
    "This is how long React spent rendering the profiled subtree in this commit, measured with high resolution timers.",
    "It includes work for that subtree in this frame; cheap parents with expensive children still show higher numbers.",
  ],
};

const baseMs: GlossaryEntry = {
  heading: "Base duration (ms)",
  lines: [
    "Base duration estimates how long rendering would take if React skipped memoized results and re-rendered everything from scratch.",
    "Comparing base to actual shows how much memoization or bailouts saved you in this commit.",
  ],
};

const commitWallTime: GlossaryEntry = {
  heading: "Commit time (column)",
  lines: [
    "Here “commit” is not git: it is the high-resolution timestamp React passes for when the commit finished.",
    "Values climb as your session clock moves forward; they are not a score to minimize on their own.",
  ],
};

const rafCoalescing: GlossaryEntry = {
  heading: "One flush per animation frame",
  lines: [
    "Several Profiler callbacks can fire in the same frame; we buffer them and update React state once on requestAnimationFrame.",
    "That avoids a render storm where each micro-commit would enqueue another table update and make the UI feel like it is racing.",
  ],
};

const commitLogGrowth: GlossaryEntry = {
  heading: "Why the log grows and numbers move",
  lines: [
    "Each interaction adds new rows at the top; commit timestamps follow performance time, so they generally increase as you click.",
    "actual ms jumps with how much subtree work ran—demo list size changes on purpose so you can see variance.",
  ],
};

const commitLogSection: GlossaryEntry = {
  heading: "Commit log (newest first)",
  lines: [
    "Each row is one React commit that touched the profiled subtree; newest rows appear at the top of the table.",
    "Timestamps move forward with your session clock; actual ms varies with how much work ran in the subtree on that commit.",
  ],
};

const localInstrument: GlossaryEntry = {
  heading: "Local instrument",
  lines: [
    "This profiler UI runs only in your browser session to explain the machinery; it does not replace field RUM.",
    "Ship something like it behind a flag or staff auth so typical visitors do not pay the measurement tax.",
  ],
};

const metricColumn: GlossaryEntry = {
  heading: "Metric column",
  lines: [
    "Each row is one Core Web Vitals-style signal (LCP, INP, CLS, FCP, or TTFB) aggregated for that pathname.",
    "Use it with n and the percentile columns to see both how common the signal is and how it spreads.",
  ],
};

/** Keys used on the status / profiler pages and metric column. */
export const glossary = {
  field,
  p50,
  p75,
  p95,
  LCP,
  INP,
  CLS,
  FCP,
  TTFB,
  rum,
  route,
  metricColumn,
  sampleN,
  percentileInterpolation,
  reactProfiler,
  profilerTreeId,
  reactCommit,
  renderPhase,
  actualMs,
  baseMs,
  commitWallTime,
  rafCoalescing,
  commitLogGrowth,
  commitLogSection,
  localInstrument,
} as const;

/** Metric column cells on /status — every `VitalMetricName` is covered. */
export const metricGlossary = {
  LCP: glossary.LCP,
  INP: glossary.INP,
  CLS: glossary.CLS,
  FCP: glossary.FCP,
  TTFB: glossary.TTFB,
} as const;

/** Footer strip: field + p75 + headline vitals only. */
export const webVitalGlossary = {
  field: glossary.field,
  p75: glossary.p75,
  LCP: glossary.LCP,
  INP: glossary.INP,
  CLS: glossary.CLS,
} as const;
