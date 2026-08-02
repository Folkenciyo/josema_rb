"""Idempotent upsert of app/data/exercises_es_seed.json into the exercises table.

Run with: uv run python scripts/seed_exercises.py
"""

import json
from pathlib import Path

from sqlalchemy.dialects.postgresql import insert

from app.core.db import SessionLocal
from app.models import Exercise

BACKEND_ROOT = Path(__file__).resolve().parent.parent
SEED_PATH = BACKEND_ROOT / "app" / "data" / "exercises_es_seed.json"


def main() -> None:
    exercises = json.loads(SEED_PATH.read_text(encoding="utf-8"))

    with SessionLocal() as db:
        for ex in exercises:
            stmt = insert(Exercise).values(**ex, source="free-exercise-db")
            update_columns = {col: stmt.excluded[col] for col in ex if col != "id"}
            stmt = stmt.on_conflict_do_update(
                index_elements=[Exercise.id], set_=update_columns
            )
            db.execute(stmt)
        db.commit()

    print(f"Seeded {len(exercises)} exercises from {SEED_PATH}")


if __name__ == "__main__":
    main()
