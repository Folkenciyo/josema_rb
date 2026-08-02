from sqlalchemy.orm import Session

from app.models import Trainer


def get_by_email(db: Session, email: str) -> Trainer | None:
    return db.query(Trainer).filter(Trainer.email == email).first()
