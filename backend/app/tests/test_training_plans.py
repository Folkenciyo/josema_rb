from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Exercise


def test_duplicate_training_week_copies_days_and_exercises(
    authenticated_client: TestClient, db_session: Session
) -> None:
    exercise = (
        db_session.query(Exercise)
        .filter(Exercise.created_by_trainer_id.is_(None))
        .first()
    )
    assert exercise is not None

    client_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Cliente Entreno"}
    ).json()["id"]
    plan = authenticated_client.post(
        f"/api/clients/{client_id}/training-plans", json={"title": "Plan Fuerza"}
    ).json()
    week = authenticated_client.post(
        f"/api/training-plans/{plan['id']}/weeks", json={"week_number": 1}
    ).json()

    days_payload = {
        "days": [
            {
                "day_of_week": "monday",
                "order_index": 0,
                "exercises": [
                    {
                        "exercise_id": exercise.id,
                        "order_index": 0,
                        "sets": 4,
                        "reps": "8-12",
                    }
                ],
            }
        ]
    }
    set_resp = authenticated_client.put(
        f"/api/training-weeks/{week['id']}/days", json=days_payload
    )
    assert set_resp.status_code == 200

    dup_resp = authenticated_client.post(
        f"/api/training-weeks/{week['id']}/duplicate", json={"week_number": 2}
    )
    assert dup_resp.status_code == 201
    body = dup_resp.json()
    assert body["week_number"] == 2
    assert len(body["days"]) == 1
    assert body["days"][0]["exercises"][0]["exercise_id"] == exercise.id
    assert body["days"][0]["exercises"][0]["sets"] == 4


def test_client_has_multiple_training_plans_as_history(
    authenticated_client: TestClient,
) -> None:
    client_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Cliente Historial"}
    ).json()["id"]

    plan1 = authenticated_client.post(
        f"/api/clients/{client_id}/training-plans", json={"title": "Plan Enero"}
    )
    plan2 = authenticated_client.post(
        f"/api/clients/{client_id}/training-plans", json={"title": "Plan Febrero"}
    )
    assert plan1.status_code == 201
    assert plan2.status_code == 201

    list_resp = authenticated_client.get(f"/api/clients/{client_id}/training-plans")
    assert len(list_resp.json()) == 2
