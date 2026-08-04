import uuid

from pydantic import BaseModel, Field, model_validator

UNCLASSIFIED_CATEGORY = "Otros"


class NutritionFacts(BaseModel):
    """Per reference quantity, mirroring what a Spanish food label shows."""

    calories: float = Field(ge=0)
    protein_g: float = Field(ge=0)
    carbs_g: float = Field(ge=0)
    sugars_g: float = Field(default=0, ge=0)
    fat_g: float = Field(ge=0)
    saturated_fat_g: float = Field(default=0, ge=0)
    fiber_g: float = Field(default=0, ge=0)
    salt_g: float = Field(default=0, ge=0)

    @model_validator(mode="after")
    def check_subcomponents(self) -> "NutritionFacts":
        if self.sugars_g > self.carbs_g:
            raise ValueError("Los azúcares no pueden superar a los hidratos")
        if self.saturated_fat_g > self.fat_g:
            raise ValueError("Las grasas saturadas no pueden superar a las grasas")
        return self


class FoodCreate(NutritionFacts):
    name: str = Field(min_length=1, max_length=255)
    category: str = Field(default=UNCLASSIFIED_CATEGORY, min_length=1, max_length=100)
    subcategory: str | None = Field(default=None, max_length=100)
    unit_amount: float = Field(gt=0)
    unit_type: str = Field(min_length=1, max_length=30)


class FoodUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    subcategory: str | None = Field(default=None, max_length=100)
    unit_amount: float | None = Field(default=None, gt=0)
    unit_type: str | None = Field(default=None, min_length=1, max_length=30)
    calories: float | None = Field(default=None, ge=0)
    protein_g: float | None = Field(default=None, ge=0)
    carbs_g: float | None = Field(default=None, ge=0)
    sugars_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)
    saturated_fat_g: float | None = Field(default=None, ge=0)
    fiber_g: float | None = Field(default=None, ge=0)
    salt_g: float | None = Field(default=None, ge=0)


class FoodOut(FoodCreate):
    id: uuid.UUID
    slug: str | None
    source: str
    # Derived from unit_amount + unit_type by the model property.
    unit_label: str

    model_config = {"from_attributes": True}


class FoodFiltersOut(BaseModel):
    categories: list[str]
    #: Flat list, used when no category is selected yet.
    subcategories: list[str]
    #: Only the subcategories that actually exist under each category.
    subcategories_by_category: dict[str, list[str]]
    unit_types: list[str]
