"""Analytics API — summary and forecast endpoints (HR Admin only)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_hr_admin
from app.models.user import User
from app.schemas.analytics import AnalyticsSummary, ForecastResult
from app.services.analytics import get_forecast, get_summary

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
async def analytics_summary(
    hr_user: User = Depends(require_hr_admin),
    db: Session = Depends(get_db),
):
    """Aggregate leave request counts by status, department, and month."""
    data = get_summary(db)
    return AnalyticsSummary(**data)


@router.get("/forecast", response_model=ForecastResult)
async def analytics_forecast(
    hr_user: User = Depends(require_hr_admin),
    db: Session = Depends(get_db),
):
    """Forecast next month's leave request volume using linear regression."""
    data = get_forecast(db)
    return ForecastResult(**data)
