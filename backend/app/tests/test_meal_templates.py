import pytest
from fastapi.testclient import TestClient


def test_meal_template_item_auto_computes_macros_from_food(
    authenticated_client: TestClient,
) -> None:
    food_resp = authenticated_client.post(
        "/api/foods",
        json={
            "name": "Pechuga de pollo",
            "unit_label": "100 g",
            "calories": 165,
            "protein_g": 31,
            "carbs_g": 0,
            "fat_g": 3.6,
        },
    )
    assert food_resp.status_code == 201
    food_id = food_resp.json()["id"]

    mt_resp = authenticated_client.post(
        "/api/meal-templates",
        json={
            "name": "Desayuno proteico",
            "items": [
                {
                    "food_id": food_id,
                    "quantity_label": "150 g",
                    "quantity_multiplier": 1.5,
                }
            ],
        },
    )
    assert mt_resp.status_code == 201
    body = mt_resp.json()
    item = body["items"][0]
    assert item["calories"] == pytest.approx(247.5)
    assert item["protein_g"] == pytest.approx(46.5)
    assert body["totals"]["protein_g"] == pytest.approx(46.5)


def test_meal_template_item_requires_manual_macros_without_food(
    authenticated_client: TestClient,
) -> None:
    response = authenticated_client.post(
        "/api/meal-templates",
        json={"name": "Comida manual", "items": [{"food_name": "Arroz"}]},
    )
    assert response.status_code == 422


def test_cannot_delete_meal_template_used_by_menu(
    authenticated_client: TestClient,
) -> None:
    mt_resp = authenticated_client.post(
        "/api/meal-templates",
        json={
            "name": "Cena ligera",
            "items": [
                {
                    "food_name": "Pescado",
                    "calories": 200,
                    "protein_g": 30,
                    "carbs_g": 0,
                    "fat_g": 8,
                }
            ],
        },
    )
    meal_template_id = mt_resp.json()["id"]

    menu_resp = authenticated_client.post(
        "/api/menus",
        json={
            "name": "Menu Test",
            "meals": [{"meal_template_id": meal_template_id, "order_index": 0}],
        },
    )
    assert menu_resp.status_code == 201

    delete_resp = authenticated_client.delete(f"/api/meal-templates/{meal_template_id}")
    assert delete_resp.status_code == 409
