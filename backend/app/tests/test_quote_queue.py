from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.api.portal import portal_limiter


@pytest.fixture(autouse=True)
def clean_limiter() -> Generator[None, None, None]:
    portal_limiter.reset()
    yield
    portal_limiter.reset()


def _quote(api: TestClient, text: str) -> dict:
    response = api.post("/api/quotes", data={"text": text})
    assert response.status_code == 201, response.text
    return response.json()


def _library(api: TestClient, size: int = 4) -> list[dict]:
    return [_quote(api, f"Mensaje {index}") for index in range(size)]


def _queue(api: TestClient, days: int = 3) -> dict:
    response = api.get("/api/quotes/queue", params={"days": days})
    assert response.status_code == 200, response.text
    return response.json()


def _client_with_token(api: TestClient, name: str) -> str:
    client_id = api.post("/api/clients", json={"full_name": name}).json()["id"]
    return api.post(f"/api/clients/{client_id}/portal-token").json()["portal_token"]


def test_new_messages_join_the_end_of_the_queue(
    authenticated_client: TestClient,
) -> None:
    created = _library(authenticated_client)

    listing = authenticated_client.get("/api/quotes").json()

    assert [item["text"] for item in listing] == [item["text"] for item in created]
    assert [item["position"] for item in listing] == [0, 1, 2, 3]


def test_the_queue_shows_today_and_what_comes_next(
    authenticated_client: TestClient,
) -> None:
    quotes = _library(authenticated_client)

    queue = _queue(authenticated_client, days=3)

    assert queue["today"] is not None
    # Each day is the next one along, wrapping around at the end of the library.
    ids = [queue["today"]["quote"]["id"]] + [
        entry["quote"]["id"] for entry in queue["upcoming"]
    ]
    order = [item["id"] for item in quotes]
    start = order.index(ids[0])
    assert ids == [order[(start + step) % len(order)] for step in range(4)]


def test_the_trainer_picks_what_is_showing_today(
    authenticated_client: TestClient,
) -> None:
    quotes = _library(authenticated_client)
    chosen = quotes[2]

    queue = authenticated_client.put(f"/api/quotes/{chosen['id']}/today").json()

    assert queue["today"]["quote"]["id"] == chosen["id"]
    # And tomorrow carries on from it instead of jumping somewhere else.
    assert queue["upcoming"][0]["quote"]["id"] == quotes[3]["id"]


def test_the_trainer_picks_what_comes_next(authenticated_client: TestClient) -> None:
    quotes = _library(authenticated_client)
    authenticated_client.put(f"/api/quotes/{quotes[0]['id']}/today")

    queue = authenticated_client.put(f"/api/quotes/{quotes[3]['id']}/next").json()

    assert queue["today"]["quote"]["id"] == quotes[0]["id"]
    assert queue["upcoming"][0]["quote"]["id"] == quotes[3]["id"]
    # The one it jumped ahead of has not been lost, only pushed back.
    assert queue["upcoming"][1]["quote"]["id"] == quotes[1]["id"]


def test_choosing_the_next_one_does_not_change_todays(
    authenticated_client: TestClient,
) -> None:
    quotes = _library(authenticated_client)
    authenticated_client.put(f"/api/quotes/{quotes[1]['id']}/today")

    queue = authenticated_client.put(f"/api/quotes/{quotes[0]['id']}/next").json()

    assert queue["today"]["quote"]["id"] == quotes[1]["id"]


def test_the_queue_can_be_reordered_whole(authenticated_client: TestClient) -> None:
    quotes = _library(authenticated_client)
    authenticated_client.put(f"/api/quotes/{quotes[0]['id']}/today")
    reversed_ids = [item["id"] for item in reversed(quotes)]

    queue = authenticated_client.put(
        "/api/quotes/queue/order", json={"quote_ids": reversed_ids}
    ).json()

    listing = authenticated_client.get("/api/quotes").json()
    assert [item["id"] for item in listing] == reversed_ids
    # Reordering must not swap what the clients are already reading today.
    assert queue["today"]["quote"]["id"] == quotes[0]["id"]


def test_reordering_with_an_unknown_message_is_refused(
    authenticated_client: TestClient,
) -> None:
    _library(authenticated_client, size=2)

    response = authenticated_client.put(
        "/api/quotes/queue/order",
        json={"quote_ids": ["11111111-2222-3333-4444-555555555555"]},
    )

    assert response.status_code == 404


def test_two_clients_read_the_same_message_today(
    authenticated_client: TestClient,
) -> None:
    quotes = _library(authenticated_client)
    authenticated_client.put(f"/api/quotes/{quotes[2]['id']}/today")
    first = _client_with_token(authenticated_client, "Cliente Uno")
    second = _client_with_token(authenticated_client, "Cliente Dos")

    one = authenticated_client.get(f"/api/portal/{first}").json()["quote"]
    two = authenticated_client.get(f"/api/portal/{second}").json()["quote"]

    assert one["id"] == two["id"] == quotes[2]["id"]


def test_an_empty_library_has_no_queue(authenticated_client: TestClient) -> None:
    queue = _queue(authenticated_client)

    assert queue["today"] is None
    assert queue["upcoming"] == []
