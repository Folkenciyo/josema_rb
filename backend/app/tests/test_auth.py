from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.api.auth import login_limiter
from app.models import Trainer
from app.tests.conftest import TEST_TRAINER_PASSWORD


@pytest.fixture(autouse=True)
def clean_limiter() -> Generator[None, None, None]:
    """The limiter lives in process, so one test must not spend another's quota."""
    login_limiter.reset()
    yield
    login_limiter.reset()


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


def test_login_blocks_after_repeated_failures(
    client: TestClient, trainer: Trainer
) -> None:
    for _ in range(login_limiter._max_attempts):
        client.post("/api/auth/login", json={"email": trainer.email, "password": "x"})

    response = client.post(
        "/api/auth/login",
        json={"email": trainer.email, "password": TEST_TRAINER_PASSWORD},
    )

    assert response.status_code == 429


def test_successful_logins_do_not_spend_the_quota(
    client: TestClient, trainer: Trainer
) -> None:
    for _ in range(login_limiter._max_attempts + 1):
        response = client.post(
            "/api/auth/login",
            json={"email": trainer.email, "password": TEST_TRAINER_PASSWORD},
        )

    assert response.status_code == 200


def test_spoofed_forwarded_for_does_not_reset_the_quota(
    client: TestClient, trainer: Trainer
) -> None:
    # Traefik appends the real address after whatever the caller sent.
    for attempt in range(login_limiter._max_attempts):
        client.post(
            "/api/auth/login",
            json={"email": trainer.email, "password": "x"},
            headers={"x-forwarded-for": f"9.9.9.{attempt}, 81.40.1.2, 172.18.0.5"},
        )

    response = client.post(
        "/api/auth/login",
        json={"email": trainer.email, "password": TEST_TRAINER_PASSWORD},
        headers={"x-forwarded-for": "1.1.1.1, 81.40.1.2, 172.18.0.5"},
    )

    assert response.status_code == 429
