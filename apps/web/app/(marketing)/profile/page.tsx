import type { Metadata } from "next";
import Link from "next/link";

import { CommitProfilerExplorer } from "@/components/profile/CommitProfilerExplorer";
import { ProfilePageIntro } from "@/components/profile/ProfilePageIntro";

export const metadata: Metadata = {
  title: "Profiler · Forest City Worlds",
  description:
    "Client-side React Profiler demo with requestAnimationFrame–debounced commit logging.",
};

export default function ProfilePage() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
    >
      <h1 className="font-lineal text-3xl font-semibold tracking-tight text-mycelium-cream sm:text-4xl">
        React commit profiler
      </h1>
      <ProfilePageIntro />

      <div className="mt-10">
        <CommitProfilerExplorer />
      </div>

      <p className="mt-16 text-sm text-forest-moss">
        <Link
          href="/"
          className="font-medium text-bioluminescent underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
        <span aria-hidden className="text-forest-canopy">
          {" "}
          ·{" "}
        </span>
        <Link
          href="/status"
          className="font-medium text-bioluminescent underline-offset-4 hover:underline"
        >
          Field Web Vitals
        </Link>
      </p>
    </main>
  );
}
