"""Idempotent creation/update of the single trainer account from env vars.

Run with: uv run python -m scripts.seed_trainer
"""

from sqlalchemy.dialects.postgresql import insert

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models import Trainer

settings = get_settings()


def main() -> None:
    with SessionLocal() as db:
        stmt = insert(Trainer).values(
            email=settings.trainer_email,
            hashed_password=hash_password(settings.trainer_password),
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[Trainer.email],
            set_={"hashed_password": stmt.excluded.hashed_password},
        )
        db.execute(stmt)
        db.commit()

    print(f"Seeded trainer {settings.trainer_email}")


if __name__ == "__main__":
    main()
