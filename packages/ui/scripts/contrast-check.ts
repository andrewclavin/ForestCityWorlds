/**
 * WCAG 2.2 AA contrast checks for documented brand pairings.
 * Pairs mirror `packages/ui/src/tokens.css` — extend when new UI combos ship.
 */
const AA_NORMAL = 4.5;

const PAIRS: { name: string; fg: string; bg: string }[] = [
  { name: "mycelium-cream on forest-deep", fg: "#f4efe6", bg: "#0f2a1f" },
  { name: "forest-spring on forest-deep", fg: "#c5d9b0", bg: "#0f2a1f" },
  { name: "bioluminescent on forest-deep", fg: "#7df0b5", bg: "#0f2a1f" },
  { name: "mycelium-cream on forest-canopy", fg: "#f4efe6", bg: "#1f4d38" },
  { name: "forest-spring on forest-canopy", fg: "#c5d9b0", bg: "#1f4d38" },
  { name: "bark on mycelium-cream", fg: "#6b4f3a", bg: "#f4efe6" },
  { name: "forest-deep on mycelium-cream", fg: "#0f2a1f", bg: "#f4efe6" },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n) || h.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function channelLuminance(channel: number): number {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

function contrastRatio(fg: string, bg: string): number {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

let failed = false;
for (const p of PAIRS) {
  const ratio = contrastRatio(p.fg, p.bg);
  if (ratio < AA_NORMAL) {
    failed = true;
    console.error(
      `[contrast] FAIL ${p.name}: ${ratio.toFixed(2)}:1 < ${AA_NORMAL}:1 (${p.fg} / ${p.bg})`,
    );
  } else {
    console.log(`[contrast] OK ${p.name}: ${ratio.toFixed(2)}:1`);
  }
}

if (failed) {
  process.exit(1);
}
