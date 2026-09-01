# --- Frontend build (vite) ---
FROM node:20-alpine AS frontend
WORKDIR /app/Frontend

# Install dependencies and build the frontend
COPY Frontend/ava-03/package*.json ./
RUN npm ci

# Copy source and build
COPY Frontend/ava-03/ ./
# outputs /app/frontend/dist
# Keep enough RAM available for Docker and the OS on a 2 GiB EC2 instance.
RUN NODE_OPTIONS=--max-old-space-size=1024 npm run build

# ---------- Backend stage ----------
FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY --from=ghcr.io/astral-sh/uv:0.10.8 /uv /uvx /bin/
COPY Backend/pyproject.toml Backend/uv.lock ./Backend/

RUN uv sync --directory Backend --locked --no-dev --no-install-project

# Backend code
COPY Backend/ ./Backend/
ENV PATH="/app/Backend/.venv/bin:$PATH"


# Copy built frontend from the frontend stage
COPY --from=frontend /app/Frontend/dist ./FrontendDist

EXPOSE 8000
CMD ["uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
