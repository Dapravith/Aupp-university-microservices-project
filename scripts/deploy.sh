#!/bin/bash
# Script to deploy microservices using Docker Compose on Ubuntu EC2 instance
# Run this script on the EC2 instance after installing Docker

# Navigate to project root (parent of scripts/)
cd "$(dirname "$0")/.."

echo "========================================="
echo "  Deploying Microservices on Ubuntu EC2"
echo "========================================="
echo "Working directory: $(pwd)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Run ./scripts/install-docker.sh first."
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found in $(pwd)"
    exit 1
fi

# Install curl if not available
if ! command -v curl &> /dev/null; then
    echo "Installing curl..."
    sudo apt-get install -y curl
fi

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

# Get EC2 public IP
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")

echo ""
echo "========================================="
echo "  Deployment complete!"
echo "  Student API: http://$EC2_IP:5001"
echo "  Teacher API: http://$EC2_IP:5002"
echo "========================================="
