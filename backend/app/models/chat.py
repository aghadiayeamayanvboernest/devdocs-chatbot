"""Request/response models for chat endpoints."""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any


class ChatMessage(BaseModel):
    """Single chat message."""
    role: Literal["user", "assistant"] = Field(..., description="Message role")
    content: str = Field(..., description="Message content")


class SourceNode(BaseModel):
    """Source document node with metadata."""
    id: str
    text: str
    score: float
    metadata: Dict[str, Any]
    url: Optional[str] = None
    framework: Optional[str] = None


class ChatRequest(BaseModel):
    """Chat request payload."""
    message: str = Field(..., min_length=1, max_length=2000)
    frameworks: List[str] = Field(
        default=["react", "nextjs", "tailwind", "fastapi", "django", "postgresql", "typescript"],
        description="Frameworks to search"
    )
    history: List[ChatMessage] = Field(default=[], max_length=20)


class ChatResponse(BaseModel):
    """Chat response payload."""
    response: str
    sources: List[SourceNode]
    trace_id: Optional[str] = None


class FeedbackRequest(BaseModel):
    """User feedback request."""
    trace_id: str
    value: Literal["positive", "negative"]
    comment: Optional[str] = None


class CodeGenerationRequest(BaseModel):
    """Code generation request payload."""
    prompt: str = Field(..., min_length=1, max_length=2000, description="Code generation request")
    frameworks: List[str] = Field(
        default=["react", "nextjs", "tailwind", "fastapi", "django", "postgresql", "typescript"],
        description="Frameworks to use for context"
    )
    history: List[ChatMessage] = Field(default=[], max_length=20)
    include_docs_context: bool = Field(
        default=True,
        description="Whether to include relevant documentation as context"
    )


class CodeGenerationResponse(BaseModel):
    """Code generation response payload."""
    code: str = Field(..., description="Generated code with explanation")
    trace_id: Optional[str] = None
