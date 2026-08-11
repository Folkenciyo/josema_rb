import uuid
from datetime import time

from pydantic import BaseModel, Field

from app.schemas.meal_template import MacroTotals, MealTemplateOut


class MenuMealCreate(BaseModel):
    meal_template_id: uuid.UUID
    order_index: int
    time_of_day: time | None = None


class MenuMealOut(BaseModel):
    id: uuid.UUID
    meal_template: MealTemplateOut
    order_index: int
    time_of_day: time | None


class MenuCreate(BaseModel):
    name: str
    notes: str | None = None
    meals: list[MenuMealCreate] = []


class MenuUpdate(BaseModel):
    name: str | None = None
    notes: str | None = None
    # When provided, replaces the full meal slot list transactionally.
    meals: list[MenuMealCreate] | None = None


class MenuScaleRequest(BaseModel):
    """A day's worth of eating: below or above this is not a menu, it is a typo."""

    target_calories: float = Field(gt=500, le=6000)


class MenuOut(BaseModel):
    id: uuid.UUID
    name: str
    notes: str | None
    meals: list[MenuMealOut]
    totals: MacroTotals


class MenuSummaryOut(BaseModel):
    """Lightweight representation used when a Menu is nested under a DietDay."""

    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}
