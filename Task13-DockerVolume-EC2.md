# Task 13 - Web Container + Database Container + Docker Volume + EC2

## Architecture Diagram

```
                                    EC2 Instance
    ┌─────────────────────────────────────────────────────────────────────┐
    │                                                                     │
    │   ┌─────────────┐        docker-compose-task13.yml                  │
    │   │   POSTMAN    │                                                  │
    │   │   (Step 5)   │        ┌────────────────────────────────────┐    │
    │   │              │        │       Docker Engine                 │    │
    │   │  Insert &    │        │                                    │    │
    │   │  View Records│        │  ┌──────────────────────┐          │    │
    │   │              ├───────►│  │  auth-api (3.1)       │          │    │
    │   └─────────────┘  :5004 │  │  Auth Service API     │          │    │
    │                          │  │  (Node.js + Express)   │          │    │
    │                          │  │  Port: 5004            │          │    │
    │                          │  │                        │          │    │
    │                          │  │  Image: dapravith99/   │          │    │
    │                          │  │  auth-service-task13   │          │    │
    │                          │  └──────┬───────┬─────────┘          │    │
    │                          │         │       │                    │    │
    │                          │         │       │  /app/logs/        │    │
    │                          │         │       │  access.log        │    │
    │                          │         │       ▼                    │    │
    │                          │         │  ┌──────────┐              │    │
    │                          │         │  │ Volume    │              │    │
    │                          │         │  │ (3.2)     │              │    │
    │                          │         │  │ auth-logs │              │    │
    │                          │         │  │ Server    │              │    │
    │                          │         │  │ Log Files │              │    │
    │                          │         │  └──────────┘              │    │
    │                          │         │                            │    │
    │                          │         │ mongodb://mongodb:27017    │    │
    │                          │         ▼                            │    │
    │                          │  ┌──────────────────────┐            │    │
    │                          │  │  mongodb (4.1)        │            │    │
    │                          │  │  MongoDB Database     │            │    │
    │                          │  │  Port: 27017          │            │    │
    │                          │  │                        │            │    │
    │                          │  │  Image: mongo:7        │            │    │
    │                          │  └──────────┬─────────────┘            │    │
    │                          │             │                          │    │
    │                          │             │  /data/db                │    │
    │                          │             ▼                          │    │
    │                          │  ┌──────────────────┐                  │    │
    │                          │  │  Volume (4.2)     │                  │    │
    │                          │  │  mongo-data       │                  │    │
    │                          │  │  Database Backup  │                  │    │
    │                          │  └──────────────────┘                  │    │
    │                          │                                        │    │
    │                          └────────────────────────────────────────┘    │
    │                                                                       │
    └───────────────────────────────────────────────────────────────────────┘
```

## Volume Persistence Flow

```
    ┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────────┐
    │ Step 5:  │     │ Step 6:  │     │ Step 7:      │     │ Step 8:      │
    │ Insert   │────►│ DESTROY  │────►│ Try Access   │────►│ RECREATE     │
    │ Data via │     │ MongoDB  │     │ Data         │     │ MongoDB      │
    │ Postman  │     │ Container│     │ (FAILS!)     │     │ Container    │
    └──────────┘     └──────────┘     └──────────────┘     └──────┬───────┘
                                                                   │
                                                                   ▼
                     ┌──────────────────────────────────────────────────────┐
                     │  Step 9: Access OLD data via Postman                 │
                     │                                                      │
                     │  YES! Old data is accessible because Docker Volume   │
                     │  (mongo-data) preserved the database files on disk   │
                     │  even after the MongoDB container was destroyed.     │
                     └──────────────────────────────────────────────────────┘
```

## Key Concept: Docker Volumes

