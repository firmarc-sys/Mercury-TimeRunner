FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PORT=8080
WORKDIR /app
COPY . .

# Canonical Mercury UI is committed in /static. Do not rebuild legacy React into it.
RUN pip install --no-cache-dir uv && uv sync --frozen --no-dev

EXPOSE 8080
CMD ["sh", "-c", "exec uv run uvicorn app:asgi --host 0.0.0.0 --port ${PORT:-8080}"]
