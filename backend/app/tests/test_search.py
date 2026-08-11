from fastapi.testclient import TestClient

from app.models import Exercise
from app.tests.test_foods import OATS


def test_a_short_query_matches_nothing_at_all(
    authenticated_client: TestClient,
) -> None:
    """One letter would match half the catalogue, which helps nobody."""
    authenticated_client.post("/api/clients", json={"full_name": "Laura Buscada"})

    results = authenticated_client.get("/api/search", params={"q": "L"}).json()

    assert results["clients"] == []


def test_the_palette_finds_a_client_by_name(
    authenticated_client: TestClient,
) -> None:
    authenticated_client.post("/api/clients", json={"full_name": "Laura Buscada"})

    results = authenticated_client.get("/api/search", params={"q": "buscada"}).json()

    assert [hit["label"] for hit in results["clients"]] == ["Laura Buscada"]


def test_it_looks_in_every_kind_of_thing_at_once(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    authenticated_client.post("/api/foods", json={**OATS, "name": "Avena buscada"})
    authenticated_client.post(
        "/api/meal-templates",
        json={
            "name": "Desayuno buscado",
            "items": [
                {
                    "food_name": "Algo",
                    "calories": 100,
                    "protein_g": 1,
                    "carbs_g": 1,
                    "fat_g": 1,
                }
            ],
        },
    )

    results = authenticated_client.get("/api/search", params={"q": "busca"}).json()

    assert [hit["label"] for hit in results["foods"]] == ["Avena buscada"]
    assert [hit["label"] for hit in results["meals"]] == ["Desayuno buscado"]


def test_a_client_on_hold_stays_out_of_the_palette(
    authenticated_client: TestClient,
) -> None:
    client_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Carlos Inactivo"}
    ).json()["id"]
    authenticated_client.delete(f"/api/clients/{client_id}")

    results = authenticated_client.get("/api/search", params={"q": "inactivo"}).json()

    assert results["clients"] == []


def test_the_palette_needs_a_session(client: TestClient) -> None:
    client.cookies.clear()

    assert client.get("/api/search", params={"q": "algo"}).status_code == 401
