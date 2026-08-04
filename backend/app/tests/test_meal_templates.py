import pytest
from fastapi.testclient import TestClient

CHICKEN = {
    "name": "Pechuga de pollo",
    "category": "Proteína animal",
    "subcategory": "Aves",
    "unit_amount": 100,
    "unit_type": "g",
    "calories": 165,
    "protein_g": 31,
    "carbs_g": 0,
    "sugars_g": 0,
    "fat_g": 3.6,
    "saturated_fat_g": 1,
    "fiber_g": 0,
    "salt_g": 0.1,
}

EGG = {
    "name": "Huevo M",
    "category": "Proteína animal",
    "subcategory": "Huevos",
    "unit_amount": 1,
    "unit_type": "unidad",
    "calories": 78,
    "protein_g": 6.3,
    "carbs_g": 0.6,
    "sugars_g": 0.6,
    "fat_g": 5.3,
    "saturated_fat_g": 1.6,
    "fiber_g": 0,
    "salt_g": 0.17,
}


def test_meal_template_item_auto_computes_macros_from_food(
    authenticated_client: TestClient,
) -> None:
    food_resp = authenticated_client.post("/api/foods", json=CHICKEN)
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


def test_quantity_amount_derives_the_multiplier(
    authenticated_client: TestClient,
) -> None:
    """The trainer types 150 g; the ×1.5 factor is the app's job, not theirs."""
    food_id = authenticated_client.post("/api/foods", json=CHICKEN).json()["id"]

    response = authenticated_client.post(
        "/api/meal-templates",
        json={
            "name": "Comida con gramos reales",
            "items": [{"food_id": food_id, "quantity_amount": 150}],
        },
    )

    assert response.status_code == 201
    item = response.json()["items"][0]
    assert item["quantity_amount"] == pytest.approx(150)
    assert item["quantity_unit"] == "g"
    assert item["quantity_multiplier"] == pytest.approx(1.5)
    assert item["quantity_label"] == "150 g"
    assert item["calories"] == pytest.approx(247.5)


def test_quantity_amount_works_with_countable_units(
    authenticated_client: TestClient,
) -> None:
    food_id = authenticated_client.post("/api/foods", json=EGG).json()["id"]

    response = authenticated_client.post(
        "/api/meal-templates",
        json={
            "name": "Dos huevos",
            "items": [{"food_id": food_id, "quantity_amount": 2}],
        },
    )

    item = response.json()["items"][0]
    assert item["quantity_label"] == "2 unidad"
    assert item["quantity_multiplier"] == pytest.approx(2)
    assert item["calories"] == pytest.approx(156)


def test_meal_totals_cover_the_full_label(authenticated_client: TestClient) -> None:
    chicken_id = authenticated_client.post("/api/foods", json=CHICKEN).json()["id"]
    egg_id = authenticated_client.post("/api/foods", json=EGG).json()["id"]

    response = authenticated_client.post(
        "/api/meal-templates",
        json={
            "name": "Pollo con huevo",
            "items": [
                {"food_id": chicken_id, "quantity_amount": 200},
                {"food_id": egg_id, "quantity_amount": 1},
            ],
        },
    )

    totals = response.json()["totals"]
    assert totals["calories"] == pytest.approx(408)
    assert totals["protein_g"] == pytest.approx(68.3)
    assert totals["sugars_g"] == pytest.approx(0.6)
    assert totals["saturated_fat_g"] == pytest.approx(3.6)
    assert totals["fiber_g"] == pytest.approx(0)
    assert totals["salt_g"] == pytest.approx(0.37)


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
