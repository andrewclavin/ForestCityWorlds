"""Property-style checks on generated policy helpers."""

from hypothesis import assume, given
from hypothesis import strategies as st

from forest_api._policies import can

_KNOWN = frozenset(
    {
        "home.view",
        "tools.overview.view",
        "tools.snowboard.demo",
        "business-plan.view",
        "project-update.view",
        "admin.dashboard",
        "labs.snowboard-jepa.view",
    }
)


@given(st.sampled_from(["public", "authed", "approved", "admin"]))
def test_unknown_policy_denied(actor: str) -> None:
    assert can(actor, "definitely.not-a-real-policy-id") is False  # type: ignore[arg-type]


@given(st.text(min_size=1, max_size=64, alphabet=st.characters(whitelist_categories=("L", "N", "P"))))
def test_garbage_policy_ids_denied(policy_id: str) -> None:
    assume(policy_id not in _KNOWN)
    assert can("public", policy_id) is False  # type: ignore[arg-type]
