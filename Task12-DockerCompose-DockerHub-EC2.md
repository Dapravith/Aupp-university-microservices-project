# Task 12 - Docker Compose - Docker Hub - EC2

## Overview

Deploy Student and Teacher microservices on an **Ubuntu EC2 instance** using **Docker Compose** with images pulled from **Docker Hub**.

### Architecture Diagram

```
+----------------------------+     +----------------------------+
|        Docker Hub          |     |        Docker Hub          |
|  Student Microservice      |     |  Teacher Microservice      |
|  dapravith99/student-      |     |  dapravith99/teacher-      |
|  microservice:latest       |     |  microservice:latest       |
+-------------+--------------+     +-------------+--------------+
              |                                   |
              +----------------+------------------+
                               |
                               v
                +-----------------------------+
                |   docker-compose.yml        |
                |   (pulls images from        |
                |    Docker Hub)              |
                +-----------------------------+
                       |              |
                       v              v
              +--------------+ +--------------+
              | Container 1  | | Container 2  |
              | student-     | | teacher-     |
              | service      | | service      |
              | Port: 5001   | | Port: 5002   |
              +--------------+ +--------------+
                       |              |
                       v              v
                +-----------------------------+
                |   Ubuntu EC2 Instance       |
                |   (Docker installed)        |
                +-----------------------------+
                               |
                               v
                +-----------------------------+
                |   Test APIs using Postman   |
                +-----------------------------+
```

---

## Step 1: Create EC2 Instance and Install Docker

### 1.1 Create EC2 Instance on AWS

1. Go to **AWS Console** > **EC2** > **Launch Instance**
2. Choose **Ubuntu Server 22.04 LTS** AMI
3. Select instance type: **t2.micro** (Free Tier)
4. Configure Security Group - open the following ports:
   - **SSH (22)** - for remote access
   - **Port 5001** - Student Microservice API
   - **Port 5002** - Teacher Microservice API
5. Create or select a key pair for SSH access
6. Launch the instance

### 1.2 Connect to EC2 via SSH

```bash
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

### 1.3 Clone the Repository on EC2

```bash
git clone https://github.com/Dapravith/Aupp-university-microservices-project.git
cd Aupp-university-microservices-project
```

### 1.4 Install Docker on EC2

Run the install script:

```bash
chmod +x scripts/install-docker.sh
./scripts/install-docker.sh
```

This script performs the following:

```bash
#!/bin/bash
# Script to install Docker and Docker Compose on Ubuntu EC2 instance

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

# Add current user to docker group
sudo usermod -aG docker $USER
```

After installation, apply docker group changes:

```bash
newgrp docker
```

Verify Docker is installed:

```bash
docker --version
docker compose version
```

**Expected output:**

```
Docker version 28.x.x, build xxxxxxx
Docker Compose version v2.x.x
```

---

## Step 2: Build and Push Docker Images to Docker Hub

### 2.1 Build Docker Images (on local machine)

Run the build script:

```bash
chmod +x scripts/build-images.sh
./scripts/build-images.sh
```

This script builds both microservice images:

```bash
DOCKER_USERNAME="dapravith99"

# Build Student Microservice image
docker build -t $DOCKER_USERNAME/student-microservice:latest ./Student_Microservice

# Build Teacher Microservice image
docker build -t $DOCKER_USERNAME/teacher-microservice:latest ./Teacher_Microservice
```

The **Student Microservice Dockerfile** (`Student_Microservice/Dockerfile`):

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5001
CMD ["node", "src/server.js"]
```

The **Teacher Microservice Dockerfile** (`Teacher_Microservice/Dockerfile`):

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5002
CMD ["node", "src/server.js"]
```

Verify images were built:

```bash
docker images | grep dapravith99
```

**Expected output:**

```
dapravith99/student-microservice   latest   xxxxxxxxxxxx   ...   xx MB
dapravith99/teacher-microservice   latest   xxxxxxxxxxxx   ...   xx MB
```

### 2.2 Push Images to Docker Hub

Run the push script:

```bash
chmod +x scripts/push-images.sh
./scripts/push-images.sh
```

This script logs in and pushes both images:

```bash
DOCKER_USERNAME="dapravith99"

# Login to Docker Hub
docker login

# Push Student Microservice image
docker push $DOCKER_USERNAME/student-microservice:latest

# Push Teacher Microservice image
docker push $DOCKER_USERNAME/teacher-microservice:latest
```

**Docker Hub repositories:**

- `dapravith99/student-microservice:latest`
- `dapravith99/teacher-microservice:latest`

Verify on Docker Hub: Go to https://hub.docker.com and check that both images are available under the `dapravith99` account.

---

## Step 3: Docker Compose File

The `docker-compose.yml` pulls images directly from Docker Hub:

```yaml
services:
  student-service:
    image: dapravith99/student-microservice:latest
    container_name: student-service
    ports:
      - "5001:5001"
    environment:
      - PORT=5001
      - JWT_SECRET=task07_super_secret_key
      - TEACHER_SERVICE_URL=http://teacher-service:5002
    networks:
      - microservices-network
    restart: unless-stopped

  teacher-service:
    image: dapravith99/teacher-microservice:latest
    container_name: teacher-service
    ports:
      - "5002:5002"
    environment:
      - PORT=5002
      - JWT_SECRET=task07_super_secret_key
      - STUDENT_SERVICE_URL=http://student-service:5001
    networks:
      - microservices-network
    depends_on:
      - student-service
    restart: unless-stopped

