import json
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models import Exercise, Trainer
from app.repositories import exercise_repository

STATIC_ROOT = Path(__file__).resolve().parent.parent / "static" / "exercise-images"
CUSTOM_IMAGES_ROOT = STATIC_ROOT / "custom"

MAX_IMAGES = 2
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg": ".jpg", "image/png": ".png"}


def list_exercises(
    db: Session,
    *,
    muscle: str | None = None,
    equipment: str | None = None,
    category: str | None = None,
    level: str | None = None,
    search: str | None = None,
) -> list[Exercise]:
    return exercise_repository.list_exercises(
        db,
        muscle=muscle,
        equipment=equipment,
        category=category,
        level=level,
        search=search,
    )


def get_exercise(db: Session, exercise_id: str) -> Exercise:
    exercise = exercise_repository.get_by_id(db, exercise_id)
    if exercise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found"
        )
    return exercise


def get_filters(db: Session) -> dict[str, list[str]]:
    return exercise_repository.distinct_filter_values(db)


def parse_json_string_list(raw: str | None, field_name: str) -> list[str]:
    if raw is None:
        return []
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"{field_name} must be a JSON array of strings",
        ) from exc
    if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"{field_name} must be a JSON array of strings",
        )
    return value


async def _save_images(exercise_id: str, images: list[UploadFile]) -> list[str]:
    if not images:
        return []
    if len(images) > MAX_IMAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Maximum {MAX_IMAGES} images allowed",
        )

    exercise_dir = CUSTOM_IMAGES_ROOT / exercise_id
    exercise_dir.mkdir(parents=True, exist_ok=True)

    saved_paths: list[str] = []
    for index, image in enumerate(images):
        extension = ALLOWED_CONTENT_TYPES.get(image.content_type or "")
        if extension is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Unsupported image type: {image.content_type}",
            )
        contents = await image.read()
        if len(contents) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Image exceeds 5MB limit",
            )
        dest = exercise_dir / f"{index}{extension}"
        dest.write_bytes(contents)
        saved_paths.append(f"custom/{exercise_id}/{index}{extension}")

    return saved_paths


async def create_exercise(
    db: Session,
    trainer: Trainer,
    *,
    name_es: str,
    instructions_es: list[str],
    category_es: str | None,
    level_es: str | None,
    force_es: str | None,
    mechanic_es: str | None,
    equipment_es: str | None,
    primary_muscles_es: list[str],
    secondary_muscles_es: list[str],
    images: list[UploadFile],
) -> Exercise:
    exercise_id = str(uuid.uuid4())
    image_paths = await _save_images(exercise_id, images)

    exercise = Exercise(
        id=exercise_id,
        created_by_trainer_id=trainer.id,
        name_es=name_es,
        category_es=category_es,
        level_es=level_es,
        force_es=force_es,
        mechanic_es=mechanic_es,
        equipment_es=equipment_es,
        primary_muscles_es=primary_muscles_es,
        secondary_muscles_es=secondary_muscles_es,
        instructions_es=instructions_es,
        images=image_paths,
        source="trainer",
    )
    return exercise_repository.create(db, exercise)


def _ensure_owned(exercise: Exercise, trainer: Trainer) -> None:
    if (
        exercise.created_by_trainer_id is None
        or exercise.created_by_trainer_id != trainer.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainer-created exercises can be modified",
        )


async def update_exercise(
    db: Session,
    trainer: Trainer,
    exercise_id: str,
    *,
    updates: dict,
    images: list[UploadFile] | None,
) -> Exercise:
    exercise = get_exercise(db, exercise_id)
    _ensure_owned(exercise, trainer)

    if images:
        updates["images"] = await _save_images(exercise_id, images)

    return exercise_repository.update(db, exercise, updates)


def delete_exercise(db: Session, trainer: Trainer, exercise_id: str) -> None:
    exercise = get_exercise(db, exercise_id)
    _ensure_owned(exercise, trainer)
    exercise_repository.delete(db, exercise)
