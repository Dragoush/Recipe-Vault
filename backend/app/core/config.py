from pathlib import Path
from typing import Literal

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_CORS_ORIGINS = ("http://localhost:5173",)
BASE_DIR = Path(__file__).resolve().parents[2]


def parse_cors_origins(origins_file: str) -> tuple[str, ...]:
    path = Path(origins_file)

    if not path.is_absolute():
        path = BASE_DIR / path

    try:
        with path.open(encoding="utf-8") as file_handle:
            origins = []

            for raw_value in file_handle:
                origin = raw_value.strip()

                if not origin or origin.startswith("#"):
                    continue
                if "://" not in origin:
                    origin = f"http://{origin}"

                origins.append(origin.rstrip("/"))

            if origins:
                return tuple(origins)
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
    repository_backend: Literal["database", "memory"] = "database"
    database_url: str = (
        "postgresql+psycopg://postgres:postgres@localhost:5432/recipes_db"
    )
    test_database_url: str = (
        "postgresql+psycopg://postgres:postgres@localhost:5432/recipes_db"
    )
    allowed_origins_file: str = "app/core/allowed_ip_list.txt"

    @computed_field
    @property
    def cors_origins(self) -> tuple[str, ...]:
        return parse_cors_origins(self.allowed_origins_file)


settings = Settings()
