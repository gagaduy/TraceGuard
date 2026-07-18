# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0

FROM node:24.13.0-bookworm-slim@sha256:4660b1ca8b28d6d1906fd644abe34b2ed81d15434d26d845ef0aced307cf4b6f AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@11.13.1 --activate

FROM base AS builder

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/database/package.json packages/database/package.json

RUN pnpm install --frozen-lockfile

COPY packages/database packages/database

RUN pnpm --filter @traceguard/database build \
    && pnpm --filter @traceguard/database deploy --prod --legacy /opt/traceguard

FROM node:24.13.0-bookworm-slim@sha256:4660b1ca8b28d6d1906fd644abe34b2ed81d15434d26d845ef0aced307cf4b6f AS runner

ENV NODE_ENV=production
WORKDIR /opt/traceguard

COPY --from=builder --chown=node:node /opt/traceguard ./

USER node

CMD ["node", "dist/migrate.js"]
