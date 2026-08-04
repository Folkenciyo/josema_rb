import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models import Food

SORT_COLUMNS = {
    "name": Food.name.asc(),
    "calories": Food.calories.asc(),
    "calories_desc": Food.calories.desc(),
    "protein": Food.protein_g.desc(),
}


def list_foods(
    db: Session,
    trainer_id: uuid.UUID,
    *,
    search: str | None = None,
    category: str | None = None,
    subcategory: str | None = None,
    min_calories: float | None = None,
    max_calories: float | None = None,
    sort: str | None = None,
) -> list[Food]:
    query = db.query(Food).filter(Food.trainer_id == trainer_id)
    if category:
        query = query.filter(Food.category == category)
    if subcategory:
        query = query.filter(Food.subcategory == subcategory)
    if search:
        query = query.filter(Food.name.ilike(f"%{search}%"))
    if min_calories is not None:
        query = query.filter(Food.calories >= min_calories)
    if max_calories is not None:
        query = query.filter(Food.calories <= max_calories)
    # Secondary ordering by name keeps the list stable between identical values.
    order = SORT_COLUMNS.get(sort or "name", Food.name.asc())
    return query.order_by(order, Food.name).all()


def get_by_id(db: Session, food_id: uuid.UUID) -> Food | None:
    return db.get(Food, food_id)


def create(db: Session, trainer_id: uuid.UUID, data: dict[str, Any]) -> Food:
    food = Food(trainer_id=trainer_id, **data)
    db.add(food)
    db.commit()
    db.refresh(food)
    return food


def update(db: Session, food: Food, data: dict[str, Any]) -> Food:
    for field, value in data.items():
        setattr(food, field, value)
    db.commit()
    db.refresh(food)
    return food


def delete(db: Session, food: Food) -> None:
    db.delete(food)
    db.commit()


def _distinct_column(db: Session, trainer_id: uuid.UUID, column: Any) -> list[str]:
    rows = (
        db.query(column)
        .filter(Food.trainer_id == trainer_id, column.isnot(None))
        .distinct()
        .order_by(column)
        .all()
    )
    return [row[0] for row in rows]


def _subcategories_by_category(
    db: Session, trainer_id: uuid.UUID
) -> dict[str, list[str]]:
    """Real (category, subcategory) pairs, so one never offers the other's."""
    rows = (
        db.query(Food.category, Food.subcategory)
        .filter(Food.trainer_id == trainer_id, Food.subcategory.isnot(None))
        .distinct()
        .order_by(Food.category, Food.subcategory)
        .all()
    )

    grouped: dict[str, list[str]] = {}
    for category, subcategory in rows:
        grouped.setdefault(category, []).append(subcategory)
    return grouped


def distinct_filter_values(db: Session, trainer_id: uuid.UUID) -> dict[str, Any]:
    return {
        "categories": _distinct_column(db, trainer_id, Food.category),
        "subcategories": _distinct_column(db, trainer_id, Food.subcategory),
        "subcategories_by_category": _subcategories_by_category(db, trainer_id),
        "unit_types": _distinct_column(db, trainer_id, Food.unit_type),
    }
