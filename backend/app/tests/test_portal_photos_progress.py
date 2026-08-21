import io
from collections.abc import Generator
from datetime import date

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.api.portal import portal_limiter, weigh_in_limiter, workout_limiter
from app.models import Exercise


@pytest.fixture(autouse=True)
def clean_limiter() -> Generator[None, None, None]:
    portal_limiter.reset()
    weigh_in_limiter.reset()
    workout_limiter.reset()
    yield
    portal_limiter.reset()
    weigh_in_limiter.reset()
    workout_limiter.reset()


def _jpeg_bytes() -> bytes:
    image = Image.new("RGB", (800, 600), color=(120, 90, 60))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()


def _client_with_token(
    api: TestClient, name: str = "Cliente Portal"
) -> tuple[str, str]:
    client_id = api.post("/api/clients", json={"full_name": name}).json()["id"]
    token = api.post(f"/api/clients/{client_id}/portal-token").json()["portal_token"]
    return client_id, token


def _upload(
    api: TestClient,
    client_id: str,
    *,
    taken_on: str = "2026-08-01",
    pose: str = "front",
) -> dict:
    response = api.post(
        f"/api/clients/{client_id}/photos",
        data={"taken_on": taken_on, "pose": pose},
        files={"file": ("photo.jpg", _jpeg_bytes(), "image/jpeg")},
    )
    assert response.status_code == 201
    return response.json()


def _plan_with_one_day(api: TestClient, client_id: str, exercise_id: str) -> str:
    plan = api.post(
        f"/api/clients/{client_id}/training-plans",
        json={"title": "Plan", "status": "active"},
    ).json()
    week = api.post(
        f"/api/training-plans/{plan['id']}/weeks", json={"week_number": 1}
    ).json()
    api.put(
        f"/api/training-weeks/{week['id']}/days",
        json={
            "days": [
                {
                    "day_of_week": "monday",
                    "order_index": 0,
                    "exercises": [
                        {
                            "exercise_id": exercise_id,
                            "order_index": 0,
                            "sets": 3,
                            "reps": "8-12",
                        }
                    ],
                }
            ]
        },
    )
    return plan["id"]


def _log_session(
    api: TestClient, token: str, *, weight: float, device_id: str, day: str
) -> None:
    day_id = api.get(f"/api/portal/{token}/workout/days").json()[0]["id"]
    detail = api.get(f"/api/portal/{token}/workout/days/{day_id}").json()
    response = api.post(
        f"/api/portal/{token}/workouts",
        json={
            "device_session_id": device_id,
            "training_day_id": day_id,
            "performed_on": day,
            "sets": [
                {
                    # Without it the set has no exercise to chart: the id is what
                    # ties the logged weight back to the catalogue.
                    "training_day_exercise_id": detail["exercises"][0]["id"],
                    "exercise_name": detail["exercises"][0]["name_es"],
                    "order_index": 0,
                    "set_number": 1,
                    "weight_kg": weight,
                    "reps": 10,
                }
            ],
        },
    )
    assert response.status_code == 200


# --- Photos -----------------------------------------------------------------


