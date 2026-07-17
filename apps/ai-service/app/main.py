# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0

from collections.abc import Awaitable, Callable

import structlog
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.schemas import HealthResponse, ProblemDetails

ReadinessCheck = Callable[[], Awaitable[None]]


async def ready_by_default() -> None:
    """Report readiness while the service has no mandatory external dependency."""


def create_app(readiness_check: ReadinessCheck = ready_by_default) -> FastAPI:
    """Construct the private compute application with injectable readiness."""

    application = FastAPI(
        title="TraceGuard private compute service",
        version="0.0.0",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    logger = structlog.get_logger()

    async def liveness() -> HealthResponse:
        return HealthResponse()

    async def readiness() -> HealthResponse | JSONResponse:
        try:
            await readiness_check()
        except Exception as error:  # noqa: BLE001 - boundary maps all failures safely
            logger.warning("readiness_check_failed", error_type=type(error).__name__)
            problem = ProblemDetails(
                detail="A required compute dependency is unavailable.",
                status=503,
                title="Service unavailable",
                type="https://traceguard.dev/problems/compute-dependency-unavailable",
            )
            return JSONResponse(
                content=problem.model_dump(),
                media_type="application/problem+json",
                status_code=503,
            )
        return HealthResponse()

    application.add_api_route(
        "/health/live",
        liveness,
        methods=["GET"],
        response_model=HealthResponse,
    )
    application.add_api_route(
        "/health/ready",
        readiness,
        methods=["GET"],
        response_model=HealthResponse,
        responses={503: {"model": ProblemDetails}},
    )

    return application


app = create_app()
