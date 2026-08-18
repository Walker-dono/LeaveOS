# LeaveOS — Cloud-Native Staff Leave Management & Predictive Analytics

LeaveOS is a production-grade staff leave management system built with **FastAPI**, **React (Vite) + TypeScript**, **Tailwind CSS**, and **PostgreSQL**. It features role-based workflows for Employees, Managers, and HR Admins alongside an explainable **Machine Learning module** for forecasting seasonal leave demand.

---

## 🌟 Key Features

- **Role-Based Workflows (RBAC):**
  - **Employee:** Submit leave requests with working-day checks (excluding weekends and public holidays), view allocated vs. used balances, and cancel pending requests.
  - **Manager:** Review direct reports' requests with single-click Approve / Reject actions and audit comments.
  - **HR Admin:** Organization-wide analytics summary, department-level distribution, leave policy configuration, and predictive ML volume forecasting.
- **Atomic Balance Updates:** Approvals atomically deduct working days from the employee's annual leave balance within a database transaction.
- **Predictive ML Forecasting:** Linear regression model built on historical request patterns predicting next month's leave load for proactive resource planning.
- **One-Click Demo Switcher:** Switch between Employee, Manager, and HR Admin roles in the navbar to test workflows.
- **Interactive OpenAPI Documentation:** Fully documented interactive endpoints at `/docs`.

---

## 🏗️ Architecture & Tech Stack

```
[React 19 + TypeScript SPA] ──HTTPS/JSON──► [FastAPI Backend (Python 3.13)] ──SQLAlchemy 2.0──► [PostgreSQL / SQLite]
                                                ├── /auth (OAuth2 JWT Password Flow)
                                                ├── /users (/users/me)
                                                ├── /leave-requests (CRUD + Decision)
                                                ├── /leave-balances (Annual tracking)
                                                ├── /departments (Org units)
                                                └── /analytics (Summary + ML Forecast)
```

| Layer | Technology |
|---|---|
| **Backend / API** | FastAPI, Python 3.13, Pydantic v2 |
| **ORM / Migrations** | SQLAlchemy 2.0, Alembic |
| **Database** | PostgreSQL (Docker/Prod), SQLite (Local Dev) |
| **Authentication** | OAuth2 Password Flow + JWT (In-memory Access Token + Refresh Token) |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons |
| **Analytics & ML** | scikit-learn, numpy, pandas |
| **Containerization** | Multi-stage Dockerfiles + Docker Compose |
| **Cloud Deployment** | Google Cloud Run + Cloud SQL (PostgreSQL) |
| **CI/CD** | GitHub Actions Workflow (`.github/workflows/ci.yml`) |

---

## 🚀 Quick Start (Local Development)

### 1. Preset Demo Credentials

The database comes pre-seeded with accounts for all three roles (password for all: `password123`):

| Role | Email | Purpose |
|---|---|---|
| **HR Admin** | `sarah.hr@leaveos.local` | Organization metrics & ML forecasting |
| **Manager** | `alex.manager@leaveos.local` | Direct reports approval queue |
| **Employee** | `john.dev@leaveos.local` | Requesting time off & balance tracking |

---

### 2. Run with Docker Compose (Recommended)

To bring up the entire stack (PostgreSQL + FastAPI Backend + React Frontend Nginx) with a single command:

```bash
docker-compose up --build
```

- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **Interactive API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 3. Run Manually (Without Docker)

#### Backend Setup:

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations & seed realistic data
alembic upgrade head
python scripts/seed_demo.py

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## ☁️ Google Cloud Deployment (Cloud Run + Cloud SQL)

### 1. Cloud SQL Setup

```bash
gcloud sql instances create leaveos-db \
    --database-version=POSTGRES_16 \
    --tier=db-f1-micro \
    --region=us-central1

gcloud sql databases create leaveos --instance=leaveos-db
gcloud sql users set-password postgres --instance=leaveos-db --password=STRONG_PASSWORD
```

### 2. Build and Deploy Backend to Cloud Run

```bash
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/leaveos-backend ./backend

gcloud run deploy leaveos-backend \
    --image gcr.io/$GOOGLE_CLOUD_PROJECT/leaveos-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --add-cloudsql-instances $GOOGLE_CLOUD_PROJECT:us-central1:leaveos-db \
    --set-env-vars DATABASE_URL="postgresql://postgres:STRONG_PASSWORD@/leaveos?host=/cloudsql/$GOOGLE_CLOUD_PROJECT:us-central1:leaveos-db",JWT_SECRET_KEY="PROD_SECRET_KEY",CORS_ORIGINS="https://leaveos-frontend-URL"
```

### 3. Build and Deploy Frontend to Cloud Run

```bash
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/leaveos-frontend ./frontend

gcloud run deploy leaveos-frontend \
    --image gcr.io/$GOOGLE_CLOUD_PROJECT/leaveos-frontend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars VITE_API_URL="https://leaveos-backend-URL/api/v1"
```

---

## 📊 Analytics & Forecasting

For an in-depth breakdown of our Linear Regression modeling, seasonal data distributions, and explainability trade-offs, read [docs/analytics.md](docs/analytics.md).

---

## 📝 Architectural Decisions

Design choices, cross-engine UUID mappings, in-memory JWT storage, and business rule enforcement are documented in [DECISIONS.md](DECISIONS.md).
