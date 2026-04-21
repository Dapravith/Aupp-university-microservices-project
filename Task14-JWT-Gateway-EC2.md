# Task 14 — JWT Auth, Role-Based Authorization & API Gateway on 4 EC2 instances

Implements login + JWT, protected Student / Teacher CRUD, and an API Gateway that routes `/auth/*`, `/students/*`, `/teachers/*` to three independent microservices, each with its own MongoDB. Dockerized for EC2 deployment.

---

## 1. Final Architecture

```
┌──────────┐       ┌────────────────────┐       ┌──────────────────────┐       ┌──────────┐
│          │       │                    │       │  Auth Service (EC2#2)│◄─────►│ MongoDB  │
│ Postman  │──────►│  API Gateway       │──────►│  /auth/register      │       │ auth_db  │
│ (local)  │       │  (EC2 #1)          │       │  /auth/login  (JWT)  │       └──────────┘
│          │       │  Port 4000         │       │  Port 5001           │
│          │       │                    │       └──────────────────────┘
│          │       │  /auth   → auth    │       ┌──────────────────────┐       ┌──────────┐
│          │       │  /students → stu.. │──────►│  Student Svc (EC2#3) │◄─────►│ MongoDB  │
│          │       │  /teachers → tea.. │       │  Port 5002  JWT req. │       │student_db│
│          │       │                    │       └──────────────────────┘       └──────────┘
│          │       │ http-proxy-middle  │       ┌──────────────────────┐       ┌──────────┐
│          │       │ forwards Authoriz. │──────►│  Teacher Svc (EC2#4) │◄─────►│ MongoDB  │
│          │       │                    │       │  Port 5003  JWT req. │       │teacher_db│
└──────────┘       └────────────────────┘       └──────────────────────┘       └──────────┘
```

- **Node.js 20 + Express** on every service
- **Mongoose** for MongoDB
- **bcryptjs** to hash passwords
- **jsonwebtoken** Bearer tokens, payload = `{ userId, email, role }`
- **http-proxy-middleware** inside the gateway (forwards the `Authorization` header)
- **cors**, **morgan** everywhere; no over-engineering

Roles: `admin`, `student`, `teacher`.

| Route | Method | Allowed Roles |
|---|---|---|
| `/auth/register` | POST | public |
| `/auth/login` | POST | public |
| `/auth/seed` | POST | public (dev helper, idempotent) |
| `/auth/me` | GET | any logged-in |
| `/auth/users` | GET | admin |
| `/students` | GET | admin, student, teacher |
| `/students/:id` | GET | admin, student, teacher |
| `/students` | POST | admin, student |
| `/students/:id` | PUT | admin, student |
| `/students/:id` | DELETE | admin |
| `/teachers` | GET | admin, student, teacher |
| `/teachers/:id` | GET | admin, student, teacher |
| `/teachers` | POST | admin, teacher |
| `/teachers/:id` | PUT | admin, teacher |
| `/teachers/:id` | DELETE | admin |

---

## 2. Folder Tree

```
Aupp-university-microservices-project/
├── APIGateway_Microservice/
│   ├── .dockerignore
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── server.js
│       └── config/env.js
│
├── auth-service/
│   ├── .dockerignore
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/{db.js, env.js}
│       ├── controllers/authController.js
│       ├── middleware/{auth.js, role.js}
│       ├── models/User.js
│       ├── routes/authRoutes.js
│       └── utils/seed.js
│
├── Student_Microservice/
│   ├── .dockerignore
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/{db.js, env.js}
│       ├── controllers/studentController.js
│       ├── middleware/{auth.js, role.js}
│       ├── models/Student.js
│       └── routes/studentRoutes.js
│
├── Teacher_Microservice/
│   ├── .dockerignore
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/{db.js, env.js}
│       ├── controllers/teacherController.js
│       ├── middleware/{auth.js, role.js}
│       ├── models/Teacher.js
│       └── routes/teacherRoutes.js
│
├── docker-compose.task14.yml
├── postman/Task14_JWT_Gateway.postman_collection.json
└── Task14-JWT-Gateway-EC2.md   ← this file
```

---

## 3. Environment Variables

### auth-service (`auth-service/.env`)
```
PORT=5001
MONGO_URI=mongodb://<host>:27017/auth_db
JWT_SECRET=use_a_long_random_value
JWT_EXPIRES_IN=1d
SEED_ON_START=true
```

### student-service (`Student_Microservice/.env`)
```
PORT=5002
MONGO_URI=mongodb://<host>:27017/student_db
JWT_SECRET=use_a_long_random_value   # must match auth-service
```

### teacher-service (`Teacher_Microservice/.env`)
```
PORT=5003
MONGO_URI=mongodb://<host>:27017/teacher_db
JWT_SECRET=use_a_long_random_value   # must match auth-service
```

