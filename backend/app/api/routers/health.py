"""Health check endpoint."""
from fastapi import APIRouter
from datetime import datetime
from app.services.pinecone_service import pinecone_service

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Get Pinecone stats to verify connection
        stats = pinecone_service.get_stats()

        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "devdocs-backend",
            "pinecone": {
                "connected": True,
                "total_vectors": stats.get("total_vectors", 0),
                "dimension": stats.get("dimension", 0)
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "devdocs-backend",
            "error": str(e)
        }
