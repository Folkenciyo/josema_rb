import pytest
from fastapi.testclient import TestClient

from app.tests.test_meal_templates import CHICKEN, EGG

OATS = {
    "name": "Copos de avena",
    "category": "Hidratos",
    "subcategory": "Cereales y granos",
    "unit_amount": 100,
    "unit_type": "g",
    "calories": 389,
    "protein_g": 16.9,
    "carbs_g": 66.3,
    "sugars_g": 0.9,
    "fat_g": 6.9,
    "saturated_fat_g": 1.2,
    "fiber_g": 10.6,
    "salt_g": 0.01,
}


def test_food_keeps_the_full_label(authenticated_client: TestClient) -> None:
    response = authenticated_client.post("/api/foods", json=OATS)

    assert response.status_code == 201
    body = response.json()
    assert body["fiber_g"] == pytest.approx(10.6)
    assert body["sugars_g"] == pytest.approx(0.9)
    assert body["saturated_fat_g"] == pytest.approx(1.2)
    assert body["salt_g"] == pytest.approx(0.01)
    # Derived from unit_amount + unit_type, never stored twice.
    assert body["unit_label"] == "100 g"
    assert body["source"] == "custom"


def test_countable_unit_label(authenticated_client: TestClient) -> None:
    response = authenticated_client.post("/api/foods", json=EGG)

    assert response.json()["unit_label"] == "1 unidad"


def test_search_and_category_filters(authenticated_client: TestClient) -> None:
    for food in (CHICKEN, EGG, OATS):
        authenticated_client.post("/api/foods", json=food)

    by_name = authenticated_client.get("/api/foods", params={"search": "pollo"})
    assert [food["name"] for food in by_name.json()] == ["Pechuga de pollo"]

    by_category = authenticated_client.get(
        "/api/foods", params={"category": "Proteína animal"}
    )
    assert len(by_category.json()) == 2

    by_subcategory = authenticated_client.get(
        "/api/foods", params={"subcategory": "Huevos"}
    )
    assert [food["name"] for food in by_subcategory.json()] == ["Huevo M"]


def test_calorie_range_and_sorting(authenticated_client: TestClient) -> None:
    for food in (CHICKEN, EGG, OATS):
        authenticated_client.post("/api/foods", json=food)

    light = authenticated_client.get("/api/foods", params={"max_calories": 100})
    assert [food["name"] for food in light.json()] == ["Huevo M"]

    heavy = authenticated_client.get("/api/foods", params={"min_calories": 150})
    assert [food["name"] for food in heavy.json()] == [
        "Copos de avena",
        "Pechuga de pollo",
    ]

    by_calories = authenticated_client.get("/api/foods", params={"sort": "calories"})
    assert [food["calories"] for food in by_calories.json()] == [78, 165, 389]

    by_protein = authenticated_client.get("/api/foods", params={"sort": "protein"})
    assert by_protein.json()[0]["name"] == "Pechuga de pollo"


def test_filters_endpoint_lists_distinct_values(
    authenticated_client: TestClient,
) -> None:
    for food in (CHICKEN, EGG, OATS):
        authenticated_client.post("/api/foods", json=food)

    body = authenticated_client.get("/api/foods/filters").json()

    assert body["categories"] == ["Hidratos", "Proteína animal"]
    assert "Aves" in body["subcategories"]
    assert set(body["unit_types"]) == {"g", "unidad"}

    # Each category only offers its own subcategories: no "Legumbres" showing
    # up under "Proteína animal".
    grouped = body["subcategories_by_category"]
    assert grouped["Proteína animal"] == ["Aves", "Huevos"]
    assert grouped["Hidratos"] == ["Cereales y granos"]


def test_every_field_is_editable(authenticated_client: TestClient) -> None:
    """Seeded or not, the trainer can rewrite any part of a food."""
    food_id = authenticated_client.post("/api/foods", json=OATS).json()["id"]

    response = authenticated_client.patch(
        f"/api/foods/{food_id}",
        json={
            "name": "Avena integral",
            "category": "Hidratos",
            "subcategory": "Pan",
            "unit_amount": 30,
            "unit_type": "cucharada",
            "calories": 117,
            "protein_g": 5.1,
            "carbs_g": 19.9,
            "sugars_g": 0.3,
            "fat_g": 2.1,
            "saturated_fat_g": 0.4,
            "fiber_g": 3.2,
            "salt_g": 0.0,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Avena integral"
    assert body["unit_label"] == "30 cucharada"
    assert body["fiber_g"] == pytest.approx(3.2)


def test_rejects_sugars_above_carbs(authenticated_client: TestClient) -> None:
    response = authenticated_client.post(
        "/api/foods", json={**OATS, "sugars_g": 90, "carbs_g": 66.3}
    )

    assert response.status_code == 422


def test_rejects_saturated_above_fat_on_patch(
    authenticated_client: TestClient,
) -> None:
    food_id = authenticated_client.post("/api/foods", json=OATS).json()["id"]

    response = authenticated_client.patch(
        f"/api/foods/{food_id}", json={"saturated_fat_g": 50}
    )

    assert response.status_code == 422


def test_deleting_a_food_keeps_meal_macros(authenticated_client: TestClient) -> None:
    food_id = authenticated_client.post("/api/foods", json=CHICKEN).json()["id"]
    meal = authenticated_client.post(
        "/api/meal-templates",
        json={
            "name": "Comida con pollo",
            "items": [{"food_id": food_id, "quantity_amount": 150}],
        },
    ).json()

    assert authenticated_client.delete(f"/api/foods/{food_id}").status_code == 204

    after = authenticated_client.get(f"/api/meal-templates/{meal['id']}").json()
    assert after["totals"]["calories"] == pytest.approx(247.5)
    assert after["items"][0]["food_id"] is None
