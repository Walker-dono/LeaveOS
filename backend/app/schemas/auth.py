"""Pydantic schemas for authentication."""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """JSON login request body."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    """Refresh token request body."""
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """New access token response."""
    access_token: str
    token_type: str = "bearer"