```
  WITHOUT Volume:                      WITH Volume (Task 13):
  ┌─────────────┐                      ┌─────────────┐
  │  Container   │                      │  Container   │
  │  MongoDB     │                      │  MongoDB     │
  │  /data/db    │                      │  /data/db ───┼──► ┌────────────┐
  └──────┬───────┘                      └──────┬───────┘    │   Docker   │
         │ destroy                             │ destroy    │   Volume   │
         ▼                                     ▼            │ mongo-data │
  ┌─────────────┐                      ┌─────────────┐     │            │
  │  DATA LOST! │                      │  Container   │     │  DATA IS   │
  │             │                      │  Removed     │     │  SAFE!     │
  └─────────────┘                      └──────────────┘     └────────────┘
                                                                  │
                                       ┌─────────────┐           │
                                       │  NEW MongoDB │           │
                                       │  Container   │           │
                                       │  /data/db ───┼───────────┘
                                       └─────────────┘
                                       Data restored automatically!
```

---

## Prerequisites

- AWS Account with EC2 access
- Docker Hub account (username: `dapravith99`)
- Postman installed locally

---

## Step-by-Step Implementation

### Step 1: Create EC2 Instance

1. **Login to AWS Console** -> EC2 -> Launch Instance
2. **Configuration:**
   - **Name:** `task13-docker-volume`
   - **AMI:** Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance type:** t2.micro (Free tier)
   - **Key pair:** Create or select existing key pair
   - **Security Group:** Allow inbound rules:
     - SSH (port 22) from your IP
     - Custom TCP (port 5004) from Anywhere (0.0.0.0/0) - Auth API
     - Custom TCP (port 27017) from Anywhere (0.0.0.0/0) - MongoDB
3. **Launch** the instance and note the **Public IP address**

### Step 2: Install Docker on EC2

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

# Install Docker
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### Step 3: Build and Push Docker Image (Local Machine)

```bash
# On your local machine
cd Aupp-university-microservices-project

# Login to Docker Hub
docker login

# Build and push the auth-service image
./scripts/build-push-task13.sh
```

### Step 4: Deploy with Docker Compose on EC2

```bash
# On EC2: Create docker-compose file
nano docker-compose-task13.yml
# (paste the contents of docker-compose-task13.yml)

# Or copy from local machine:
scp -i your-key.pem docker-compose-task13.yml ubuntu@<EC2-PUBLIC-IP>:~/

# Deploy
docker compose -f docker-compose-task13.yml pull
docker compose -f docker-compose-task13.yml up -d
```

**Verify containers are running:**

```bash
docker compose -f docker-compose-task13.yml ps
```

Expected output:
```
NAME        IMAGE                                  STATUS          PORTS
auth-api    dapravith99/auth-service-task13:latest  Up 10 seconds   0.0.0.0:5004->5004/tcp
mongodb     mongo:7                                Up 10 seconds   0.0.0.0:27017->27017/tcp
```

**Verify Docker Volumes:**

```bash
docker volume ls | grep task13
```

Expected output:
```
DRIVER    VOLUME NAME
local     task13-auth-logs
local     task13-mongo-data
```

### Step 5: Store and Retrieve Data using Postman

**Import** the Postman collection: `postman/Task13_DockerVolume.postman_collection.json`

Set the `BASE_URL` variable to: `http://<EC2-PUBLIC-IP>:5004`

#### 5.1 Register Users (Store Data)

**POST** `http://<EC2-PUBLIC-IP>:5004/auth/register`

```json
{
    "fullName": "Dapravith Rotha",
    "username": "dapravith",
    "email": "dapravith@aupp.edu.kh",
    "password": "password123",
    "role": "student"
}
```

Response (201 Created):
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "id": "...",
        "fullName": "Dapravith Rotha",
        "username": "dapravith",
        "email": "dapravith@aupp.edu.kh",
        "role": "student"
    }
}
```

#### 5.2 Login (Retrieve Token)

**POST** `http://<EC2-PUBLIC-IP>:5004/auth/login`

```json
{
    "usernameOrEmail": "dapravith",
    "password": "password123"
}
```

Response (200 OK):
```json
{
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "data": { ... }
}
```

#### 5.3 Get Profile (Verify Data in MongoDB)

**GET** `http://<EC2-PUBLIC-IP>:5004/auth/profile`
- Header: `Authorization: Bearer <token>`

Response (200 OK):
```json
{
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
        "fullName": "Dapravith Rotha",
        "username": "dapravith",
        "email": "dapravith@aupp.edu.kh",
        "role": "student"
    }
}
```

