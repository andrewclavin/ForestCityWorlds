/**
 * Forest City Worlds — permission policy IDs and allowed actors.
 * Codegen mirrors this to `apps/api/forest_api/_policies.py`; keep both in sync via `pnpm codegen:policies`.
 */
export type Actor = "public" | "authed" | "approved" | "admin";

export const policies = {
  "home.view": ["public"],
  "tools.overview.view": ["public"],
  "tools.snowboard.demo": ["public"],
  "business-plan.view": ["approved"],
  "project-update.view": ["approved"],
  "admin.dashboard": ["admin"],
  "labs.snowboard-jepa.view": ["approved"],
} as const satisfies Record<string, readonly Actor[]>;

export type PolicyId = keyof typeof policies;

export function can(actor: Actor, policyId: PolicyId): boolean {
  const allowed = policies[policyId];
  return (allowed as readonly Actor[]).includes(actor);
}
