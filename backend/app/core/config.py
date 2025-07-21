"""
Configurações principais do backend PokeAPI App.
"""
import os
import secrets
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configurações da aplicação."""

    # API Config
    app_name: str = "PokeAPI Backend"
    app_version: str = "1.5"
    debug: bool = True

    # Database
    database_url: str = "sqlite:///./pokemon_app.db"

    # CORS
    cors_origins: list[str] = [
        "http://localhost:4200",
        "http://localhost:8100",
        "http://127.0.0.1:4200",
        "http://127.0.0.1:8100"
    ]

    # External APIs
    pokeapi_base_url: str = "https://pokeapi.co/api/v2"

    # JWT Configuration
    secret_key: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Security Configuration
    bcrypt_rounds: int = 8  # Número de rounds para bcrypt (balanceado: seguro mas rápido)
    password_min_length: int = 6
    password_max_length: int = 100

    class Config:
        env_file = ".env"


settings = Settings()
