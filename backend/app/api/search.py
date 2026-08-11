from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.models import Trainer
from app.schemas.search import SearchResults
from app.services import search_service

router = APIRouter(tags=["search"], dependencies=[Depends(get_current_trainer)])


@router.get("/api/search", response_model=SearchResults)
def search(
    q: str = Query(default="", max_length=100),
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> SearchResults:
    """Everything the trainer can jump to from one box: the Ctrl+K palette."""
    return search_service.search(db, trainer, q)
