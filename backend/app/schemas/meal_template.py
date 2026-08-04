import uuid

from pydantic import BaseModel, Field


class MealTemplateItemCreate(BaseModel):
    # Either food_id (auto-computes macros from the Food catalog) or a manual
    # food_name + macros must be provided; validated in the service layer.
    food_id: uuid.UUID | None = None
    food_name: str | None = None
    quantity_label: str | None = None
    # Real amount served, in the food's own unit (150 for a food measured per
    # 100 g). Preferred over quantity_multiplier, which is kept so older
    # clients keep working.
    quantity_amount: float | None = Field(default=None, gt=0)
    quantity_multiplier: float | None = Field(default=None, gt=0)
    calories: float | None = Field(default=None, ge=0)
    protein_g: float | None = Field(default=None, ge=0)
    carbs_g: float | None = Field(default=None, ge=0)
    sugars_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)
    saturated_fat_g: float | None = Field(default=None, ge=0)
    fiber_g: float | None = Field(default=None, ge=0)
    salt_g: float | None = Field(default=None, ge=0)


class MealTemplateItemOut(BaseModel):
    id: uuid.UUID
    food_id: uuid.UUID | None
    food_name: str
    quantity_label: str | None
    quantity_amount: float | None
    quantity_unit: str | None
    quantity_multiplier: float | None
    calories: float | None
    protein_g: float | None
    carbs_g: float | None
    sugars_g: float | None
    fat_g: float | None
    saturated_fat_g: float | None
    fiber_g: float | None
    salt_g: float | None
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
    sugars_g: float = 0
    fat_g: float
    saturated_fat_g: float = 0
    fiber_g: float = 0
    salt_g: float = 0


class MealTemplateOut(BaseModel):
    id: uuid.UUID
    name: str
    notes: str | None
    items: list[MealTemplateItemOut]
    totals: MacroTotals
