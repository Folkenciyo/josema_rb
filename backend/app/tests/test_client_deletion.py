"""Erasing a client for good, as opposed to deactivating them."""

from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Client, Exercise, TrainingPlan


def _client_with_everything(
    api: TestClient, exercise: Exercise, name: str = "Cliente Que Se Va"
) -> tuple[str, str]:
    """A client carrying one of each thing that hangs off them."""
    client_id = api.post("/api/clients", json={"full_name": name}).json()["id"]
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
                            "exercise_id": exercise.id,
                            "order_index": 0,
                            "sets": 3,
                            "reps": "10",
                        }
                    ],
                }
            ]
        },
    )

    api.post(
        f"/api/clients/{client_id}/measurements",
        json={"measured_on": date.today().isoformat(), "weight_kg": 80},
    )

    day_id = api.get(f"/api/portal/{token}/workout/days").json()[0]["id"]
    api.post(
        f"/api/portal/{token}/workouts",
        json={
            "device_session_id": "device-deletion-1",
            "training_day_id": day_id,
            "performed_on": date.today().isoformat(),
            "sets": [
                {
                    "exercise_name": exercise.name_es,
                    "order_index": 0,
                    "set_number": 1,
                    "weight_kg": 40,
                    "reps": 10,
                }
            ],
        },
    )

    return client_id, token


def test_deleting_a_client_takes_their_plans_and_history_with_them(
    authenticated_client: TestClient, imported_exercise: Exercise, db_session: Session
) -> None:
    client_id, token = _client_with_everything(authenticated_client, imported_exercise)
    plan_count_before = (
        db_session.query(TrainingPlan)
        .filter(TrainingPlan.client_id == client_id)
        .count()
    )
    assert plan_count_before == 1

    response = authenticated_client.delete(f"/api/clients/{client_id}/permanent")
    assert response.status_code == 204

    assert authenticated_client.get(f"/api/clients/{client_id}").status_code == 404
    assert db_session.query(Client).filter(Client.id == client_id).count() == 0
    assert (
        db_session.query(TrainingPlan)
        .filter(TrainingPlan.client_id == client_id)
        .count()
        == 0
    )
    # The link dies with the client, so a copy of it in a chat leads nowhere.
    assert authenticated_client.get(f"/api/portal/{token}").status_code == 404


def test_deleting_a_client_leaves_the_others_alone(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    doomed_id, _ = _client_with_everything(
        authenticated_client, imported_exercise, name="Cliente Borrado"
    )
    kept_id, _ = _client_with_everything(
        authenticated_client, imported_exercise, name="Cliente Que Sigue"
    )

    authenticated_client.delete(f"/api/clients/{doomed_id}/permanent")

    assert authenticated_client.get(f"/api/clients/{kept_id}").status_code == 200
    listed = [c["id"] for c in authenticated_client.get("/api/clients").json()]
    assert kept_id in listed
    assert doomed_id not in listed


def test_deleting_an_unknown_client_is_a_404(
    authenticated_client: TestClient,
) -> None:
    unknown_id = "00000000-0000-0000-0000-000000000000"
    response = authenticated_client.delete(f"/api/clients/{unknown_id}/permanent")
    assert response.status_code == 404


def test_a_template_survives_the_client_it_was_saved_from(
    authenticated_client: TestClient, imported_exercise: Exercise, db_session: Session
) -> None:
    """A template belongs to the trainer: deleting the client must not touch it."""
    client_id, _ = _client_with_everything(authenticated_client, imported_exercise)
    plan_id = authenticated_client.get(f"/api/clients/{client_id}").json()[
        "training_plans"
    ][0]["id"]
    template_id = authenticated_client.post(
        f"/api/training-plans/{plan_id}/save-as-template", json={}
    ).json()["id"]

    authenticated_client.delete(f"/api/clients/{client_id}/permanent")

    assert (
        db_session.query(TrainingPlan).filter(TrainingPlan.id == template_id).count()
        == 1
    )
