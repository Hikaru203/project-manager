# Script to build and run all microservices locally using Maven
# Each service will open in a new PowerShell window so you can easily view its logs

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  STARTING PROJECT MANAGEMENT SYSTEM LOCALLY" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Step 0: Ensure Java 21 is available (Bypass Java 25 Lombok errors)
$jdkDir = "$PWD\.jdk21"
$expectedPath = "$jdkDir\jdk-21*\bin\java.exe"
$currentJava = ""

if (Get-Command "java" -ErrorAction SilentlyContinue) {
    $javaVer = & java -version 2>&1 | Select-String -Pattern '"21\.'
    if ($javaVer) { $currentJava = "21" }
}

$javaHomeEnv = ""
$javaPathEnv = ""

if ($currentJava -ne "21") {
    Write-Host "`n[0/4] Java 21 not detected globally. Setting up Portable JDK 21..." -ForegroundColor Yellow
    $javaExePath = Resolve-Path $expectedPath -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Path
    
    if (-not $javaExePath) {
        Write-Host "Downloading Eclipse Temurin JDK 21 (Portable) to avoid Java 25 Lombok errors..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Force -Path $jdkDir | Out-Null
        $zipPath = "$jdkDir\jdk21.zip"
        $url = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jdk_x64_windows_hotspot_21.0.2_13.zip"
        Invoke-WebRequest -Uri $url -OutFile $zipPath
        Write-Host "Extracting JDK 21. This might take a minute..." -ForegroundColor Cyan
        Expand-Archive -Path $zipPath -DestinationPath $jdkDir -Force
        $javaExePath = Resolve-Path $expectedPath | Select-Object -First 1 -ExpandProperty Path
        Remove-Item $zipPath -Force
    }
    
    $javaHome = (Get-Item $javaExePath).Directory.Parent.FullName
    Write-Host "Using Portable JDK 21 at: $javaHome" -ForegroundColor Green
    
    # Set environment for current script (for common-lib and auth-src compilation)
    $env:JAVA_HOME = $javaHome
    $env:PATH = "$javaHome\bin;" + $env:PATH
    
    # Environment prefixes for the spawned windows
    $javaHomeEnv = "`$env:JAVA_HOME='$javaHome';"
    $javaPathEnv = "`$env:PATH = `$env:JAVA_HOME + '\bin;' + `$env:PATH;"
} else {
    Write-Host "`n[0/4] Global Java 21 detected. Proceeding..." -ForegroundColor Green
}

# Step 1: Start Database
Write-Host "`n[1/4] Starting PostgreSQL Database via Docker..." -ForegroundColor Yellow
if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
    docker-compose up -d postgres
} elseif (Get-Command "docker" -ErrorAction SilentlyContinue) {
    docker compose up -d postgres
} else {
    Write-Host "ERROR: Cannot find Docker. Please install Docker to run the database." -ForegroundColor Red
    exit 1
}

Write-Host "Waiting for database to initialize (10s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 2: Build Shared Libraries
Write-Host "`n[2/4] Building common-lib and auth-src..." -ForegroundColor Yellow

Set-Location -Path ".\common-lib"
Write-Host "Building common-lib..."
mvn clean install -DskipTests
Set-Location -Path ".."

Set-Location -Path "..\auth-src"
Write-Host "Building auth-src..."
mvn clean install -DskipTests
Set-Location -Path "..\project-manager"

# Step 3: Start Microservices
Write-Host "`n[3/4] Starting Microservices in separate windows..." -ForegroundColor Yellow

$services = @(
    "auth-service;..\auth-src;8080",
    "api-gateway;.\api-gateway;8090",
    "project-service;.\project-service;8081",
    "task-service;.\task-service;8082",
    "comment-service;.\comment-service;8083",
    "notification-service;.\notification-service;8084",
    "audit-service;.\audit-service;8085"
)

foreach ($svc in $services) {
    $parts = $svc.Split(";")
    $name = $parts[0]
    $path = $parts[1]
    
    Write-Host "Starting $name..." -ForegroundColor Green
    $cmdToRun = " `$host.ui.RawUI.WindowTitle='$name'; $javaHomeEnv $javaPathEnv cd '$path'; mvn spring-boot:run "
    Start-Process powershell -ArgumentList "-NoExit -Command `"$cmdToRun`""
    Start-Sleep -Seconds 3 # Give it a moment to avoid concurrent build lock issues
}

# Step 4: Start Frontend
Write-Host "`n[4/4] Starting Frontend (Next.js)..." -ForegroundColor Yellow
Set-Location -Path ".\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend libraries..." -ForegroundColor Yellow
    npm install
}

Write-Host "`n===============================================" -ForegroundColor Green
Write-Host "  System is starting up locally!" -ForegroundColor Green
Write-Host "  Please wait for the microservice windows to finish loading." -ForegroundColor Green
Write-Host "  Frontend   : http://localhost:3000" -ForegroundColor Green
Write-Host "  API Gateway: http://localhost:8090" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host "`nPress Ctrl+C in this main window to stop the Frontend Server." -ForegroundColor Gray
Write-Host "To stop the backend services, just close their respective PowerShell windows." -ForegroundColor Gray

# Run Next.js
npm run dev
