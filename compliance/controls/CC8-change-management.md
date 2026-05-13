# CC8 — Change management

**Objective:** All production-impacting changes flow through version control, peer review, and automated checks.

**In scope:** Application code (`apps/*`, `packages/*`), infrastructure (`infra/*`), and CI workflows (`.github/workflows/*`).

**Evidence types:** Pull request history, required status checks, deployment logs.

**Current implementation (bootstrap):**

- GitHub Actions `ci.yml` runs Biome, TypeScript, Vitest, and Next.js build on every PR.
- Branch protection (to configure in GitHub): require reviews, linear history, required checks.

**Owner:** Engineering lead.
