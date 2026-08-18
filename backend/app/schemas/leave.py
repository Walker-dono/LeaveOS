"""Pydantic schemas for Leave-related entities."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, field_validator

from app.models.leave_request import LeaveStatus


# --- LeaveType ---
class LeaveTypeRead(BaseModel):
    id: uuid.UUID
    name: str
    default_days_per_year: int
    requires_approval: bool
    is_paid: bool

    model_config = {"from_attributes": True}


# --- LeaveBalance ---
class LeaveBalanceRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    leave_type_id: uuid.UUID
    leave_type_name: str | None = None
    year: int
    allocated_days: int
    used_days: int
    remaining_days: int

    model_config = {"from_attributes": True}


# --- LeaveRequest ---
class LeaveRequestCreate(BaseModel):
    leave_type_id: uuid.UUID
    start_date: date
    end_date: date
    reason: str = ""

    @field_validator("end_date")
    @classmethod
    def end_date_not_before_start(cls, v: date, info) -> date:
        start = info.data.get("start_date")
        if start and v < start:
            raise ValueError("End date cannot be before start date.")
        return v


class LeaveRequestRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_name: str | None = None
    leave_type_id: uuid.UUID
    leave_type_name: str | None = None
    start_date: date
    end_date: date
    reason: str
    status: LeaveStatus
    approver_id: uuid.UUID | None = None
    approver_name: str | None = None
    decision_comment: str
    days_requested: int
    created_at: datetime
    decided_at: datetime | None = None

    model_config = {"from_attributes": True}


class LeaveDecisionRequest(BaseModel):
    """Approve or reject a leave request."""
    action: str  # "approve" or "reject"
    comment: str = ""

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        if v.lower() not in ("approve", "reject"):
            raise ValueError("Action must be 'approve' or 'reject'.")
        return v.lower()


# --- Department ---
class DepartmentRead(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}


class DepartmentCreate(BaseModel):
    name: str
