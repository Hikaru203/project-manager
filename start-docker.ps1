Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  STARTING PROJECT MANAGEMENT SYSTEM (DOCKER)" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Check for Docker
if (-not (Get-Command "docker-compose" -ErrorAction SilentlyContinue) -and -not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "Building and starting Monolith backend..." -ForegroundColor Yellow
if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
    docker-compose up -d --build
} else {
    docker compose up -d --build
}

Write-Host "`nMonolith service is starting in the background." -ForegroundColor Green
Write-Host "You can check logs with: docker-compose logs -f" -ForegroundColor Gray

# Start Frontend
Write-Host "`nStarting Frontend (Next.js)..." -ForegroundColor Yellow
Set-Location -Path ".\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    npm install
}

Write-Host "`n===============================================" -ForegroundColor Green
Write-Host "  System is running via Docker Compose!" -ForegroundColor Green
Write-Host "  Frontend    : http://localhost:3000" -ForegroundColor Green
Write-Host "  Monolith API: http://localhost:8081" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

npm run dev
