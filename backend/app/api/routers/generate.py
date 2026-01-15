"""Code generation endpoints."""
import json
import logging
from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.models.chat import CodeGenerationRequest, CodeGenerationResponse
from app.services.code_generation_service import code_generation_service
from app.services.file_service import process_uploaded_files, format_file_context
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
        logger.info(f"CODE GENERATION REQUEST")
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

        logger.info(f"Code generated ({len(code)} characters)")

        # Update Langfuse trace
        langfuse_client = get_client()
        langfuse_client.update_current_trace(
            input={
                "prompt": request.prompt,
                "frameworks": request.frameworks,
                "include_docs_context": request.include_docs_context,
            },
            output={
                "code": code[:500],
                "code_length": len(code),
            },
            metadata={
                "frameworks": request.frameworks,
                "prompt_length": len(request.prompt),
                "history_length": len(request.history),
                "include_docs_context": request.include_docs_context,
            }
        )

        trace_id = langfuse_client.get_current_trace_id()

        return CodeGenerationResponse(
            code=code,
            trace_id=trace_id
        )

    except Exception as e:
        langfuse_client = get_client()
        langfuse_client.update_current_trace(
            output={"error": str(e)},
            metadata={"error_type": type(e).__name__}
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload", response_model=CodeGenerationResponse)
@observe()
async def generate_code_with_files(
    prompt: str = Form(""),
    frameworks: str = Form("[]"),
    history: str = Form("[]"),
    include_docs_context: str = Form("true"),
    files: List[UploadFile] = File(default=[])
):
    """
    Code generation endpoint with file upload support.

    Processes uploaded files and includes their content as context for code generation.
    """
    try:
        # Parse JSON strings
        frameworks_list = json.loads(frameworks)
        history_list = json.loads(history)
        include_docs = include_docs_context.lower() == "true"

        logger.info("=" * 80)
        logger.info(f"CODE GENERATION WITH FILES")
        logger.info(f"Prompt: {prompt}")
        logger.info(f"Frameworks: {frameworks_list}")
        logger.info(f"Files: {[f.filename for f in files]}")
        logger.info("=" * 80)

        # Process uploaded files
        file_content = await process_uploaded_files(files)
        file_context = format_file_context(file_content)

        # Combine prompt with file context
        enhanced_prompt = prompt
        if file_context:
            enhanced_prompt = f"{file_context}\n\nUser request: {prompt}" if prompt else file_context

        # Generate code
        code = await code_generation_service.generate_code(
            prompt=enhanced_prompt,
            frameworks=frameworks_list,
            history=history_list,
            include_docs_context=include_docs
        )

        logger.info(f"Code generated ({len(code)} characters)")

        # Update Langfuse trace
        langfuse_client = get_client()
        langfuse_client.update_current_trace(
            input={
                "prompt": prompt,
                "frameworks": frameworks_list,
                "include_docs_context": include_docs,
                "files": [f.filename for f in files],
            },
            output={
                "code": code[:500],
                "code_length": len(code),
            },
            metadata={
                "frameworks": frameworks_list,
                "prompt_length": len(prompt),
                "file_count": len(files),
                "file_context_length": len(file_content),
                "include_docs_context": include_docs,
            }
        )

        trace_id = langfuse_client.get_current_trace_id()

        return CodeGenerationResponse(
            code=code,
            trace_id=trace_id
        )

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"Invalid JSON: {str(e)}")
    except Exception as e:
        logger.error(f"Error in generate_code_with_files: {e}")
        langfuse_client = get_client()
        langfuse_client.update_current_trace(
            output={"error": str(e)},
            metadata={"error_type": type(e).__name__}
        )
        raise HTTPException(status_code=500, detail=str(e))
