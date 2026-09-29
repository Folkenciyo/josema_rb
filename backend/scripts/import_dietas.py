"""Import the reviewed meal templates extracted from Dietas/ into the trainer's
reusable meal library.

Idempotent by name: re-running replaces a template whose name already matches
one of the entries below instead of duplicating it.

Run with: uv run python -m scripts.import_dietas
"""

import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.models import Food, MealTemplate, Trainer
from app.schemas.meal_template import MealTemplateCreate, MealTemplateItemCreate
from app.services import meal_template_service

BACKEND_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = BACKEND_ROOT / "scripts" / "data" / "meal_templates_dietas.json"


def _build_items(
    db: Session, trainer_id, raw_items: list[dict]
) -> list[MealTemplateItemCreate]:
    items = []
    for raw in raw_items:
        food = db.scalars(
            select(Food).where(
                Food.slug == raw["food_slug"], Food.trainer_id == trainer_id
            )
        ).first()
        if food is None:
            raise SystemExit(
                f"Food con slug '{raw['food_slug']}' no existe todavía; "
                "corre primero scripts/seed_foods.py"
            )
        items.append(
            MealTemplateItemCreate(
                food_id=food.id,
                quantity_amount=raw["quantity_amount"],
                alternative_group=raw.get("alternative_group"),
            )
        )
    return items


def main() -> None:
    templates = json.loads(DATA_PATH.read_text(encoding="utf-8"))

    with SessionLocal() as db:
        trainer = db.scalars(select(Trainer).order_by(Trainer.created_at)).first()
        if trainer is None:
            print("No hay entrenador todavía, se omite la importación")
            return

        created, replaced = 0, 0
        for entry in templates:
            existing = db.scalars(
                select(MealTemplate).where(
                    MealTemplate.trainer_id == trainer.id,
                    MealTemplate.name == entry["name"],
                )
            ).first()
            if existing is not None:
                meal_template_service.delete_meal_template(db, existing.id)
                db.flush()
                replaced += 1
            else:
                created += 1

            data = MealTemplateCreate(
                name=entry["name"],
                notes=entry.get("notes"),
                items=_build_items(db, trainer.id, entry["items"]),
            )
            meal_template_service.create_meal_template(db, trainer, data)

        db.commit()

    print(f"{created} plantillas nuevas, {replaced} reemplazadas, desde {DATA_PATH}")


if __name__ == "__main__":
    main()
