"""Chat endpoints."""
import json
import logging
from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.models.chat import ChatRequest, ChatResponse, FeedbackRequest, SourceNode
from app.services.rag_service import rag_service
from app.services.file_service import process_uploaded_files, format_file_context
from app.langfuse_client import observe, get_client, langfuse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
@observe()
async def chat(request: ChatRequest):
    """
    Chat endpoint for documentation Q&A.

    Retrieves relevant documentation and generates answer.
    """
    try:
        logger.info("=" * 80)
        logger.info(f"NEW CHAT QUERY")
        logger.info(f"Message: {request.message}")
        logger.info(f"Frameworks: {request.frameworks}")
        logger.info("=" * 80)

        # Convert history to dict format
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.history
        ]

        # Query RAG service
        answer, sources = await rag_service.query(
            question=request.message,
            frameworks=request.frameworks,
            history=history
        )

        logger.info(f"Response generated with {len(sources)} sources")

        # Format sources
        source_nodes = [
            SourceNode(
                id=s["id"],
                text=s["text"][:300] + "..." if len(s["text"]) > 300 else s["text"],
                score=s["score"],
                metadata=s["metadata"],
                url=s.get("url"),
                framework=s.get("framework")
            )
            for s in sources
        ]

        # Update Langfuse trace
        langfuse_client = get_client()
        langfuse_client.update_current_trace(
            input={
                "message": request.message,
                "frameworks": request.frameworks,
            },
            output={
                "answer": answer[:500],
                "num_sources": len(sources),
            },
            metadata={
                "frameworks": request.frameworks,
                "message_length": len(request.message),
                "history_length": len(request.history),
                "top_scores": [s["score"] for s in sources[:3]],
            }
        )

        trace_id = langfuse_client.get_current_trace_id()

        return ChatResponse(
            response=answer,
            sources=source_nodes,
            trace_id=trace_id
        )

    except Exception as e:
        langfuse_client = get_client()
        langfuse_client.update_current_trace(
            output={"error": str(e)},
            metadata={"error_type": type(e).__name__}
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload", response_model=ChatResponse)
@observe()
async def chat_with_files(
    message: str = Form(""),
    frameworks: str = Form("[]"),
    history: str = Form("[]"),
    files: List[UploadFile] = File(default=[])
):
    """
    Chat endpoint with file upload support.

    Processes uploaded files and includes their content in the context.
    """
    try:
        # Parse JSON strings
        frameworks_list = json.loads(frameworks)
        history_list = json.loads(history)

        logger.info("=" * 80)
        logger.info(f"NEW CHAT WITH FILES")
        logger.info(f"Message: {message}")
        logger.info(f"Frameworks: {frameworks_list}")
        logger.info(f"Files: {[f.filename for f in files]}")
        logger.info("=" * 80)

        # Process uploaded files
        file_content = await process_uploaded_files(files)
        file_context = format_file_context(file_content)

        # Combine message with file context
        enhanced_message = message
        if file_context:
            enhanced_message = f"{file_context}\n\nUser question: {message}" if message else file_context

        # Query RAG service
        answer, sources = await rag_service.query(
            question=enhanced_message,
            frameworks=frameworks_list,
            history=history_list
        )

        logger.info(f"Response generated with {len(sources)} sources")

        # Format sources
        source_nodes = [
            SourceNode(
                id=s["id"],
                text=s["text"][:300] + "..." if len(s["text"]) > 300 else s["text"],
                score=s["score"],
                metadata=s["metadata"],
                url=s.get("url"),
                framework=s.get("framework")
            )
            for s in sources
        ]

        # Update Langfuse trace
        langfuse_client = get_client()
        langfuse_client.update_current_trace(
            input={
                "message": message,
                "frameworks": frameworks_list,
                "files": [f.filename for f in files],
            },
            output={
                "answer": answer[:500],
                "num_sources": len(sources),
            },
            metadata={
                "frameworks": frameworks_list,
                "message_length": len(message),
                "file_count": len(files),
                "file_context_length": len(file_content),
            }
        )

        trace_id = langfuse_client.get_current_trace_id()

        return ChatResponse(
            response=answer,
            sources=source_nodes,
            trace_id=trace_id
        )

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"Invalid JSON: {str(e)}")
    except Exception as e:
        logger.error(f"Error in chat_with_files: {e}")
        langfuse_client = get_client()
        langfuse_client.update_current_trace(
            output={"error": str(e)},
            metadata={"error_type": type(e).__name__}
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    """Submit user feedback for a chat response."""
    try:
        langfuse.score(
            id=f"{request.trace_id}_feedback",
            trace_id=request.trace_id,
            name="user_feedback",
            data_type="CATEGORICAL",
            value=request.value,
            comment=request.comment,
        )
        return {"status": "success", "trace_id": request.trace_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
