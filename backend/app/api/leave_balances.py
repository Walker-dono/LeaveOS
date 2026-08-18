"""Leave Balances API."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.leave_balance import LeaveBalance
from app.models.user import User
from app.schemas.leave import LeaveBalanceRead

router = APIRouter(prefix="/leave-balances", tags=["leave-balances"])


@router.get("/me", response_model=list[LeaveBalanceRead])
async def get_my_balances(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's leave balances for the current year."""
    current_year = datetime.now(timezone.utc).year
    balances = (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.user_id == current_user.id,
            LeaveBalance.year == current_year,
        )
        .all()
    )
    result = []
    for b in balances:
        result.append(
            LeaveBalanceRead(
                id=b.id,
                user_id=b.user_id,
                leave_type_id=b.leave_type_id,
                leave_type_name=b.leave_type.name if b.leave_type else None,
                year=b.year,
                allocated_days=b.allocated_days,
                used_days=b.used_days,
                remaining_days=b.remaining_days,
            )
        )
    return result