def test_the_gallery_stays_shut_until_the_client_consents(
    authenticated_client: TestClient,
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    photo = _upload(authenticated_client, client_id)

    listing = authenticated_client.get(f"/api/portal/{token}/photos")

    assert listing.status_code == 403

    authenticated_client.delete(f"/api/photos/{photo['id']}")


def test_the_client_sees_their_own_photos_once_they_agree(
    authenticated_client: TestClient,
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    photo = _upload(authenticated_client, client_id)
    authenticated_client.post(f"/api/portal/{token}/photo-consent")

    listing = authenticated_client.get(f"/api/portal/{token}/photos")

    assert listing.status_code == 200
    body = listing.json()
    assert [item["pose"] for item in body] == ["front"]
    # The token is the key: no client id ever travels to the portal.
    assert "client_id" not in body[0]

    authenticated_client.delete(f"/api/photos/{photo['id']}")


def test_the_photo_file_is_served_through_the_token(
    authenticated_client: TestClient,
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    photo = _upload(authenticated_client, client_id)
    authenticated_client.post(f"/api/portal/{token}/photo-consent")

    full = authenticated_client.get(f"/api/portal/{token}/photos/{photo['id']}/file")
    thumb = authenticated_client.get(
        f"/api/portal/{token}/photos/{photo['id']}/file?thumbnail=true"
    )

    assert full.status_code == 200
    assert full.headers["content-type"] == "image/jpeg"
    assert len(thumb.content) < len(full.content)

    authenticated_client.delete(f"/api/photos/{photo['id']}")


def test_one_link_never_reaches_another_clients_photo(
    authenticated_client: TestClient,
) -> None:
    _, my_token = _client_with_token(authenticated_client, "Cliente Propio")
    other_id, _ = _client_with_token(authenticated_client, "Cliente Ajeno")
    stranger = _upload(authenticated_client, other_id)
    authenticated_client.post(f"/api/portal/{my_token}/photo-consent")

    listing = authenticated_client.get(f"/api/portal/{my_token}/photos").json()
    stolen = authenticated_client.get(
        f"/api/portal/{my_token}/photos/{stranger['id']}/file"
    )

    assert listing == []
    # The same 404 as an id that never existed: the portal confirms nothing.
    assert stolen.status_code == 404

    authenticated_client.delete(f"/api/photos/{stranger['id']}")


def test_withdrawing_the_permission_closes_the_gallery(
    authenticated_client: TestClient,
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    photo = _upload(authenticated_client, client_id)
    authenticated_client.post(f"/api/portal/{token}/photo-consent")
    authenticated_client.delete(f"/api/portal/{token}/photo-consent")

    listing = authenticated_client.get(f"/api/portal/{token}/photos")
    file_response = authenticated_client.get(
        f"/api/portal/{token}/photos/{photo['id']}/file"
    )

    assert listing.status_code == 403
    assert file_response.status_code == 403

    authenticated_client.delete(f"/api/photos/{photo['id']}")


# --- Progression ------------------------------------------------------------


def test_the_portal_says_whether_there_is_anything_to_chart(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    _plan_with_one_day(authenticated_client, client_id, imported_exercise.id)

    before = authenticated_client.get(f"/api/portal/{token}").json()
    _log_session(
        authenticated_client,
        token,
        weight=60,
        device_id="device-1",
        day=date.today().isoformat(),
    )
    after = authenticated_client.get(f"/api/portal/{token}").json()

    assert before["workout_count"] == 0
    assert after["workout_count"] == 1


def test_the_client_gets_the_progression_of_what_they_logged(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    _plan_with_one_day(authenticated_client, client_id, imported_exercise.id)
    _log_session(
        authenticated_client, token, weight=60, device_id="device-1", day="2026-08-01"
    )
    _log_session(
        authenticated_client, token, weight=65, device_id="device-2", day="2026-08-08"
    )

    trained = authenticated_client.get(f"/api/portal/{token}/trained-exercises").json()
    history = authenticated_client.get(
        f"/api/portal/{token}/exercises/{imported_exercise.id}/history"
    ).json()

    assert [item["exercise_id"] for item in trained] == [imported_exercise.id]
    assert trained[0]["session_count"] == 2
    assert [point["top_weight_kg"] for point in history["points"]] == [60.0, 65.0]


def test_one_link_never_reaches_another_clients_progression(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    other_id, other_token = _client_with_token(authenticated_client, "Cliente Ajeno")
    _plan_with_one_day(authenticated_client, other_id, imported_exercise.id)
    _log_session(
        authenticated_client,
        other_token,
        weight=100,
        device_id="device-other",
        day="2026-08-01",
    )
    _, my_token = _client_with_token(authenticated_client, "Cliente Propio")

    trained = authenticated_client.get(f"/api/portal/{my_token}/trained-exercises")
    history = authenticated_client.get(
        f"/api/portal/{my_token}/exercises/{imported_exercise.id}/history"
    ).json()

    assert trained.json() == []
    assert history["points"] == []


def test_the_progression_needs_a_valid_link(client: TestClient) -> None:
    response = client.get("/api/portal/not-a-real-token/trained-exercises")

    assert response.status_code == 404
