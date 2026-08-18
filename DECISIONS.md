# LeaveOS — DECISIONS.md

Log of assumptions and design decisions made during the build.

---

## 1. UUID Primary Keys — Cross-Engine Compatibility

**Decision:** Use `sqlalchemy.Uuid(as_uuid=True)` with `default=uuid.uuid4` for all primary keys. This works natively on PostgreSQL and falls back to `CHAR(32)` on SQLite, enabling seamless testing without external extensions.

## 2. Password Hashing — Python 3.13 Compatibility

**Decision:** Use `bcrypt` directly (pinned `bcrypt>=4.0.1`) instead of `passlib` to avoid `crypt` module deprecation warnings on Python 3.13+. The `passlib` library triggers `DeprecationWarning` for the `crypt` module removed in Python 3.13.

## 3. Login Endpoint — Dual Accept (JSON + Form)

**Decision:** `/api/v1/auth/login` accepts both `application/json` bodies and `application/x-www-form-urlencoded` form data. This ensures the React SPA (JSON) and Swagger `/docs` UI (form data) both work out of the box.

## 4. JWT Storage — In-Memory Access Token

**Decision:** Access tokens stored in React state (in-memory), never in localStorage. Refresh tokens also stored in-memory with an Axios interceptor that auto-refreshes on 401. A true httpOnly cookie approach would require same-domain deployment; flagged as a future improvement.

## 5. Database Engine — Dual Strategy

**Decision:** SQLite for instant local development and Pytest. PostgreSQL via docker-compose for integration testing and production. The `DATABASE_URL` environment variable controls which engine is used.

## 6. Working Day Calculation

**Decision:** `days_requested` computes Mon–Fri working days only (excluding weekends). The Holiday table is included but optional — if holidays are seeded, they are also excluded from the count. The Django reference uses a simple `(end - start).days + 1` calendar-day calculation; this is an intentional improvement.

## 7. Quick Demo Login Buttons

**Decision:** The login page includes 3 pre-filled demo login buttons for HR Admin, Manager, and Employee roles. These use seeded demo credentials (password: `password123`) and are intended for portfolio demos and interview walkthroughs.

## 8. Frontend CSS Framework

**Decision:** Using Tailwind CSS as specified in the locked tech stack (Section 2 of build spec), overriding any default vanilla CSS guidance.
