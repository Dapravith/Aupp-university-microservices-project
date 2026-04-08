#!/bin/bash
# Script to push Docker images to Docker Hub
# Compatible with Ubuntu EC2 instance

DOCKER_USERNAME="dapravith99"

echo "========================================="
echo "  Pushing Images to Docker Hub (Ubuntu EC2)"
echo "========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Run ./scripts/install-docker.sh first."
    exit 1
fi

# Check if images exist
if ! docker images | grep -q "$DOCKER_USERNAME/student-microservice"; then
    echo "Error: Student image not found. Run ./scripts/build-images.sh first."
    exit 1
fi
if ! docker images | grep -q "$DOCKER_USERNAME/teacher-microservice"; then
    echo "Error: Teacher image not found. Run ./scripts/build-images.sh first."
    exit 1
fi

# Login to Docker Hub
echo "Logging in to Docker Hub..."
docker login

# Push Student Microservice image
echo ""
echo "Pushing Student Microservice image..."
docker push $DOCKER_USERNAME/student-microservice:latest
echo "Student Microservice image pushed successfully!"

# Push Teacher Microservice image
echo ""
echo "Pushing Teacher Microservice image..."
docker push $DOCKER_USERNAME/teacher-microservice:latest
echo "Teacher Microservice image pushed successfully!"

echo ""
echo "========================================="
echo "  All images pushed to Docker Hub!"
echo "  - $DOCKER_USERNAME/student-microservice:latest"
echo "  - $DOCKER_USERNAME/teacher-microservice:latest"
echo "========================================="
