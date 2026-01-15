"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings, SUPPORTED_FRAMEWORKS
from app.api.routers import health, chat, generate

# Create FastAPI app
app = FastAPI(
    title="DevDocs AI Chatbot API",
    description="AI-powered chatbot for developer documentation",
    version="1.0.0"
)

# CORS middleware
if settings.environment == "dev":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://your-frontend-domain.vercel.app",
            "http://localhost:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include routers
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(generate.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "DevDocs AI Chatbot API",
        "docs": "/docs",
        "supported_frameworks": SUPPORTED_FRAMEWORKS,
        "version": "1.0.0"
    }


@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    print("=" * 80)
    print("DevDocs AI Chatbot API Starting...")
    print(f"Environment: {settings.environment}")
    print(f"Supported Frameworks: {', '.join(SUPPORTED_FRAMEWORKS)}")
    print("=" * 80)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.environment == "dev"
    )
