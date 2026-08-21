from collections.abc import Generator
from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.api.portal import portal_limiter, weigh_in_limiter


@pytest.fixture(autouse=True)
def clean_limiter() -> Generator[None, None, None]:
    """The limiter lives in process, so one test must not spend another's quota."""
    portal_limiter.reset()
    weigh_in_limiter.reset()
    yield
    portal_limiter.reset()
    weigh_in_limiter.reset()


def _client_id(api: TestClient) -> str:
    response = api.post("/api/clients", json={"full_name": "Cliente de Prueba"})
    return response.json()["id"]


def _client_with_token(api: TestClient) -> tuple[str, str]:
    client_id = _client_id(api)
    token = api.post(f"/api/clients/{client_id}/portal-token").json()["portal_token"]
    return client_id, token


def test_only_the_zones_that_were_measured_are_stored(
    authenticated_client: TestClient,
) -> None:
    client_id = _client_id(authenticated_client)

    response = authenticated_client.post(
        f"/api/clients/{client_id}/body-measurements",
        json={"measured_on": "2026-09-01", "waist_cm": 86.5, "chest_cm": 104},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["waist_cm"] == 86.5
    assert body["chest_cm"] == 104
    # The seven spots nobody put the tape round stay empty instead of guessing.
    assert body["calf_cm"] is None
    assert body["arm_left_cm"] is None


def test_an_entry_with_no_zone_at_all_is_refused(
    authenticated_client: TestClient,
) -> None:
    client_id = _client_id(authenticated_client)

    response = authenticated_client.post(
        f"/api/clients/{client_id}/body-measurements",
        json={"measured_on": "2026-09-01", "notes": "se me olvidó la cinta"},
    )

    assert response.status_code == 422


def test_a_zone_out_of_range_is_refused(authenticated_client: TestClient) -> None:
    client_id = _client_id(authenticated_client)

    response = authenticated_client.post(
        f"/api/clients/{client_id}/body-measurements",
        # Someone typing their weight into the waist box, or a plain typo.
        json={"measured_on": "2026-09-01", "waist_cm": 860},
    )

    assert response.status_code == 422


def test_two_entries_on_the_same_day_are_refused(
    authenticated_client: TestClient,
) -> None:
    client_id = _client_id(authenticated_client)
    payload = {"measured_on": "2026-09-01", "waist_cm": 86.5}
    authenticated_client.post(
        f"/api/clients/{client_id}/body-measurements", json=payload
    )

    response = authenticated_client.post(
        f"/api/clients/{client_id}/body-measurements", json=payload
    )

    assert response.status_code == 409


def test_editing_one_zone_leaves_the_others_alone(
    authenticated_client: TestClient,
) -> None:
    client_id = _client_id(authenticated_client)
    measurement_id = authenticated_client.post(
        f"/api/clients/{client_id}/body-measurements",
        json={"measured_on": "2026-09-01", "waist_cm": 86.5, "chest_cm": 104},
    ).json()["id"]

    response = authenticated_client.patch(
        f"/api/body-measurements/{measurement_id}", json={"waist_cm": 85}
    )

    assert response.status_code == 200
    assert response.json()["waist_cm"] == 85
    assert response.json()["chest_cm"] == 104


def test_a_zone_sent_as_null_is_cleared(authenticated_client: TestClient) -> None:
    client_id = _client_id(authenticated_client)
    measurement_id = authenticated_client.post(
        f"/api/clients/{client_id}/body-measurements",
        json={"measured_on": "2026-09-01", "waist_cm": 86.5, "chest_cm": 104},
    ).json()["id"]

    response = authenticated_client.patch(
        f"/api/body-measurements/{measurement_id}", json={"chest_cm": None}
    )

    assert response.status_code == 200
    assert response.json()["chest_cm"] is None
    assert response.json()["waist_cm"] == 86.5


def test_entries_are_listed_newest_first(authenticated_client: TestClient) -> None:
    client_id = _client_id(authenticated_client)
    for day in ("2026-07-01", "2026-09-01", "2026-08-01"):
        authenticated_client.post(
            f"/api/clients/{client_id}/body-measurements",
            json={"measured_on": day, "waist_cm": 86},
        )

    days = [
        entry["measured_on"]
        for entry in authenticated_client.get(
            f"/api/clients/{client_id}/body-measurements"
        ).json()
    ]

    assert days == ["2026-09-01", "2026-08-01", "2026-07-01"]


def test_an_entry_can_be_deleted(authenticated_client: TestClient) -> None:
    client_id = _client_id(authenticated_client)
    measurement_id = authenticated_client.post(
        f"/api/clients/{client_id}/body-measurements",
        json={"measured_on": "2026-09-01", "waist_cm": 86.5},
    ).json()["id"]

    assert (
        authenticated_client.delete(
            f"/api/body-measurements/{measurement_id}"
        ).status_code
        == 204
    )
    assert (
        authenticated_client.get(f"/api/clients/{client_id}/body-measurements").json()
        == []
    )


def test_the_client_writes_their_own_measurements(
    authenticated_client: TestClient,
) -> None:
    client_id, token = _client_with_token(authenticated_client)

    response = authenticated_client.post(
        f"/api/portal/{token}/body-measurements",
        json={"waist_cm": 86.5, "notes": "en ayunas"},
    )

    assert response.status_code == 200
    assert response.json()["waist_cm"] == 86.5
    assert response.json()["measured_on"] == date.today().isoformat()
    # The trainer sees the same entry from their side.
    entries = authenticated_client.get(
        f"/api/clients/{client_id}/body-measurements"
    ).json()
    assert len(entries) == 1
    assert entries[0]["client_notes"] == "en ayunas"


def test_saving_again_the_same_day_corrects_the_entry(
    authenticated_client: TestClient,
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    authenticated_client.post(
        f"/api/portal/{token}/body-measurements", json={"waist_cm": 86.5}
    )

    # A typo from a phone has to be fixable: overwriting beats refusing.
    response = authenticated_client.post(
        f"/api/portal/{token}/body-measurements", json={"waist_cm": 85}
    )

    assert response.status_code == 200
    entries = authenticated_client.get(
        f"/api/clients/{client_id}/body-measurements"
    ).json()
    assert len(entries) == 1
    assert entries[0]["waist_cm"] == 85


def test_a_second_zone_joins_todays_entry_instead_of_replacing_it(
    authenticated_client: TestClient,
) -> None:
    _, token = _client_with_token(authenticated_client)
    authenticated_client.post(
        f"/api/portal/{token}/body-measurements", json={"waist_cm": 86.5}
    )

    # Measured with the tape in the other hand, one spot at a time.
    response = authenticated_client.post(
        f"/api/portal/{token}/body-measurements", json={"chest_cm": 104}
    )

    assert response.json()["waist_cm"] == 86.5
    assert response.json()["chest_cm"] == 104


def test_the_trainers_note_never_reaches_the_portal(
    authenticated_client: TestClient,
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    authenticated_client.post(
        f"/api/clients/{client_id}/body-measurements",
        json={
            "measured_on": date.today().isoformat(),
            "waist_cm": 86.5,
            "notes": "le cuesta la dieta",
        },
    )

    entries = authenticated_client.get(f"/api/portal/{token}/body-measurements").json()

    assert entries[0]["notes"] is None
    assert "le cuesta la dieta" not in str(entries)


def test_the_portal_refuses_an_entry_with_no_zone(
    authenticated_client: TestClient,
) -> None:
    _, token = _client_with_token(authenticated_client)

    response = authenticated_client.post(
        f"/api/portal/{token}/body-measurements", json={"notes": "sin cinta"}
    )

    assert response.status_code == 422