### Step 6: DESTROY MongoDB Container

```bash
# Stop and remove ONLY the MongoDB container
docker compose -f docker-compose-task13.yml stop mongodb
docker compose -f docker-compose-task13.yml rm -f mongodb

# Verify MongoDB is gone
docker compose -f docker-compose-task13.yml ps
```

Expected output:
```
NAME        IMAGE                                  STATUS          PORTS
auth-api    dapravith99/auth-service-task13:latest  Up 5 minutes    0.0.0.0:5004->5004/tcp
```

**Verify the Docker Volume still exists:**
```bash
docker volume ls | grep task13
```
```
DRIVER    VOLUME NAME
local     task13-auth-logs
local     task13-mongo-data      <-- Volume still exists!
```

### Step 7: Try to Access Data (FAILS!)

**POST** `http://<EC2-PUBLIC-IP>:5004/auth/login`

```json
{
    "usernameOrEmail": "dapravith",
    "password": "password123"
}
```

Response (500 Error):
```json
{
    "success": false,
    "message": "Failed to login",
    "error": "..."
}
```

**The API cannot access the data because MongoDB is not running!**

### Step 8: Recreate MongoDB Container

```bash
# Recreate MongoDB container (uses the SAME volume)
docker compose -f docker-compose-task13.yml up -d mongodb

# Wait for MongoDB to start
sleep 5

# Verify both containers are running
docker compose -f docker-compose-task13.yml ps
```

Expected output:
```
NAME        IMAGE                                  STATUS          PORTS
auth-api    dapravith99/auth-service-task13:latest  Up 6 minutes    0.0.0.0:5004->5004/tcp
mongodb     mongo:7                                Up 5 seconds    0.0.0.0:27017->27017/tcp
```

### Step 9: Access Old Data (SUCCESS!)

**POST** `http://<EC2-PUBLIC-IP>:5004/auth/login`

```json
{
    "usernameOrEmail": "dapravith",
    "password": "password123"
}
```

Response (200 OK):
```json
{
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "data": {
        "fullName": "Dapravith Rotha",
        "username": "dapravith",
        "email": "dapravith@aupp.edu.kh",
        "role": "student"
    }
}
```

**YES! The old data is accessible!** Docker Volume preserved the MongoDB data even after the container was completely destroyed and recreated.

---

## Checking Docker Volumes

### View Volume Details

```bash
# List all volumes
docker volume ls

# Inspect specific volume
docker volume inspect task13-mongo-data
docker volume inspect task13-auth-logs
```

### View Log Files (auth-logs volume)

```bash
# View logs inside the container
docker exec auth-api ls -la /app/logs/
docker exec auth-api cat /app/logs/access.log
```

### View Volume Data on Host

```bash
# MongoDB data location
sudo ls /var/lib/docker/volumes/task13-mongo-data/_data/

# Auth logs location
sudo ls /var/lib/docker/volumes/task13-auth-logs/_data/
```

---

## Cleanup

```bash
# Stop and remove all containers
docker compose -f docker-compose-task13.yml down

# Remove containers AND volumes (WARNING: deletes all data!)
docker compose -f docker-compose-task13.yml down -v
```

---

## Summary

| Step | Action | Result |
|------|--------|--------|
| 1 | Create EC2 Instance | Ubuntu EC2 with Docker installed |
| 2 | Docker Compose with Volumes | 2 containers + 2 volumes created |
| 3 | Store data via Postman | Users registered in MongoDB |
| 4 | Retrieve data via Postman | Profiles fetched successfully |
| 5 | **DESTROY MongoDB container** | Container removed, **volume persists** |
| 6 | Try to access data | **FAILS** - MongoDB not running |
| 7 | **RECREATE MongoDB container** | New container uses same volume |
| 8 | Access old data | **SUCCESS** - Data preserved by volume! |

## Key Takeaway

**Docker Volumes** provide persistent storage that exists independently of container lifecycle. Even when a container is completely destroyed (`docker rm -f`), the data stored in a named volume remains on the host filesystem. When a new container is created with the same volume mount, it automatically has access to all the previously stored data. This is critical for production databases where data must survive container restarts, updates, and failures.
