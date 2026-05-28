from pathlib import Path

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_CORS_ORIGINS = ("http://localhost:5173", "https://localhost:5173")
BASE_DIR = Path(__file__).resolve().parents[2]
VALID_COOKIE_SAMESITE_VALUES = {"lax", "strict", "none"}


def parse_cors_origins(origins_file: str) -> tuple[str, ...]:
    path = Path(origins_file)
    if not path.is_absolute():
        path = BASE_DIR / path


    try:
        with path.open(encoding="utf-8") as file_handle:
            origins = []
            for line in file_handle:
                origin = line.strip()

                if not origin or origin.startswith("#"):
                    continue
                if "://" not in origin:
                    origins.append(f"http://{origin}".rstrip("/"))
                    origins.append(f"https://{origin}".rstrip("/"))
                    continue

                origins.append(origin.rstrip("/"))
            if origins:
                print(origins)
                return tuple(dict.fromkeys(origins))

    except FileNotFoundError:
        pass

    return DEFAULT_CORS_ORIGINS


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        frozen=True,
    )

    app_name: str = "Recipe Vault API"
    api_prefix: str = "/api"
    default_page_size: int = 4
    max_page_size: int = 50
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/recipes_db"
    test_database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/recipes_db_test"
    allowed_origins_file: str = "app/core/allowed_ip_list.txt"
    auth_jwt_secret_key: str = "development-only-change-me"
    auth_access_token_ttl_seconds: int = 900
    auth_session_ttl_seconds: int = 604800
    auth_session_inactivity_ttl_seconds: int = 1800
    auth_refresh_cookie_name: str = "recipe_vault_refresh_token"
    auth_refresh_cookie_secure: bool = False
    auth_refresh_cookie_samesite: str = "lax"
    auth_refresh_cookie_path: str | None = None
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_reload: bool = False
    backend_ssl_certfile: str | None = None
    backend_ssl_keyfile: str | None = None
    password_hash_iterations: int = 200000

    @computed_field
    @property
    def auth_refresh_cookie_samesite_normalized(self) -> str:
        value = self.auth_refresh_cookie_samesite.strip().lower()

        if value not in VALID_COOKIE_SAMESITE_VALUES:
            raise ValueError(
                "AUTH_REFRESH_COOKIE_SAMESITE must be one of: lax, strict, none."
            )

        return value

    @computed_field
    @property
    def auth_refresh_cookie_path_resolved(self) -> str:
        configured_path = (self.auth_refresh_cookie_path or "").strip()

        if configured_path:
            return configured_path.rstrip("/")

        return f"{self.api_prefix.rstrip('/')}/auth"

    @computed_field
    @property
    def backend_https_enabled(self) -> bool:
        print("HTTPS ENABLED")
        return bool(self.backend_ssl_certfile and self.backend_ssl_keyfile)

    @computed_field
    @property
    def cors_origins(self) -> tuple[str, ...]:
        return parse_cors_origins(self.allowed_origins_file)


settings = Settings()
