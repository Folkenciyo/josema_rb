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


def _create_week(authenticated_client: TestClient) -> tuple[str, str]:
    client_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Cliente Entreno"}
    ).json()["id"]
    plan = authenticated_client.post(
        f"/api/clients/{client_id}/training-plans", json={"title": "Plan Fuerza"}
    ).json()
    week = authenticated_client.post(
        f"/api/training-plans/{plan['id']}/weeks", json={"week_number": 1}
    ).json()
    return plan["id"], week["id"]


def test_a_time_based_exercise_stores_duration_instead_of_reps(
    authenticated_client: TestClient, db_session: Session
) -> None:
    exercise = (
        db_session.query(Exercise)
        .filter(Exercise.created_by_trainer_id.is_(None))
        .first()
    )
    assert exercise is not None
    _, week_id = _create_week(authenticated_client)

    days_payload = {
        "days": [
            {
                "day_of_week": "monday",
                "order_index": 0,
                "exercises": [
                    {
                        "exercise_id": exercise.id,
                        "order_index": 0,
                        "sets": 3,
                        "measurement": "time",
                        "duration_seconds": 45,
                    }
                ],
            }
        ]
    }
    set_resp = authenticated_client.put(
        f"/api/training-weeks/{week_id}/days", json=days_payload
    )
    assert set_resp.status_code == 200
    saved = set_resp.json()["days"][0]["exercises"][0]
    assert saved["measurement"] == "time"
    assert saved["duration_seconds"] == 45
    assert saved["reps"] is None


def test_a_time_based_exercise_without_duration_is_rejected(
    authenticated_client: TestClient, db_session: Session
) -> None:
    exercise = (
        db_session.query(Exercise)
        .filter(Exercise.created_by_trainer_id.is_(None))
        .first()
    )
    assert exercise is not None
    _, week_id = _create_week(authenticated_client)

    days_payload = {
        "days": [
            {
                "day_of_week": "monday",
                "order_index": 0,
                "exercises": [
                    {
                        "exercise_id": exercise.id,
                        "order_index": 0,
                        "sets": 3,
                        "measurement": "time",
                    }
                ],
            }
        ]
    }
    set_resp = authenticated_client.put(
        f"/api/training-weeks/{week_id}/days", json=days_payload
    )
    assert set_resp.status_code == 422


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


def _plan_with_weeks(api: TestClient, count: int) -> tuple[str, list[dict]]:
    client_id = api.post("/api/clients", json={"full_name": "Cliente Semanas"}).json()[
        "id"
    ]
    plan = api.post(
        f"/api/clients/{client_id}/training-plans", json={"title": "Mesociclo"}
    ).json()
    weeks = [
        api.post(
            f"/api/training-plans/{plan['id']}/weeks",
            json={"week_number": number, "notes": f"Semana {number}"},
        ).json()
        for number in range(1, count + 1)
    ]
    return plan["id"], weeks


def test_a_week_added_by_mistake_can_be_removed(
    authenticated_client: TestClient,
) -> None:
    plan_id, weeks = _plan_with_weeks(authenticated_client, 2)

    deleted = authenticated_client.delete(f"/api/training-weeks/{weeks[1]['id']}")

    assert deleted.status_code == 204
    detail = authenticated_client.get(f"/api/training-plans/{plan_id}").json()
    assert [week["notes"] for week in detail["weeks"]] == ["Semana 1"]


def test_removing_a_week_closes_the_gap_in_the_numbering(
    authenticated_client: TestClient,
) -> None:
    """Leaving "semana 1, semana 3" would read as a week gone missing."""
    plan_id, weeks = _plan_with_weeks(authenticated_client, 3)

    authenticated_client.delete(f"/api/training-weeks/{weeks[1]['id']}")

    detail = authenticated_client.get(f"/api/training-plans/{plan_id}").json()
    assert [week["week_number"] for week in detail["weeks"]] == [1, 2]
    assert [week["notes"] for week in detail["weeks"]] == ["Semana 1", "Semana 3"]
