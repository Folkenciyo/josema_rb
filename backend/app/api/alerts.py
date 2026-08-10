from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.schemas.alert import DashboardAlerts
from app.services import alert_service

router = APIRouter(
    prefix="/api/alerts", tags=["alerts"], dependencies=[Depends(get_current_trainer)]
)


@router.get("", response_model=DashboardAlerts)
def get_alerts(db: Session = Depends(get_db)) -> DashboardAlerts:
    return alert_service.get_dashboard_alerts(db)
