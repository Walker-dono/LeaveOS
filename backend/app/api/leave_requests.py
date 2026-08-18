"""Leave Requests API — CRUD, cancel, and decision endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_manager_or_hr
from app.models.leave_request import LeaveRequest
from app.models.user import User, UserRole
from app.schemas.leave import (
    LeaveDecisionRequest,
    LeaveRequestCreate,
    LeaveRequestRead,
)
from app.services.leave import (
    cancel_leave_request,
    decide_leave_request,
    submit_leave_request,
)

router = APIRouter(prefix="/leave-requests", tags=["leave-requests"])


def _request_to_read(lr: LeaveRequest) -> LeaveRequestRead:
    """Convert a LeaveRequest model to its read schema."""
    return LeaveRequestRead(
        id=lr.id,
        user_id=lr.user_id,
        user_name=lr.user.full_name if lr.user else None,
        leave_type_id=lr.leave_type_id,
        leave_type_name=lr.leave_type.name if lr.leave_type else None,
        start_date=lr.start_date,
        end_date=lr.end_date,
        reason=lr.reason,
        status=lr.status,
        approver_id=lr.approver_id,
        approver_name=lr.approver.full_name if lr.approver else None,
        decision_comment=lr.decision_comment,
        days_requested=lr.days_requested,
        created_at=lr.created_at,
        decided_at=lr.decided_at,
    )


@router.post("", response_model=LeaveRequestRead, status_code=status.HTTP_201_CREATED)
async def create_leave_request(
    body: LeaveRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit a new leave request (Employee+)."""
    try:
        lr = submit_leave_request(
            db=db,
            user=current_user,
            leave_type_id=body.leave_type_id,
            start_date=body.start_date,
            end_date=body.end_date,
            reason=body.reason,
        )
        return _request_to_read(lr)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/me", response_model=list[LeaveRequestRead])
async def get_my_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's own leave request history."""
    requests = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.user_id == current_user.id)
        .order_by(LeaveRequest.created_at.desc())
        .all()
    )
    return [_request_to_read(lr) for lr in requests]


@router.patch("/{request_id}/cancel", response_model=LeaveRequestRead)
async def cancel_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel own pending leave request."""
    try:
        lr = cancel_leave_request(db=db, request_id=request_id, user=current_user)
        return _request_to_read(lr)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/team", response_model=list[LeaveRequestRead])
async def get_team_requests(
    manager: User = Depends(require_manager_or_hr),
    db: Session = Depends(get_db),
):
    """Get leave requests (direct reports for Manager, company-wide for HR Admin)."""
    query = db.query(LeaveRequest).join(User, User.id == LeaveRequest.user_id)
    if manager.role != UserRole.HR_ADMIN:
        query = query.filter(User.manager_id == manager.id)
    requests = query.order_by(LeaveRequest.status, LeaveRequest.created_at.desc()).all()
    return [_request_to_read(lr) for lr in requests]


@router.patch("/{request_id}/decision", response_model=LeaveRequestRead)
async def decide_request(
    request_id: UUID,
    body: LeaveDecisionRequest,
    manager: User = Depends(require_manager_or_hr),
    db: Session = Depends(get_db),
):
    """Approve or reject a leave request (Manager for direct reports, HR Admin for company)."""
    try:
        lr = decide_leave_request(
            db=db,
            request_id=request_id,
            manager=manager,
            action=body.action,
            comment=body.comment,
        )
        return _request_to_read(lr)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
