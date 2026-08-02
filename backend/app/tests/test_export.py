import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Exercise
from app.services import docx_export, export_service, pdf_export


def _build_training_plan(client: TestClient, exercise: Exercise) -> str:
    client_id = client.post(
        "/api/clients", json={"full_name": "Cliente Export Training"}
    ).json()["id"]
    plan = client.post(
        f"/api/clients/{client_id}/training-plans", json={"title": "Plan Fuerza"}
    ).json()
    week = client.post(
        f"/api/training-plans/{plan['id']}/weeks", json={"week_number": 1}
    ).json()
    client.put(
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
                            "sets": 4,
                            "reps": "8-12",
                            "rest_seconds": 90,
                        }
                    ],
                },
                {"day_of_week": "tuesday", "order_index": 1, "exercises": []},
            ]
        },
    )
    return plan["id"]


def _build_diet_plan(client: TestClient) -> str:
    mt = client.post(
        "/api/meal-templates",
        json={
            "name": "Desayuno",
            "items": [
                {
                    "food_name": "Avena con leche",
                    "calories": 350,
                    "protein_g": 15,
                    "carbs_g": 50,
                    "fat_g": 8,
                }
            ],
        },
    ).json()
    menu = client.post(
        "/api/menus",
        json={
            "name": "Menu Base",
            "meals": [{"meal_template_id": mt["id"], "order_index": 0}],
        },
    ).json()

    client_id = client.post(
        "/api/clients", json={"full_name": "Cliente Export Dieta"}
    ).json()["id"]
    plan = client.post(
        f"/api/clients/{client_id}/diet-plans",
        json={
            "title": "Plan Dieta",
            "daily_calories_target": 2000,
            "daily_protein_g": 150,
        },
    ).json()
    week = client.post(
        f"/api/diet-plans/{plan['id']}/weeks", json={"week_number": 1}
    ).json()
    client.put(
        f"/api/diet-weeks/{week['id']}/days",
        json={
            "days": [
                {"day_of_week": "monday", "order_index": 0, "menu_id": menu["id"]},
                {"day_of_week": "tuesday", "order_index": 1},
            ]
        },
    )
    return plan["id"]


def test_training_plan_document_normalizes_days_and_exercises(
    authenticated_client: TestClient, db_session: Session, imported_exercise: Exercise
) -> None:
    plan_id = _build_training_plan(authenticated_client, imported_exercise)

    document = export_service.build_training_plan_document(db_session, plan_id)

    assert document.plan_title == "Plan Fuerza"
    assert document.client_name == "Cliente Export Training"
    week = document.weeks[0]
    monday = next(d for d in week.days if d.day_of_week_es == "Lunes")
    assert monday.exercises[0].name_es == imported_exercise.name_es
    assert monday.exercises[0].sets == 4
    tuesday = next(d for d in week.days if d.day_of_week_es == "Martes")
    assert tuesday.exercises == []


def test_diet_plan_document_normalizes_menus_and_totals(
    authenticated_client: TestClient, db_session: Session
) -> None:
    plan_id = _build_diet_plan(authenticated_client)

    document = export_service.build_diet_plan_document(db_session, plan_id)

    assert document.daily_calories_target == pytest.approx(2000)
    week = document.weeks[0]
    monday = next(d for d in week.days if d.day_of_week_es == "Lunes")
    assert monday.menu_name == "Menu Base"
    assert monday.meals[0].name == "Desayuno"
    assert monday.totals.calories == pytest.approx(350)
    tuesday = next(d for d in week.days if d.day_of_week_es == "Martes")
    assert tuesday.menu_name is None
    assert tuesday.meals == []


def test_render_training_plan_docx_produces_valid_docx(
    authenticated_client: TestClient, db_session: Session, imported_exercise: Exercise
) -> None:
    plan_id = _build_training_plan(authenticated_client, imported_exercise)
    document = export_service.build_training_plan_document(db_session, plan_id)

    docx_bytes = docx_export.render_training_plan_docx(document)

    assert docx_bytes[:2] == b"PK"  # .docx files are zip archives


def test_render_diet_plan_docx_produces_valid_docx(
    authenticated_client: TestClient, db_session: Session
) -> None:
    plan_id = _build_diet_plan(authenticated_client)
    document = export_service.build_diet_plan_document(db_session, plan_id)

    docx_bytes = docx_export.render_diet_plan_docx(document)

    assert docx_bytes[:2] == b"PK"


def test_render_training_plan_pdf(
    authenticated_client: TestClient, db_session: Session, imported_exercise: Exercise
) -> None:
    plan_id = _build_training_plan(authenticated_client, imported_exercise)
    document = export_service.build_training_plan_document(db_session, plan_id)

    try:
        pdf_bytes = pdf_export.render_training_plan_pdf(document)
    except OSError as exc:
        pytest.skip(f"WeasyPrint native libraries not available: {exc}")

    assert pdf_bytes.startswith(b"%PDF")


def test_render_diet_plan_pdf(
    authenticated_client: TestClient, db_session: Session
) -> None:
    plan_id = _build_diet_plan(authenticated_client)
    document = export_service.build_diet_plan_document(db_session, plan_id)

    try:
        pdf_bytes = pdf_export.render_diet_plan_pdf(document)
    except OSError as exc:
        pytest.skip(f"WeasyPrint native libraries not available: {exc}")

    assert pdf_bytes.startswith(b"%PDF")


def test_export_endpoints_return_files(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    plan_id = _build_training_plan(authenticated_client, imported_exercise)

    docx_response = authenticated_client.get(
        f"/api/training-plans/{plan_id}/export/docx"
    )
    assert docx_response.status_code == 200
    assert docx_response.content[:2] == b"PK"

    try:
        pdf_response = authenticated_client.get(
            f"/api/training-plans/{plan_id}/export/pdf"
        )
    except OSError as exc:
        pytest.skip(f"WeasyPrint native libraries not available: {exc}")
    assert pdf_response.status_code == 200
    assert pdf_response.content.startswith(b"%PDF")
