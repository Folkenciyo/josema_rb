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


def _imported_exercise(db_session: Session) -> Exercise:
    imported = (
        db_session.query(Exercise)
        .filter(Exercise.created_by_trainer_id.is_(None))
        .first()
    )
    assert imported is not None
    return imported


def test_editing_an_imported_exercise_takes_it_over(
    authenticated_client: TestClient, db_session: Session
) -> None:
    imported = _imported_exercise(db_session)

    response = authenticated_client.patch(
        f"/api/exercises/{imported.id}", data={"name_es": "Jalón al pecho (mi nombre)"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["name_es"] == "Jalón al pecho (mi nombre)"
    # From here on it is the trainer's copy and the seed leaves it alone.
    assert body["created_by_trainer_id"] is not None


def test_cannot_delete_imported_exercise(
    authenticated_client: TestClient, db_session: Session
) -> None:
    imported = _imported_exercise(db_session)

    response = authenticated_client.delete(f"/api/exercises/{imported.id}")

    assert response.status_code == 403


def test_hiding_an_exercise_takes_it_out_of_the_list(
    authenticated_client: TestClient, db_session: Session
) -> None:
    imported = _imported_exercise(db_session)

    hide = authenticated_client.patch(
        f"/api/exercises/{imported.id}", data={"is_hidden": "true"}
    )
    assert hide.status_code == 200
    assert hide.json()["is_hidden"] is True
    # Hiding is not editing: it does not take the exercise over.
    assert hide.json()["created_by_trainer_id"] is None

    listed = authenticated_client.get("/api/exercises").json()
    assert all(item["id"] != imported.id for item in listed)

    hidden = authenticated_client.get(
        "/api/exercises", params={"visibility": "hidden"}
    ).json()
    assert any(item["id"] == imported.id for item in hidden)

    # The routine builder needs to name what it already has on screen.
    everything = authenticated_client.get(
        "/api/exercises", params={"visibility": "all"}
    ).json()
    assert any(item["id"] == imported.id for item in everything)

    restore = authenticated_client.patch(
        f"/api/exercises/{imported.id}", data={"is_hidden": "false"}
    )
    assert restore.status_code == 200
    restored = authenticated_client.get("/api/exercises").json()
    assert any(item["id"] == imported.id for item in restored)


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
