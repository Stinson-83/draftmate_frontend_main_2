#!/bin/bash

# Configuration
AWS_REGION="us-east-1"
ECR_REPO_NAME="draftmate-app" # Updated from screenshot
IMAGE_TAG="latest"
VITE_CLIENT_ID="462761102428-qa47r8k64d1log5488m2un9890iprauu.apps.googleusercontent.com"

# 1. Authenticate with ECR
echo "🔐 Authenticating with ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com

# Get Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"

# 2. Build the Image
echo "🏗️ Building Docker Image..."
docker build \
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
