#!/bin/bash
# Script to push Docker images to Docker Hub

DOCKER_USERNAME="dapravith99"

echo "========================================="
echo "  Pushing Images to Docker Hub"
echo "========================================="

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
