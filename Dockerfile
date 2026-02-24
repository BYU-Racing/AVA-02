# --- Frontend build (vite) ---
FROM node:20-alpine AS frontend
WORKDIR /app/Frontend

# Install dependencies and build the frontend
COPY Frontend/ava-03/package*.json ./
RUN npm ci

# Copy source and build
COPY Frontend/ava-03/ ./
# outputs /app/frontend/dist
RUN npm run build   

# ---------- Backend stage ----------
FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY Backend/requirements.txt ./Backend/
RUN pip install --no-cache-dir -r Backend/requirements.txt

# Backend code
COPY Backend/ ./Backend/

# Copy built frontend from the frontend stage
COPY --from=frontend /app/frontend/dist ./FrontendDist

EXPOSE 8000
CMD ["uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