### api-gateway (`APIGateway_Microservice/.env`)
```
PORT=4000
AUTH_SERVICE_URL=http://<EC2-2-private-or-public-IP>:5001
STUDENT_SERVICE_URL=http://<EC2-3-private-or-public-IP>:5002
TEACHER_SERVICE_URL=http://<EC2-4-private-or-public-IP>:5003
```

> `JWT_SECRET` **must be identical** in auth, student, and teacher services — they sign and verify with it. No MongoDB URL, no EC2 IP is hard-coded in JS; everything is `.env` driven.

---

## 4. Local Run (no Docker)

Requires Node 20+ and a reachable MongoDB (Atlas or local).

```bash
# Terminal 1
cd auth-service && npm install && npm start

# Terminal 2
cd Student_Microservice && npm install && npm start

# Terminal 3
cd Teacher_Microservice && npm install && npm start

# Terminal 4
cd APIGateway_Microservice && npm install && npm start
```

Check everything is up:
```bash
curl http://localhost:5001/health
curl http://localhost:5002/health
curl http://localhost:5003/health
curl http://localhost:4000/health
```

Seed users (auth service also seeds on boot when `SEED_ON_START=true`):
```bash
curl -X POST http://localhost:4000/auth/seed
```

---

## 5. Docker — Build & Run

### 5.1 One-command local stack (`docker-compose.task14.yml`)

```bash
docker compose -f docker-compose.task14.yml up --build -d
docker compose -f docker-compose.task14.yml ps
docker compose -f docker-compose.task14.yml logs -f api-gateway
```

This spins up three MongoDB containers + 4 service containers on a private Docker network, mirrors the EC2 layout locally, and seeds 3 users.

### 5.2 Build images individually (for pushing to Docker Hub or scp to EC2)

```bash
# from repo root
docker build -t <dockerhub-user>/task14-auth-service:1.0.0      ./auth-service
docker build -t <dockerhub-user>/task14-student-service:1.0.0   ./Student_Microservice
docker build -t <dockerhub-user>/task14-teacher-service:1.0.0   ./Teacher_Microservice
docker build -t <dockerhub-user>/task14-api-gateway:1.0.0       ./APIGateway_Microservice

docker push <dockerhub-user>/task14-auth-service:1.0.0
docker push <dockerhub-user>/task14-student-service:1.0.0
docker push <dockerhub-user>/task14-teacher-service:1.0.0
docker push <dockerhub-user>/task14-api-gateway:1.0.0
```

### 5.3 Exact `docker run` commands (for each EC2 instance)

On EC2 #2 (Auth + MongoDB):
```bash
docker network create task14 || true
docker run -d --name mongo-auth --network task14 -v mongo-auth-data:/data/db mongo:7

docker run -d --name auth-service --network task14 \
  -p 5001:5001 \
  -e PORT=5001 \
  -e MONGO_URI="mongodb://mongo-auth:27017/auth_db" \
  -e JWT_SECRET="REPLACE_WITH_STRONG_SECRET" \
  -e JWT_EXPIRES_IN=1d \
  -e SEED_ON_START=true \
  <dockerhub-user>/task14-auth-service:1.0.0
```

On EC2 #3 (Student + MongoDB):
```bash
docker network create task14 || true
docker run -d --name mongo-student --network task14 -v mongo-student-data:/data/db mongo:7

docker run -d --name student-service --network task14 \
  -p 5002:5002 \
  -e PORT=5002 \
  -e MONGO_URI="mongodb://mongo-student:27017/student_db" \
  -e JWT_SECRET="REPLACE_WITH_STRONG_SECRET" \
  <dockerhub-user>/task14-student-service:1.0.0
```

On EC2 #4 (Teacher + MongoDB):
```bash
docker network create task14 || true
docker run -d --name mongo-teacher --network task14 -v mongo-teacher-data:/data/db mongo:7

docker run -d --name teacher-service --network task14 \
  -p 5003:5003 \
  -e PORT=5003 \
  -e MONGO_URI="mongodb://mongo-teacher:27017/teacher_db" \
  -e JWT_SECRET="REPLACE_WITH_STRONG_SECRET" \
  <dockerhub-user>/task14-teacher-service:1.0.0
```

On EC2 #1 (API Gateway — note the public DNS of the other instances):
```bash
docker run -d --name api-gateway \
  -p 4000:4000 \
  -e PORT=4000 \
  -e AUTH_SERVICE_URL="http://<EC2-2-public-dns>:5001" \
  -e STUDENT_SERVICE_URL="http://<EC2-3-public-dns>:5002" \
  -e TEACHER_SERVICE_URL="http://<EC2-4-public-dns>:5003" \
  <dockerhub-user>/task14-api-gateway:1.0.0
```

