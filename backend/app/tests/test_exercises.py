from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Exercise


def test_filters_returns_known_muscle(authenticated_client: TestClient) -> None:
    response = authenticated_client.get("/api/exercises/filters")

    assert response.status_code == 200
    assert "Abdominales" in response.json()["muscles"]


def test_list_filters_by_search(authenticated_client: TestClient) -> None:
    response = authenticated_client.get(
        "/api/exercises", params={"search": "Sentadilla"}
    )

    assert response.status_code == 200
    exercises = response.json()
    assert len(exercises) > 0
    assert all("sentadilla" in ex["name_es"].lower() for ex in exercises)


def test_cannot_edit_imported_exercise(
    authenticated_client: TestClient, db_session: Session
) -> None:
    imported = (
        db_session.query(Exercise)
        .filter(Exercise.created_by_trainer_id.is_(None))
        .first()
    )
    assert imported is not None

    response = authenticated_client.patch(
        f"/api/exercises/{imported.id}", data={"name_es": "Nombre hackeado"}
    )

    assert response.status_code == 403


def test_cannot_delete_imported_exercise(
    authenticated_client: TestClient, db_session: Session
) -> None:
    imported = (
        db_session.query(Exercise)
        .filter(Exercise.created_by_trainer_id.is_(None))
        .first()
    )

    response = authenticated_client.delete(f"/api/exercises/{imported.id}")

    assert response.status_code == 403


def test_create_own_exercise_and_edit_it(authenticated_client: TestClient) -> None:
    create_response = authenticated_client.post(
        "/api/exercises",
        data={
            "name_es": "Ejercicio Personalizado",
            "instructions_es": '["Paso uno", "Paso dos"]',
        },
    )
    assert create_response.status_code == 201
    exercise_id = create_response.json()["id"]

    update_response = authenticated_client.patch(
        f"/api/exercises/{exercise_id}",
        data={"name_es": "Ejercicio Editado"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["name_es"] == "Ejercicio Editado"

    delete_response = authenticated_client.delete(f"/api/exercises/{exercise_id}")
    assert delete_response.status_code == 204
