"""Tests for authentication endpoints."""

import pytest
from tests.conftest import auth_header


class TestLogin:
    """POST /api/v1/auth/login"""

    def test_login_json_valid(self, client, employee):
        """Login with valid JSON credentials returns tokens."""
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "employee@test.com", "password": "password123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_case_insensitive(self, client, employee):
        """Login is case-insensitive for email."""
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "EMPLOYEE@TEST.COM", "password": "password123"},
        )
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_login_form_valid(self, client, employee):
        """Login with OAuth2 form data (Swagger /docs) returns tokens."""
        resp = client.post(
            "/api/v1/auth/login",
            data={"username": "employee@test.com", "password": "password123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data

    def test_login_wrong_password(self, client, employee):
        """Wrong password returns 401."""
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "employee@test.com", "password": "wrong"},
        )
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        """Non-existent user returns 401."""
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@test.com", "password": "password123"},
        )
        assert resp.status_code == 401


class TestRefresh:
    """POST /api/v1/auth/refresh"""

    def test_refresh_valid(self, client, employee):
        """Valid refresh token issues new access token."""
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "employee@test.com", "password": "password123"},
        )
        refresh_token = login_resp.json()["refresh_token"]

        resp = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_refresh_invalid_token(self, client):
        """Invalid refresh token returns 401."""
        resp = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid.token.here"},
        )
        assert resp.status_code == 401


class TestProtectedRoutes:
    """Test 401/403 on protected routes."""

    def test_users_me_no_token(self, client):
        """No token returns 401."""
        resp = client.get("/api/v1/users/me")
        assert resp.status_code == 401

    def test_users_me_valid_token(self, client, employee):
        """Valid token returns user profile."""
        resp = client.get("/api/v1/users/me", headers=auth_header(employee))
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "employee@test.com"
        assert data["role"] == "EMPLOYEE"

    def test_departments_employee_forbidden(self, client, employee):
        """Employee cannot access HR-only departments endpoint."""
        resp = client.get("/api/v1/departments", headers=auth_header(employee))
        assert resp.status_code == 403

    def test_departments_hr_allowed(self, client, hr_admin, department):
        """HR Admin can access departments."""
        resp = client.get("/api/v1/departments", headers=auth_header(hr_admin))
        assert resp.status_code == 200

    def test_team_requests_employee_forbidden(self, client, employee):
        """Employee cannot access manager-only team requests."""
        resp = client.get("/api/v1/leave-requests/team", headers=auth_header(employee))
        assert resp.status_code == 403
