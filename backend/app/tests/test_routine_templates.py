from fastapi.testclient import TestClient

from app.models import Exercise


def _client_with_routine(
    api: TestClient, exercise_id: str, name: str, title: str
) -> tuple[str, str]:
    """A client with a two-day routine, which is what a copy has to carry over."""
    client_id = api.post("/api/clients", json={"full_name": name}).json()["id"]
    plan = api.post(
        f"/api/clients/{client_id}/training-plans",
        json={"title": title, "status": "active"},
    ).json()
    week = api.post(
        f"/api/training-plans/{plan['id']}/weeks",
        json={"week_number": 1, "notes": "Semana de adaptación"},
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
                            "reps": "8-10",
                            "rest_seconds": 120,
                            "notes": "Sube el peso si llegas sobrado",
                        }
                    ],
                },
                {"day_of_week": "wednesday", "order_index": 1, "exercises": []},
            ]
        },
    )
    return client_id, plan["id"]


def test_a_routine_is_copied_onto_another_client_whole(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, source_plan_id = _client_with_routine(
        authenticated_client, imported_exercise.id, "Laura", "Fuerza fase 1"
    )
    target_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Marta"}
    ).json()["id"]

    copy = authenticated_client.post(
        f"/api/clients/{target_id}/training-plans/from/{source_plan_id}",
        json={"title": "Fuerza de Marta"},
    )

    assert copy.status_code == 201
    detail = authenticated_client.get(f"/api/training-plans/{copy.json()['id']}").json()
    assert detail["title"] == "Fuerza de Marta"
    assert detail["weeks"][0]["notes"] == "Semana de adaptación"
    exercise = detail["weeks"][0]["days"][0]["exercises"][0]
    assert exercise["sets"] == 4
    assert exercise["notes"] == "Sube el peso si llegas sobrado"


def test_the_copy_starts_as_a_draft_with_no_dates(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    """Copying must not quietly put a second plan in charge of the client."""
    _, source_plan_id = _client_with_routine(
        authenticated_client, imported_exercise.id, "Laura", "Fuerza fase 1"
    )
    target_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Marta"}
    ).json()["id"]

    copy = authenticated_client.post(
        f"/api/clients/{target_id}/training-plans/from/{source_plan_id}", json={}
    ).json()

    assert copy["status"] == "draft"
    assert copy["start_date"] is None


def test_editing_the_copy_leaves_the_original_alone(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, source_plan_id = _client_with_routine(
        authenticated_client, imported_exercise.id, "Laura", "Fuerza fase 1"
    )
    target_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Marta"}
    ).json()["id"]
    copy_id = authenticated_client.post(
        f"/api/clients/{target_id}/training-plans/from/{source_plan_id}", json={}
    ).json()["id"]

    week_id = authenticated_client.get(f"/api/training-plans/{copy_id}").json()[
        "weeks"
    ][0]["id"]
    authenticated_client.put(f"/api/training-weeks/{week_id}/days", json={"days": []})

    original = authenticated_client.get(f"/api/training-plans/{source_plan_id}").json()
    assert len(original["weeks"][0]["days"]) == 2


def test_a_plan_that_worked_becomes_a_template(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, source_plan_id = _client_with_routine(
        authenticated_client, imported_exercise.id, "Laura", "Fuerza fase 1"
    )

    template = authenticated_client.post(
        f"/api/training-plans/{source_plan_id}/save-as-template",
        json={"title": "Full body 3 días"},
    )

    assert template.status_code == 201
    templates = authenticated_client.get("/api/training-templates").json()
    assert [item["title"] for item in templates] == ["Full body 3 días"]


def test_a_template_is_not_listed_among_a_clients_plans(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    """It belongs to the trainer: it must not show up in anybody's file."""
    client_id, source_plan_id = _client_with_routine(
        authenticated_client, imported_exercise.id, "Laura", "Fuerza fase 1"
    )
    authenticated_client.post(
        f"/api/training-plans/{source_plan_id}/save-as-template",
        json={"title": "Full body"},
    )

    plans = authenticated_client.get(f"/api/clients/{client_id}/training-plans").json()

    assert [plan["title"] for plan in plans] == ["Fuerza fase 1"]


def test_a_template_can_be_built_from_scratch(
    authenticated_client: TestClient,
) -> None:
    created = authenticated_client.post(
        "/api/training-templates", json={"title": "Torso pierna"}
    )

    assert created.status_code == 201
    # And it is edited with the very same weeks-and-days editor.
    week = authenticated_client.post(
        f"/api/training-plans/{created.json()['id']}/weeks", json={"week_number": 1}
    )
    assert week.status_code == 201


def test_a_client_starts_from_a_template(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, source_plan_id = _client_with_routine(
        authenticated_client, imported_exercise.id, "Laura", "Fuerza fase 1"
    )
    template_id = authenticated_client.post(
        f"/api/training-plans/{source_plan_id}/save-as-template",
        json={"title": "Full body"},
    ).json()["id"]
    target_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Marta"}
    ).json()["id"]

    copy = authenticated_client.post(
        f"/api/clients/{target_id}/training-plans/from/{template_id}", json={}
    )

    assert copy.status_code == 201
    detail = authenticated_client.get(f"/api/training-plans/{copy.json()['id']}").json()
    assert len(detail["weeks"][0]["days"][0]["exercises"]) == 1


def test_a_template_still_exports(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    """There is no client to name on the cover, and that must not break the PDF."""
    _, source_plan_id = _client_with_routine(
        authenticated_client, imported_exercise.id, "Laura", "Fuerza fase 1"
    )
    template_id = authenticated_client.post(
        f"/api/training-plans/{source_plan_id}/save-as-template",
        json={"title": "Full body"},
    ).json()["id"]

    response = authenticated_client.get(
        f"/api/training-plans/{template_id}/export/docx"
    )

    assert response.status_code == 200
