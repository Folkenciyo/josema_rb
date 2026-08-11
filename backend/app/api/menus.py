import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.models import Trainer
from app.schemas.menu import MenuCreate, MenuOut, MenuScaleRequest, MenuUpdate
from app.services import menu_service

router = APIRouter(
    prefix="/api/menus", tags=["menus"], dependencies=[Depends(get_current_trainer)]
)


@router.get("", response_model=list[MenuOut])
def list_menus(
    db: Session = Depends(get_db), trainer: Trainer = Depends(get_current_trainer)
) -> list[MenuOut]:
    menus = menu_service.list_menus(db, trainer)
    return [menu_service.to_out(menu) for menu in menus]


@router.post("", response_model=MenuOut, status_code=status.HTTP_201_CREATED)
def create_menu(
    payload: MenuCreate,
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> MenuOut:
    menu = menu_service.create_menu(db, trainer, payload)
    return menu_service.to_out(menu)


@router.post(
    "/{menu_id}/scale", response_model=MenuOut, status_code=status.HTTP_201_CREATED
)
def scale_menu(
    menu_id: uuid.UUID,
    payload: MenuScaleRequest,
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> MenuOut:
    """The same menu at another calorie target, as a new menu.

    Never an edit: menus are shared, and this one may already be handed out
    inside somebody else's week.
    """
    menu = menu_service.scale_menu(db, trainer, menu_id, payload.target_calories)
    return menu_service.to_out(menu)


@router.get("/{menu_id}", response_model=MenuOut)
def get_menu(menu_id: uuid.UUID, db: Session = Depends(get_db)) -> MenuOut:
    menu = menu_service.get_menu(db, menu_id)
    return menu_service.to_out(menu)


@router.patch("/{menu_id}", response_model=MenuOut)
def update_menu(
    menu_id: uuid.UUID, payload: MenuUpdate, db: Session = Depends(get_db)
) -> MenuOut:
    menu = menu_service.update_menu(db, menu_id, payload)
    return menu_service.to_out(menu)


@router.delete("/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu(menu_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    menu_service.delete_menu(db, menu_id)
