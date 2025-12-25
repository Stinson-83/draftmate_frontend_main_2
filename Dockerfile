# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js eslint.config.js ./
COPY src/ src/
COPY public/ public/
RUN VITE_BASE_PATH=/ npm run build

# Stage 2: Backend & Runtime
FROM python:3.11-slim-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

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
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

# Copy all backend code
COPY backend/ backend/

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy Frontend Build Artifacts from Stage 1
COPY --from=frontend-builder /app/dist /var/www/html

# Create directory for uploads (used by lex_bot)
RUN mkdir -p backend/Deep_research/lex_bot/data/uploads

# Expose Nginx port (Main Entrypoint)
EXPOSE 8080

# Run supervisor to start all services
CMD ["/usr/bin/supervisord"]
