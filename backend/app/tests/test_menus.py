import pytest
from fastapi.testclient import TestClient

from app.tests.test_foods import OATS


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


def test_alternative_meal_slots_only_count_the_first(
    authenticated_client: TestClient,
) -> None:
    mt1 = _create_meal_template(authenticated_client, "Desayuno", 300, 10)
    cena_a = _create_meal_template(authenticated_client, "Cena A", 400, 30)
    cena_b = _create_meal_template(authenticated_client, "Cena B", 900, 90)

    menu_resp = authenticated_client.post(
        "/api/menus",
        json={
            "name": "Menu con alternativas",
            "meals": [
                {"meal_template_id": mt1["id"], "order_index": 0},
                {
                    "meal_template_id": cena_a["id"],
                    "order_index": 1,
                    "alternative_group": "cena",
                },
                {
                    "meal_template_id": cena_b["id"],
                    "order_index": 2,
                    "alternative_group": "cena",
                },
            ],
        },
    )
    assert menu_resp.status_code == 201
    body = menu_resp.json()
    totals = body["totals"]
    # Only Desayuno + Cena A count; Cena B is shown as an alternative, not added.
    assert totals["calories"] == pytest.approx(700)
    assert totals["protein_g"] == pytest.approx(40)
    assert body["meals"][1]["alternative_group"] == "cena"
    assert body["meals"][2]["alternative_group"] == "cena"


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


def _menu_from_catalog_food(
    client: TestClient, name: str, amount: float
) -> tuple[dict, str]:
    """A menu built from a real food, which is what carries units and macros."""
    food = client.post("/api/foods", json=OATS).json()
    meal = client.post(
        "/api/meal-templates",
        json={
            "name": f"Comida {name}",
            "items": [{"food_id": food["id"], "quantity_amount": amount}],
        },
    ).json()
    menu = client.post(
        "/api/menus",
        json={
            "name": name,
            "meals": [{"meal_template_id": meal["id"], "order_index": 0}],
        },
    ).json()
    return menu, food["id"]


def test_scaling_a_menu_hits_the_calorie_target(
    authenticated_client: TestClient,
) -> None:
    menu, _ = _menu_from_catalog_food(authenticated_client, "Menú base", 100)
    current = menu["totals"]["calories"]

    scaled = authenticated_client.post(
        f"/api/menus/{menu['id']}/scale", json={"target_calories": current * 2}
    )

    assert scaled.status_code == 201
    # Portions are rounded to what a person can serve, so the target is a target.
    assert scaled.json()["totals"]["calories"] == pytest.approx(current * 2, rel=0.05)


def test_scaling_leaves_the_original_menu_untouched(
    authenticated_client: TestClient,
) -> None:
    menu, _ = _menu_from_catalog_food(authenticated_client, "Menú original", 100)

    authenticated_client.post(
        f"/api/menus/{menu['id']}/scale", json={"target_calories": 3000}
    )

    unchanged = authenticated_client.get(f"/api/menus/{menu['id']}").json()
    assert unchanged["totals"] == menu["totals"]
    assert unchanged["name"] == "Menú original"


def test_the_scaled_menu_says_what_it_is(authenticated_client: TestClient) -> None:
    menu, _ = _menu_from_catalog_food(authenticated_client, "Menú base", 100)

    scaled = authenticated_client.post(
        f"/api/menus/{menu['id']}/scale", json={"target_calories": 2400}
    ).json()

    assert scaled["name"] == "Menú base · 2400 kcal"
    # Its meals are copies too: editing them must not touch the original ones.
    assert (
        scaled["meals"][0]["meal_template"]["id"]
        != menu["meals"][0]["meal_template"]["id"]
    )


def test_scaling_preserves_alternative_groups(
    authenticated_client: TestClient,
) -> None:
    cena_a = _create_meal_template(authenticated_client, "Cena A", 400, 30)
    cena_b = _create_meal_template(authenticated_client, "Cena B", 900, 90)
    menu = authenticated_client.post(
        "/api/menus",
        json={
            "name": "Menu con alternativas",
            "meals": [
                {
                    "meal_template_id": cena_a["id"],
                    "order_index": 0,
                    "alternative_group": "cena",
                },
                {
                    "meal_template_id": cena_b["id"],
                    "order_index": 1,
                    "alternative_group": "cena",
                },
            ],
        },
    ).json()

    scaled = authenticated_client.post(
        f"/api/menus/{menu['id']}/scale", json={"target_calories": 800}
    ).json()

    assert scaled["meals"][0]["alternative_group"] == "cena"
    assert scaled["meals"][1]["alternative_group"] == "cena"


def test_an_absurd_calorie_target_is_refused(
    authenticated_client: TestClient,
) -> None:
    menu, _ = _menu_from_catalog_food(authenticated_client, "Menú base", 100)

    response = authenticated_client.post(
        f"/api/menus/{menu['id']}/scale", json={"target_calories": 50}
    )

    assert response.status_code == 422
