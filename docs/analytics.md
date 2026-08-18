# LeaveOS Analytics Module — Forecasting Approach

## Overview

The analytics module provides two endpoints for HR Admins:

1. **`/api/v1/analytics/summary`** — Aggregate counts of leave requests by status, department, and month.
2. **`/api/v1/analytics/forecast`** — A next-month leave volume prediction using linear regression.

---

## Summary Endpoint

The summary endpoint performs three aggregate queries:

- **By Status**: Count of PENDING, APPROVED, REJECTED, CANCELLED requests.
- **By Department**: Count of requests grouped by the requestor's department.
- **By Month**: Count of requests grouped by the month of `created_at` (YYYY-MM format).

These are standard SQL GROUP BY aggregations. No modeling is involved.

---

## Forecast Endpoint — Linear Regression

### Approach

We use **Ordinary Least Squares (OLS) Linear Regression** from scikit-learn to predict next month's leave request volume.

**Feature (X):** Month index (0, 1, 2, ... N-1), where each index corresponds to a calendar month in chronological order.

**Target (Y):** The total number of leave requests submitted in that month.

**Prediction:** The model extrapolates to `X = N` (the next month) and returns the predicted count.

### Why Linear Regression?

1. **Explainability**: The model is a simple `y = mx + b` line. In an interview, you can explain the slope ("requests are increasing by ~3 per month") and intercept directly.
2. **Minimal data requirement**: Works with as few as 2 data points.
3. **Transparency**: No hidden hyperparameters or black-box behavior.
4. **Speed**: Near-instant prediction, no model serialization needed.

### Implementation Details

```python
from sklearn.linear_model import LinearRegression

X = np.arange(len(monthly_counts)).reshape(-1, 1)  # Month indices
Y = np.array(monthly_counts)                         # Request counts

model = LinearRegression()
model.fit(X, Y)

next_month_prediction = model.predict([[len(monthly_counts)]])
```

### Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| **No seasonality modeling** | December spikes and summer patterns are not captured explicitly | Could extend to include month-of-year as a cyclical feature |
| **Linear assumption** | Assumes a constant trend; real patterns may be non-linear | Adequate for 6-12 months of data; revisit with more data |
| **No external factors** | Doesn't account for company events, policy changes, or headcount growth | Document as a known limitation |
| **Small sample bias** | With < 6 months, the regression is unstable | Returns the single data point if only 1 month available |
| **Negative predictions** | Linear extrapolation can predict negative volume | Clamped to `max(0, prediction)` |

### Future Improvements

- **Seasonal decomposition**: Use `statsmodels.seasonal_decompose` to isolate trend from seasonality.
- **Moving average**: Add a 3-month moving average as a simpler alternative.
- **Confidence intervals**: Report prediction intervals to indicate uncertainty.
- **ARIMA/Prophet**: For production use with 24+ months of data, a proper time-series model would be more appropriate.

---

## Data Seeding

The `scripts/seed_demo.py` script generates realistic synthetic data with:

- **Seasonal bias**: December gets 15-25 requests/month vs. 5-12 for typical months.
- **Status distribution**: ~55% approved, ~20% pending, ~10% rejected, ~15% cancelled.
- **Leave type distribution**: Weighted toward Annual and Sick leave.
- **12 months** of historical data for meaningful trend analysis.
