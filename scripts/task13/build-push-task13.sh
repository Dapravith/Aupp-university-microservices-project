#!/bin/bash
###############################################################
# Task 13: Build and Push auth-service Docker image
# This script builds the auth-service image with morgan logging
# and pushes it to Docker Hub for EC2 deployment.
###############################################################

set -e

DOCKER_USERNAME="dapravith99"
IMAGE_NAME="auth-service-task13"
TAG="latest"
FULL_IMAGE="${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"

echo "=========================================="
echo "  Task 13: Build & Push Auth Service"
echo "=========================================="

# Check Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed."
    exit 1
fi

# Navigate to auth-service directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AUTH_DIR="${SCRIPT_DIR}/../../auth-service"

if [ ! -d "$AUTH_DIR" ]; then
    echo "ERROR: auth-service directory not found at $AUTH_DIR"
    exit 1
fi

echo ""
echo "Step 1: Building Docker image..."
echo "  Image: ${FULL_IMAGE}"
echo "  Context: ${AUTH_DIR}"
docker build -t "${FULL_IMAGE}" "$AUTH_DIR"
echo "  Build successful!"

echo ""
echo "Step 2: Pushing image to Docker Hub..."
echo "  (Make sure you are logged in: docker login)"
docker push "${FULL_IMAGE}"
echo "  Push successful!"

echo ""
echo "=========================================="
echo "  Image pushed: ${FULL_IMAGE}"
echo "=========================================="