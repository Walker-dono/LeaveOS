"""User model with role enum."""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    """User role enum matching the Django reference."""
    EMPLOYEE = "EMPLOYEE"
    MANAGER = "MANAGER"
    HR_ADMIN = "HR_ADMIN"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        default=UserRole.EMPLOYEE, nullable=False
    )
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    manager_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[str] = mapped_column(
        String(50), nullable=False,
        default=lambda: datetime.now(timezone.utc).isoformat(),
    )

    # Relationships
    department = relationship("Department", back_populates="staff")
    manager = relationship("User", remote_side="User.id", backref="direct_reports")
    balances = relationship("LeaveBalance", back_populates="user")
    leave_requests = relationship(
        "LeaveRequest",
        back_populates="user",
        foreign_keys="LeaveRequest.user_id",
    )
    approved_requests = relationship(
        "LeaveRequest",
        back_populates="approver",
        foreign_keys="LeaveRequest.approver_id",
    )

    @property
    def is_manager(self) -> bool:
        return self.role == UserRole.MANAGER

    @property
    def is_hr_admin(self) -> bool:
        return self.role == UserRole.HR_ADMIN

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role.value})>"
