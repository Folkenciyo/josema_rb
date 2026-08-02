from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.models import Exercise, Trainer
from app.schemas.exercise import ExerciseFiltersOut, ExerciseOut
from app.services import exercise_service

router = APIRouter(
    prefix="/api/exercises",
    tags=["exercises"],
    dependencies=[Depends(get_current_trainer)],
)


@router.get("", response_model=list[ExerciseOut])
def list_exercises(
    muscle: str | None = None,
    equipment: str | None = None,
    category: str | None = None,
    level: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
) -> list[Exercise]:
    return exercise_service.list_exercises(
        db,
        muscle=muscle,
        equipment=equipment,
        category=category,
        level=level,
        search=search,
    )


@router.get("/filters", response_model=ExerciseFiltersOut)
def get_filters(db: Session = Depends(get_db)) -> dict[str, list[str]]:
    return exercise_service.get_filters(db)


@router.get("/{exercise_id}", response_model=ExerciseOut)
def get_exercise(exercise_id: str, db: Session = Depends(get_db)) -> Exercise:
    return exercise_service.get_exercise(db, exercise_id)


@router.post("", response_model=ExerciseOut, status_code=status.HTTP_201_CREATED)
async def create_exercise(
    name_es: str = Form(...),
    instructions_es: str = Form(..., description="JSON array of strings"),
    category_es: str | None = Form(None),
    level_es: str | None = Form(None),
    force_es: str | None = Form(None),
    mechanic_es: str | None = Form(None),
    equipment_es: str | None = Form(None),
    primary_muscles_es: str | None = Form(None, description="JSON array of strings"),
    secondary_muscles_es: str | None = Form(None, description="JSON array of strings"),
    images: list[UploadFile] = File(default=[]),
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> Exercise:
    return await exercise_service.create_exercise(
        db,
        trainer,
        name_es=name_es,
        instructions_es=exercise_service.parse_json_string_list(
            instructions_es, "instructions_es"
        ),
        category_es=category_es,
        level_es=level_es,
        force_es=force_es,
        mechanic_es=mechanic_es,
        equipment_es=equipment_es,
        primary_muscles_es=exercise_service.parse_json_string_list(
            primary_muscles_es, "primary_muscles_es"
        ),
        secondary_muscles_es=exercise_service.parse_json_string_list(
            secondary_muscles_es, "secondary_muscles_es"
        ),
        images=images,
    )


@router.patch("/{exercise_id}", response_model=ExerciseOut)
async def update_exercise(
    exercise_id: str,
    name_es: str | None = Form(None),
    instructions_es: str | None = Form(None, description="JSON array of strings"),
    category_es: str | None = Form(None),
    level_es: str | None = Form(None),
    force_es: str | None = Form(None),
    mechanic_es: str | None = Form(None),
    equipment_es: str | None = Form(None),
    primary_muscles_es: str | None = Form(None, description="JSON array of strings"),
    secondary_muscles_es: str | None = Form(None, description="JSON array of strings"),
    images: list[UploadFile] | None = File(default=None),
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> Exercise:
    updates: dict = {}
    if name_es is not None:
        updates["name_es"] = name_es
    if instructions_es is not None:
        updates["instructions_es"] = exercise_service.parse_json_string_list(
            instructions_es, "instructions_es"
        )
    if category_es is not None:
        updates["category_es"] = category_es
    if level_es is not None:
        updates["level_es"] = level_es
    if force_es is not None:
        updates["force_es"] = force_es
    if mechanic_es is not None:
        updates["mechanic_es"] = mechanic_es
    if equipment_es is not None:
        updates["equipment_es"] = equipment_es
    if primary_muscles_es is not None:
        updates["primary_muscles_es"] = exercise_service.parse_json_string_list(
            primary_muscles_es, "primary_muscles_es"
        )
    if secondary_muscles_es is not None:
        updates["secondary_muscles_es"] = exercise_service.parse_json_string_list(
            secondary_muscles_es, "secondary_muscles_es"
        )

    return await exercise_service.update_exercise(
        db, trainer, exercise_id, updates=updates, images=images
    )


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
    exercise_id: str,
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> None:
    exercise_service.delete_exercise(db, trainer, exercise_id)
