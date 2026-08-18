"""Pydantic schemas for analytics endpoints."""

from pydantic import BaseModel


class StatusCount(BaseModel):
    status: str
    count: int


class DepartmentCount(BaseModel):
    department: str
    count: int


class MonthCount(BaseModel):
    month: str  # "YYYY-MM"
    count: int


class AnalyticsSummary(BaseModel):
    by_status: list[StatusCount]
    by_department: list[DepartmentCount]
    by_month: list[MonthCount]
    total_requests: int


class ForecastResult(BaseModel):
    predicted_month: str  # "YYYY-MM"
    predicted_volume: float
    model_type: str  # e.g. "linear_regression"
    confidence_note: str
    historical_data: list[MonthCount]
