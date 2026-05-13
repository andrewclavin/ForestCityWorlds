# forest-api

FastAPI service for Forest City Worlds. Phase 1 ships a health stub; DynamoDB, JWT, OAuth, and Mangum arrive in Phase 2.

## Local run

```bash
uv sync
uv run uvicorn forest_api.main:app --reload --port 8000
```

## Policy mirror

`forest_api/_policies.py` is generated from `packages/auth-policy`. After editing TypeScript policies:

```bash
pnpm codegen:policies
```
