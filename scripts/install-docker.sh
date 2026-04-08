#!/bin/bash
# Script to install Docker and Docker Compose on Amazon Linux 2 EC2 instance

echo "========================================="
echo "  Installing Docker on EC2 Instance"
echo "========================================="

# Update system packages
sudo yum update -y

# Install Docker
sudo yum install -y docker

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group (so you can run docker without sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
echo ""
echo "========================================="
echo "  Verifying Installation"
echo "========================================="
docker --version
docker-compose --version

echo ""
echo "========================================="
echo "  Docker installed successfully!"
echo "  NOTE: Log out and log back in for"
echo "  docker group changes to take effect."
echo "========================================="
