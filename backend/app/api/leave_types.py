"""Leave Types API."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.leave_type import LeaveType
from app.models.user import User
from app.schemas.leave import LeaveTypeRead

router = APIRouter(prefix="/leave-types", tags=["leave-types"])


@router.get("", response_model=list[LeaveTypeRead])
async def list_leave_types(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all leave types (authenticated users)."""
    leave_types = db.query(LeaveType).order_by(LeaveType.name).all()
    return [LeaveTypeRead.model_validate(lt) for lt in leave_types]
