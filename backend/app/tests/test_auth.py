from fastapi.testclient import TestClient

from app.models import Trainer
from app.tests.conftest import TEST_TRAINER_PASSWORD


def test_login_success_sets_cookie(client: TestClient, trainer: Trainer) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": trainer.email, "password": TEST_TRAINER_PASSWORD},
    )

    assert response.status_code == 200
    assert response.json()["email"] == trainer.email
    assert "josema_session" in response.cookies


def test_login_wrong_password_returns_401(client: TestClient, trainer: Trainer) -> None:
    response = client.post(
        "/api/auth/login", json={"email": trainer.email, "password": "wrong"}
    )

    assert response.status_code == 401


def test_me_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_me_returns_trainer_when_authenticated(
    authenticated_client: TestClient, trainer: Trainer
) -> None:
    response = authenticated_client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == trainer.email


def test_logout_clears_cookie(authenticated_client: TestClient) -> None:
    response = authenticated_client.post("/api/auth/logout")

    assert response.status_code == 204

    me_response = authenticated_client.get("/api/auth/me")
    assert me_response.status_code == 401
