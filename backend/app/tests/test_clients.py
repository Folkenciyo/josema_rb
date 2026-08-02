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
