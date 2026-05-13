import { CorticalGraph, MyceliumGraph } from "@fcw/ui";
import Link from "next/link";

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="relative overflow-hidden border-b border-forest-canopy/30">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 opacity-[0.52]">
            <MyceliumGraph className="h-full w-full scale-110" />
          </div>
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:grid-cols-2 sm:px-6 sm:py-28">
          <div className="max-w-xl">
            <p className="text-sm font-medium leading-snug tracking-wide text-forest-moss sm:text-[0.8125rem] sm:tracking-widest">
              Autonomously Learned Behaviors
            </p>
            <h1 className="mt-4 font-lineal text-3xl font-semibold leading-tight tracking-tight text-mycelium-cream sm:text-4xl">
              forest city worlds
            </h1>
            <p className="mt-6 font-display text-lg leading-relaxed text-forest-spring">
              Experimenting with cognitive models for frontier pragmatics.
              Theoretical focus on a digitized cortical column as new paradigms
              continue to normalize. Aimed intelligence stays on a single
              pragmatic instance, with generalization explored in how it
              networks with other column-based world models. World models stay
              small and tied to a single implementation, experimentally linked
              towards generalization as evidence tunes the growing neural
              paradigms, while protecting data privacy with the same restraint
              in copy and discipline in build and review from sketch to ship.
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
            <CorticalGraph
              className="absolute inset-0 z-0 h-full w-full p-6"
              coreFill="#0f2a1f"
            />
            <MyceliumGraph
              className="absolute inset-0 z-10 h-full w-full p-6"
              preserveAspectRatio="xMidYMid meet"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="font-lineal text-2xl font-semibold tracking-tight text-mycelium-cream sm:text-3xl">
          Practice
        </h2>
        <p className="mt-4 max-w-3xl font-display leading-relaxed text-forest-spring">
          Layout, motion, and instrumentation kept legible. When a sketch
          becomes something shippable, the scope should read narrower and the
          bar for accessibility and review stays the same.
        </p>
      </section>
    </main>
  );
}
