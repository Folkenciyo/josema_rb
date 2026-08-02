from typing import Any

from sqlalchemy import func, select, union
from sqlalchemy.orm import Session

from app.models import Exercise


def list_exercises(
    db: Session,
    *,
    muscle: str | None = None,
    equipment: str | None = None,
    category: str | None = None,
    level: str | None = None,
    search: str | None = None,
) -> list[Exercise]:
    query = db.query(Exercise)
    if equipment:
        query = query.filter(Exercise.equipment_es == equipment)
    if category:
        query = query.filter(Exercise.category_es == category)
    if level:
        query = query.filter(Exercise.level_es == level)
    if muscle:
        query = query.filter(
            Exercise.primary_muscles_es.contains([muscle])
            | Exercise.secondary_muscles_es.contains([muscle])
        )
    if search:
        query = query.filter(Exercise.name_es.ilike(f"%{search}%"))
    return query.order_by(Exercise.name_es).all()


def get_by_id(db: Session, exercise_id: str) -> Exercise | None:
    return db.get(Exercise, exercise_id)


def create(db: Session, exercise: Exercise) -> Exercise:
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


def update(db: Session, exercise: Exercise, data: dict[str, Any]) -> Exercise:
    for field, value in data.items():
        setattr(exercise, field, value)
    db.commit()
    db.refresh(exercise)
    return exercise


def delete(db: Session, exercise: Exercise) -> None:
    db.delete(exercise)
    db.commit()


def _distinct_column(db: Session, column: Any) -> list[str]:
    rows = db.query(column).filter(column.isnot(None)).distinct().order_by(column).all()
    return [row[0] for row in rows]


def distinct_filter_values(db: Session) -> dict[str, list[str]]:
    primary = select(
        func.jsonb_array_elements_text(Exercise.primary_muscles_es).label("muscle")
    )
    secondary = select(
        func.jsonb_array_elements_text(Exercise.secondary_muscles_es).label("muscle")
    )
    muscles_subquery = union(primary, secondary).subquery()
    muscles = [
        row[0]
        for row in db.execute(
            select(muscles_subquery.c.muscle)
            .distinct()
            .order_by(muscles_subquery.c.muscle)
        ).all()
    ]

    return {
        "categories": _distinct_column(db, Exercise.category_es),
        "levels": _distinct_column(db, Exercise.level_es),
        "forces": _distinct_column(db, Exercise.force_es),
        "mechanics": _distinct_column(db, Exercise.mechanic_es),
        "equipment": _distinct_column(db, Exercise.equipment_es),
        "muscles": muscles,
    }
