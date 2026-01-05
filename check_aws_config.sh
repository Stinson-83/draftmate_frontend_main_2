#!/bin/bash

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it to run this script."
    exit 1
fi

echo "🔍 Fetching AWS App Runner Services..."
SERVICES=$(aws apprunner list-services --region us-east-1 --query "ServiceSummaryList[*].{Name:ServiceName, Arn:ServiceArn, Status:Status}" --output table)

if [ -z "$SERVICES" ]; then
    echo "❌ No App Runner services found in us-east-1."
    exit 1
fi

echo "$SERVICES"
echo ""
echo "Please enter the Name of the App Runner service you want to inspect:"
read SERVICE_NAME

if [ -z "$SERVICE_NAME" ]; then
    echo "❌ Service name cannot be empty."
    exit 1
fi

echo "🔍 Retrieving configuration for service: $SERVICE_NAME..."
SERVICE_ARN=$(aws apprunner list-services --region us-east-1 --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" --output text)

if [ -z "$SERVICE_ARN" ]; then
    echo "❌ Service '$SERVICE_NAME' not found."
    exit 1
fi

# Get Service Description
aws apprunner describe-service --service-arn $SERVICE_ARN --region us-east-1 > apprunner_config.json

echo "✅ Configuration saved to apprunner_config.json"
echo ""
echo "--- Environment Variables ---"
cat apprunner_config.json | grep -A 20 "RuntimeEnvironmentVariables"
echo ""
echo "--- VPC Connector ---"
cat apprunner_config.json | grep -A 5 "NetworkConfiguration"
