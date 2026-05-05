from pydantic import BaseModel, ConfigDict


class Settings(BaseModel):
    model_config = ConfigDict(frozen=True)

    app_name: str = "Recipe Vault API"
    api_prefix: str = "/api"
    cors_origins: tuple[str, ...] = ("http://localhost:5173",)
    default_page_size: int = 4
    max_page_size: int = 50


settings = Settings()
