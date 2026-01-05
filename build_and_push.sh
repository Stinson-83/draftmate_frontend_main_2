#!/bin/bash

# Configuration
AWS_REGION="us-east-1"
ECR_REPO_NAME="draftmate-app" # Updated from screenshot
IMAGE_TAG="v28"
# Load VITE_CLIENT_ID from .env safely
if [ -f .env ]; then
  VITE_CLIENT_ID=$(grep "^VITE_CLIENT_ID=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$VITE_CLIENT_ID" ]; then
  echo "Error: VITE_CLIENT_ID not found in .env"
  exit 1
fi

# 1. Authenticate with ECR
echo "🔐 Authenticating with ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com

# Get Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"

# 2. Build the Image
echo "🏗️ Building Docker Image..."
docker build \
  --no-cache \
  --build-arg VITE_CLIENT_ID=$VITE_CLIENT_ID \
  -t $ECR_REPO_NAME \
  .

# 3. Tag the Image
echo "🏷️ Tagging Image..."
docker tag $ECR_REPO_NAME:latest $ECR_URI:$IMAGE_TAG

# 4. Push to ECR
echo "🚀 Pushing to ECR..."
docker push $ECR_URI:$IMAGE_TAG

echo "✅ Done! Image pushed to: $ECR_URI:$IMAGE_TAG"
echo "You can now deploy this image in App Runner."
