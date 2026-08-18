"""Departments API."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_hr_admin
from app.models.department import Department
from app.models.user import User
from app.schemas.leave import DepartmentRead

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("", response_model=list[DepartmentRead])
async def list_departments(
    hr_user: User = Depends(require_hr_admin),
    db: Session = Depends(get_db),
):
    """List all departments (HR Admin only)."""
    departments = db.query(Department).order_by(Department.name).all()
    return [DepartmentRead.model_validate(d) for d in departments]
