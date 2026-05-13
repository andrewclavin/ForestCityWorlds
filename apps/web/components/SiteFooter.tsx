import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import { VitalsFooterStrip } from "@/components/vitals/VitalsFooterStrip";
import { getGlobalVitalsSummary } from "@/lib/vitals/store";

const WINDOW_MS = 24 * 60 * 60 * 1000;

export async function SiteFooter() {
  noStore();
  const summary = await getGlobalVitalsSummary({ windowMs: WINDOW_MS });
  const hasSamples = summary.totalEvents > 0;

  return (
    <footer className="border-t border-forest-canopy/40 bg-forest-deep/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="font-lineal text-lg font-medium tracking-tight text-mycelium-cream">
            Forest City Worlds
          </p>
          <p className="mt-2 max-w-md font-display text-sm leading-relaxed text-forest-moss">
            Autonomously learned behaviors. Digitized cortical column focus,
            networked column-based models, while protecting data privacy.
          </p>
        </div>
        <div className="text-sm text-forest-spring">
          <p>
            <Link
              className="underline-offset-4 hover:text-bioluminescent hover:underline"
              href="/contact"
            >
              Contact
            </Link>
          </p>
          <p className="mt-2 font-lineal tracking-tight text-forest-moss">
            © {new Date().getFullYear()} Forest City Worlds
          </p>
        </div>
      </div>

      <div className="border-t border-forest-canopy/30 bg-forest-deep/95">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <VitalsFooterStrip
            lcpP75={summary.lcpP75}
            inpP75={summary.inpP75}
            clsP75={summary.clsP75}
            hasSamples={hasSamples}
          />
        </div>
      </div>
    </footer>
  );
}
