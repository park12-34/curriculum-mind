from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # OpenAI
    OPENAI_API_KEY: str
    LLM_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # RAG
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50


@lru_cache
def get_settings() -> Settings:
    return Settings()
