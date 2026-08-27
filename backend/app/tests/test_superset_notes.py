"""The note that belongs to a superset block rather than to one exercise."""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.api.portal import portal_limiter
from app.models import Exercise


@pytest.fixture(autouse=True)
def clean_limiter() -> Generator[None, None, None]:
    portal_limiter.reset()
    yield
    portal_limiter.reset()


def _superset_day(api: TestClient, exercise_id: str, note: str) -> tuple[str, str]:
    """A client whose active routine is one day with a single superset in it."""
    client_id = api.post("/api/clients", json={"full_name": "Cliente Nota"}).json()[
        "id"
    ]
    token = api.post(f"/api/clients/{client_id}/portal-token").json()["portal_token"]
    plan = api.post(
        f"/api/clients/{client_id}/training-plans",
        json={"title": "Rutina", "status": "active"},
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
                            "reps": "10",
                            "superset_group": 1,
                            "superset_note": note,
                        },
                        {
                            "exercise_id": exercise_id,
                            "order_index": 1,
                            "sets": 3,
                            "reps": "12",
                            "superset_group": 1,
                            # Sent on the second half too: it must not stick.
                            "superset_note": "no debería guardarse",
                        },
                    ],
                }
            ]
        },
    )
    return client_id, token


def test_only_the_exercise_that_opens_the_block_keeps_the_note(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, _ = _superset_day(
        authenticated_client, imported_exercise.id, "Sin soltar la barra"
    )

    plan_id = authenticated_client.get(f"/api/clients/{client_id}").json()[
        "training_plans"
    ][0]["id"]
    exercises = authenticated_client.get(f"/api/training-plans/{plan_id}").json()[
        "weeks"
    ][0]["days"][0]["exercises"]

    assert exercises[0]["superset_note"] == "Sin soltar la barra"
    assert exercises[1]["superset_note"] is None


def test_the_note_reaches_the_client_routine_and_the_training_screen(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, token = _superset_day(
        authenticated_client, imported_exercise.id, "Sin soltar la barra"
    )

    routine = authenticated_client.get(f"/api/portal/{token}/training-plan").json()
    exercises = routine["weeks"][0]["days"][0]["exercises"]
    assert exercises[0]["superset_note"] == "Sin soltar la barra"
    assert exercises[1]["superset_note"] is None

    day_id = authenticated_client.get(f"/api/portal/{token}/workout/days").json()[0][
        "id"
    ]
    day = authenticated_client.get(f"/api/portal/{token}/workout/days/{day_id}").json()
    assert day["exercises"][0]["superset_note"] == "Sin soltar la barra"


def test_ungrouping_a_superset_drops_the_note_it_described(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, _ = _superset_day(
        authenticated_client, imported_exercise.id, "Sin soltar la barra"
    )
    plan_id = authenticated_client.get(f"/api/clients/{client_id}").json()[
        "training_plans"
    ][0]["id"]
    week_id = authenticated_client.get(f"/api/training-plans/{plan_id}").json()[
        "weeks"
    ][0]["id"]

    authenticated_client.put(
        f"/api/training-weeks/{week_id}/days",
        json={
            "days": [
                {
                    "day_of_week": "monday",
                    "order_index": 0,
                    "exercises": [
                        {
                            "exercise_id": imported_exercise.id,
                            "order_index": 0,
                            "sets": 3,
                            "reps": "10",
                            "superset_group": None,
                            "superset_note": "Sin soltar la barra",
                        }
                    ],
                }
            ]
        },
    )

    exercises = authenticated_client.get(f"/api/training-plans/{plan_id}").json()[
        "weeks"
    ][0]["days"][0]["exercises"]
    assert exercises[0]["superset_note"] is None


def test_the_note_survives_being_copied_onto_another_client(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    source_id, _ = _superset_day(
        authenticated_client, imported_exercise.id, "Sin soltar la barra"
    )
    plan_id = authenticated_client.get(f"/api/clients/{source_id}").json()[
        "training_plans"
    ][0]["id"]
    target_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Cliente Destino"}
    ).json()["id"]

    copy = authenticated_client.post(
        f"/api/clients/{target_id}/training-plans/from/{plan_id}", json={}
    )
    assert copy.status_code == 201

    exercises = authenticated_client.get(
        f"/api/training-plans/{copy.json()['id']}"
    ).json()["weeks"][0]["days"][0]["exercises"]
    assert exercises[0]["superset_note"] == "Sin soltar la barra"
