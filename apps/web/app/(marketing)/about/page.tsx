export default function AboutPage() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
    >
      <article className="max-w-3xl space-y-6">
        <h1 className="font-lineal text-3xl font-semibold tracking-tight text-mycelium-cream sm:text-4xl">
          About
        </h1>
        <p className="font-display text-lg text-forest-spring">
          Forest City Worlds is a small umbrella for experimental cognitive
          work: public pages, authenticated areas when they are ready, and
          sandboxed demos that can graduate without a rewrite. The aim is
          restraint in copy and discipline in how things are built and reviewed.
        </p>
        <h2 className="font-lineal text-2xl font-semibold tracking-tight text-mycelium-cream">
          Principles
        </h2>
        <ul className="list-disc space-y-3 pl-5 font-display leading-relaxed text-forest-spring">
          <li>Accessibility to WCAG 2.2 AA, including motion sensitivity.</li>
          <li>
            Security-minded defaults in CI and infrastructure, documented so
            they can be evidenced later without heroics.
          </li>
          <li>
            Observability and performance treated as part of the feature, not an
            afterthought.
          </li>
        </ul>
      </article>
    </main>
  );
}
