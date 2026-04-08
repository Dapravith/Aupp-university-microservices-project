#!/bin/bash
# Script to deploy microservices using Docker Compose on EC2
# Run this script on the EC2 instance after installing Docker

echo "========================================="
echo "  Deploying Microservices on EC2"
echo "========================================="

# Pull latest images from Docker Hub
echo "Pulling latest images from Docker Hub..."
docker compose pull

# Stop existing containers (if any)
echo "Stopping existing containers..."
docker compose down

# Start containers in detached mode
echo "Starting containers..."
docker compose up -d

# Wait for services to start
sleep 5

# Check container status
echo ""
echo "========================================="
echo "  Container Status"
echo "========================================="
docker compose ps

# Test health endpoints
echo ""
echo "========================================="
echo "  Health Check"
echo "========================================="
echo "Student Service: $(curl -s http://localhost:5001/health)"
echo "Teacher Service: $(curl -s http://localhost:5002/health)"

echo ""
echo "========================================="
echo "  Deployment complete!"
echo "  Student API: http://localhost:5001"
echo "  Teacher API: http://localhost:5002"
echo "========================================="
