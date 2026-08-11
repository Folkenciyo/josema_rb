
from sqlalchemy.orm import Session

from app.models import Client, Exercise, Food, MealTemplate, Menu, Trainer
from app.schemas.search import SearchHit, SearchResults

# Enough to recognise what you were after without turning the palette into a list.
HITS_PER_KIND = 5
# Below this every query matches half the catalogue and nothing is useful.
MIN_QUERY_LENGTH = 2


def _matches(column, term: str):
    return column.ilike(f"%{term}%")


def search(db: Session, trainer: Trainer, term: str) -> SearchResults:
    """One query per kind of thing, capped, so the palette answers instantly.

    Only what belongs to this trainer, plus the imported exercise library, which
    is shared by design.
    """
    cleaned = term.strip()
    if len(cleaned) < MIN_QUERY_LENGTH:
        return SearchResults(clients=[], exercises=[], foods=[], meals=[], menus=[])

    clients = (
        db.query(Client)
        .filter(
            Client.trainer_id == trainer.id,
            Client.active.is_(True),
            _matches(Client.full_name, cleaned),
        )
        .order_by(Client.full_name)
        .limit(HITS_PER_KIND)
        .all()
    )

    exercises = (
        db.query(Exercise)
        .filter(_matches(Exercise.name_es, cleaned))
        .order_by(Exercise.name_es)
        .limit(HITS_PER_KIND)
        .all()
    )

    foods = (
        db.query(Food)
        .filter(Food.trainer_id == trainer.id, _matches(Food.name, cleaned))
        .order_by(Food.name)
        .limit(HITS_PER_KIND)
        .all()
    )

    meals = (
        db.query(MealTemplate)
        .filter(
            MealTemplate.trainer_id == trainer.id,
            _matches(MealTemplate.name, cleaned),
        )
        .order_by(MealTemplate.name)
        .limit(HITS_PER_KIND)
        .all()
    )

    menus = (
        db.query(Menu)
        .filter(Menu.trainer_id == trainer.id, _matches(Menu.name, cleaned))
        .order_by(Menu.name)
        .limit(HITS_PER_KIND)
        .all()
    )

    return SearchResults(
        clients=[
            SearchHit(id=str(client.id), label=client.full_name) for client in clients
        ],
        exercises=[
            SearchHit(id=exercise.id, label=exercise.name_es, detail=exercise.category)
            for exercise in exercises
        ],
        foods=[
            SearchHit(id=str(food.id), label=food.name, detail=food.category)
            for food in foods
        ],
        meals=[SearchHit(id=str(meal.id), label=meal.name) for meal in meals],
        menus=[SearchHit(id=str(menu.id), label=menu.name) for menu in menus],
    )
