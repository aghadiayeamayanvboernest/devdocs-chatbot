"""Chat endpoints."""
import logging
from fastapi import APIRouter, HTTPException
from app.models.chat import ChatRequest, ChatResponse, FeedbackRequest, SourceNode
from app.services.rag_service import rag_service
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
        logger.info(f"📨 NEW CHAT QUERY")
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

        logger.info(f"✅ Response generated with {len(sources)} sources")
        logger.info("\n📝 RESPONSE:")
        logger.info(answer)
        logger.info("\n📚 SOURCE NODES:")
        for i, source in enumerate(sources[:5], 1):  # Show top 5 sources
            logger.info(f"\n  Source {i}:")
            logger.info(f"    Score: {source['score']:.4f}")
            logger.info(f"    Framework: {source.get('framework', 'N/A')}")
            logger.info(f"    Text: {source['text'][:200]}...")
        logger.info("=" * 80 + "\n")

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

        # Update Langfuse trace with input, output, and metadata (v3 API)
        langfuse_client = get_client()
        langfuse_client.update_current_trace(
            input={
                "message": request.message,
                "frameworks": request.frameworks,
            },
            output={
                "answer": answer[:500],  # Truncate for logging
                "num_sources": len(sources),
            },
            metadata={
                "frameworks": request.frameworks,
                "message_length": len(request.message),
                "history_length": len(request.history),
                "top_scores": [s["score"] for s in sources[:3]],
            }
        )

        # Get trace ID for response (v3 API)
        trace_id = langfuse_client.get_current_trace_id()

        return ChatResponse(
            response=answer,
            sources=source_nodes,
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
