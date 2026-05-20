"""HTTP contract tests for the public stub surface."""

from httpx import ASGITransport, AsyncClient

from forest_api.main import app


async def test_health_ok() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


async def test_policy_check_shape() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/policy-check")
    assert res.status_code == 200
    body = res.json()
    assert body == {"business_plan_public": False}
