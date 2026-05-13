import Link from "next/link";

export default function ToolsPage() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
    >
      <header className="max-w-2xl">
        <h1 className="font-lineal text-3xl font-semibold tracking-tight text-mycelium-cream sm:text-4xl">
          Tools
        </h1>
        <p className="mt-4 font-display text-lg leading-relaxed text-forest-spring">
          Teasers and gated labs for motion-and-behavior experiments. Each piece
          is meant to ship with tests, accessibility checks, and a plausible
          path from sketch to something you could hand off.
        </p>
      </header>

      <ul className="mt-12 grid gap-6 sm:grid-cols-2">
        <li className="rounded-xl border border-forest-canopy/50 bg-forest-deep/60 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="font-lineal text-xl font-semibold tracking-tight text-mycelium-cream">
            Snowboard (motion study)
          </h2>
          <p className="mt-3 font-display text-sm leading-relaxed text-forest-spring">
            A compact teaser around average-motion cues on a simple figure (mock
            in v1). When the labs route exists, it will live at{" "}
            <Link
              className="text-bioluminescent underline-offset-4 hover:underline"
              href="/labs/snowboard-jepa"
            >
              /labs/snowboard-jepa
            </Link>
            .
          </p>
        </li>
        <li className="rounded-xl border border-forest-canopy/40 border-dashed p-6 text-forest-moss">
          <h2 className="font-lineal text-xl font-semibold tracking-tight text-forest-moss">
            More tools
          </h2>
          <p className="mt-3 font-display text-sm leading-relaxed">
            Placeholder cards for later demos — telemetry, narrative graphs, and
            training visibility will show up here when they are far enough along
            to invite a second pair of eyes.
          </p>
        </li>
      </ul>
    </main>
  );
}
