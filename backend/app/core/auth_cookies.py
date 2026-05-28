from fastapi import Response

from app.core.config import settings


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.auth_refresh_cookie_name,
        value=refresh_token,
        max_age=settings.auth_session_ttl_seconds,
        httponly=True,
        secure=settings.auth_refresh_cookie_secure,
        samesite=settings.auth_refresh_cookie_samesite_normalized,
        path=settings.auth_refresh_cookie_path_resolved,
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.auth_refresh_cookie_name,
        httponly=True,
        secure=settings.auth_refresh_cookie_secure,
        samesite=settings.auth_refresh_cookie_samesite_normalized,
        path=settings.auth_refresh_cookie_path_resolved,
    )
