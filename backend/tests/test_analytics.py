"""Tests for analytics endpoints."""

from tests.conftest import auth_header


class TestAnalyticsSummary:
    """GET /api/v1/analytics/summary"""

    def test_summary_hr_only(self, client, employee):
        """Non-HR users get 403."""
        resp = client.get("/api/v1/analytics/summary", headers=auth_header(employee))
        assert resp.status_code == 403

    def test_summary_returns_data(self, client, hr_admin):
        """HR Admin gets a valid summary response."""
        resp = client.get("/api/v1/analytics/summary", headers=auth_header(hr_admin))
        assert resp.status_code == 200
        data = resp.json()
        assert "by_status" in data
        assert "by_department" in data
        assert "by_month" in data
        assert "total_requests" in data


class TestAnalyticsForecast:
    """GET /api/v1/analytics/forecast"""

    def test_forecast_hr_only(self, client, employee):
        """Non-HR users get 403."""
        resp = client.get("/api/v1/analytics/forecast", headers=auth_header(employee))
        assert resp.status_code == 403

    def test_forecast_returns_data(self, client, hr_admin):
        """HR Admin gets a valid forecast response."""
        resp = client.get("/api/v1/analytics/forecast", headers=auth_header(hr_admin))
        assert resp.status_code == 200
        data = resp.json()
        assert "predicted_month" in data
        assert "predicted_volume" in data
        assert "model_type" in data
        assert data["model_type"] == "linear_regression"
