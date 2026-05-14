export type ProfilerCommitRow = {
  key: string;
  id: string;
  phase: "mount" | "update" | "nested-update";
  actualDuration: number;
  baseDuration: number;
  commitTime: number;
};
