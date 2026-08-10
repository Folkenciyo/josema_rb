from fastapi.testclient import TestClient


def test_deactivated_client_is_soft_deleted_and_excluded_by_default(
    authenticated_client: TestClient,
) -> None:
    create_response = authenticated_client.post(
        "/api/clients", json={"full_name": "Cliente de Prueba"}
    )
    client_id = create_response.json()["id"]

    delete_response = authenticated_client.delete(f"/api/clients/{client_id}")
    assert delete_response.status_code == 200
    assert delete_response.json()["active"] is False

    detail_response = authenticated_client.get(f"/api/clients/{client_id}")
    assert detail_response.status_code == 200

    list_response = authenticated_client.get("/api/clients")
    assert client_id not in [c["id"] for c in list_response.json()]

    list_with_inactive = authenticated_client.get(
        "/api/clients", params={"include_inactive": True}
    )
    assert client_id in [c["id"] for c in list_with_inactive.json()]


def test_reactivated_client_shows_up_in_the_default_listing_again(
    authenticated_client: TestClient,
) -> None:
    client_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Cliente Que Vuelve"}
    ).json()["id"]
    authenticated_client.delete(f"/api/clients/{client_id}")

    reactivate_response = authenticated_client.post(
        f"/api/clients/{client_id}/reactivate"
    )
    assert reactivate_response.status_code == 200
    assert reactivate_response.json()["active"] is True

    list_response = authenticated_client.get("/api/clients")
    assert client_id in [c["id"] for c in list_response.json()]


def test_reactivating_an_unknown_client_is_a_404(
    authenticated_client: TestClient,
) -> None:
    unknown_id = "00000000-0000-0000-0000-000000000000"
    response = authenticated_client.post(f"/api/clients/{unknown_id}/reactivate")
    assert response.status_code == 404
