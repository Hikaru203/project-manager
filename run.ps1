Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "      PROJECTFLOW - UNIFIED RUNNER" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

Write-Host "`nHow would you like to start the system?" -ForegroundColor Yellow
Write-Host "1) Run with Docker Compose (Recommended)" -ForegroundColor White
Write-Host "2) Run Locally (Manual Build & Open Windows)" -ForegroundColor White
Write-Host "3) Exit" -ForegroundColor White

$choice = Read-Host "`nEnter your choice (1-3)"

switch ($choice) {
    "1" { 
        .\start-docker.ps1
    }
    "2" {
        .\start-local.ps1
    }
    "3" {
        exit
    }
    default {
        Write-Host "Invalid choice." -ForegroundColor Red
    }
}
