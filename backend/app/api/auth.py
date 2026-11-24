from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.client_ip import caller_ip
from app.core.db import get_db
from app.core.rate_limit import SlidingWindowLimiter
from app.core.security import (
    clear_session_cookie,
    get_current_trainer,
    set_session_cookie,
)
from app.models import Trainer
from app.schemas.auth import LoginRequest, TrainerOut
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Only failures count, so the trainer logging in from several devices is never
# locked out; ten wrong passwords in fifteen minutes is someone guessing.
login_limiter = SlidingWindowLimiter(max_attempts=10, window_seconds=900)


@router.post("/login", response_model=TrainerOut)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> Trainer:
    caller = caller_ip(request)
    if login_limiter.is_blocked(caller):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts, try again later",
        )

    trainer = auth_service.authenticate(db, payload.email, payload.password)
    if trainer is None:
        login_limiter.record_attempt(caller)
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
