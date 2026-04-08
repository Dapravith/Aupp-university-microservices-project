#!/bin/bash
# Script to build Docker images for Student and Teacher microservices

DOCKER_USERNAME="dapravith99"

echo "========================================="
echo "  Building Docker Images"
echo "========================================="

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
