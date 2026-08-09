# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0

FROM python:3.14.0-slim-bookworm AS build
ENV UV_PROJECT_ENVIRONMENT=/opt/traceguard/.venv
RUN pip install --no-cache-dir uv==0.11.29
WORKDIR /workspace
COPY apps/ai-service/pyproject.toml apps/ai-service/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

FROM python:3.14.0-slim-bookworm AS runtime
ENV PATH=/opt/traceguard/.venv/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
RUN addgroup --system traceguard \
    && adduser --system --ingroup traceguard --home /opt/traceguard traceguard
WORKDIR /opt/traceguard
COPY --from=build --chown=traceguard:traceguard /opt/traceguard/.venv .venv
COPY --chown=traceguard:traceguard apps/ai-service/app app
USER traceguard
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
