from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.db import engine, get_db
from app.core.security import hash_password
from app.main import app
from app.models import Exercise, Trainer

TEST_TRAINER_PASSWORD = "supersecret123"


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def trainer(db_session: Session) -> Trainer:
    trainer = Trainer(
        email="test-trainer@example.com",
        hashed_password=hash_password(TEST_TRAINER_PASSWORD),
        full_name="Test Trainer",
    )
    db_session.add(trainer)
    db_session.flush()
    return trainer


@pytest.fixture()
def authenticated_client(client: TestClient, trainer: Trainer) -> TestClient:
    response = client.post(
        "/api/auth/login",
        json={"email": trainer.email, "password": TEST_TRAINER_PASSWORD},
    )
    assert response.status_code == 200
    return client


@pytest.fixture()
def imported_exercise(db_session: Session) -> Exercise:
    exercise = (
        db_session.query(Exercise)
        .filter(Exercise.created_by_trainer_id.is_(None))
        .first()
    )
    assert exercise is not None
    return exercise
