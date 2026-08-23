"""Idempotent upsert of the exercise seed files into the exercises table.

Two catalogues are seeded: free-exercise-db (public domain, with photos) and
ExerciseDB (MIT data, no photos — the media belongs to Gym visual).

Run with: uv run python scripts/seed_exercises.py
"""

import json
from pathlib import Path

from sqlalchemy.dialects.postgresql import insert

from app.core.db import SessionLocal
from app.models import Exercise

BACKEND_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_ROOT / "app" / "data"

SEEDS = (
    (DATA_DIR / "exercises_es_seed.json", "free-exercise-db"),
    (DATA_DIR / "exercises_exercisedb_seed.json", "exercisedb"),
)


def seed_file(path: Path, source: str) -> int:
    exercises = json.loads(path.read_text(encoding="utf-8"))

    with SessionLocal() as db:
        for ex in exercises:
            stmt = insert(Exercise).values(**ex, source=source)
            update_columns = {col: stmt.excluded[col] for col in ex if col != "id"}
            stmt = stmt.on_conflict_do_update(
                index_elements=[Exercise.id],
                set_=update_columns,
                # An exercise the trainer has edited is his: he rewrote the
                # wording, or photographed it at his own gym. Seeding again must
                # not write the catalogue's version back over it.
                where=Exercise.created_by_trainer_id.is_(None),
            )
            db.execute(stmt)
        db.commit()

    return len(exercises)


def main() -> None:
    for path, source in SEEDS:
        if not path.exists():
            print(f"Skipped {path.name}: not found")
            continue
        count = seed_file(path, source)
        print(f"Seeded {count} exercises from {path.name} (source={source})")


if __name__ == "__main__":
    main()
