import uuid
from datetime import date
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models import ClientPhoto, PhotoPose
from app.repositories import photo_repository
from app.services import client_service, photo_storage


def list_photos(db: Session, client_id: uuid.UUID) -> list[ClientPhoto]:
    client_service.get_client(db, client_id)
    return photo_repository.list_for_client(db, client_id)


def get_photo(db: Session, photo_id: uuid.UUID) -> ClientPhoto:
    photo = photo_repository.get_by_id(db, photo_id)
    if photo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found"
        )
    return photo


async def create_photo(
    db: Session,
    client_id: uuid.UUID,
    *,
    taken_on: date,
    pose: PhotoPose,
    upload: UploadFile,
) -> ClientPhoto:
    """Uploading the same day and pose again replaces the previous shot.

    The new files are written before the old row is dropped, so a failed upload
    never leaves the client without the photo they already had.
    """
    client_service.get_client(db, client_id)
    existing = photo_repository.get_by_slot(db, client_id, taken_on, pose)

    photo_id = uuid.uuid4()
    file_path, thumb_path = await photo_storage.save_photo(client_id, photo_id, upload)

    if existing is not None:
        photo_repository.delete(db, existing)
        photo_storage.delete_files(existing.file_path, existing.thumb_path)

    return photo_repository.create(
        db,
        photo_id=photo_id,
        client_id=client_id,
        taken_on=taken_on,
        pose=pose,
        file_path=file_path,
        thumb_path=thumb_path,
    )


def photo_file(db: Session, photo_id: uuid.UUID, *, thumbnail: bool) -> Path:
    photo = get_photo(db, photo_id)
    path = photo_storage.absolute_path(
        photo.thumb_path if thumbnail else photo.file_path
    )
    if not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Photo file is missing"
        )
    return path


def delete_photo(db: Session, photo_id: uuid.UUID) -> None:
    photo = get_photo(db, photo_id)
    file_path, thumb_path = photo.file_path, photo.thumb_path
    photo_repository.delete(db, photo)
    photo_storage.delete_files(file_path, thumb_path)


def delete_all_photos(db: Session, client_id: uuid.UUID) -> int:
    """Every photo of a client, files included.

    What withdrawing consent has to be able to do: leaving the images on disk
    would make the promise meaningless.
    """
    photos = photo_repository.list_for_client(db, client_id)
    for photo in photos:
        file_path, thumb_path = photo.file_path, photo.thumb_path
        photo_repository.delete(db, photo)
        photo_storage.delete_files(file_path, thumb_path)
    return len(photos)
