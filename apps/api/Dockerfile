# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0

FROM node:26.7.0-bookworm-slim AS build
RUN npm install --global pnpm@11.13.1
WORKDIR /workspace
COPY . .
RUN pnpm install --frozen-lockfile \
    && pnpm --filter @traceguard/database build \
    && pnpm --filter @traceguard/api build \
    && pnpm --filter @traceguard/api deploy --prod --legacy /opt/traceguard

FROM node:26.7.0-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=4000
WORKDIR /opt/traceguard
COPY --from=build --chown=node:node /opt/traceguard ./
USER node
EXPOSE 4000
CMD ["node", "dist/apps/api/src/server.js"]
