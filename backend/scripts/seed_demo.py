"""Seed script — generates realistic synthetic demo data using Faker.

Creates:
- 5 departments
- 50+ users (employees, managers, HR admins) with demo login credentials
- Leave types (Annual, Sick, Parental, Compassionate, Study)
- 6-12 months of leave requests with seasonal bias (higher in December)
- Corresponding leave balances

Demo credentials (for quick login buttons):
- HR Admin:  hradmin@leaveos.demo / password123
- Manager:   mgr_engineering@leaveos.demo / password123
- Employee:  emp_demo@leaveos.demo / password123
"""

import random
import sys
import os
from datetime import date, datetime, timedelta, timezone
from uuid import uuid4

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from faker import Faker

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models.department import Department
from app.models.holiday import Holiday
from app.models.leave_balance import LeaveBalance
from app.models.leave_request import LeaveRequest, LeaveStatus
from app.models.leave_type import LeaveType
from app.models.user import User, UserRole
from app.services.auth import hash_password

fake = Faker()
Faker.seed(42)
random.seed(42)

# ── Configuration ──────────────────────────────────────────────
DEMO_PASSWORD = "password123"
DEPARTMENT_NAMES = ["Engineering", "Marketing", "Sales", "Human Resources", "Finance"]
LEAVE_TYPES = [
    {"name": "Annual Leave", "default_days_per_year": 25, "requires_approval": True, "is_paid": True},
    {"name": "Sick Leave", "default_days_per_year": 10, "requires_approval": True, "is_paid": True},
    {"name": "Parental Leave", "default_days_per_year": 90, "requires_approval": True, "is_paid": True},
    {"name": "Compassionate Leave", "default_days_per_year": 5, "requires_approval": True, "is_paid": True},
    {"name": "Study Leave", "default_days_per_year": 10, "requires_approval": True, "is_paid": False},
]
PUBLIC_HOLIDAYS = [
    (date(2026, 1, 1), "New Year's Day"),
    (date(2026, 4, 3), "Good Friday"),
    (date(2026, 4, 6), "Easter Monday"),
    (date(2026, 5, 4), "Early May Bank Holiday"),
    (date(2026, 5, 25), "Spring Bank Holiday"),
    (date(2026, 8, 31), "Summer Bank Holiday"),
    (date(2026, 12, 25), "Christmas Day"),
    (date(2026, 12, 26), "Boxing Day"),
]


