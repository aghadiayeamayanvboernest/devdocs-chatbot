"""Pinecone vector database service."""
from typing import List, Dict, Any, Optional
from pinecone import Pinecone
from openai import OpenAI
from app.config import settings


class PineconeService:
    """Service for interacting with Pinecone vector database."""

    def __init__(self):
        """Initialize Pinecone and OpenAI clients."""
        # Initialize Pinecone
        self.pc = Pinecone(api_key=settings.pinecone_api_key)
        self.index = self.pc.Index(settings.pinecone_index_name)

        # Initialize OpenAI for embeddings
        self.openai = OpenAI(api_key=settings.openai_api_key)

    def create_embedding(self, text: str) -> List[float]:
        """
        Create embedding for text using OpenAI.

        Args:
            text: Text to embed

        Returns:
            List of floats representing the embedding
        """
        response = self.openai.embeddings.create(
            model=settings.embedding_model,
            input=text,
            dimensions=settings.embedding_dim
        )
        return response.data[0].embedding

    def search(
        self,
        query: str,
        frameworks: List[str],
        top_k: int = None
    ) -> List[Dict[str, Any]]:
        """
        Search Pinecone for relevant documentation across framework namespaces.

        Args:
            query: Search query text
            frameworks: List of framework namespaces to search
            top_k: Number of results to return per framework (default from settings)

        Returns:
            List of matching documents with metadata and scores, sorted by relevance
        """
        if top_k is None:
            top_k = settings.similarity_top_k

        # Create query embedding once
        query_embedding = self.create_embedding(query)

        # Query each framework namespace separately and collect all results
        all_results = []
        for framework in frameworks:
            try:
                # Query specific framework namespace
                results = self.index.query(
                    vector=query_embedding,
                    namespace=framework,  # Query framework-specific namespace!
                    top_k=top_k,
                    include_metadata=True,
                )

                # Format and add results
                for match in results.matches:
                    all_results.append({
                        "id": match.id,
                        "score": float(match.score),
                        "metadata": match.metadata,
                        "text": match.metadata.get("content", ""),
                        "url": match.metadata.get("url", ""),
                        "framework": framework,  # Use namespace as framework
                    })
            except Exception as e:
                # Log but don't fail if one namespace query fails
                print(f"Warning: Error querying namespace '{framework}': {e}")
                continue

        # Sort all results by score (highest first) and limit to top_k total
        all_results.sort(key=lambda x: x["score"], reverse=True)
        return all_results[:top_k]

    def get_stats(self) -> Dict[str, Any]:
        """
        Get index statistics.

        Returns:
            Dictionary with index stats
        """
        stats = self.index.describe_index_stats()
        return {
            "total_vectors": stats.total_vector_count,
            "dimension": stats.dimension,
            "namespaces": stats.namespaces if hasattr(stats, 'namespaces') else {}
        }


# Global service instance
pinecone_service = PineconeService()
