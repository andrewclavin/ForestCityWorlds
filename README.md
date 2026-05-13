# Forest City Worlds

Monorepo for the Forest City Worlds portal: Next.js marketing site, shared UI, auth policy package, and (forthcoming) FastAPI + AWS CDK stack.

## Prerequisites

- Node 22+
- [pnpm](https://pnpm.io) 9+
- Python 3.12+ with [uv](https://docs.astral.sh/uv/) (for `apps/api` when enabled)

## Commands

| Command | Description |
| --- | --- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start dev servers (Turbo) |
| `pnpm build` | Production build |
| `pnpm lint` / `pnpm check` | Biome lint + format check |
| `pnpm test` | Run tests (Vitest + future pytest) |
| `pnpm typecheck` | TypeScript across packages |
| `pnpm codegen:policies` | Generate Python policy mirror from `packages/auth-policy` |

See [docs/forest-city-worlds-bootstrap-plan.md](docs/forest-city-worlds-bootstrap-plan.md) for architecture and phased delivery.