def seed():
    """Run the full seed."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if database is already seeded
        if db.query(User).filter(User.email == "hradmin@leaveos.demo").first():
            print("🌱 Database already seeded. Skipping demo seed.")
            return

        print("🌱 Seeding LeaveOS database...")

        # ── Departments ────────────────────────────────────────
        departments = []
        for name in DEPARTMENT_NAMES:
            dept = db.query(Department).filter(Department.name == name).first()
            if not dept:
                dept = Department(id=uuid4(), name=name)
                db.add(dept)
                db.flush()
            departments.append(dept)
        print(f"   ✓ {len(departments)} departments")

        # ── Leave Types ────────────────────────────────────────
        leave_types = []
        for lt_data in LEAVE_TYPES:
            lt = db.query(LeaveType).filter(LeaveType.name == lt_data["name"]).first()
            if not lt:
                lt = LeaveType(id=uuid4(), **lt_data)
                db.add(lt)
                db.flush()
            leave_types.append(lt)
        print(f"   ✓ {len(leave_types)} leave types")

        # ── Holidays ───────────────────────────────────────────
        for h_date, h_name in PUBLIC_HOLIDAYS:
            h = db.query(Holiday).filter(Holiday.date == h_date).first()
            if not h:
                db.add(Holiday(id=uuid4(), date=h_date, name=h_name))
        db.flush()
        print(f"   ✓ {len(PUBLIC_HOLIDAYS)} public holidays")

        hashed_pw = hash_password(DEMO_PASSWORD)
        now_str = datetime.now(timezone.utc).isoformat()

        # ── HR Admin (demo) ────────────────────────────────────
        hr_admin = db.query(User).filter(User.email == "hradmin@leaveos.demo").first()
        if not hr_admin:
            hr_admin = User(
                id=uuid4(),
                email="hradmin@leaveos.demo",
                hashed_password=hashed_pw,
                full_name="Ada Okonkwo",
                role=UserRole.HR_ADMIN,
                department_id=departments[3].id,  # HR department
                is_active=True,
                created_at=now_str,
            )
            db.add(hr_admin)
            db.flush()
        print("   ✓ HR Admin: hradmin@leaveos.demo")

        # ── Managers (1 per department) ────────────────────────
        managers = []
        manager_emails = []
        for i, dept in enumerate(departments):
            if i == 0:
                email = "mgr_engineering@leaveos.demo"
            else:
                email = f"mgr_{dept.name.lower().replace(' ', '_')}@leaveos.demo"
            mgr = db.query(User).filter(User.email == email).first()
            if not mgr:
                mgr = User(
                    id=uuid4(),
                    email=email,
                    hashed_password=hashed_pw,
                    full_name=fake.name(),
                    role=UserRole.MANAGER,
                    department_id=dept.id,
                    is_active=True,
                    created_at=now_str,
                )
                db.add(mgr)
                db.flush()
            managers.append(mgr)
            manager_emails.append(email)
        print(f"   ✓ {len(managers)} managers")

        # ── Employees (8-12 per department) ────────────────────
        employees = []
        demo_employee = None
        for dept_idx, dept in enumerate(departments):
            num_employees = random.randint(8, 12)
            for j in range(num_employees):
                if dept_idx == 0 and j == 0:
                    email = "emp_demo@leaveos.demo"
                    name = "Chidi Nwachukwu"
                else:
                    email = fake.unique.email()
                    name = fake.name()

                emp = db.query(User).filter(User.email == email).first()
                if not emp:
                    emp = User(
                        id=uuid4(),
                        email=email,
                        hashed_password=hashed_pw,
                        full_name=name,
                        role=UserRole.EMPLOYEE,
                        department_id=dept.id,
                        manager_id=managers[dept_idx].id,
                        is_active=True,
                        created_at=now_str,
                    )
                    db.add(emp)
                employees.append(emp)
                if email == "emp_demo@leaveos.demo":
                    demo_employee = emp
        db.flush()
        print(f"   ✓ {len(employees)} employees")
        print("   ✓ Demo employee: emp_demo@leaveos.demo")

        # ── Leave Balances (for current year) ──────────────────
        current_year = datetime.now(timezone.utc).year
        all_staff = employees + managers
        balance_count = 0
        for user in all_staff:
            for lt in leave_types:
                bal = (
                    db.query(LeaveBalance)
                    .filter(
                        LeaveBalance.user_id == user.id,
                        LeaveBalance.leave_type_id == lt.id,
                        LeaveBalance.year == current_year,
                    )
                    .first()
                )
                if not bal:
                    bal = LeaveBalance(
                        id=uuid4(),
                        user_id=user.id,
                        leave_type_id=lt.id,
                        year=current_year,
                        allocated_days=lt.default_days_per_year,
                        used_days=0,
                    )
                    db.add(bal)
                    balance_count += 1
        db.flush()
        print(f"   ✓ {balance_count} leave balances")

        # ── Leave Requests (6-12 months, seasonal bias) ───────
        request_count = 0
        approved_days: dict[str, int] = {}  # key: f"{user_id}:{leave_type_id}" -> used_days

        # Generate requests over the past 12 months
        today = date.today()
        for month_offset in range(12, 0, -1):
            month_date = today - timedelta(days=month_offset * 30)
            month = month_date.month

            # Seasonal bias: more requests in December, June-August
            if month == 12:
                num_requests = random.randint(15, 25)
            elif month in (6, 7, 8):
                num_requests = random.randint(10, 18)
            else:
                num_requests = random.randint(5, 12)

            for _ in range(num_requests):
                user = random.choice(all_staff)
                lt = random.choice(leave_types[:2])  # Mostly annual/sick

                # Random start within the month
                start_day = random.randint(1, 20)
                try:
                    start = date(month_date.year, month, start_day)
                except ValueError:
                    start = date(month_date.year, month, 1)

                duration = random.randint(1, 5)
                end = start + timedelta(days=duration)

                # Determine status with realistic distribution
                status_roll = random.random()
                if status_roll < 0.55:
                    req_status = LeaveStatus.APPROVED
                elif status_roll < 0.80:
                    req_status = LeaveStatus.PENDING
                elif status_roll < 0.90:
                    req_status = LeaveStatus.REJECTED
                else:
                    req_status = LeaveStatus.CANCELLED

                # Find the user's manager for approver
                approver_id = None
                if req_status in (LeaveStatus.APPROVED, LeaveStatus.REJECTED):
                    approver_id = user.manager_id
                    if not approver_id:
                        # Managers approved by HR
                        approver_id = hr_admin.id

                decided_at = None
                if req_status in (LeaveStatus.APPROVED, LeaveStatus.REJECTED, LeaveStatus.CANCELLED):
                    decided_at = datetime(
                        start.year, start.month, min(start.day + 1, 28),
                        tzinfo=timezone.utc,
                    )

                req = LeaveRequest(
                    id=uuid4(),
                    user_id=user.id,
                    leave_type_id=lt.id,
                    start_date=start,
                    end_date=end,
                    reason=fake.sentence(nb_words=8),
                    status=req_status,
                    approver_id=approver_id,
                    decision_comment=fake.sentence(nb_words=4) if approver_id else "",
                    created_at=datetime(
                        start.year, start.month, start.day, tzinfo=timezone.utc
                    ),
                    decided_at=decided_at,
                )
                db.add(req)
                request_count += 1

                # Track approved days for balance updates
                if req_status == LeaveStatus.APPROVED:
                    key = f"{user.id}:{lt.id}"
                    # Simple calendar days for seeding
                    days = (end - start).days + 1
                    approved_days[key] = approved_days.get(key, 0) + days

        db.flush()
        print(f"   ✓ {request_count} leave requests (12 months)")

        # Update balances with used days from approved requests
        for key, used in approved_days.items():
            uid, ltid = key.split(":")
            bal = (
                db.query(LeaveBalance)
                .filter(
                    LeaveBalance.user_id == uid,
                    LeaveBalance.leave_type_id == ltid,
                    LeaveBalance.year == current_year,
                )
                .first()
            )
            if bal:
                bal.used_days = min(used, bal.allocated_days)

        db.commit()
        print("\n✅ Seed complete!")
        print(f"\n📋 Demo Accounts (password: {DEMO_PASSWORD}):")
        print(f"   👑 HR Admin:  hradmin@leaveos.demo")
        print(f"   👔 Manager:   mgr_engineering@leaveos.demo")
        print(f"   👤 Employee:  emp_demo@leaveos.demo")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
