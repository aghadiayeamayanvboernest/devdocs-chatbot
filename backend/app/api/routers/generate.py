"""Code generation endpoints."""
import logging
from fastapi import APIRouter, HTTPException
from app.models.chat import CodeGenerationRequest, CodeGenerationResponse
from app.services.code_generation_service import code_generation_service
from app.langfuse_client import observe, get_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/generate", tags=["generate"])


@router.post("", response_model=CodeGenerationResponse)
@observe()
async def generate_code(request: CodeGenerationRequest):
    """
    Code generation endpoint.

    Generates production-ready code based on user prompt,
    optionally including relevant documentation as context.
    """
    try:
        logger.info("=" * 80)
        logger.info(f"💻 NEW CODE GENERATION REQUEST")
        logger.info(f"Prompt: {request.prompt}")
        logger.info(f"Frameworks: {request.frameworks}")
        logger.info(f"Include Docs Context: {request.include_docs_context}")
        logger.info("=" * 80)

        # Convert history to dict format
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.history
        ]

        # Generate code
        code = await code_generation_service.generate_code(
            prompt=request.prompt,
            frameworks=request.frameworks,
            history=history,
            include_docs_context=request.include_docs_context
        )

        logger.info(f"✅ Code generated ({len(code)} characters)")
        logger.info("\n💻 GENERATED CODE:")
        logger.info(code)
        logger.info("=" * 80 + "\n")

        # Update Langfuse trace with input, output, and metadata (v3 API)
        langfuse_client = get_client()
        langfuse_client.update_current_trace(
            input={
                "prompt": request.prompt,
                "frameworks": request.frameworks,
                "include_docs_context": request.include_docs_context,
            },
            output={
                "code": code[:500],  # Truncate for logging
                "code_length": len(code),
            },
            metadata={
                "frameworks": request.frameworks,
                "prompt_length": len(request.prompt),
                "history_length": len(request.history),
                "include_docs_context": request.include_docs_context,
            }
        )

        # Get trace ID for response (v3 API)
        trace_id = langfuse_client.get_current_trace_id()

        return CodeGenerationResponse(
            code=code,
            trace_id=trace_id
        )

    except Exception as e:
        # Update trace with error information (v3 API)
        langfuse_client = get_client()
        langfuse_client.update_current_trace(
            output={"error": str(e)},
            metadata={"error_type": type(e).__name__}
        )
        raise HTTPException(status_code=500, detail=str(e))
