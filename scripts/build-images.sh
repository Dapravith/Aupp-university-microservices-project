#!/bin/bash
# Script to build Docker images for Student and Teacher microservices
# Compatible with Ubuntu EC2 instance

DOCKER_USERNAME="dapravith99"

# Navigate to project root (parent of scripts/)
cd "$(dirname "$0")/.."

echo "========================================="
echo "  Building Docker Images (Ubuntu EC2)"
echo "========================================="
echo "Working directory: $(pwd)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Run ./scripts/install-docker.sh first."
    exit 1
fi

# Build Student Microservice image
echo ""
echo "Building Student Microservice image..."
docker build -t $DOCKER_USERNAME/student-microservice:latest ./Student_Microservice
echo "Student Microservice image built successfully!"

# Build Teacher Microservice image
echo ""
echo "Building Teacher Microservice image..."
docker build -t $DOCKER_USERNAME/teacher-microservice:latest ./Teacher_Microservice
echo "Teacher Microservice image built successfully!"

# List built images
echo ""
echo "========================================="
echo "  Built Images"
echo "========================================="
docker images | grep $DOCKER_USERNAME
