"""OpenAPI-driven fuzzing — catches handler/schema drift early."""

import schemathesis
from hypothesis import HealthCheck, settings

from forest_api.main import app

schema = schemathesis.openapi.from_asgi("/openapi.json", app=app)


@schema.parametrize()
@settings(
    max_examples=12,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
def test_openapi_contract(case: schemathesis.Case) -> None:
    case.call_and_validate()
