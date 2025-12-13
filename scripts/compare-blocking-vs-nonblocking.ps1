# Compare Blocking vs. Non-Blocking Performance
# 
# Purpose: Run side-by-side load tests comparing blocking vs. non-blocking apps
# Usage: .\compare-blocking-vs-nonblocking.ps1
# 
# Requirements:
# - Both apps in blocking/ and non-blocking/ directories
# - npm installed
# - autocannon installed globally or npx available
# - Node.js 25.0.0+
# - PowerShell 5.1+

param(
    [int]$Concurrency = 10,
    [int]$Duration = 30,
    [int]$WarmupDuration = 10,
    [int]$WarmupConnections = 5
)

$ErrorActionPreference = "Stop"

# Color functions
function Write-Title {
    param([string]$Message)
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
    Write-Host "║ $($Message.PadRight(61)) ║" -ForegroundColor Blue
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
}

function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# Check directories exist
if (-not (Test-Path "blocking")) {
    Write-Error "blocking/ directory not found"
    exit 1
}

if (-not (Test-Path "non-blocking")) {
    Write-Error "non-blocking/ directory not found"
    exit 1
}

# Function to start app
function Start-App {
    param(
        [string]$AppDir,
        [int]$Port,
        [string]$AppName
    )
    
    Write-Warning "Starting $AppName on port $Port..."
    
    Push-Location $AppDir
    
    # Start npm start in background
    $process = Start-Process -FilePath "npm" -ArgumentList "start" `
                             -WindowStyle Hidden `
                             -PassThru `
                             -ErrorAction Stop
    
    Pop-Location
    
    # Wait for app to start
    Start-Sleep -Seconds 3
    
    # Verify it's running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -ErrorAction Stop
        Write-Success "$AppName started (PID: $($process.Id))"
        return $process.Id
    }
    catch {
        Write-Error "Failed to start $AppName"
        $process | Stop-Process -Force -ErrorAction SilentlyContinue
        exit 1
    }
}

# Function to stop app
function Stop-App {
    param(
        [int]$ProcessId,
        [string]$AppName
    )
    
    try {
        Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
        Write-Success "$AppName stopped"
    }
    catch {
        # Process already stopped
    }
}

# Function to run load test
function Run-LoadTest {
    param(
        [int]$Port,
        [string]$AppName,
        [bool]$Warmup,
        [int]$Concurrency,
        [int]$Duration
    )
    
    Write-Section "Testing $AppName"
    
    if ($Warmup) {
        Write-Warning "Running warmup ($($WarmupConnections)c/$($WarmupDuration)s)..."
        
        try {
            $cmd = if (Get-Command autocannon -ErrorAction SilentlyContinue) {
                "autocannon"
            }
            else {
                "npx autocannon"
            }
            
            Invoke-Expression "$cmd -c $WarmupConnections -d $WarmupDuration http://localhost:$Port" | Out-Null
            Start-Sleep -Seconds 2
            Write-Success "Warmup complete"
        }
        catch {
            Write-Warning "Warmup failed (continuing anyway): $_"
        }
    }
    
    Write-Host ""
    Write-Warning "Running main test ($($Concurrency)c/$($Duration)s)..."
    Write-Host ""
    
    try {
        $cmd = if (Get-Command autocannon -ErrorAction SilentlyContinue) {
            "autocannon"
        }
        else {
            "npx autocannon"
        }
        
        Invoke-Expression "$cmd -c $Concurrency -d $Duration http://localhost:$Port"
    }
    catch {
        Write-Error "Load test failed: $_"
    }
}

# Setup cleanup on exit
$blockingPid = $null
$nonblockingPid = $null

$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Host ""
    Write-Warning "Cleaning up..."
    
    if ($blockingPid) {
        Stop-App $blockingPid "Blocking app"
    }
    
    if ($nonblockingPid) {
        Stop-App $nonblockingPid "Non-blocking app"
    }
    
    Write-Success "Cleanup complete"
}

# Main execution
Clear-Host
Write-Title "Blocking vs. Non-Blocking Performance Comparison"

# Start apps
Write-Host ""
Write-Warning "Starting applications..."
$blockingPid = Start-App "blocking" 3000 "Blocking app"
$nonblockingPid = Start-App "non-blocking" 3001 "Non-blocking app"

Write-Host ""
Write-Success "Both apps running. Ready to test."

# Run tests
Run-LoadTest 3000 "Blocking App" $true $Concurrency $Duration

# Give apps time to settle
Start-Sleep -Seconds 5

Run-LoadTest 3001 "Non-Blocking App" $true $Concurrency $Duration

# Cleanup
Stop-App $blockingPid "Blocking app"
Stop-App $nonblockingPid "Non-blocking app"

Write-Host ""
Write-Title "Comparison Complete!"
Write-Host ""
Write-Success "Check the results above"
Write-Warning "Non-blocking app should show:"
Write-Host "  • ~2-3x higher throughput"
Write-Host "  • ~40-50% lower p99 latency"
Write-Host "  • Stable performance across concurrency levels"
Write-Host ""
