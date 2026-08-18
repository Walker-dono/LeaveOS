"""Tests for the leave workflow — submit, approve, reject, cancel, balance updates."""

import uuid
from datetime import date, timedelta

import pytest
from tests.conftest import auth_header


class TestSubmitRequest:
    """POST /api/v1/leave-requests"""

    def test_submit_leave_request(self, client, employee, leave_type, employee_balance):
        """Employee can submit a leave request."""
        start = date.today() + timedelta(days=7)
        end = start + timedelta(days=2)
        resp = client.post(
            "/api/v1/leave-requests",
            json={
                "leave_type_id": str(leave_type.id),
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
                "reason": "Family event",
            },
            headers=auth_header(employee),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "PENDING"
        assert data["user_id"] == str(employee.id)

    def test_submit_end_before_start(self, client, employee, leave_type, employee_balance):
        """Cannot submit with end_date before start_date."""
        start = date.today() + timedelta(days=7)
        end = start - timedelta(days=1)
        resp = client.post(
            "/api/v1/leave-requests",
            json={
                "leave_type_id": str(leave_type.id),
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
            },
            headers=auth_header(employee),
        )
        assert resp.status_code == 422  # Validation error


class TestCancelRequest:
    """PATCH /api/v1/leave-requests/{id}/cancel"""

    def test_cancel_pending(self, client, employee, leave_type, employee_balance):
        """Can cancel a pending request."""
        start = date.today() + timedelta(days=7)
        end = start + timedelta(days=1)
        create_resp = client.post(
            "/api/v1/leave-requests",
            json={
                "leave_type_id": str(leave_type.id),
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
            },
            headers=auth_header(employee),
        )
        request_id = create_resp.json()["id"]

        resp = client.patch(
            f"/api/v1/leave-requests/{request_id}/cancel",
            headers=auth_header(employee),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "CANCELLED"


class TestDecision:
    """PATCH /api/v1/leave-requests/{id}/decision"""

    def _create_request(self, client, employee, leave_type):
        start = date.today() + timedelta(days=7)
        end = start + timedelta(days=2)
        resp = client.post(
            "/api/v1/leave-requests",
            json={
                "leave_type_id": str(leave_type.id),
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
                "reason": "Test leave",
            },
            headers=auth_header(employee),
        )
        return resp.json()["id"]

    def test_approve_updates_balance(
        self, client, db, employee, manager, leave_type, employee_balance
    ):
        """Approving a request increments used_days on the balance."""
        request_id = self._create_request(client, employee, leave_type)

        resp = client.patch(
            f"/api/v1/leave-requests/{request_id}/decision",
            json={"action": "approve", "comment": "Approved, enjoy!"},
            headers=auth_header(manager),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "APPROVED"

        # Verify balance was updated
        db.refresh(employee_balance)
        assert employee_balance.used_days > 0

    def test_reject_no_balance_change(
        self, client, db, employee, manager, leave_type, employee_balance
    ):
        """Rejecting a request does NOT change the balance."""
        request_id = self._create_request(client, employee, leave_type)

        resp = client.patch(
            f"/api/v1/leave-requests/{request_id}/decision",
            json={"action": "reject", "comment": "Not this week"},
            headers=auth_header(manager),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "REJECTED"

        db.refresh(employee_balance)
        assert employee_balance.used_days == 0

    def test_manager_cannot_approve_own(
        self, client, db, manager, leave_type
    ):
        """Manager cannot approve their own request."""
        # Create a balance for manager
        from app.models.leave_balance import LeaveBalance

        bal = LeaveBalance(
            id=uuid.uuid4(),
            user_id=manager.id,
            leave_type_id=leave_type.id,
            year=date.today().year,
            allocated_days=25,
            used_days=0,
        )
        db.add(bal)
        db.commit()

        # Manager submits a request
        start = date.today() + timedelta(days=7)
        end = start + timedelta(days=1)
        create_resp = client.post(
            "/api/v1/leave-requests",
            json={
                "leave_type_id": str(leave_type.id),
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
            },
            headers=auth_header(manager),
        )
        request_id = create_resp.json()["id"]

        # Manager tries to approve own request
        resp = client.patch(
            f"/api/v1/leave-requests/{request_id}/decision",
            json={"action": "approve", "comment": "Self-approve attempt"},
            headers=auth_header(manager),
        )
        assert resp.status_code == 400
        assert "own" in resp.json()["detail"].lower()

    def test_manager_cannot_approve_non_report(
        self, client, db, manager, leave_type
    ):
        """Manager cannot approve requests from non-direct reports."""
        from app.models.user import User, UserRole
        from app.services.auth import hash_password
        from datetime import datetime, timezone

        # Create another employee NOT reporting to this manager
        other_emp = User(
            id=uuid.uuid4(),
            email="other@test.com",
            hashed_password=hash_password("password123"),
            full_name="Other Employee",
            role=UserRole.EMPLOYEE,
            manager_id=None,  # No manager / different manager
            is_active=True,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        db.add(other_emp)
        bal = LeaveBalance(
            id=uuid.uuid4(),
            user_id=other_emp.id,
            leave_type_id=leave_type.id,
            year=date.today().year,
            allocated_days=25,
            used_days=0,
        )
        db.add(bal)
        db.commit()

        # Other employee submits a request
        start = date.today() + timedelta(days=7)
        end = start + timedelta(days=1)
        create_resp = client.post(
            "/api/v1/leave-requests",
            json={
                "leave_type_id": str(leave_type.id),
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
            },
            headers=auth_header(other_emp),
        )
        request_id = create_resp.json()["id"]

        # Manager tries to approve non-report's request
        resp = client.patch(
            f"/api/v1/leave-requests/{request_id}/decision",
            json={"action": "approve"},
            headers=auth_header(manager),
        )
        assert resp.status_code == 400
        assert "direct reports" in resp.json()["detail"].lower()


class TestGetRequests:
    """GET endpoints for leave requests."""

    def test_get_my_requests(self, client, employee, leave_type, employee_balance):
        """Employee can see own request history."""
        # Create a request first
        start = date.today() + timedelta(days=7)
        end = start + timedelta(days=1)
        client.post(
            "/api/v1/leave-requests",
            json={
                "leave_type_id": str(leave_type.id),
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
            },
            headers=auth_header(employee),
        )

        resp = client.get("/api/v1/leave-requests/me", headers=auth_header(employee))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_get_team_requests(self, client, employee, manager, leave_type, employee_balance):
        """Manager can see team requests."""
        # Employee creates a request
        start = date.today() + timedelta(days=7)
        end = start + timedelta(days=1)
        client.post(
            "/api/v1/leave-requests",
            json={
                "leave_type_id": str(leave_type.id),
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
            },
            headers=auth_header(employee),
        )

        resp = client.get("/api/v1/leave-requests/team", headers=auth_header(manager))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1
