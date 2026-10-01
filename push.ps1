
$env:VERSION="v1.0.7"

$env:DOCKERHUB_USER="pcdpbit"

# --- Frontend (mobiledev-frontend) ---
docker build `
  --build-arg VITE_API_BASE="https://pcdp.bitsathy.ac.in/flutter" `
  --build-arg VITE_BASE_PATH="/flutter/" `
  -t mobiledev-frontend:$env:VERSION `
  -f .\frontend\frontend\Dockerfile .\frontend\frontend
docker tag mobiledev-frontend:$env:VERSION $env:DOCKERHUB_USER/mobiledev-frontend:$env:VERSION
docker push $env:DOCKERHUB_USER/mobiledev-frontend:$env:VERSION

# --- Backend (mobiledev-backend) ---
docker build -t mobiledev-backend:$env:VERSION -f .\backend\Dockerfile .\backend
docker tag mobiledev-backend:$env:VERSION $env:DOCKERHUB_USER/mobiledev-backend:$env:VERSION
docker push $env:DOCKERHUB_USER/mobiledev-backend:$env:VERSION

# --- Flutter runner ---
docker build -t flutter-runner:$env:VERSION -f .\backend\flutter_runner\Dockerfile .\backend
docker tag flutter-runner:$env:VERSION $env:DOCKERHUB_USER/flutter-runner:$env:VERSION
docker push $env:DOCKERHUB_USER/flutter-runner:$env:VERSION

Write-Host "All images built, tagged and pushed successfully!" -ForegroundColor Green
