#!/bin/bash

# Configuration
IMAGE_NAME="draftmate-app-local"
# Load VITE_CLIENT_ID from .env safely
if [ -f .env ]; then
  VITE_CLIENT_ID=$(grep "^VITE_CLIENT_ID=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$VITE_CLIENT_ID" ]; then
  echo "Error: VITE_CLIENT_ID not found in .env"
  exit 1
fi

echo "🏗️ Building Docker Image for Local Testing..."
docker build \
  --no-cache \
  --build-arg VITE_CLIENT_ID=$VITE_CLIENT_ID \
  -t $IMAGE_NAME \
  .

echo "🏃 Running Docker Container..."
echo "Access the app at http://localhost:8080"
echo "Press Ctrl+C to stop."

# Run with .env file passed through
docker run --rm -p 8080:8080 --env-file .env $IMAGE_NAME
