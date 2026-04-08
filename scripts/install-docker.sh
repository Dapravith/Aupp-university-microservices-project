#!/bin/bash
# Script to install Docker and Docker Compose on Ubuntu EC2 instance

echo "========================================="
echo "  Installing Docker on EC2 (Ubuntu)"
echo "========================================="

# Update system packages
sudo apt-get update -y

# Install prerequisites
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Docker Compose
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group (so you can run docker without sudo)
sudo usermod -aG docker $USER

# Verify installation
echo ""
echo "========================================="
echo "  Verifying Installation"
echo "========================================="
docker --version
docker compose version

echo ""
echo "========================================="
echo "  Docker installed successfully!"
echo "  NOTE: Log out and log back in for"
echo "  docker group changes to take effect."
echo "  Run: newgrp docker"
echo "========================================="
