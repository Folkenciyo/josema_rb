import uuid
from datetime import date

from sqlalchemy.orm import Session

from app.models import ClientPhoto, PhotoPose


def list_for_client(db: Session, client_id: uuid.UUID) -> list[ClientPhoto]:
    return (
        db.query(ClientPhoto)
        .filter(ClientPhoto.client_id == client_id)
        .order_by(ClientPhoto.taken_on.desc(), ClientPhoto.pose)
        .all()
    )


def get_by_id(db: Session, photo_id: uuid.UUID) -> ClientPhoto | None:
    return db.query(ClientPhoto).filter(ClientPhoto.id == photo_id).first()


def get_by_slot(
    db: Session, client_id: uuid.UUID, taken_on: date, pose: PhotoPose
) -> ClientPhoto | None:
    return (
        db.query(ClientPhoto)
        .filter(
            ClientPhoto.client_id == client_id,
            ClientPhoto.taken_on == taken_on,
            ClientPhoto.pose == pose,
        )
        .first()
    )


def create(
    db: Session,
    *,
    photo_id: uuid.UUID,
    client_id: uuid.UUID,
    taken_on: date,
    pose: PhotoPose,
    file_path: str,
    thumb_path: str,
) -> ClientPhoto:
    photo = ClientPhoto(
        id=photo_id,
        client_id=client_id,
        taken_on=taken_on,
        pose=pose,
        file_path=file_path,
        thumb_path=thumb_path,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


def delete(db: Session, photo: ClientPhoto) -> None:
    db.delete(photo)
    db.commit()
