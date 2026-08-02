import pytest
from fastapi.testclient import TestClient

ALL_DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]


def _create_menu(client: TestClient) -> dict:
    mt = client.post(
        "/api/meal-templates",
        json={
            "name": "Comida",
            "items": [
                {
                    "food_name": "Pollo con arroz",
                    "calories": 200,
                    "protein_g": 30,
                    "carbs_g": 0,
                    "fat_g": 5,
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
    )
    assert menu.status_code == 201
    return menu.json()


def _create_diet_week(client: TestClient, full_name: str) -> tuple[str, dict]:
    client_id = client.post("/api/clients", json={"full_name": full_name}).json()["id"]
    plan = client.post(
        f"/api/clients/{client_id}/diet-plans", json={"title": "Plan"}
    ).json()
    week = client.post(
        f"/api/diet-plans/{plan['id']}/weeks", json={"week_number": 1}
    ).json()
    return plan["id"], week


def test_assign_menu_to_all_days_of_week(authenticated_client: TestClient) -> None:
    menu = _create_menu(authenticated_client)
    _plan_id, week = _create_diet_week(authenticated_client, "Cliente Semana")

    days_payload = {
        "days": [
            {"day_of_week": day, "order_index": i} for i, day in enumerate(ALL_DAYS)
        ]
    }
    set_resp = authenticated_client.put(
        f"/api/diet-weeks/{week['id']}/days", json=days_payload
    )
    assert set_resp.status_code == 200

    assign_resp = authenticated_client.post(
        f"/api/diet-weeks/{week['id']}/assign-menu", json={"menu_id": menu["id"]}
    )
    assert assign_resp.status_code == 200
    days = assign_resp.json()["days"]
    assert len(days) == 7
    assert all(day["menu"]["id"] == menu["id"] for day in days)
    assert all(day["totals"]["calories"] == pytest.approx(200) for day in days)


def test_assign_menu_to_subset_of_days(authenticated_client: TestClient) -> None:
    menu = _create_menu(authenticated_client)
    _plan_id, week = _create_diet_week(authenticated_client, "Cliente Subset")

    days_payload = {
        "days": [
            {"day_of_week": "monday", "order_index": 0},
            {"day_of_week": "tuesday", "order_index": 1},
        ]
    }
    authenticated_client.put(f"/api/diet-weeks/{week['id']}/days", json=days_payload)

    assign_resp = authenticated_client.post(
        f"/api/diet-weeks/{week['id']}/assign-menu",
        json={"menu_id": menu["id"], "days_of_week": ["monday"]},
    )
    assert assign_resp.status_code == 200
    days = {day["day_of_week"]: day for day in assign_resp.json()["days"]}
    assert days["monday"]["menu"]["id"] == menu["id"]
    assert days["tuesday"]["menu"] is None


def test_assign_menu_creates_missing_days(authenticated_client: TestClient) -> None:
    """A freshly added week has no DietDay rows yet; assigning must create them."""
    menu = _create_menu(authenticated_client)
    _plan_id, week = _create_diet_week(authenticated_client, "Cliente Sin Dias")

    assign_resp = authenticated_client.post(
        f"/api/diet-weeks/{week['id']}/assign-menu",
        json={"menu_id": menu["id"], "days_of_week": ["monday", "wednesday"]},
    )

    assert assign_resp.status_code == 200
    days = assign_resp.json()["days"]
    assert [day["day_of_week"] for day in days] == ["monday", "wednesday"]
    assert all(day["menu"]["id"] == menu["id"] for day in days)
    assert [day["order_index"] for day in days] == [0, 1]


def test_assign_menu_to_all_days_creates_the_full_week(
    authenticated_client: TestClient,
) -> None:
    menu = _create_menu(authenticated_client)
    _plan_id, week = _create_diet_week(authenticated_client, "Cliente Semana Nueva")

    assign_resp = authenticated_client.post(
        f"/api/diet-weeks/{week['id']}/assign-menu", json={"menu_id": menu["id"]}
    )

    assert assign_resp.status_code == 200
    days = assign_resp.json()["days"]
    assert [day["day_of_week"] for day in days] == ALL_DAYS
    assert all(day["menu"]["id"] == menu["id"] for day in days)


def test_duplicate_diet_week_copies_menu_assignments(
    authenticated_client: TestClient,
) -> None:
    menu = _create_menu(authenticated_client)
    _plan_id, week = _create_diet_week(authenticated_client, "Cliente Duplicar")

    authenticated_client.put(
        f"/api/diet-weeks/{week['id']}/days",
        json={
            "days": [{"day_of_week": "monday", "order_index": 0, "menu_id": menu["id"]}]
        },
    )

    dup_resp = authenticated_client.post(
        f"/api/diet-weeks/{week['id']}/duplicate", json={"week_number": 2}
    )
    assert dup_resp.status_code == 201
    body = dup_resp.json()
    assert body["week_number"] == 2
    assert body["days"][0]["menu"]["id"] == menu["id"]
