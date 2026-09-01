# syntax=docker/dockerfile:1

# --- Frontend build (Vite) ---
FROM node:20-alpine AS frontend
WORKDIR /app/Frontend

COPY Frontend/ava-03/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-fund

COPY Frontend/ava-03/index.html Frontend/ava-03/vite.config.js ./
COPY Frontend/ava-03/src/ ./src/

# Public assets are copied directly into the runtime image below. Vite does not
# transform them, so keeping them out of this step avoids recopying 75 MiB of
# animation frames whenever frontend source code changes.
# Keep enough RAM available for Docker and the OS on a 2 GiB EC2 instance.
RUN NODE_OPTIONS=--max-old-space-size=1500 npm run build

# ---------- Backend stage ----------
FROM python:3.11-slim
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.10.8 /uv /uvx /bin/
COPY Backend/pyproject.toml Backend/uv.lock ./Backend/
ENV UV_LINK_MODE=copy
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --directory Backend --locked --no-dev --no-install-project

# Copy large, rarely changing static files before application source so Docker
# can reuse this layer during normal code deployments.
COPY Frontend/ava-03/public/ ./FrontendDist/
COPY Backend/ ./Backend/
ENV PATH="/app/Backend/.venv/bin:$PATH"

COPY --from=frontend /app/Frontend/dist ./FrontendDist

EXPOSE 8000
CMD ["uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
