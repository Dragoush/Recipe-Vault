from fastapi import APIRouter, Depends, Request, Response, status

from app.core.auth_cookies import clear_refresh_cookie, set_refresh_cookie
from app.core.config import settings
from app.core.dependencies import get_auth_service, get_current_auth_context
from app.core.errors import AuthenticationError
from app.schemas.auth import AuthTokensResponse, AuthUserResponse, LoginRequest, RegisterRequest
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
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> AuthTokensResponse:
    authenticated_session = service.login_user(payload)
    set_refresh_cookie(response, authenticated_session.tokens.refresh_token)
    return AuthTokensResponse.from_authenticated_session(authenticated_session)


@router.post("/refresh", response_model=AuthTokensResponse)
def refresh_session(
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> AuthTokensResponse:
    refresh_token = request.cookies.get(settings.auth_refresh_cookie_name)

    if not refresh_token:
        raise AuthenticationError("Refresh token is missing.")

    authenticated_session = service.refresh_session(refresh_token)
    set_refresh_cookie(response, authenticated_session.tokens.refresh_token)
    return AuthTokensResponse.from_authenticated_session(authenticated_session)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_user(
    response: Response,
    auth_context=Depends(get_current_auth_context),
    service: AuthService = Depends(get_auth_service),
) -> Response:
    service.logout_session(auth_context.session.id)
    clear_refresh_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=AuthUserResponse)
def get_current_user(auth_context=Depends(get_current_auth_context)) -> AuthUserResponse:
    return AuthUserResponse.from_user(auth_context.user)
