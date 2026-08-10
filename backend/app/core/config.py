from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://josema:josema@localhost:5432/josema_rb"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    trainer_email: str = "trainer@example.com"
    trainer_password: str = "change-me"

    cors_origins: list[str] = ["http://localhost:3000"]

    # Used to build the client portal link when the request carries no Origin
    # header (curl, a script). In the browser the real origin always wins.
    public_base_url: str = "http://localhost:3000"

    # False for local dev over plain HTTP; set to true in production (Dokploy),
    # where Traefik terminates TLS and the browser always sees https.
    cookie_secure: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
