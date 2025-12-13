# Functional Test Runner for Node Blocking Demo
param([string]$App = "both")

$root = "e:\Users\jeffc\Source\Repos\GitHub\node-blocking-demo"
$blockingDir = "$root\blocking"
$nonBlockingDir = "$root\non-blocking"

Write-Host "Phase 4.1 Functional Test Runner" -ForegroundColor Cyan

$processes = @()
$results = @{}

# Start blocking app
if ($App -eq "blocking" -or $App -eq "both") {
    Write-Host "Starting Blocking App..." -ForegroundColor Cyan
    $blockingProc = Start-Process -FilePath "node" -ArgumentList "src/index.js" -WorkingDirectory $blockingDir -WindowStyle Minimized -PassThru
    Start-Sleep -Milliseconds 2000
    Write-Host "Blocking App started (PID: $($blockingProc.Id))" -ForegroundColor Green
    $processes += $blockingProc
}

# Start non-blocking app
if ($App -eq "non-blocking" -or $App -eq "both") {
    Write-Host "Starting Non-Blocking App..." -ForegroundColor Cyan
    $nonBlockingProc = Start-Process -FilePath "node" -ArgumentList "src/index.js" -WorkingDirectory $nonBlockingDir -WindowStyle Minimized -PassThru
    Start-Sleep -Milliseconds 2000
    Write-Host "Non-Blocking App started (PID: $($nonBlockingProc.Id))" -ForegroundColor Green
    $processes += $nonBlockingProc
}

# Run blocking tests
if ($App -eq "blocking" -or $App -eq "both") {
    Write-Host "Running Blocking App Tests..." -ForegroundColor Cyan
    Push-Location $blockingDir
    & node test/functional.test.js
    $blockingPassed = ($LASTEXITCODE -eq 0)
    Pop-Location
    $results["Blocking"] = $blockingPassed
}

# Run non-blocking tests
if ($App -eq "non-blocking" -or $App -eq "both") {
    Write-Host "Running Non-Blocking App Tests..." -ForegroundColor Cyan
    Push-Location $nonBlockingDir
    & node test/functional.test.js
    $nonBlockingPassed = ($LASTEXITCODE -eq 0)
    Pop-Location
    $results["Non-Blocking"] = $nonBlockingPassed
}

# Stop all processes
Write-Host "Cleaning up..." -ForegroundColor Yellow
foreach ($proc in $processes) {
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}

# Summary
Write-Host "Test Summary:" -ForegroundColor Cyan
foreach ($label in $results.Keys) {
    $status = if ($results[$label]) { "PASSED" } else { "FAILED" }
    Write-Host "$label : $status" -ForegroundColor $(if ($results[$label]) { "Green" } else { "Red" })
}
