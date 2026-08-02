from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models import Trainer
from app.repositories import trainer_repository


def authenticate(db: Session, email: str, password: str) -> Trainer | None:
    trainer = trainer_repository.get_by_email(db, email)
    if trainer is None or not verify_password(password, trainer.hashed_password):
        return None
    return trainer
