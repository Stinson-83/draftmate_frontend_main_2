#!/bin/bash

# Configuration

# Load VITE_CLIENT_ID from .env safely
if [ -f .env ]; then
  VITE_CLIENT_ID=$(grep "^VITE_CLIENT_ID=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$VITE_CLIENT_ID" ]; then
  echo "Error: VITE_CLIENT_ID not found in .env"
  exit 1
fi

echo "🏗️ Building and Running with Docker Compose..."
echo "This ensures the database and other services are running, mimicking production."

# Use docker-compose to build and run the backend service (and its dependencies like db)
# We use --build to ensure the image is up to date
docker compose up --build backend
