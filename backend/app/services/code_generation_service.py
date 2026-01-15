"""Code generation service using Claude."""
from typing import List, Dict, Any, Optional
from anthropic import Anthropic
from app.config import settings
from app.services.pinecone_service import pinecone_service


# System prompt for code generation
CODE_GENERATION_SYSTEM_PROMPT = """You are an expert software engineer specializing in writing production-quality code.

CRITICAL: Generate COMPLETE, PRODUCTION-READY applications with proper project structure, NOT single-file examples.

Your output MUST include:

1. **Complete Project Structure**:
   - Organize code into multiple files following best practices
   - Create separate files for components, utilities, types, styles, etc.
   - Include configuration files (tsconfig.json, package.json, .env.example, etc.)
   - Follow the framework's recommended folder structure

2. **Package Dependencies**:
   - Provide a complete package.json with ALL dependencies and devDependencies
   - Include exact versions for stability
   - List all required packages (runtime and development)

3. **Setup Instructions**:
   - Step-by-step installation commands
   - Environment setup (.env variables)
   - How to run development server
   - How to build for production

4. **Code Quality**:
   - Proper TypeScript types and interfaces
   - Error handling and validation
   - Loading states and error states
   - Accessibility (ARIA labels, semantic HTML)
   - Responsive design with Tailwind CSS
   - Code comments for complex logic

5. **Best Practices**:
   - Separation of concerns (components, hooks, utilities, types)
   - Reusable components and custom hooks
   - Proper state management
   - API error handling
   - Form validation
   - Security best practices

OUTPUT FORMAT:

## 1. Project Overview
[Brief description of what you're building and architecture decisions]

## 2. Project Structure
```
project-name/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   └── ...
├── package.json
├── tsconfig.json
└── ...
```

## 3. Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Step by step commands
```

### Environment Variables
```bash
# .env.example content
```

## 4. Complete Code

### File: package.json
```json
{
  "name": "...",
  "dependencies": { ... },
  "devDependencies": { ... }
}
```

### File: src/components/ComponentName.tsx
```tsx
// Complete, working code
```

[Continue with ALL necessary files]

## 5. Running the Application
```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## 6. Features & Usage
- List of implemented features
- How to use the application
- API endpoints (if applicable)

## 7. Additional Notes
- Important considerations
- Potential improvements
- Security notes

REMEMBER: Generate a COMPLETE, MULTI-FILE application that someone can copy, install dependencies, and run immediately. NOT a single-file demo!"""


class CodeGenerationService:
    """Service for generating code using Claude."""

    def __init__(self):
        """Initialize code generation service."""
        self.client = Anthropic(api_key=settings.anthropic_api_key)

    async def generate_code(
        self,
        prompt: str,
        frameworks: List[str],
        history: List[Dict[str, str]] = None,
        include_docs_context: bool = True
    ) -> str:
        """
        Generate code based on user prompt.

        Args:
            prompt: User's code generation request
            frameworks: List of frameworks to consider
            history: Previous conversation history (optional)
            include_docs_context: Whether to include documentation context

        Returns:
            Generated code with explanation
        """
        # Build context from documentation if requested
        context = ""
        if include_docs_context and frameworks:
            # Search for relevant documentation
            search_results = pinecone_service.search(
                query=prompt,
                frameworks=frameworks,
                top_k=3  # Fewer sources for code gen to keep prompt focused
            )

            if search_results:
                context = self._build_context(search_results)

        # Generate code using Claude Opus 4.5
        response_text = await self._generate_with_claude(
            prompt=prompt,
            context=context,
            history=history
        )

        return response_text

    def _build_context(self, results: List[Dict[str, Any]]) -> str:
        """
        Build documentation context from search results.

        Args:
            results: Search results from Pinecone

        Returns:
            Formatted context string
        """
        if not results:
            return ""

        context_parts = ["\n# RELEVANT DOCUMENTATION\n"]

        for idx, result in enumerate(results, 1):
            metadata = result.get("metadata", {})
            text = result.get("text", "")
            url = metadata.get("url", "")
            framework = result.get("framework", "")

            context_parts.append(
                f"\n## Source {idx} ({framework})\n"
                f"URL: {url}\n"
                f"\n{text}\n"
                f"{'='*80}"
            )

        return "\n".join(context_parts)

    async def _generate_with_claude(
        self,
        prompt: str,
        context: str = "",
        history: List[Dict[str, str]] = None
    ) -> str:
        """
        Generate code using Claude.

        Args:
            prompt: User's code generation request
            context: Optional documentation context
            history: Previous conversation history

        Returns:
            Generated code response
        """
        # Build conversation messages for Claude (no system in messages array)
        messages = []

        # Add history if provided (last 5 messages for context)
        if history:
            for msg in history[-5:]:
                # Skip system messages in history
                if msg["role"] != "system":
                    messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })

        # Build user message with context if available
        if context:
            user_message = f"""{context}

# USER REQUEST

{prompt}

Based on the documentation above, generate a COMPLETE, PRODUCTION-READY application with:
- Full project structure with multiple files
- Complete package.json with all dependencies
- Setup instructions and environment configuration
- All necessary components, hooks, utilities, and types
- Proper error handling, validation, and loading states
- Configuration files (tsconfig.json, etc.)
Make it ready to copy, install, and run immediately."""
        else:
            user_message = f"""{prompt}

Generate a COMPLETE, PRODUCTION-READY application with:
- Full project structure with multiple files
- Complete package.json with all dependencies
- Setup instructions and environment configuration
- All necessary components, hooks, utilities, and types
- Proper error handling, validation, and loading states
- Configuration files (tsconfig.json, etc.)
Make it ready to copy, install, and run immediately."""

        messages.append({
            "role": "user",
            "content": user_message
        })

        # Call Claude API (Claude Sonnet 4.5)
        response = self.client.messages.create(
            model=settings.code_model,  # claude-sonnet-4-5-20250929
            max_tokens=16000,  # Increased for large multi-file applications
            temperature=settings.temperature,
            system=CODE_GENERATION_SYSTEM_PROMPT,  # System prompt goes here for Claude
            messages=messages
        )

        # Extract text from response
        return response.content[0].text


# Global service instance
code_generation_service = CodeGenerationService()
