from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.api.portal import portal_limiter, weigh_in_limiter


@pytest.fixture(autouse=True)
def clean_limiter() -> Generator[None, None, None]:
    portal_limiter.reset()
    weigh_in_limiter.reset()
    yield
    portal_limiter.reset()
    weigh_in_limiter.reset()


def _client_with_token(api: TestClient) -> tuple[str, str]:
    client_id = api.post("/api/clients", json={"full_name": "Cliente Fotos"}).json()[
        "id"
    ]
    token = api.post(f"/api/clients/{client_id}/portal-token").json()["portal_token"]
    return client_id, token


def test_nobody_has_consented_until_they_say_so(
    authenticated_client: TestClient,
) -> None:
    _, token = _client_with_token(authenticated_client)

    portal = authenticated_client.get(f"/api/portal/{token}").json()

    assert portal["photo_consent_at"] is None


def test_the_client_consents_from_their_own_link(
    authenticated_client: TestClient,
) -> None:
    client_id, token = _client_with_token(authenticated_client)

    granted = authenticated_client.post(f"/api/portal/{token}/photo-consent").json()

    assert granted["photo_consent_at"] is not None
    # And the trainer sees it on the file, so they know where they stand.
    detail = authenticated_client.get(f"/api/clients/{client_id}").json()
    assert detail["photo_consent_at"] is not None


def test_withdrawing_stops_new_photos_without_deleting_the_old_ones(
    authenticated_client: TestClient,
) -> None:
    _, token = _client_with_token(authenticated_client)
    authenticated_client.post(f"/api/portal/{token}/photo-consent")

    withdrawn = authenticated_client.delete(f"/api/portal/{token}/photo-consent").json()

    assert withdrawn["photo_consent_at"] is None
    # Deleting is a separate, explicit act: it cannot be undone.
    assert withdrawn["photo_count"] == 0


def test_the_client_can_wipe_their_photos(authenticated_client: TestClient) -> None:
    _, token = _client_with_token(authenticated_client)

    response = authenticated_client.delete(f"/api/portal/{token}/photos")

    assert response.status_code == 200
    assert response.json()["photo_count"] == 0


def test_one_link_never_reaches_another_clients_consent(
    authenticated_client: TestClient,
) -> None:
    mine_id, my_token = _client_with_token(authenticated_client)
    other_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Cliente Ajeno"}
    ).json()["id"]

    authenticated_client.post(f"/api/portal/{my_token}/photo-consent")

    other = authenticated_client.get(f"/api/clients/{other_id}").json()
    assert other["photo_consent_at"] is None
    assert mine_id != other_id
