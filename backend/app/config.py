"""Application configuration using pydantic-settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Keys
    anthropic_api_key: str
    openai_api_key: str
    pinecone_api_key: str
    pinecone_index_name: str
    pinecone_environment: str = "us-east-1"

    # Langfuse
    langfuse_secret_key: str
    langfuse_public_key: str
    langfuse_host: str = "https://cloud.langfuse.com"

    # App
    environment: Literal["dev", "prod"] = "dev"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # Models
    embedding_model: str = "text-embedding-3-small"
    embedding_dim: int = 1536
    doc_model: str = "claude-sonnet-4-20250514"
    code_model: str = "claude-opus-4-20250514"
    temperature: float = 0.1

    # RAG
    similarity_top_k: int = 5
    chunk_size: int = 1024
    chunk_overlap: int = 200

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


# Global settings instance
settings = Settings()

# Framework namespaces (must match your indexer)
SUPPORTED_FRAMEWORKS = [
    "react",
    "nextjs",
    "tailwind",
    "fastapi",
    "django",
    "postgresql",
    "typescript"
]
