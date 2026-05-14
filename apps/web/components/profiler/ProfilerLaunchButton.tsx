"use client";

import type { ReactNode } from "react";

import { useProfilerPanelOptional } from "./profilerPanelContext";

type ProfilerLaunchButtonProps = {
  className?: string;
  children?: ReactNode;
};

export function ProfilerLaunchButton({
  className,
  children = "Profiler",
}: ProfilerLaunchButtonProps) {
  const panel = useProfilerPanelOptional();
  if (!panel) {
    return null;
  }
  return (
    <button type="button" className={className} onClick={panel.open}>
      {children}
    </button>
  );
}
