# CC6 — Logical access

**Objective:** Least-privilege access to systems; no long-lived cloud credentials in CI where OIDC can be used.

**Current implementation (bootstrap):**

- GitHub → AWS deploys should use OIDC roles (provision in Phase 0.5 CDK).
- Human access via IAM Identity Center with MFA (documented expectation).

**Owner:** Security / infrastructure owner.
