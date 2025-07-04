"""
Configurações principais do backend PokeAPI App.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configurações da aplicação."""

    # API Config
    app_name: str = "PokeAPI Backend"
    app_version: str = "1.0.0"
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

    # Secrets
    secret_key: str = "your-secret-key-here"

    class Config:
        env_file = ".env"


settings = Settings()
