from collections.abc import Generator
from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.api.portal import portal_limiter, weigh_in_limiter
from app.models import Exercise


@pytest.fixture(autouse=True)
def clean_limiter() -> Generator[None, None, None]:
    """The limiter lives in process, so one test must not spend another's quota."""
    portal_limiter.reset()
    weigh_in_limiter.reset()
    yield
    portal_limiter.reset()
    weigh_in_limiter.reset()


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


def _give_active_training_plan(
    api: TestClient, client_id: str, exercise_id: str, title: str
) -> str:
    plan = api.post(
        f"/api/clients/{client_id}/training-plans",
        json={"title": title, "status": "active"},
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
                            "sets": 4,
                            "reps": "8-12",
                        }
                    ],
                }
            ]
        },
    )
    return plan["id"]


def test_the_portal_serves_the_active_training_plan(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    authenticated_client.post(
        f"/api/clients/{client_id}/training-plans",
        json={"title": "Plan Viejo", "status": "archived"},
    )
    _give_active_training_plan(
        authenticated_client, client_id, imported_exercise.id, "Plan En Curso"
    )

    body = authenticated_client.get(f"/api/portal/{token}/training-plan").json()

    assert body["plan_title"] == "Plan En Curso"
    exercise = body["weeks"][0]["days"][0]["exercises"][0]
    assert exercise["sets"] == 4
    # The client gets the exercise by name and picture, never by catalogue id.
    assert exercise["name_es"]
    assert "exercise_id" not in exercise


def test_a_token_never_reaches_another_clients_plan(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    mine_id, my_token = _client_with_token(authenticated_client, "Cliente Propio")
    other_id, _ = _client_with_token(authenticated_client, "Cliente Ajeno")

    _give_active_training_plan(
        authenticated_client, mine_id, imported_exercise.id, "Mi Plan"
    )
    _give_active_training_plan(
        authenticated_client, other_id, imported_exercise.id, "Plan Ajeno"
    )

    body = authenticated_client.get(f"/api/portal/{my_token}/training-plan").json()

    assert body["plan_title"] == "Mi Plan"
    assert body["client_name"] == "Cliente Propio"


def test_the_portal_says_404_when_there_is_no_active_plan_yet(
    authenticated_client: TestClient,
) -> None:
    _, token = _client_with_token(authenticated_client)

    training = authenticated_client.get(f"/api/portal/{token}/training-plan")
    diet = authenticated_client.get(f"/api/portal/{token}/diet-plan")

    assert training.status_code == 404
    assert diet.status_code == 404


def test_the_home_announces_what_there_is_to_open(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, token = _client_with_token(authenticated_client)

    empty = authenticated_client.get(f"/api/portal/{token}").json()
    assert empty["has_training_plan"] is False
    assert empty["has_diet_plan"] is False
    assert empty["weigh_in_count"] == 0

    _give_active_training_plan(
        authenticated_client, client_id, imported_exercise.id, "Plan En Curso"
    )
    authenticated_client.post(
        f"/api/clients/{client_id}/measurements",
        json={"measured_on": "2026-08-09", "weight_kg": 79.5},
    )

    filled = authenticated_client.get(f"/api/portal/{token}").json()
    assert filled["has_training_plan"] is True
    assert filled["weigh_in_count"] == 1


def test_the_portal_serves_only_its_own_weigh_ins(
    authenticated_client: TestClient,
) -> None:
    mine_id, my_token = _client_with_token(authenticated_client, "Peso Propio")
    other_id, _ = _client_with_token(authenticated_client, "Peso Ajeno")

    authenticated_client.post(
        f"/api/clients/{mine_id}/measurements",
        json={"measured_on": "2026-08-01", "weight_kg": 70},
    )
    authenticated_client.post(
        f"/api/clients/{other_id}/measurements",
        json={"measured_on": "2026-08-01", "weight_kg": 95},
    )

    body = authenticated_client.get(f"/api/portal/{my_token}/measurements").json()

    assert [row["weight_kg"] for row in body] == [70.0]
    # Neither the client id nor the trainer's private notes travel to the phone.
    assert "client_id" not in body[0]
    assert "notes" not in body[0]


def test_the_client_can_download_their_own_plan_in_word(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    _give_active_training_plan(
        authenticated_client, client_id, imported_exercise.id, "Plan Descargable"
    )

    response = authenticated_client.get(
        f"/api/portal/{token}/training-plan/export/docx"
    )

    assert response.status_code == 200
    assert response.content[:2] == b"PK"  # a .docx is a zip archive


def test_the_client_records_todays_weight_from_the_portal(
    authenticated_client: TestClient, client: TestClient
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    authenticated_client.patch(f"/api/clients/{client_id}", json={"height_cm": 180})

    client.cookies.clear()
    response = client.post(
        f"/api/portal/{token}/measurements", json={"weight_kg": 79.4}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["weight_kg"] == 79.4
    assert body["measured_on"] == date.today().isoformat()
    assert body["bmi"] == 24.5


def test_weighing_in_twice_the_same_day_corrects_the_entry(
    authenticated_client: TestClient,
) -> None:
    client_id, token = _client_with_token(authenticated_client)

    authenticated_client.post(
        f"/api/portal/{token}/measurements", json={"weight_kg": 88}
    )
    authenticated_client.post(
        f"/api/portal/{token}/measurements", json={"weight_kg": 80.5}
    )

    history = authenticated_client.get(f"/api/portal/{token}/measurements").json()
    assert [row["weight_kg"] for row in history] == [80.5]

    # And the trainer sees the same single entry, not two.
    trainer_view = authenticated_client.get(
        f"/api/clients/{client_id}/measurements"
    ).json()
    assert len(trainer_view) == 1


def test_an_absurd_weight_is_rejected(authenticated_client: TestClient) -> None:
    _, token = _client_with_token(authenticated_client)

    too_heavy = authenticated_client.post(
        f"/api/portal/{token}/measurements", json={"weight_kg": 900}
    )
    negative = authenticated_client.post(
        f"/api/portal/{token}/measurements", json={"weight_kg": -5}
    )

    assert too_heavy.status_code == 422
    assert negative.status_code == 422


def test_a_dead_link_cannot_write_either(authenticated_client: TestClient) -> None:
    client_id, token = _client_with_token(authenticated_client)
    authenticated_client.delete(f"/api/clients/{client_id}/portal-token")

    response = authenticated_client.post(
        f"/api/portal/{token}/measurements", json={"weight_kg": 75}
    )

    assert response.status_code == 404


def test_the_portal_writes_nothing_else(authenticated_client: TestClient) -> None:
    """The client may only touch their weight — no other verb is exposed."""
    _, token = _client_with_token(authenticated_client)

    assert (
        authenticated_client.post(
            f"/api/portal/{token}/training-plan", json={"title": "Mi plan"}
        ).status_code
        == 405
    )
    assert (
        authenticated_client.delete(f"/api/portal/{token}/measurements").status_code
        == 405
    )


def test_managing_the_token_requires_the_trainer_session(
    authenticated_client: TestClient, client: TestClient
) -> None:
    client_id, _ = _client_with_token(authenticated_client)

    client.cookies.clear()
    assert client.post(f"/api/clients/{client_id}/portal-token").status_code == 401
    assert client.delete(f"/api/clients/{client_id}/portal-token").status_code == 401
