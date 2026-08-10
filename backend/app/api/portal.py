from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.rate_limit import SlidingWindowLimiter
from app.models import Client
from app.schemas.portal import PortalClientOut
from app.services import portal_service

# Guessing a 32-byte token is hopeless anyway; this is defence in depth against
# someone hammering the endpoint. Only failed attempts count, so a client
# reloading their own portal all day is never locked out.
portal_limiter = SlidingWindowLimiter(max_attempts=20, window_seconds=300)

router = APIRouter(prefix="/api/portal", tags=["portal"])


def _caller_ip(request: Request) -> str:
    # Traefik and the Next proxy sit in front, so the original address only
    # survives in the forwarding header.
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def get_portal_client(
    token: str, request: Request, db: Session = Depends(get_db)
) -> Client:
    """Resolve the client from the token alone.

    Every portal route depends on this and none of them takes a client id, so
    there is no way to ask for someone else's data by editing the URL.
    """
    caller = _caller_ip(request)
    if portal_limiter.is_blocked(caller):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts, try again later",
        )

    try:
        return portal_service.resolve_token(db, token)
    except HTTPException:
        portal_limiter.record_failure(caller)
        raise


@router.get("/{token}", response_model=PortalClientOut)
def get_portal_home(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> PortalClientOut:
    return portal_service.build_portal_view(db, client)
