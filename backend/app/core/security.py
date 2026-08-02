import uuid
from datetime import UTC, datetime, timedelta

import bcrypt
from fastapi import Cookie, Depends, HTTPException, Response, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import get_db
from app.models import Trainer

settings = get_settings()

COOKIE_NAME = "josema_session"
COOKIE_MAX_AGE_SECONDS = settings.jwt_expire_minutes * 60


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(trainer_id: uuid.UUID) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(trainer_id), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> uuid.UUID:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        ) from exc

    subject = payload.get("sub")
    if subject is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session"
        )
    return uuid.UUID(subject)


def set_session_cookie(response: Response, trainer_id: uuid.UUID) -> None:
    token = create_access_token(trainer_id)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=COOKIE_MAX_AGE_SECONDS,
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME)


def get_current_trainer(
    response: Response,
    db: Session = Depends(get_db),
    session_token: str | None = Cookie(default=None, alias=COOKIE_NAME),
) -> Trainer:
    if session_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    trainer_id = decode_access_token(session_token)
    trainer = db.get(Trainer, trainer_id)
    if trainer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    # Sliding renewal: every authenticated request refreshes the cookie's expiry.
    set_session_cookie(response, trainer.id)
    return trainer
