#!/bin/bash
###############################################################
# Task 13: Test Docker Volume Persistence
#
# This script demonstrates the full Task 13 workflow:
#   1. Insert data via API
#   2. Verify data exists
#   3. Destroy MongoDB container
#   4. Try to access data (should fail)
#   5. Recreate MongoDB container
#   6. Try to access old data again (should succeed)
###############################################################

set -e

# Configuration
BASE_URL="${1:-http://localhost:5004}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
AUTH_CONTAINER="auth-api"

# Try to find docker-compose file in likely places
if [ -f "${SCRIPT_DIR}/docker-compose-task13.yml" ]; then
    COMPOSE_FILE="${SCRIPT_DIR}/docker-compose-task13.yml"
elif [ -f "${PROJECT_ROOT}/docker-compose-task13.yml" ]; then
    COMPOSE_FILE="${PROJECT_ROOT}/docker-compose-task13.yml"
elif [ -f "${PROJECT_ROOT}/scripts/task13/docker-compose-task13.yml" ]; then
    COMPOSE_FILE="${PROJECT_ROOT}/scripts/task13/docker-compose-task13.yml"
else
    echo "ERROR: docker-compose-task13.yml not found."
    echo ""
    echo "Checked paths:"
    echo "  ${SCRIPT_DIR}/docker-compose-task13.yml"
    echo "  ${PROJECT_ROOT}/docker-compose-task13.yml"
    echo "  ${PROJECT_ROOT}/scripts/task13/docker-compose-task13.yml"
    echo ""
    echo "Please move the file to one of those locations or update COMPOSE_FILE manually."
    exit 1
fi

echo "============================================================"
echo "  Task 13: Docker Volume Persistence Test"
echo "  API URL: ${BASE_URL}"
echo "  Script Dir: ${SCRIPT_DIR}"
echo "  Project Root: ${PROJECT_ROOT}"
echo "  Compose File: ${COMPOSE_FILE}"
echo "============================================================"

# Validate docker exists
if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: docker is not installed."
    exit 1
fi

echo ""
echo "========================================"
echo "  STEP 1: Register a new user"
echo "========================================"
echo "POST ${BASE_URL}/auth/register"

REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Volume Test User",
    "username": "volumetest",
    "email": "volumetest@aupp.edu.kh",
    "password": "test123456",
    "role": "student"
  }')

echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"

echo ""
echo "========================================"
echo "  STEP 2: Login to get token"
echo "========================================"
echo "POST ${BASE_URL}/auth/login"

LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "volumetest",
    "password": "test123456"
  }')

echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
    echo ""
    echo "WARNING: Could not extract token from first login attempt."
    echo "Trying login again..."

    LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "usernameOrEmail": "volumetest",
        "password": "test123456"
      }')

    echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
    TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null || echo "")
fi

if [ -z "$TOKEN" ]; then
    echo "ERROR: Failed to get JWT token. Cannot continue."
    exit 1
fi

echo ""
echo "========================================"
echo "  STEP 3: Retrieve profile (verify data exists)"
echo "========================================"
echo "GET ${BASE_URL}/auth/profile"

PROFILE_RESPONSE=$(curl -s -X GET "${BASE_URL}/auth/profile" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$PROFILE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PROFILE_RESPONSE"

echo ""
echo "========================================"
echo "  STEP 4: Check log volume"
echo "========================================"
echo "Log files in /app/logs inside container ${AUTH_CONTAINER}:"
docker exec "${AUTH_CONTAINER}" ls -la /app/logs/ 2>/dev/null || echo "Container not running or logs folder not found"

echo ""
echo "Last 5 lines of access.log:"
docker exec "${AUTH_CONTAINER}" tail -5 /app/logs/access.log 2>/dev/null || echo "No access.log found yet"

echo ""
echo "============================================================"
echo "  STEP 5: DESTROY MongoDB Container"
echo "============================================================"
echo "Running: docker compose -f \"$COMPOSE_FILE\" stop mongodb"
docker compose -f "$COMPOSE_FILE" stop mongodb

echo "Running: docker compose -f \"$COMPOSE_FILE\" rm -f mongodb"
docker compose -f "$COMPOSE_FILE" rm -f mongodb

echo ""
echo "MongoDB container destroyed."
echo "Current compose status:"
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "============================================================"
echo "  STEP 6: Try to access data (should fail)"
echo "============================================================"
echo "POST ${BASE_URL}/auth/login"
echo "Expected: API should fail or return DB connection related error"

sleep 2

FAIL_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "volumetest",
    "password": "test123456"
  }')

echo "$FAIL_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FAIL_RESPONSE"

echo ""
echo ">>> At this point the API should not be able to access MongoDB. <<<"

echo ""
echo "============================================================"
echo "  STEP 7: Verify Docker Volume still exists"
echo "============================================================"
docker volume ls

echo ""
echo "============================================================"
echo "  STEP 8: RECREATE MongoDB Container"
echo "============================================================"
echo "Running: docker compose -f \"$COMPOSE_FILE\" up -d mongodb"
docker compose -f "$COMPOSE_FILE" up -d mongodb

echo ""
echo "Waiting for MongoDB to be ready..."
sleep 5

echo "Current compose status:"
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "============================================================"
echo "  STEP 9: Access OLD data again (should succeed)"
echo "============================================================"

LOGIN_RESPONSE2=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "volumetest",
    "password": "test123456"
  }')

echo "$LOGIN_RESPONSE2" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE2"

TOKEN2=$(echo "$LOGIN_RESPONSE2" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null || echo "")

if [ -z "$TOKEN2" ]; then
    echo "ERROR: Failed to login after MongoDB recreation."
    exit 1
fi

echo ""
echo "GET ${BASE_URL}/auth/profile"

PROFILE_RESPONSE2=$(curl -s -X GET "${BASE_URL}/auth/profile" \
  -H "Authorization: Bearer ${TOKEN2}")

echo "$PROFILE_RESPONSE2" | python3 -m json.tool 2>/dev/null || echo "$PROFILE_RESPONSE2"

echo ""
echo "============================================================"
echo "  RESULT: OLD DATA IS ACCESSIBLE"
echo "============================================================"