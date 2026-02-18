FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY Backend/requirements.txt ./Backend/
RUN pip install --no-cache-dir -r Backend/requirements.txt

# Copy Backend application code
COPY Backend/ ./Backend/

# Copy Frontend build files
COPY Frontend/ava-02/build/ ./Frontend/ava-02/build/

# Expose port 8000
EXPOSE 8000

# Run the application with uvicorn on port 8000
CMD ["uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
