# Agent instructions

## Repo layout

- `apps/web` — Next.js 15 App Router (marketing + future authed routes).
- `apps/api` — FastAPI service (stub; auth and DynamoDB in later phases).
- `packages/ui` — Brand tokens, `MyceliumGraph`, shared primitives.
- `packages/auth-policy` — Single source of truth for policy IDs; codegen writes `apps/api/forest_api/_policies.py`.

## Conventions

- TypeScript strict; Biome for format/lint (no Prettier).
- UI copy and structure follow WCAG 2.2 AA: landmarks, heading order, skip link, visible focus, `prefers-reduced-motion` for decorative motion.
- Policy changes: edit `packages/auth-policy/src/policies.ts`, run `pnpm codegen:policies`, commit both TS and generated Python.

## Before opening a PR

- `pnpm check && pnpm typecheck && pnpm test && pnpm build`
- For policy edits: `pnpm check:policy-codegen`

## CI

GitHub Actions runs the same checks on every push to a PR branch targeting `main`.
