#!/bin/bash
# ============================================
# Zero Downtime Deployment Script for PDF Converter
# ============================================

set -e

# Project name prefix for containers
PROJECT="pdf-converter"

# 1. Determine which container is currently running
# We check if the 'blue' container is running.
IS_BLUE_RUNNING=$(docker ps --format '{{.Names}}' | grep -w "${PROJECT}-blue" || true)

if [ -n "$IS_BLUE_RUNNING" ]; then
  TARGET="green"
  CURRENT="blue"
else
  TARGET="blue"
  CURRENT="green"
fi

echo "🚀 Starting Zero Downtime Deployment..."
echo "📍 Current active instance: ${CURRENT:-None}"
echo "🎯 Deploying to: $TARGET"

# 2. Build and start the target container
# We explicitly build to ensure we have the latest code
echo "📦 Building and starting $TARGET..."
docker compose up -d --build --force-recreate $TARGET

# 3. Wait for the health check to pass
echo "🏥 Waiting for health check to pass..."
ATTEMPTS=0
MAX_ATTEMPTS=60 # 60 * 2s = 2 minutes max wait

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  # Get container health status
  HEALTH=$(docker inspect --format='{{.State.Health.Status}}' ${PROJECT}-$TARGET 2>/dev/null || echo "starting")
  
  if [ "$HEALTH" == "healthy" ]; then
    echo "✅ Success! $TARGET is healthy and receiving traffic."
    break
  fi
  
  if [ "$HEALTH" == "unhealthy" ]; then
    echo "❌ Deployment Failed: $TARGET is unhealthy."
    echo "Logs:"
    docker logs --tail 20 ${PROJECT}-$TARGET
    echo "Stopping unhealthy container..."
    docker compose stop $TARGET
    exit 1
  fi
  
  echo "⏳ Status: $HEALTH... ($((ATTEMPTS+1))/$MAX_ATTEMPTS)"
  sleep 2
  ATTEMPTS=$((ATTEMPTS+1))
done

if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
  echo "❌ Timeout waiting for health check."
  echo "Logs:"
  docker logs --tail 30 ${PROJECT}-$TARGET
  echo "Stopping $TARGET..."
  docker compose stop $TARGET
  exit 1
fi

# 4. Stop the old container
# Only stop if it was actually running
if [ -n "$IS_BLUE_RUNNING" ] || [ "$CURRENT" == "green" ]; then
  # Verify previously running container still exists before stopping
  if [ -n "$(docker ps -q -f name=${PROJECT}-$CURRENT)" ]; then
    echo "🛑 Stopping old instance ($CURRENT)..."
    docker compose stop $CURRENT
  fi
fi

echo "✨ Deployment Complete Successfully!"
echo "🌍 Service is running on $TARGET."
