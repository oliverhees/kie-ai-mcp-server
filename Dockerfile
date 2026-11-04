# kie-ai-mcp-server (oliverhees fork) — Streamable HTTP image for Coolify.
#
# Same build as upstream packages/mcp/Dockerfile, plus one fork addition:
# the 3.x fork ran as root, so an existing /data volume (tasks.db) is owned
# by root. The entrypoint fixes the ownership once and then drops to the
# unprivileged `mcp` user, so old volumes keep working after the upgrade.
#
# Build context is the monorepo root:
#   docker build -t kie-ai-mcp-http .
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages packages
RUN npm ci

RUN npm run build -w @felores/kie-ai-core \
  && npm run bundle -w @felores/kie-ai-mcp-server

# --- runtime image -------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    MCP_TRANSPORT=http \
    MCP_HTTP_HOST=0.0.0.0 \
    MCP_HTTP_PORT=3000 \
    KIE_AI_DB_PATH=/data/tasks.db

RUN apk add --no-cache su-exec

COPY packages/mcp/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/mcp/dist ./dist

RUN mkdir -p /data \
  && addgroup -S mcp && adduser -S mcp -G mcp \
  && chown -R mcp:mcp /app /data \
  && printf '%s\n' \
    '#!/bin/sh' \
    'set -e' \
    'if [ "$(id -u)" = "0" ]; then' \
    '  chown -R mcp:mcp /data 2>/dev/null || true' \
    '  exec su-exec mcp "$@"' \
    'fi' \
    'exec "$@"' > /usr/local/bin/entrypoint.sh \
  && chmod +x /usr/local/bin/entrypoint.sh
VOLUME /data

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.MCP_HTTP_PORT||process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "dist/index.js"]
