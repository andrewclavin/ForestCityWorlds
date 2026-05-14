"use client";

import { createContext, useContext } from "react";

export type ProfilerPanelControls = {
  open: () => void;
  close: () => void;
  clearLog: () => void;
};

const ProfilerPanelContext = createContext<ProfilerPanelControls | null>(null);

export function useProfilerPanel(): ProfilerPanelControls {
  const v = useContext(ProfilerPanelContext);
  if (!v) {
    throw new Error("useProfilerPanel must be used within AppProfilerRoot");
  }
  return v;
}

export function useProfilerPanelOptional(): ProfilerPanelControls | null {
  return useContext(ProfilerPanelContext);
}

export { ProfilerPanelContext };
