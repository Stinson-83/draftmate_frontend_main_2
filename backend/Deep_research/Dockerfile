# Use an official Python runtime as a parent image
FROM python:3.11-slim-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpoppler-cpp-dev \
    pkg-config \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create directory for uploads
RUN mkdir -p lex_bot/data/uploads

# Expose port
EXPOSE 8004

# Run the application
CMD ["python", "-m", "lex_bot.app"]
