import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.leave_balance import LeaveBalance
from app.models.leave_type import LeaveType
from app.models.user import User
from app.schemas.leave import LeaveBalanceRead

router = APIRouter(prefix="/leave-balances", tags=["leave-balances"])


@router.get("/me", response_model=list[LeaveBalanceRead])
async def get_my_balances(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's leave balances for the current year, auto-provisioning missing ones."""
    current_year = datetime.now(timezone.utc).year
    leave_types = db.query(LeaveType).order_by(LeaveType.name).all()

    existing_balances = {
        b.leave_type_id: b
        for b in db.query(LeaveBalance)
        .filter(
            LeaveBalance.user_id == current_user.id,
            LeaveBalance.year == current_year,
        )
        .all()
    }

    created_any = False
    for lt in leave_types:
        if lt.id not in existing_balances:
            new_bal = LeaveBalance(
                id=uuid.uuid4(),
                user_id=current_user.id,
                leave_type_id=lt.id,
                year=current_year,
                allocated_days=lt.default_days_per_year,
                used_days=0,
            )
            db.add(new_bal)
            existing_balances[lt.id] = new_bal
            created_any = True

    if created_any:
        db.commit()
        for b in existing_balances.values():
            db.refresh(b)

    result = []
    for lt in leave_types:
        b = existing_balances.get(lt.id)
        if b:
            result.append(
                LeaveBalanceRead(
                    id=b.id,
                    user_id=b.user_id,
                    leave_type_id=b.leave_type_id,
                    leave_type_name=lt.name,
                    year=b.year,
                    allocated_days=b.allocated_days,
                    used_days=b.used_days,
                    remaining_days=b.remaining_days,
                )
            )
    return result
