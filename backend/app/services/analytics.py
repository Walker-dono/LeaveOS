"""Analytics service — summary aggregations and leave volume forecasting."""

from datetime import datetime, timezone
from calendar import monthrange

import numpy as np
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.models.leave_request import LeaveRequest, LeaveStatus
from app.models.user import User


def get_summary(db: Session) -> dict:
    """Aggregate leave requests by status, department, and month."""
    # By status
    status_rows = (
        db.query(LeaveRequest.status, func.count(LeaveRequest.id))
        .group_by(LeaveRequest.status)
        .all()
    )
    by_status = [
        {"status": row[0].value if hasattr(row[0], "value") else row[0], "count": row[1]}
        for row in status_rows
    ]

    # By department
    dept_rows = (
        db.query(
            func.coalesce(
                # Join through user to department
                func.min(  # hack: aggregate for group_by
                    db.query(User.department_id)
                    .filter(User.id == LeaveRequest.user_id)
                    .correlate(LeaveRequest)
                    .scalar_subquery()
                ),
                None,
            ),
            func.count(LeaveRequest.id),
        )
        .join(User, User.id == LeaveRequest.user_id)
        .group_by(User.department_id)
        .all()
    )

    # Simpler approach: join through user
    from app.models.department import Department

    dept_rows = (
        db.query(
            func.coalesce(Department.name, "Unassigned"),
            func.count(LeaveRequest.id),
        )
        .join(User, User.id == LeaveRequest.user_id)
        .outerjoin(Department, Department.id == User.department_id)
        .group_by(Department.name)
        .all()
    )
    by_department = [
        {"department": row[0], "count": row[1]} for row in dept_rows
    ]

    # By month (YYYY-MM)
    # Use created_at for grouping
    all_requests = db.query(LeaveRequest.created_at).all()
    month_counts: dict[str, int] = {}
    for (created_at,) in all_requests:
        if created_at:
            key = created_at.strftime("%Y-%m")
            month_counts[key] = month_counts.get(key, 0) + 1

    by_month = [
        {"month": k, "count": v}
        for k, v in sorted(month_counts.items())
    ]

    total = db.query(func.count(LeaveRequest.id)).scalar() or 0

    return {
        "by_status": by_status,
        "by_department": by_department,
        "by_month": by_month,
        "total_requests": total,
    }


def get_forecast(db: Session) -> dict:
    """Simple linear regression forecast of next month's leave request volume.

    Approach:
    1. Aggregate historical requests by month
    2. Fit a linear regression (month index → count)
    3. Predict next month's volume
    """
    # Get monthly counts
    all_requests = db.query(LeaveRequest.created_at).all()
    month_counts: dict[str, int] = {}
    for (created_at,) in all_requests:
        if created_at:
            key = created_at.strftime("%Y-%m")
            month_counts[key] = month_counts.get(key, 0) + 1

    if not month_counts:
        now = datetime.now(timezone.utc)
        next_month = now.month + 1 if now.month < 12 else 1
        next_year = now.year if now.month < 12 else now.year + 1
        return {
            "predicted_month": f"{next_year}-{next_month:02d}",
            "predicted_volume": 0.0,
            "model_type": "linear_regression",
            "confidence_note": "No historical data available.",
            "historical_data": [],
        }

    sorted_months = sorted(month_counts.keys())
    counts = [month_counts[m] for m in sorted_months]

    # X = month indices (0, 1, 2, ...), Y = counts
    X = np.arange(len(counts)).reshape(-1, 1).astype(float)
    Y = np.array(counts, dtype=float)

    # Linear regression via numpy (simple, explainable)
    if len(counts) >= 2:
        from sklearn.linear_model import LinearRegression

        model = LinearRegression()
        model.fit(X, Y)
        next_x = np.array([[len(counts)]]).astype(float)
        prediction = float(model.predict(next_x)[0])
        prediction = max(0.0, prediction)  # Can't predict negative volume
    else:
        # Only 1 data point — use that as the prediction
        prediction = float(counts[0])

    # Determine next month
    last_month_str = sorted_months[-1]
    last_year, last_month = int(last_month_str[:4]), int(last_month_str[5:])
    next_month = last_month + 1 if last_month < 12 else 1
    next_year = last_year if last_month < 12 else last_year + 1

    historical = [{"month": m, "count": month_counts[m]} for m in sorted_months]

    return {
        "predicted_month": f"{next_year}-{next_month:02d}",
        "predicted_volume": round(prediction, 1),
        "model_type": "linear_regression",
        "confidence_note": (
            f"Linear regression on {len(counts)} months of data. "
            f"R² and confidence intervals omitted for simplicity. "
            f"This is a trend extrapolation and may not capture seasonality."
        ),
        "historical_data": historical,
    }
