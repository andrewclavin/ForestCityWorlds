from fastapi import FastAPI

from forest_api._policies import can

app = FastAPI(title="Forest City Worlds API", version="0.0.1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/policy-check")
def policy_check() -> dict[str, bool]:
    """Sanity check that generated policy mirror is importable."""
    return {"business_plan_public": can("public", "business-plan.view")}
