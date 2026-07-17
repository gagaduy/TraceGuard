# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0

from typing import Literal

from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    """Versioned health response for internal orchestration."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["1"] = "1"
    status: Literal["ok"] = "ok"


class ProblemDetails(BaseModel):
    """RFC 9457-compatible internal failure response."""

    model_config = ConfigDict(extra="forbid")

    detail: str
    status: int
    title: str
    type: str
