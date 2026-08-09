# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0

FROM node:26.7.0-bookworm-slim AS build
RUN npm install --global pnpm@11.13.1
WORKDIR /workspace
COPY . .
RUN pnpm install --frozen-lockfile \
    && pnpm --filter @traceguard/workflows build \
    && pnpm --filter @traceguard/workflows deploy --prod --legacy /opt/traceguard

FROM node:26.7.0-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /opt/traceguard
COPY --from=build --chown=node:node /opt/traceguard ./
USER node
CMD ["node", "dist/worker.js"]
