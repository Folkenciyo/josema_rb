import uuid

from pydantic import BaseModel


class ExerciseOut(BaseModel):
    id: str
    name_es: str
    category_es: str | None
    level_es: str | None
    force_es: str | None
    mechanic_es: str | None
    equipment_es: str | None
    primary_muscles_es: list[str]
    secondary_muscles_es: list[str]
    instructions_es: list[str]
    images: list[str]
    created_by_trainer_id: uuid.UUID | None

    model_config = {"from_attributes": True}


class ExerciseFiltersOut(BaseModel):
    categories: list[str]
    levels: list[str]
    forces: list[str]
    mechanics: list[str]
    equipment: list[str]
    muscles: list[str]
