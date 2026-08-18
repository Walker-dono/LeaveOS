"""LeaveType model."""

import uuid

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LeaveType(Base):
    __tablename__ = "leave_types"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    default_days_per_year: Mapped[int] = mapped_column(
        Integer, default=20, nullable=False
    )
    requires_approval: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    is_paid: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    # Relationships
    balances = relationship("LeaveBalance", back_populates="leave_type")
    leave_requests = relationship("LeaveRequest", back_populates="leave_type")

    def __repr__(self) -> str:
        return f"<LeaveType {self.name}>"
