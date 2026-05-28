import uvicorn

from app.core.config import settings


def main() -> None:
    uvicorn_kwargs = {
        "app": "app.main:app",
        "host": settings.backend_host,
        "port": settings.backend_port,
        "reload": settings.backend_reload,
    }

    if settings.backend_https_enabled:
        uvicorn_kwargs["ssl_certfile"] = settings.backend_ssl_certfile
        uvicorn_kwargs["ssl_keyfile"] = settings.backend_ssl_keyfile

    uvicorn.run(**uvicorn_kwargs)


if __name__ == "__main__":
    main()
