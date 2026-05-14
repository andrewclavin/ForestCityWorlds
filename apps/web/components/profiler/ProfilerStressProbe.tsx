"use client";

import { useEffect, useState } from "react";

export const PROFILER_STRESS_EVENT = "fcw:profiler-stress-bump";

/** Hidden in-tree subscriber so synthetic bumps produce commits in the app Profiler. */
export function ProfilerStressProbe() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    function bump() {
      setTick((n) => n + 1);
    }
    window.addEventListener(PROFILER_STRESS_EVENT, bump);
    return () => window.removeEventListener(PROFILER_STRESS_EVENT, bump);
  }, []);
  return (
    <span
      aria-hidden
      className="sr-only"
      data-fcw-profiler-stress-tick={tick}
    />
  );
}