networks:
  microservices-network:
    driver: bridge
```

**Key points:**
- Uses `image:` instead of `build:` to pull from Docker Hub
- Both services are on the same `microservices-network` bridge network
- Services can communicate via container names (`student-service`, `teacher-service`)
- `depends_on` ensures student-service starts before teacher-service
- `restart: unless-stopped` keeps containers running after restarts

---

## Step 4: Run Docker Compose on EC2

SSH into your EC2 instance and run the deploy script:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This script performs the following:

```bash
# Pull latest images from Docker Hub
docker compose pull

# Stop existing containers (if any)
docker compose down

# Start containers in detached mode
docker compose up -d
```

Verify containers are running:

```bash
docker compose ps
```

**Expected output:**

```
NAME              IMAGE                                     STATUS          PORTS
student-service   dapravith99/student-microservice:latest   Up xx seconds   0.0.0.0:5001->5001/tcp
teacher-service   dapravith99/teacher-microservice:latest   Up xx seconds   0.0.0.0:5002->5002/tcp
```

Check container logs:

```bash
docker logs student-service
docker logs teacher-service
```

---

## Step 5: Test APIs using Postman

### 5.1 Health Check Endpoints

| Method | URL                                  | Expected Response                                    |
|--------|--------------------------------------|------------------------------------------------------|
| GET    | `http://<EC2-IP>:5001/health`        | `{"success":true,"message":"Student Microservice is running"}` |
| GET    | `http://<EC2-IP>:5002/health`        | `{"success":true,"message":"Teacher Microservice is running"}` |

### 5.2 Student Microservice API (Port 5001)

| Method | Endpoint                               | Description                    | Auth Required |
|--------|----------------------------------------|--------------------------------|:---:|
| GET    | `/health`                              | Health check                   | No  |
| GET    | `/students/search?q=keyword`           | Search students                | No  |
| POST   | `/students/profile`                    | Create student profile         | Yes |
| GET    | `/students/me`                         | Get current student profile    | Yes |
| PUT    | `/students/me`                         | Update current student profile | Yes |
| GET    | `/students/:id`                        | Get student by ID              | Yes |
| GET    | `/students/assignments`                | Get all assignments            | Yes |
| GET    | `/students/assignments/:assignmentId`  | Get specific assignment        | Yes |
| POST   | `/students/assignments/submit`         | Submit assignment              | Yes |
| GET    | `/students/assignments/my-submissions` | Get my submissions             | Yes |

### 5.3 Teacher Microservice API (Port 5002)

| Method | Endpoint                                    | Description                | Auth Required |
|--------|---------------------------------------------|----------------------------|:---:|
| GET    | `/health`                                   | Health check               | No  |
| POST   | `/teachers/profile`                         | Create teacher profile     | Yes |
| GET    | `/teachers/me`                              | Get current teacher profile| Yes |
| PUT    | `/teachers/me`                              | Update teacher profile     | Yes |
| GET    | `/teachers/students/search?q=keyword`       | Search students            | Yes |
| GET    | `/teachers/students/:id`                    | Get specific student       | Yes |
| POST   | `/teachers/assignments`                     | Create assignment          | Yes |
| GET    | `/teachers/assignments`                     | Get my assignments         | Yes |
| GET    | `/teachers/assignments/public`              | Get all active assignments | No  |
| GET    | `/teachers/assignments/public/:id`          | Get specific assignment    | No  |
| PUT    | `/teachers/assignments/:id`                 | Update assignment          | Yes |
| DELETE | `/teachers/assignments/:id`                 | Delete assignment          | Yes |
| PUT    | `/teachers/submissions/:submissionId/review`| Review submission          | Yes |

### 5.4 Testing with Postman

1. Open Postman
2. Set the base URL to `http://<EC2-PUBLIC-IP>`
3. Test health endpoints first (no authentication needed):
   - `GET http://<EC2-IP>:5001/health`
   - `GET http://<EC2-IP>:5002/health`
4. Test public endpoints:
   - `GET http://<EC2-IP>:5002/teachers/assignments/public`
5. For authenticated endpoints, add `Authorization: Bearer <JWT_TOKEN>` header

---

## Project Structure

```
Aupp-university-microservices-project/
├── Student_Microservice/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── server.js
├── Teacher_Microservice/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── server.js
├── scripts/
│   ├── install-docker.sh    # Step 1: Install Docker on Ubuntu EC2
│   ├── build-images.sh      # Step 2: Build Docker images
│   ├── push-images.sh       # Step 2: Push images to Docker Hub
│   └── deploy.sh            # Step 4: Deploy with Docker Compose on EC2
├── docker-compose.yml        # Step 3: Docker Compose (uses Docker Hub images)
└── postman/                  # Step 5: Postman collection for testing
```

---

## Quick Reference Commands

```bash
# Check running containers
docker compose ps

# View container logs
docker logs student-service
docker logs teacher-service

# Restart services
docker compose restart

# Stop all services
docker compose down

# Pull latest images and redeploy
docker compose pull && docker compose up -d
```
