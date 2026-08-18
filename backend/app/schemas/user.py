"""Pydantic schemas for User."""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserRead(BaseModel):
    """User response schema."""
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole
    department_id: uuid.UUID | None = None
    department_name: str | None = None
    manager_id: uuid.UUID | None = None
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    """User creation schema (used by seed script / admin)."""
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.EMPLOYEE
    department_id: uuid.UUID | None = None
    manager_id: uuid.UUID | None = None
