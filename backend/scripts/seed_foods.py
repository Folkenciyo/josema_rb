"""Idempotent upsert of app/data/foods_es_seed.json into the foods table.

Seeded foods stay fully editable: re-running this only refreshes rows whose
slug still matches, and never touches trainer-created foods (slug is null).

Run with: uv run python -m scripts.seed_foods
"""

import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.core.db import SessionLocal
from app.models import Food, Trainer

BACKEND_ROOT = Path(__file__).resolve().parent.parent
SEED_PATH = BACKEND_ROOT / "app" / "data" / "foods_es_seed.json"


def main() -> None:
    if not SEED_PATH.exists():
        print(f"No hay catálogo que sembrar en {SEED_PATH}, se omite")
        return

    foods = json.loads(SEED_PATH.read_text(encoding="utf-8"))

    with SessionLocal() as db:
        trainer = db.scalars(select(Trainer).order_by(Trainer.created_at)).first()
        if trainer is None:
            print("No hay entrenador todavía, se omite el catálogo de alimentos")
            return

        for food in foods:
            stmt = insert(Food).values(
                trainer_id=trainer.id, source="seed", **food
            )
            # The trainer owns these rows: only fields coming from the catalog
            # are refreshed, and only for entries they have not renamed away.
            update_columns = {
                column: stmt.excluded[column] for column in food if column != "slug"
            }
            stmt = stmt.on_conflict_do_update(
                index_elements=[Food.slug], set_=update_columns
            )
            db.execute(stmt)
        db.commit()

    print(f"Seeded {len(foods)} foods from {SEED_PATH}")


if __name__ == "__main__":
    main()
