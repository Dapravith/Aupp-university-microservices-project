#!/bin/bash
###############################################################
# Task 13: Deploy on EC2 with Docker Volumes
#
# This script demonstrates Docker Volume persistence:
#   Step 1: Deploy auth-service + MongoDB with volumes
#   Step 2: Verify services are running
#   Step 3: Show volume information
#
# Run on EC2 after copying docker-compose-task13.yml
###############################################################

set -e

COMPOSE_FILE="docker-compose-task13.yml"

echo "============================================================"
echo "  Task 13: Web Container + DB Container + Docker Volume"
echo "============================================================"

# Check Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Run install-docker.sh first."
    exit 1
fi

# Check compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "ERROR: $COMPOSE_FILE not found in current directory."
    echo "  Copy it from the repository first."
    exit 1
fi

echo ""
echo "Step 1: Pulling latest images from Docker Hub..."
docker compose -f "$COMPOSE_FILE" pull

echo ""
echo "Step 2: Starting containers with Docker Volumes..."
docker compose -f "$COMPOSE_FILE" up -d

echo ""
echo "Step 3: Waiting for services to start..."
sleep 5

echo ""
echo "Step 4: Checking container status..."
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "Step 5: Checking Docker Volumes..."
echo "--- Named Volumes ---"
docker volume ls | grep task13
echo ""
echo "--- Volume Details ---"
echo "[auth-logs volume]:"
docker volume inspect task13-auth-logs 2>/dev/null || echo "  Not created yet"
echo ""
echo "[mongo-data volume]:"
docker volume inspect task13-mongo-data 2>/dev/null || echo "  Not created yet"

echo ""
echo "Step 6: Health check..."
# Get EC2 public IP or use localhost
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")

echo "  Testing auth-service health endpoint..."
curl -s "http://${EC2_IP}:5004/api/health" | python3 -m json.tool 2>/dev/null || \
curl -s "http://localhost:5004/api/health" 2>/dev/null || \
echo "  Service still starting up... wait a few more seconds."

echo ""
echo "============================================================"
echo "  Deployment complete!"
echo ""
echo "  API Service:  http://${EC2_IP}:5004"
echo "  MongoDB:      mongodb://${EC2_IP}:27017"
echo ""
echo "  Volumes created:"
echo "    - task13-auth-logs  (server log files)"
echo "    - task13-mongo-data (database backup)"
echo "============================================================"
