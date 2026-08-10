from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.api.portal import portal_limiter


@pytest.fixture(autouse=True)
def clean_limiter() -> Generator[None, None, None]:
    """The limiter lives in process, so one test must not spend another's quota."""
    portal_limiter.reset()
    yield
    portal_limiter.reset()


def _client_with_token(
    api: TestClient, name: str = "Cliente Portal"
) -> tuple[str, str]:
    client_id = api.post("/api/clients", json={"full_name": name}).json()["id"]
    response = api.post(f"/api/clients/{client_id}/portal-token")
    assert response.status_code == 200
    return client_id, response.json()["portal_token"]


def test_issued_token_opens_the_portal_without_logging_in(
    authenticated_client: TestClient, client: TestClient
) -> None:
    _, token = _client_with_token(authenticated_client, "Ana Portal")

    # Same TestClient without the session cookie: the token alone must be enough.
    client.cookies.clear()
    response = client.get(f"/api/portal/{token}")

    assert response.status_code == 200
    assert response.json()["full_name"] == "Ana Portal"


def test_token_is_long_enough_to_be_unguessable(
    authenticated_client: TestClient,
) -> None:
    _, token = _client_with_token(authenticated_client)

    assert len(token) >= 40


def test_regenerating_the_token_kills_the_previous_link(
    authenticated_client: TestClient,
) -> None:
    client_id, old_token = _client_with_token(authenticated_client)

    new_token = authenticated_client.post(
        f"/api/clients/{client_id}/portal-token"
    ).json()["portal_token"]

    assert new_token != old_token
    assert authenticated_client.get(f"/api/portal/{old_token}").status_code == 404
    assert authenticated_client.get(f"/api/portal/{new_token}").status_code == 200


def test_revoking_the_token_closes_the_portal(
    authenticated_client: TestClient,
) -> None:
    client_id, token = _client_with_token(authenticated_client)

    revoke_response = authenticated_client.delete(
        f"/api/clients/{client_id}/portal-token"
    )
    assert revoke_response.status_code == 200
    assert revoke_response.json()["portal_token"] is None

    assert authenticated_client.get(f"/api/portal/{token}").status_code == 404


def test_a_client_on_hold_cannot_be_reached_through_their_link(
    authenticated_client: TestClient,
) -> None:
    client_id, token = _client_with_token(authenticated_client)

    authenticated_client.delete(f"/api/clients/{client_id}")
    assert authenticated_client.get(f"/api/portal/{token}").status_code == 404

    authenticated_client.post(f"/api/clients/{client_id}/reactivate")
    assert authenticated_client.get(f"/api/portal/{token}").status_code == 200


def test_the_portal_shows_the_latest_weigh_in(
    authenticated_client: TestClient,
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    authenticated_client.post(
        f"/api/clients/{client_id}/measurements",
        json={"measured_on": "2026-08-01", "weight_kg": 81.4},
    )
    authenticated_client.post(
        f"/api/clients/{client_id}/measurements",
        json={"measured_on": "2026-08-08", "weight_kg": 80.2},
    )

    body = authenticated_client.get(f"/api/portal/{token}").json()

    assert body["latest_weight_kg"] == 80.2
    assert body["latest_weighed_on"] == "2026-08-08"


def test_the_portal_never_leaks_the_client_id(
    authenticated_client: TestClient,
) -> None:
    client_id, token = _client_with_token(authenticated_client)

    body = authenticated_client.get(f"/api/portal/{token}").json()

    assert client_id not in str(body)
    assert "client_id" not in body


def test_hammering_unknown_tokens_gets_locked_out(client: TestClient) -> None:
    for _ in range(20):
        assert client.get("/api/portal/no-existe").status_code == 404

    assert client.get("/api/portal/no-existe").status_code == 429


def test_managing_the_token_requires_the_trainer_session(
    authenticated_client: TestClient, client: TestClient
) -> None:
    client_id, _ = _client_with_token(authenticated_client)

    client.cookies.clear()
    assert client.post(f"/api/clients/{client_id}/portal-token").status_code == 401
    assert client.delete(f"/api/clients/{client_id}/portal-token").status_code == 401
