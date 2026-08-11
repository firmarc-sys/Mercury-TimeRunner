FROM python:3.12-slim

# Install Node.js
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

# Build frontend
RUN cd frontend && npm install && npm run build

# Install Python dependencies
RUN pip install --no-cache-dir uv
RUN uv sync

CMD ["sh", "-c", "uvicorn app:asgi --host 0.0.0.0 --port ${PORT:-8080}"]
