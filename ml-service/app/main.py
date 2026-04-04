"""
AegisShield ML Microservice
FastAPI app serving risk scoring, fraud detection, and disruption prediction.
"""

import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import risk, fraud, disruption, location

# ── Structured logging ─────────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer() if get_settings().debug else structlog.processors.JSONRenderer(),
    ]
)
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    logger.info("AegisShield ML Service starting up", version="1.0.0")
    yield
    logger.info("AegisShield ML Service shutting down")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="AegisShield ML Service",
        description="AI/ML endpoints for risk scoring, fraud detection, and disruption prediction",
        version="1.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # Routers
    app.include_router(risk.router, prefix="/api/v1", tags=["risk"])
    app.include_router(fraud.router, prefix="/api/v1", tags=["fraud"])
    app.include_router(disruption.router, prefix="/api/v1", tags=["disruption"])
    app.include_router(location.router, prefix="/api/v1", tags=["location"])

    @app.get("/health", tags=["health"])
    async def health():
        return {"status": "ok", "service": "aegisshield-ml", "version": "1.0.0"}

    return app


app = create_app()
