import { GraphPresetExperience } from "@/components/marketing/GraphPresetExperience";

export default function HomePage() {
  return (
    <main id="main-content">
      <GraphPresetExperience />

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
