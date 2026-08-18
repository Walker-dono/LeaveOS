"""Pytest configuration and shared fixtures for LeaveOS backend tests."""

import os
import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.main import app
from app.api.deps import get_db
from app.models.department import Department
from app.models.leave_balance import LeaveBalance
from app.models.leave_type import LeaveType
from app.models.user import User, UserRole
from app.services.auth import hash_password, create_access_token


# In-memory SQLite for tests — fast and isolated
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Override the DB dependency for all tests
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """Provide a DB session for direct model operations in tests."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def department(db):
    """Create a test department."""
    dept = Department(id=uuid.uuid4(), name="Engineering")
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@pytest.fixture
def leave_type(db):
    """Create a test leave type."""
    lt = LeaveType(
        id=uuid.uuid4(),
        name="Annual Leave",
        default_days_per_year=25,
        requires_approval=True,
        is_paid=True,
    )
    db.add(lt)
    db.commit()
    db.refresh(lt)
    return lt


@pytest.fixture
def manager(db, department):
    """Create a test manager user."""
    user = User(
        id=uuid.uuid4(),
        email="manager@test.com",
        hashed_password=hash_password("password123"),
        full_name="Test Manager",
        role=UserRole.MANAGER,
        department_id=department.id,
        is_active=True,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def employee(db, department, manager):
    """Create a test employee user (reports to manager)."""
    user = User(
        id=uuid.uuid4(),
        email="employee@test.com",
        hashed_password=hash_password("password123"),
        full_name="Test Employee",
        role=UserRole.EMPLOYEE,
        department_id=department.id,
        manager_id=manager.id,
        is_active=True,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def hr_admin(db, department):
    """Create a test HR Admin user."""
    user = User(
        id=uuid.uuid4(),
        email="hradmin@test.com",
        hashed_password=hash_password("password123"),
        full_name="Test HR Admin",
        role=UserRole.HR_ADMIN,
        department_id=department.id,
        is_active=True,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def employee_balance(db, employee, leave_type):
    """Create a leave balance for the test employee."""
    bal = LeaveBalance(
        id=uuid.uuid4(),
        user_id=employee.id,
        leave_type_id=leave_type.id,
        year=datetime.now(timezone.utc).year,
        allocated_days=25,
        used_days=0,
    )
    db.add(bal)
    db.commit()
    db.refresh(bal)
    return bal


def auth_header(user: User) -> dict:
    """Generate an Authorization header for a user."""
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}
