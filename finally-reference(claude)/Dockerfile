# One image: Python backend + the static frontend in ./static (no Node build step needed)
FROM python:3.12-slim
RUN pip install --no-cache-dir uv
WORKDIR /app/backend
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --no-dev --frozen
COPY backend/ /app/backend/
COPY static/ /app/static/
ENV FINALLY_DB_PATH=/app/db/finally.db FINALLY_STATIC_DIR=/app/static
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
