#!/bin/bash

# Configuration
IMAGE_NAME="draftmate-app-local"
VITE_CLIENT_ID="462761102428-qa47r8k64d1log5488m2un9890iprauu.apps.googleusercontent.com"

echo "🏗️ Building Docker Image for Local Testing..."
docker build \
  --build-arg VITE_CLIENT_ID=$VITE_CLIENT_ID \
  -t $IMAGE_NAME \
  .

echo "🏃 Running Docker Container..."
echo "Access the app at http://localhost:8080"
echo "Press Ctrl+C to stop."

# Run with .env file passed through
docker run --rm -p 8080:8080 --env-file .env $IMAGE_NAME
