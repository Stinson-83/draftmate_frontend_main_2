# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit --progress=false
COPY index.html vite.config.js eslint.config.js tailwind.config.js postcss.config.js ./
ENV CACHE_BUST=1
COPY src/ src/
COPY public/ public/
ARG VITE_CLIENT_ID=462761102428-dnm0f7tmt3dbv0l41aun71k4lj1c9hig.apps.googleusercontent.com
ENV VITE_CLIENT_ID=$VITE_CLIENT_ID
RUN VITE_BASE_PATH=/ VITE_API_BASE_URL=/ VITE_CLIENT_ID=$VITE_CLIENT_ID npm run build


# Stage 2: Backend & Runtime
FROM python:3.11-slim-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV EMBED_MODEL=/app/backend/models/embedding
ENV RERANK_MODEL=/app/backend/models/rerank
ENV EASYOCR_MODULE_PATH=/app/backend/models/easyocr
ENV SKIP_TUNNEL=true
ENV HF_ENDPOINT=https://hf-mirror.com
ENV SHARED_STORAGE_PATH=/app/shared_drafts

# Set work directory
WORKDIR /app

# Install system dependencies, supervisor, and nginx (no-install-recommends)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpoppler-cpp-dev \
    pkg-config \
    python3-dev \
    supervisor \
    nginx \
    pandoc \
    wkhtmltopdf \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker layer caching
COPY requirements_base.txt requirements.txt ./

# Upgrade pip and install Python dependencies in a single cached layer.
# Using --no-cache-dir to significantly reduce final Docker image size.
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --default-timeout=3000 --retries 10 -r requirements_base.txt && \
    pip install --no-cache-dir --default-timeout=3000 --retries 10 torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir --default-timeout=3000 --retries 10 easyocr sentence-transformers && \
    pip install --no-cache-dir --default-timeout=3000 --retries 10 -r requirements.txt

# Copy all backend code (including pre-downloaded models if present)
COPY backend/ backend/

# Copy bareacts data needed by Library Service
COPY src/data/bareacts/ src/data/bareacts/


# Pre-download models if they are missing (e.g. for local development builds)
RUN if [ ! -d "backend/models/embedding" ] || [ ! -d "backend/models/rerank" ]; then python backend/download_models.py; fi

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy Frontend Build Artifacts from Stage 1
COPY --from=frontend-builder /app/dist /var/www/html

# Create directory for uploads (used by lex_bot) and shared draft storage
RUN mkdir -p backend/Deep_research/lex_bot/data/uploads && \
    mkdir -p /app/shared_drafts

# Expose Nginx port (Main Entrypoint)
EXPOSE 8080

# Initialize database and run supervisor to start all services
CMD ["sh", "-c", "mkdir -p /app/shared_drafts && python backend/login_db/init_db.py && /usr/bin/supervisord"]
