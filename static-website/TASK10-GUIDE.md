# Task 10 - Static Website Hosting and Docker Playground

## Complete Step-by-Step Guide

---

## Step 1: Static Website (DONE)

The static website has been created with:
- `index.html` - Main HTML page showcasing the AUPP Microservices Platform
- `styles.css` - Professional responsive styling
- `Dockerfile` - Uses nginx:alpine to serve the static files
- `nginx.conf` - Custom nginx configuration
- `.dockerignore` - Excludes unnecessary files from Docker builds

---

## Step 2: Push to GitHub (DONE)

The code has been pushed to:
```
https://github.com/Dapravith/Aupp-university-microservices-project
```

---

## Step 3.1: Create an EC2 Instance

1. Log in to **AWS Console** -> **EC2** -> **Launch Instance**
2. Configure:
   - **Name**: `aupp-static-website`
   - **AMI**: Amazon Linux 2023 (or Ubuntu 22.04)
   - **Instance Type**: `t2.micro` (free tier)
   - **Key Pair**: Create or select an existing key pair (.pem file)
   - **Security Group**: Create a new one with these **Inbound Rules**:
     | Type  | Port | Source    |
     |-------|------|-----------|
     | SSH   | 22   | My IP     |
     | HTTP  | 80   | 0.0.0.0/0|
     | Custom TCP | 8080 | 0.0.0.0/0 |
3. Click **Launch Instance**
4. Note down the **Public IPv4 address** (e.g., `54.xx.xx.xx`)

---

## Step 3.2: Install Docker and Git on EC2

SSH into your EC2 instance:
```bash
ssh -i "your-key.pem" ec2-user@<EC2-PUBLIC-IP>
```

### For Amazon Linux 2023:
```bash
# Update system
sudo yum update -y

# Install Git
sudo yum install -y git

# Install Docker
sudo yum install -y docker

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add ec2-user to docker group (so you don't need sudo)
sudo usermod -aG docker ec2-user

# Apply group changes (log out and back in, or run):
newgrp docker

# Verify installations
git --version
docker --version
```

### For Ubuntu 22.04:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Git
sudo apt install -y git

# Install Docker
sudo apt install -y docker.io

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Apply group changes
newgrp docker

# Verify installations
git --version
docker --version
```

---

## Step 4: Create Docker Image inside EC2

On the EC2 instance, clone the repo and build the image:

```bash
# Clone the repository
git clone https://github.com/Dapravith/Aupp-university-microservices-project.git

# Navigate to the static website directory
cd Aupp-university-microservices-project/static-website

# Build Docker image
# Format: dockerhub-loginid/image-name:version
docker build -t dapravith/aupp-static-website:v1.0 .
```

> **IMPORTANT**: Replace `dapravith` with your actual Docker Hub username.

Verify the image was created:
```bash
docker images
```

Expected output:
```
REPOSITORY                        TAG       IMAGE ID       CREATED          SIZE
dapravith/aupp-static-website     v1.0      xxxxxxxxxxxx   Few seconds ago  ~40MB
```

---

## Step 5: Run Docker Container

```bash
# Run the container
# -d = detached mode (background)
# -p 80:80 = map host port 80 to container port 80
# --name = give the container a name
docker run -d -p 80:80 --name aupp-website dapravith/aupp-static-website:v1.0
```

Verify the container is running:
```bash
docker ps
```

Expected output:
```
CONTAINER ID   IMAGE                               COMMAND                  STATUS          PORTS
xxxxxxxxxxxx   dapravith/aupp-static-website:v1.0  "nginx -g 'daemon of..." Up X seconds   0.0.0.0:80->80/tcp
```

---

## Step 6: Access via EC2 Public IP

Open your **web browser** and navigate to:
```
http://<EC2-PUBLIC-IP>
```

For example: `http://54.xx.xx.xx`

You should see the AUPP University Microservices Platform website.

> **Troubleshooting**: If you can't access:
> - Check the EC2 **Security Group** allows inbound traffic on port 80
> - Verify the container is running: `docker ps`
> - Check container logs: `docker logs aupp-website`

---

## Step 7: Push to Docker Hub

```bash
# Login to Docker Hub
docker login
# Enter your Docker Hub username and password when prompted

# Push the image
docker push dapravith/aupp-static-website:v1.0
```

> **IMPORTANT**: Replace `dapravith` with your actual Docker Hub username.

Verify on Docker Hub:
- Go to https://hub.docker.com
- Log in and check your repositories
- You should see `aupp-static-website` with tag `v1.0`

---

## Step 8: Pull and Run on Docker Playground

1. Go to **Docker Playground**: https://labs.play-with-docker.com/
2. Click **Login** -> **Docker** (use your Docker Hub credentials)
3. Click **Start**
4. Click **+ ADD NEW INSTANCE** to create a new terminal

In the Docker Playground terminal:
```bash
# Pull the image from Docker Hub
docker pull dapravith/aupp-static-website:v1.0

# Run the container
docker run -d -p 80:80 --name aupp-website dapravith/aupp-static-website:v1.0

# Verify it's running
docker ps
```

> **IMPORTANT**: Replace `dapravith` with your actual Docker Hub username.

---

## Step 9: Access from Docker Playground

After running the container in Docker Playground:
- A **port 80** link should appear at the top of the page
- Click on it to access the website

> **Note**: If you can't access due to permission issues, this step can be ignored as stated in the task requirements.

---

## Quick Command Summary

| Step | Command |
|------|---------|
| Build image | `docker build -t dapravith/aupp-static-website:v1.0 .` |
| Run container | `docker run -d -p 80:80 --name aupp-website dapravith/aupp-static-website:v1.0` |
| Check running | `docker ps` |
| View logs | `docker logs aupp-website` |
| Stop container | `docker stop aupp-website` |
| Remove container | `docker rm aupp-website` |
| Push to Hub | `docker push dapravith/aupp-static-website:v1.0` |
| Pull from Hub | `docker pull dapravith/aupp-static-website:v1.0` |
