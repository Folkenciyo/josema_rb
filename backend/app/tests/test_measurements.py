from fastapi.testclient import TestClient

from app.services.measurement_service import calculate_bmi


def _create_client(api: TestClient, **overrides: object) -> str:
    payload = {"full_name": "Cliente de Prueba", "height_cm": 180}
    payload.update(overrides)
    response = api.post("/api/clients", json=payload)
    assert response.status_code == 201
    return response.json()["id"]


def test_calculate_bmi_needs_a_height() -> None:
    assert calculate_bmi(81.0, 180.0) == 25.0
    assert calculate_bmi(81.0, None) is None
    assert calculate_bmi(81.0, 0) is None


def test_measurement_exposes_bmi_from_the_client_height(
    authenticated_client: TestClient,
) -> None:
    client_id = _create_client(authenticated_client)

    response = authenticated_client.post(
        f"/api/clients/{client_id}/measurements",
        json={"measured_on": "2026-08-01", "weight_kg": 81},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["weight_kg"] == 81.0
    assert body["bmi"] == 25.0


def test_bmi_is_null_when_the_client_has_no_height(
    authenticated_client: TestClient,
) -> None:
    client_id = _create_client(authenticated_client, height_cm=None)

    response = authenticated_client.post(
        f"/api/clients/{client_id}/measurements",
        json={"measured_on": "2026-08-01", "weight_kg": 81},
    )

    assert response.status_code == 201
    assert response.json()["bmi"] is None


def test_measurements_are_listed_newest_first(
    authenticated_client: TestClient,
) -> None:
    client_id = _create_client(authenticated_client)
    for measured_on, weight in [
        ("2026-06-01", 84),
        ("2026-08-01", 81),
        ("2026-07-01", 82.5),
    ]:
        authenticated_client.post(
            f"/api/clients/{client_id}/measurements",
            json={"measured_on": measured_on, "weight_kg": weight},
        )

    response = authenticated_client.get(f"/api/clients/{client_id}/measurements")

    assert response.status_code == 200
    assert [m["measured_on"] for m in response.json()] == [
        "2026-08-01",
        "2026-07-01",
        "2026-06-01",
    ]


def test_second_measurement_on_the_same_day_is_rejected(
    authenticated_client: TestClient,
) -> None:
    client_id = _create_client(authenticated_client)
    payload = {"measured_on": "2026-08-01", "weight_kg": 81}
    authenticated_client.post(f"/api/clients/{client_id}/measurements", json=payload)

    response = authenticated_client.post(
        f"/api/clients/{client_id}/measurements",
        json={"measured_on": "2026-08-01", "weight_kg": 80},
    )

    assert response.status_code == 409


def test_updating_the_weight_recalculates_the_bmi(
    authenticated_client: TestClient,
) -> None:
    client_id = _create_client(authenticated_client)
    created = authenticated_client.post(
        f"/api/clients/{client_id}/measurements",
        json={"measured_on": "2026-08-01", "weight_kg": 81},
    ).json()

    response = authenticated_client.patch(
        f"/api/measurements/{created['id']}", json={"weight_kg": 90}
    )

    assert response.status_code == 200
    assert response.json()["weight_kg"] == 90.0
    assert response.json()["bmi"] == 27.8


def test_measurement_can_be_deleted(authenticated_client: TestClient) -> None:
    client_id = _create_client(authenticated_client)
    created = authenticated_client.post(
        f"/api/clients/{client_id}/measurements",
        json={"measured_on": "2026-08-01", "weight_kg": 81},
    ).json()

    response = authenticated_client.delete(f"/api/measurements/{created['id']}")

    assert response.status_code == 204
    remaining = authenticated_client.get(f"/api/clients/{client_id}/measurements")
    assert remaining.json() == []


def test_weight_must_be_positive(authenticated_client: TestClient) -> None:
    client_id = _create_client(authenticated_client)

    response = authenticated_client.post(
        f"/api/clients/{client_id}/measurements",
        json={"measured_on": "2026-08-01", "weight_kg": 0},
    )

    assert response.status_code == 422


def test_measurements_of_an_unknown_client_are_404(
    authenticated_client: TestClient,
) -> None:
    unknown = "00000000-0000-0000-0000-000000000000"

    response = authenticated_client.get(f"/api/clients/{unknown}/measurements")

    assert response.status_code == 404
