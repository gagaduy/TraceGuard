# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0

import asyncio

import httpx
from fastapi import FastAPI

from app.main import create_app


async def get(app: FastAPI, path: str) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://compute.test",
    ) as client:
        return await client.get(path)


def test_liveness_is_independent_of_readiness() -> None:
    async def unavailable() -> None:
        raise RuntimeError("dependency unavailable")

    response = asyncio.run(get(create_app(unavailable), "/health/live"))

    assert response.status_code == 200
    assert response.json() == {"schema_version": "1", "status": "ok"}


def test_readiness_returns_problem_details_without_internal_error() -> None:
    async def unavailable() -> None:
        raise RuntimeError("sensitive provider detail")

    response = asyncio.run(get(create_app(unavailable), "/health/ready"))

    assert response.status_code == 503
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json() == {
        "detail": "A required compute dependency is unavailable.",
        "status": 503,
        "title": "Service unavailable",
        "type": "https://traceguard.dev/problems/compute-dependency-unavailable",
    }
    assert "sensitive provider detail" not in response.text


def test_readiness_reports_versioned_success() -> None:
    response = asyncio.run(get(create_app(), "/health/ready"))

    assert response.status_code == 200
    assert response.json() == {"schema_version": "1", "status": "ok"}
