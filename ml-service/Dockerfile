# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder
WORKDIR /app

RUN pip install --no-cache-dir poetry==1.8.3

COPY pyproject.toml requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM python:3.12-slim AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system aegis && adduser --system --ingroup aegis aegis

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY app/ ./app/

RUN chown -R aegis:aegis /app
USER aegis

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
