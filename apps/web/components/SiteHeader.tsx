"use client";

import { ProfilerLaunchButton } from "@/components/profiler/ProfilerLaunchButton";
import { navItems } from "@/lib/site";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-forest-canopy/40 bg-forest-deep/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="font-lineal text-lg font-medium tracking-tight text-mycelium-cream transition-colors hover:text-bioluminescent"
        >
          Forest City Worlds
        </Link>
        <nav aria-label="Primary">
          <ul className="flex flex-wrap items-center gap-4 text-sm text-forest-spring sm:gap-6">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-sm transition-colors hover:text-bioluminescent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bioluminescent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <ProfilerLaunchButton className="rounded-sm transition-colors hover:text-bioluminescent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bioluminescent">
                Profiler
              </ProfilerLaunchButton>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
