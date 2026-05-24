from fastapi import APIRouter, Depends, Response, status

from app.core.dependencies import get_auth_service, get_current_auth_context
from app.schemas.auth import (
    AuthTokensResponse,
    AuthUserResponse,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=AuthUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    payload: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthUserResponse:
    return AuthUserResponse.from_user(service.register_user(payload))


@router.post("/login", response_model=AuthTokensResponse)
def login_user(
    payload: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthTokensResponse:
    return AuthTokensResponse.from_authenticated_session(service.login_user(payload))


@router.post("/refresh", response_model=AuthTokensResponse)
def refresh_session(
    payload: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthTokensResponse:
    return AuthTokensResponse.from_authenticated_session(
        service.refresh_session(payload.refresh_token)
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_user(
    auth_context=Depends(get_current_auth_context),
    service: AuthService = Depends(get_auth_service),
) -> Response:
    service.logout_session(auth_context.session.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=AuthUserResponse)
def get_current_user(auth_context=Depends(get_current_auth_context)) -> AuthUserResponse:
    return AuthUserResponse.from_user(auth_context.user)
