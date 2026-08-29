"""A day of the routine carries its own note, and it has to reach everybody.

"Lunes: necesito que hagas concentración de hombro" is written once by the
trainer and read in four places — the editor, the printed plan, the client's
portal and the guided workout — so what is checked here is that it survives the
trip, copies included.
"""

from fastapi.testclient import TestClient

from app.models import Exercise
from app.services import export_service

DAY_NOTE = "Concentración de hombro, sin prisa entre series"


def _plan_with_a_note_on_monday(
    api: TestClient, exercise_id: str, *, status: str = "draft"
) -> tuple[str, str]:
    client_id = api.post("/api/clients", json={"full_name": "Nuria"}).json()["id"]
    plan = api.post(
        f"/api/clients/{client_id}/training-plans",
        json={"title": "Fuerza fase 1", "status": status},
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
                    "notes": DAY_NOTE,
                    "exercises": [
                        {
                            "exercise_id": exercise_id,
                            "order_index": 0,
                            "sets": 4,
                            "reps": "8-10",
                        }
                    ],
                }
            ]
        },
    )
    return client_id, plan["id"]


def test_the_note_of_a_day_is_stored_and_read_back(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, plan_id = _plan_with_a_note_on_monday(authenticated_client, imported_exercise.id)

    detail = authenticated_client.get(f"/api/training-plans/{plan_id}").json()

    assert detail["weeks"][0]["days"][0]["notes"] == DAY_NOTE


def test_the_note_reaches_the_printed_plan(
    authenticated_client: TestClient, imported_exercise: Exercise, db_session
) -> None:
    """The same document backs the PDF, the DOCX and the client's routine."""
    _, plan_id = _plan_with_a_note_on_monday(authenticated_client, imported_exercise.id)

    document = export_service.build_training_plan_document(db_session, plan_id)

    assert document.weeks[0].days[0].notes == DAY_NOTE


def test_the_note_travels_with_a_copy_of_the_routine(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, plan_id = _plan_with_a_note_on_monday(authenticated_client, imported_exercise.id)
    target_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Marta"}
    ).json()["id"]

    copy = authenticated_client.post(
        f"/api/clients/{target_id}/training-plans/from/{plan_id}", json={}
    ).json()

    detail = authenticated_client.get(f"/api/training-plans/{copy['id']}").json()
    assert detail["weeks"][0]["days"][0]["notes"] == DAY_NOTE


def test_the_note_travels_when_the_week_is_duplicated(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, plan_id = _plan_with_a_note_on_monday(authenticated_client, imported_exercise.id)
    week_id = authenticated_client.get(f"/api/training-plans/{plan_id}").json()[
        "weeks"
    ][0]["id"]

    duplicated = authenticated_client.post(
        f"/api/training-weeks/{week_id}/duplicate", json={"week_number": 2}
    ).json()

    assert duplicated["days"][0]["notes"] == DAY_NOTE


def test_the_client_reads_the_note_before_training(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    """The guided workout opens with what the trainer asked of the day."""
    client_id, _ = _plan_with_a_note_on_monday(
        authenticated_client, imported_exercise.id, status="active"
    )
    token = authenticated_client.post(f"/api/clients/{client_id}/portal-token").json()[
        "portal_token"
    ]

    days = authenticated_client.get(f"/api/portal/{token}/workout/days").json()
    day = authenticated_client.get(
        f"/api/portal/{token}/workout/days/{days[0]['id']}"
    ).json()

    assert day["notes"] == DAY_NOTE


def test_a_rest_day_can_be_kept_for_its_note_alone(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    """ "Descansa y estira" is worth saying, but it is not a session to log."""
    client_id, plan_id = _plan_with_a_note_on_monday(
        authenticated_client, imported_exercise.id, status="active"
    )
    week_id = authenticated_client.get(f"/api/training-plans/{plan_id}").json()[
        "weeks"
    ][0]["id"]
    authenticated_client.put(
        f"/api/training-weeks/{week_id}/days",
        json={
            "days": [
                {
                    "day_of_week": "sunday",
                    "order_index": 0,
                    "notes": "Descansa y estira",
                    "exercises": [],
                }
            ]
        },
    )
    token = authenticated_client.post(f"/api/clients/{client_id}/portal-token").json()[
        "portal_token"
    ]

    plan = authenticated_client.get(f"/api/portal/{token}/training-plan").json()
    assert plan["weeks"][0]["days"][0]["notes"] == "Descansa y estira"
    # Nothing to train, so the guided workout does not offer the day at all.
    assert authenticated_client.get(f"/api/portal/{token}/workout/days").json() == []
