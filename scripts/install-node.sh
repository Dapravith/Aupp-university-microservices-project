#!/bin/bash
# Script to install Node.js (via nvm) and nodemon on Ubuntu EC2 instance

echo "========================================="
echo "  Installing Node.js & Nodemon (Ubuntu)"
echo "========================================="

# Download and install nvm
echo "Installing nvm..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash

# Load nvm into current shell session
export NVM_DIR="$HOME/.nvm"
\. "$NVM_DIR/nvm.sh"

# Install Node.js v24
echo ""
echo "Installing Node.js v24..."
nvm install 24

# Set Node.js v24 as default
nvm alias default 24
nvm use 24

# Install nodemon globally
echo ""
echo "Installing nodemon globally..."
npm install -g nodemon

# Verify installations
echo ""
echo "========================================="
echo "  Verifying Installation"
echo "========================================="
echo "Node.js version: $(node -v)"
echo "npm version:     $(npm -v)"
echo "nodemon version: $(nodemon -v)"

echo ""
echo "========================================="
echo "  Installation complete!"
echo "  NOTE: Run the following command or"
echo "  restart your terminal to use node:"
echo "  source ~/.bashrc"
echo "========================================="
