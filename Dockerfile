FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Install Node.js for the Vite frontend build.
RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

# Build the frontend. vite.config.js writes the production bundle to /app/static.
RUN cd frontend && npm install && npm run build

# Install the Python runtime into uv's project virtual environment.
RUN pip install --no-cache-dir uv \
    && uv sync --frozen --no-dev

EXPOSE 8080

# Cloud Run injects PORT. `uv run` is required because uv sync installs
# FastAPI/Uvicorn into the project virtual environment rather than globally.
CMD ["sh", "-c", "exec uv run uvicorn app:asgi --host 0.0.0.0 --port ${PORT:-8080}"]
