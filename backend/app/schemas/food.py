import uuid

from pydantic import BaseModel


class FoodCreate(BaseModel):
    name: str
    unit_label: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class FoodUpdate(BaseModel):
    name: str | None = None
    unit_label: str | None = None
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None


class FoodOut(FoodCreate):
    id: uuid.UUID

    model_config = {"from_attributes": True}
