# file: Dockerfile
# Desc: Dockerfile for Backend. Sets up Python environment, installs dependencies, and runs FastAPI app

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.10.8 /uv /uvx /bin/

# Install Python dependencies from the lockfile
COPY pyproject.toml uv.lock ./Backend/
RUN uv sync --directory Backend --locked --no-dev --no-install-project

# Copy application code
COPY . ./Backend/
ENV PATH="/app/Backend/.venv/bin:$PATH"

# Expose port
EXPOSE 8000

# Run the application with uvicorn
CMD ["uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
