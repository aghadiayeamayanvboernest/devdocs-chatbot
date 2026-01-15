"""Models for code generation."""
from pydantic import BaseModel, Field
from typing import List, Optional


class GenerateRequest(BaseModel):
    """Code generation request."""
    description: str = Field(..., min_length=10, max_length=5000)
    frameworks: List[str] = Field(
        default=["react", "nextjs", "tailwind"],
        description="Frameworks to use"
    )


class GeneratedFile(BaseModel):
    """Single generated file."""
    path: str
    content: str
    language: str


class GenerateResponse(BaseModel):
    """Code generation response."""
    files: List[GeneratedFile]
    instructions: str
    project_structure: str
    trace_id: Optional[str] = None
