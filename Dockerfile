# Stage: Backend & Runtime
FROM python:3.11-slim-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV EMBED_MODEL=/app/models/embedding
ENV RERANK_MODEL=/app/models/rerank
ENV EASYOCR_MODULE_PATH=/app/models/easyocr
ENV SKIP_TUNNEL=true

# Set work directory
WORKDIR /app

# Install system dependencies, supervisor, and nginx
RUN apt-get update && apt-get install -y \
    build-essential \
    libpoppler-cpp-dev \
    pkg-config \
    python3-dev \
    supervisor \
    nginx \
    pandoc \
    wkhtmltopdf \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip to minimize connection issues
RUN pip install --upgrade pip

# Install heavy dependencies first with increased retries and timeout
RUN pip install --default-timeout=3000 --no-cache-dir --retries 10 \
    numpy \
    grpcio \
    grpcio-status \
    opencv-python-headless \
    faiss-cpu \
    sqlalchemy \
    psycopg2-binary

# Install Base Python dependencies (Cached Layer)
COPY requirements_base.txt .
RUN pip install --default-timeout=3000 --no-cache-dir --retries 10 -r requirements_base.txt

# Install CPU-only PyTorch and heavy ML libraries
# We install torch first from the CPU index, then easyocr/sentence-transformers
RUN pip install --default-timeout=3000 --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

RUN pip install --default-timeout=3000 --no-cache-dir easyocr sentence-transformers

# Pre-download models to bake them into the image (CACHED)
# We do this BEFORE requirements.txt so adding new features won't trigger a re-download!
COPY backend/download_models.py .
RUN python download_models.py

# Install Remaining Python dependencies (Changes Frequently)
COPY requirements.txt .
RUN pip install --default-timeout=3000 --no-cache-dir -r requirements.txt

# Copy all backend code
COPY backend/ backend/

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf


# Create directory for uploads (used by lex_bot)
RUN mkdir -p backend/Deep_research/lex_bot/data/uploads

# Expose Nginx port (Main Entrypoint)
EXPOSE 8080

# Run supervisor to start all services
CMD ["/usr/bin/supervisord"]
