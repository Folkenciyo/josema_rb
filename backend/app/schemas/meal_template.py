import uuid

from pydantic import BaseModel


class MealTemplateItemCreate(BaseModel):
    # Either food_id (auto-computes macros from the Food catalog) or a manual
    # food_name + macros must be provided; validated in the service layer.
    food_id: uuid.UUID | None = None
    food_name: str | None = None
    quantity_label: str | None = None
    quantity_multiplier: float | None = None
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None


class MealTemplateItemOut(BaseModel):
    id: uuid.UUID
    food_id: uuid.UUID | None
    food_name: str
    quantity_label: str | None
    quantity_multiplier: float | None
    calories: float | None
    protein_g: float | None
    carbs_g: float | None
    fat_g: float | None
    order_index: int

    model_config = {"from_attributes": True}


class MealTemplateCreate(BaseModel):
    name: str
    notes: str | None = None
    items: list[MealTemplateItemCreate] = []


class MealTemplateUpdate(BaseModel):
    name: str | None = None
    notes: str | None = None
    # When provided, replaces the full item list transactionally.
    items: list[MealTemplateItemCreate] | None = None


class MacroTotals(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class MealTemplateOut(BaseModel):
    id: uuid.UUID
    name: str
    notes: str | None
    items: list[MealTemplateItemOut]
    totals: MacroTotals
