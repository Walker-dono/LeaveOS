"""Leave business logic service.

Enforces all business rules from the spec at the service layer:
- Cannot approve/reject own request
- Manager can only act on direct reports
- Approval atomically increments used_days
- Cancel only when status == PENDING
"""

from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.holiday import Holiday
from app.models.leave_balance import LeaveBalance
from app.models.leave_request import LeaveRequest, LeaveStatus
from app.models.leave_type import LeaveType
from app.models.user import User, UserRole


def count_working_days(
    start_date: date,
    end_date: date,
    db: Session,
) -> int:
    """Count working days (Mon-Fri) between start and end (inclusive),
    excluding any holidays in the Holiday table."""
    # Fetch holidays in range
    holidays_in_range = set()
    holiday_rows = (
        db.query(Holiday.date)
        .filter(Holiday.date >= start_date, Holiday.date <= end_date)
        .all()
    )
    for row in holiday_rows:
        holidays_in_range.add(row.date)

    count = 0
    current = start_date
    while current <= end_date:
        if current.weekday() < 5 and current not in holidays_in_range:
            count += 1
        current += timedelta(days=1)
    return count


def submit_leave_request(
    db: Session,
    user: User,
    leave_type_id: UUID,
    start_date: date,
    end_date: date,
    reason: str = "",
) -> LeaveRequest:
    """Submit a new leave request."""
    # Validate leave type exists
    leave_type = db.query(LeaveType).filter(LeaveType.id == leave_type_id).first()
    if not leave_type:
        raise ValueError("Leave type not found.")

    if end_date < start_date:
        raise ValueError("End date cannot be before start date.")

    # Check balance
    working_days = count_working_days(start_date, end_date, db)
    balance = (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.user_id == user.id,
            LeaveBalance.leave_type_id == leave_type_id,
            LeaveBalance.year == start_date.year,
        )
        .first()
    )
    if balance and balance.remaining_days < working_days:
        raise ValueError(
            f"Insufficient leave balance. Requested {working_days} days, "
            f"but only {balance.remaining_days} remaining."
        )

    request = LeaveRequest(
        user_id=user.id,
        leave_type_id=leave_type_id,
        start_date=start_date,
        end_date=end_date,
        reason=reason,
        status=LeaveStatus.PENDING,
        created_at=datetime.now(timezone.utc),
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


def cancel_leave_request(
    db: Session,
    request_id: UUID,
    user: User,
) -> LeaveRequest:
    """Cancel own pending leave request."""
    leave_request = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.id == request_id, LeaveRequest.user_id == user.id)
        .first()
    )
    if not leave_request:
        raise ValueError("Leave request not found.")

    if leave_request.status != LeaveStatus.PENDING:
        raise ValueError("Only pending requests can be cancelled.")

    leave_request.status = LeaveStatus.CANCELLED
    leave_request.decided_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(leave_request)
    return leave_request


def decide_leave_request(
    db: Session,
    request_id: UUID,
    manager: User,
    action: str,
    comment: str = "",
) -> LeaveRequest:
    """Approve or reject a leave request (manager action).

    Business rules enforced:
    - Manager cannot approve/reject their own request
    - Manager can only act on direct reports (user.manager_id == manager.id)
    - Approval atomically increments used_days in a transaction
    """
    leave_request = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
    if not leave_request:
        raise ValueError("Leave request not found.")

    # Rule: cannot act on own request
    if leave_request.user_id == manager.id:
        raise ValueError("Cannot approve/reject your own leave request.")

    # Rule: manager can only act on direct reports
    requestor = db.query(User).filter(User.id == leave_request.user_id).first()
    if not requestor or requestor.manager_id != manager.id:
        raise ValueError("You can only act on requests from your direct reports.")

    if leave_request.status != LeaveStatus.PENDING:
        raise ValueError("Can only decide on pending requests.")

    # Set decision
    if action == "approve":
        leave_request.status = LeaveStatus.APPROVED

        # Atomically update balance
        balance = (
            db.query(LeaveBalance)
            .filter(
                LeaveBalance.user_id == leave_request.user_id,
                LeaveBalance.leave_type_id == leave_request.leave_type_id,
                LeaveBalance.year == leave_request.start_date.year,
            )
            .first()
        )
        if not balance:
            # Auto-create balance if not exists (matching Django get_or_create)
            leave_type = (
                db.query(LeaveType)
                .filter(LeaveType.id == leave_request.leave_type_id)
                .first()
            )
            balance = LeaveBalance(
                user_id=leave_request.user_id,
                leave_type_id=leave_request.leave_type_id,
                year=leave_request.start_date.year,
                allocated_days=leave_type.default_days_per_year if leave_type else 20,
                used_days=0,
            )
            db.add(balance)
            db.flush()

        working_days = count_working_days(
            leave_request.start_date, leave_request.end_date, db
        )
        balance.used_days += working_days

    elif action == "reject":
        leave_request.status = LeaveStatus.REJECTED
    else:
        raise ValueError("Action must be 'approve' or 'reject'.")

    leave_request.approver_id = manager.id
    leave_request.decision_comment = comment
    leave_request.decided_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(leave_request)
    return leave_request
