#!/usr/bin/env bash
set -e

VERSION="${VERSION:-v1.0.7}"
DOCKERHUB_USER="${DOCKERHUB_USER:-pcdpbit}"

echo "Building and pushing version: $VERSION for user: $DOCKERHUB_USER"

# --- Frontend (mobiledev-frontend) ---
docker build \
  --build-arg VITE_API_BASE="https://pcdp.bitsathy.ac.in/flutter" \
  --build-arg VITE_BASE_PATH="/flutter/" \
  -t mobiledev-frontend:$VERSION \
  -f ./frontend/frontend/Dockerfile ./frontend/frontend
docker tag mobiledev-frontend:$VERSION $DOCKERHUB_USER/mobiledev-frontend:$VERSION
docker push $DOCKERHUB_USER/mobiledev-frontend:$VERSION

# --- Backend (mobiledev-backend) ---
docker build -t mobiledev-backend:$VERSION -f ./backend/Dockerfile ./backend
docker tag mobiledev-backend:$VERSION $DOCKERHUB_USER/mobiledev-backend:$VERSION
docker push $DOCKERHUB_USER/mobiledev-backend:$VERSION

# --- Flutter runner ---
docker build -t flutter-runner:$VERSION -f ./backend/flutter_runner/Dockerfile ./backend
docker tag flutter-runner:$VERSION $DOCKERHUB_USER/flutter-runner:$VERSION
docker push $DOCKERHUB_USER/flutter-runner:$VERSION

echo "All images built, tagged and pushed successfully!"
