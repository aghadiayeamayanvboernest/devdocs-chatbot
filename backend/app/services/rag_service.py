"""RAG service for documentation Q&A."""
from typing import List, Tuple, Dict, Any
from openai import OpenAI
from app.config import settings
from app.services.pinecone_service import pinecone_service


# System prompt for documentation Q&A
DOCUMENTATION_SYSTEM_PROMPT = """You are an expert technical documentation assistant for developers.

Your role:
- Answer questions about React, Next.js, Tailwind CSS, FastAPI, Django, PostgreSQL, and TypeScript
- Use ONLY the provided documentation context
- Provide accurate, concise answers with code examples when relevant
- Always cite your sources using [N] format inline (e.g., "React uses JSX [1] which allows...")
- If the documentation doesn't contain the answer, say so clearly

Format your responses:
1. Direct answer to the question with inline citations [N]
2. Code example (if applicable)
3. Best practices or warnings (if relevant)

IMPORTANT: Use inline citations like [1], [2], [3] throughout your response, but do NOT include a "Sources:" list at the end. The sources will be displayed separately by the UI.

Be helpful, technically accurate, and provide clear explanations."""


class RAGService:
    """Service for RAG-based documentation Q&A."""

    def __init__(self):
        """Initialize RAG service."""
        self.client = OpenAI(api_key=settings.openai_api_key)

    async def query(
        self,
        question: str,
        frameworks: List[str],
        history: List[Dict[str, str]] = None
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Query documentation and generate answer.

        Args:
            question: User's question
            frameworks: List of framework namespaces to search
            history: Previous conversation history (optional)

        Returns:
            Tuple of (answer, source_nodes)
        """
        # Search Pinecone for relevant documentation
        search_results = pinecone_service.search(
            query=question,
            frameworks=frameworks,
            top_k=settings.similarity_top_k
        )

        # Build context from search results
        context = self._build_context(search_results)

        # Generate answer using Claude
        answer = await self._generate_answer(question, context, history)

        return answer, search_results

    def _build_context(self, results: List[Dict[str, Any]]) -> str:
        """
        Build context string from search results.

        Args:
            results: List of search results from Pinecone

        Returns:
            Formatted context string
        """
        if not results:
            return "No relevant documentation found."

        context_parts = []
        for i, result in enumerate(results, 1):
            framework = result.get("framework", "unknown")
            url = result.get("url", "")
            text = result.get("text", "")
            score = result.get("score", 0.0)

            context_parts.append(
                f"[Source {i} - {framework.upper()} - Relevance: {score:.2f}]\n"
                f"URL: {url}\n"
                f"Content:\n{text}\n"
            )

        return "\n" + "="*80 + "\n".join(context_parts)

    async def _generate_answer(
        self,
        question: str,
        context: str,
        history: List[Dict[str, str]] = None
    ) -> str:
        """
        Generate answer using OpenAI GPT with context.

        Args:
            question: User's question
            context: Documentation context from retrieval
            history: Previous conversation history

        Returns:
            Generated answer
        """
        # Build conversation messages
        messages = [
            {"role": "system", "content": DOCUMENTATION_SYSTEM_PROMPT}
        ]

        # Add history if provided (last 5 messages for context)
        if history:
            for msg in history[-5:]:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        # Add current question with context
        user_message = f"""DOCUMENTATION CONTEXT:
{context}

USER QUESTION:
{question}

Provide a helpful answer based on the documentation above. Include relevant code examples when appropriate.
Use inline citations [1], [2], etc. to reference sources, but do NOT include a "Sources:" list at the end."""

        messages.append({
            "role": "user",
            "content": user_message
        })

        # Call OpenAI API
        response = self.client.chat.completions.create(
            model=settings.doc_model,  # Use configured OpenAI model (gpt-4o)
            max_tokens=2000,
            temperature=settings.temperature,
            messages=messages
        )

        # Extract text from response
        answer = response.choices[0].message.content

        return answer


# Global service instance
rag_service = RAGService()
