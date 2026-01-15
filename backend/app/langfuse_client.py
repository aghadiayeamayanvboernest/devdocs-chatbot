"""Langfuse client initialization."""
from langfuse import Langfuse, observe, get_client
from app.config import settings

# Initialize Langfuse client
langfuse = Langfuse(
    secret_key=settings.langfuse_secret_key,
    public_key=settings.langfuse_public_key,
    host=settings.langfuse_host,
)

# Export for use in other modules
__all__ = ["langfuse", "observe", "get_client"]
