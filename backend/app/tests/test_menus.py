import pytest
from fastapi.testclient import TestClient


def _create_meal_template(
    client: TestClient, name: str, calories: float, protein_g: float
) -> dict:
    response = client.post(
        "/api/meal-templates",
        json={
            "name": name,
            "items": [
                {
                    "food_name": name,
                    "calories": calories,
                    "protein_g": protein_g,
                    "carbs_g": 0,
                    "fat_g": 0,
                }
            ],
        },
    )
    assert response.status_code == 201
    return response.json()


def test_menu_totals_sum_its_meal_templates(authenticated_client: TestClient) -> None:
    mt1 = _create_meal_template(authenticated_client, "Desayuno", 300, 10)
    mt2 = _create_meal_template(authenticated_client, "Comida", 500, 40)

    menu_resp = authenticated_client.post(
        "/api/menus",
        json={
            "name": "Menu Definicion",
            "meals": [
                {"meal_template_id": mt1["id"], "order_index": 0},
                {"meal_template_id": mt2["id"], "order_index": 1},
            ],
        },
    )
    assert menu_resp.status_code == 201
    totals = menu_resp.json()["totals"]
    assert totals["calories"] == pytest.approx(800)
    assert totals["protein_g"] == pytest.approx(50)


def test_cannot_delete_menu_assigned_to_diet_day(
    authenticated_client: TestClient,
) -> None:
    mt = _create_meal_template(authenticated_client, "Comida", 200, 30)
    menu = authenticated_client.post(
        "/api/menus",
        json={
            "name": "Menu X",
            "meals": [{"meal_template_id": mt["id"], "order_index": 0}],
        },
    ).json()

    client_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Cliente Dieta"}
    ).json()["id"]
    plan = authenticated_client.post(
        f"/api/clients/{client_id}/diet-plans", json={"title": "Plan Dieta"}
    ).json()
    week = authenticated_client.post(
        f"/api/diet-plans/{plan['id']}/weeks", json={"week_number": 1}
    ).json()
    authenticated_client.put(
        f"/api/diet-weeks/{week['id']}/days",
        json={
            "days": [{"day_of_week": "monday", "order_index": 0, "menu_id": menu["id"]}]
        },
    )

    delete_resp = authenticated_client.delete(f"/api/menus/{menu['id']}")
    assert delete_resp.status_code == 409
