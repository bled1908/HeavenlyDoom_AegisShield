from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    debug: bool = Field(default=True, env="DEBUG")
    cors_origins: list[str] = Field(default=["http://localhost:3001", "http://localhost:3000"])

    model_config = {"env_file": ".env", "case_sensitive": False}


@lru_cache
def get_settings() -> Settings:
    return Settings()
