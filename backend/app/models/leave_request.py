"""LeaveRequest model with status enum and working-day calculation."""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LeaveStatus(str, enum.Enum):
    """Leave request status enum matching Django reference."""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    leave_type_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("leave_types.id", ondelete="RESTRICT"), nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(Text, default="", nullable=False)
    status: Mapped[LeaveStatus] = mapped_column(
        default=LeaveStatus.PENDING, nullable=False
    )
    approver_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    decision_comment: Mapped[str] = mapped_column(
        String(255), default="", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    # Relationships
    user = relationship(
        "User", back_populates="leave_requests", foreign_keys=[user_id]
    )
    leave_type = relationship("LeaveType", back_populates="leave_requests")
    approver = relationship(
        "User", back_populates="approved_requests", foreign_keys=[approver_id]
    )

    @property
    def days_requested(self) -> int:
        """Count working days (Mon–Fri) between start_date and end_date inclusive.

        Excludes weekends. Does NOT exclude holidays here — that logic lives
        in the service layer where it can query the Holiday table.
        """
        if not self.start_date or not self.end_date:
            return 0
        count = 0
        current = self.start_date
        from datetime import timedelta
        while current <= self.end_date:
            # Monday=0, Sunday=6 — count only Mon-Fri (0-4)
            if current.weekday() < 5:
                count += 1
            current += timedelta(days=1)
        return count

    def __repr__(self) -> str:
        return (
            f"<LeaveRequest {self.user_id} | {self.start_date} to "
            f"{self.end_date} | {self.status.value}>"
        )
