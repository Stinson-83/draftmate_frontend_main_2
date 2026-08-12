FROM python:3.11-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive
ENV PIP_NO_CACHE_DIR=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip \
 && pip install -r /app/requirements.txt

# Copy app code
COPY . /app

# Create non-root user
RUN useradd --create-home appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD python -c "import requests; requests.get('http://127.0.0.1:8001/')" || exit 1

CMD ["uvicorn", "Query:app", "--host", "0.0.0.0", "--port", "8001"]