---

## 6. EC2 Deployment (Ubuntu 22.04)

Run on each of the 4 instances:

```bash
# One-time Docker install
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
newgrp docker
```

Then `docker pull <image>` and run the corresponding `docker run …` from §5.3.

### Security-group inbound rules

| EC2 | Role | Inbound ports |
|---|---|---|
| #1 | API Gateway | 22 (SSH), 4000 (HTTP) — from `0.0.0.0/0` or your IP |
| #2 | Auth | 22, 5001 — open **only to EC2 #1's security group** |
| #3 | Student | 22, 5002 — open **only to EC2 #1's security group** |
| #4 | Teacher | 22, 5003 — open **only to EC2 #1's security group** |

Only the gateway is publicly reachable. Postman talks to the gateway.

---

## 7. Postman Test Flow

Import `postman/Task14_JWT_Gateway.postman_collection.json`. Set the collection variable `gateway` to `http://<EC2-1-public-dns>:4000` (or `http://localhost:4000`).

Run requests in this order. The login requests auto-save `admin_token`, `student_token`, `teacher_token` to collection variables (see the *Tests* tab on each login).

| # | Name | Method | URL | Body | Expected |
|---|---|---|---|---|---|
| 1 | Seed users | POST | `{{gateway}}/auth/seed` | — | `200` |
| 2 | Login admin | POST | `{{gateway}}/auth/login` | `{"email":"admin@university.edu","password":"Admin@123"}` | `200` + token |
| 3 | Login student | POST | `{{gateway}}/auth/login` | `{"email":"student@university.edu","password":"Student@123"}` | `200` + token |
| 4 | Login teacher | POST | `{{gateway}}/auth/login` | `{"email":"teacher@university.edu","password":"Teacher@123"}` | `200` + token |
| 5 | Admin creates student | POST | `{{gateway}}/students` | `{"name":"Alice","studentId":"S-001","department":"CS","email":"alice@uni.edu"}` + `Bearer {{admin_token}}` | `201` |
| 6 | Student creates student | POST | `{{gateway}}/students` | `{"name":"Bob","studentId":"S-002","department":"Math","email":"bob@uni.edu"}` + `Bearer {{student_token}}` | `201` |
| 7 | Teacher POSTs /students — should fail | POST | `{{gateway}}/students` | body + `Bearer {{teacher_token}}` | `403 Forbidden` |
| 8 | Admin lists students | GET | `{{gateway}}/students` | `Bearer {{admin_token}}` | `200` |
| 9 | Student lists students | GET | `{{gateway}}/students` | `Bearer {{student_token}}` | `200` |
| 10 | Teacher lists students | GET | `{{gateway}}/students` | `Bearer {{teacher_token}}` | `200` |
| 11 | Admin creates teacher | POST | `{{gateway}}/teachers` | `{"name":"Dr. Smith","teacherId":"T-001","subject":"Math","email":"smith@uni.edu"}` + `Bearer {{admin_token}}` | `201` |
| 12 | Teacher creates teacher | POST | `{{gateway}}/teachers` | `{"name":"Dr. Jones","teacherId":"T-002","subject":"Phys","email":"jones@uni.edu"}` + `Bearer {{teacher_token}}` | `201` |
| 13 | Student POSTs /teachers — should fail | POST | `{{gateway}}/teachers` | body + `Bearer {{student_token}}` | `403 Forbidden` |
| 14 | Admin DELETE teacher | DELETE | `{{gateway}}/teachers/{{teacher_record_id}}` | `Bearer {{admin_token}}` | `200` |
| 15 | Student DELETE teacher — should fail | DELETE | `{{gateway}}/teachers/{{any_id}}` | `Bearer {{student_token}}` | `403 Forbidden` |
| 16 | No token | GET | `{{gateway}}/students` | — | `401 No token provided` |
| 17 | Invalid token | GET | `{{gateway}}/students` | `Bearer bogus` | `401 Invalid token` |

### Expected auth pass/fail matrix

|  | `/students` POST | `/students` DELETE | `/teachers` POST | `/teachers` DELETE |
|---|---|---|---|---|
| admin | ✅ | ✅ | ✅ | ✅ |
| student | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |
| teacher | ❌ 403 | ❌ 403 | ✅ | ❌ 403 |
| no/invalid token | ❌ 401 | ❌ 401 | ❌ 401 | ❌ 401 |

---

## 8. Seed Credentials

| Role | Email | Password |
|---|---|---|
| admin | `admin@university.edu` | `Admin@123` |
| student | `student@university.edu` | `Student@123` |
| teacher | `teacher@university.edu` | `Teacher@123` |

Change them for any non-assignment use.
