from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import (
    clear_session_cookie,
    get_current_trainer,
    set_session_cookie,
)
from app.models import Trainer
from app.schemas.auth import LoginRequest, TrainerOut
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TrainerOut)
def login(
    payload: LoginRequest, response: Response, db: Session = Depends(get_db)
) -> Trainer:
    trainer = auth_service.authenticate(db, payload.email, payload.password)
    if trainer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    set_session_cookie(response, trainer.id)
    return trainer


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    clear_session_cookie(response)


@router.get("/me", response_model=TrainerOut)
def me(trainer: Trainer = Depends(get_current_trainer)) -> Trainer:
    return trainer
