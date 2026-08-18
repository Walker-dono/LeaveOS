"""LeaveOS — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine

# Import all models to register them
import app.models  # noqa: F401

# Import API routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.leave_types import router as leave_types_router
from app.api.leave_balances import router as leave_balances_router
from app.api.leave_requests import router as leave_requests_router
from app.api.departments import router as departments_router
from app.api.analytics import router as analytics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup (dev convenience)."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="LeaveOS",
    description=(
        "Cloud-native staff leave management system with role-based workflows "
        "(Employee, Manager, HR Admin) and predictive analytics."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /api/v1
API_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(users_router, prefix=API_PREFIX)
app.include_router(leave_types_router, prefix=API_PREFIX)
app.include_router(leave_balances_router, prefix=API_PREFIX)
app.include_router(leave_requests_router, prefix=API_PREFIX)
app.include_router(departments_router, prefix=API_PREFIX)
app.include_router(analytics_router, prefix=API_PREFIX)


@app.get("/", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "LeaveOS API", "version": "1.0.0"}
