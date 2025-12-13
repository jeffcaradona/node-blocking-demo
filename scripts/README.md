# Profiling Scripts

This directory contains automated scripts for profiling and comparing the blocking vs. non-blocking demo applications.

## Available Scripts

### 1. compare-blocking-vs-nonblocking.ps1 (Windows/PowerShell)

**Purpose**: Automatically start both apps and run load tests sequentially for comparison.

**Usage**:
```powershell
# Windows PowerShell
.\scripts\compare-blocking-vs-nonblocking.ps1

# With custom parameters
.\scripts\compare-blocking-vs-nonblocking.ps1 -Concurrency 20 -Duration 60
```

**Parameters**:
- `-Concurrency`: Number of concurrent connections (default: 10)
- `-Duration`: Test duration in seconds (default: 30)
- `-WarmupDuration`: Warmup test duration (default: 10)
- `-WarmupConnections`: Warmup connections (default: 5)

**Output**:
- Automated startup and cleanup
- Warmup tests for each app
- Load test results for both apps
- Summary comparison

**Requirements**:
- PowerShell 5.1+
- npm
- autocannon (global or npx)
- Node.js 25.0.0+

### 2. compare-blocking-vs-nonblocking.sh (Linux/macOS/Bash)

**Purpose**: Automated comparison script for Unix-like systems.

**Usage**:
```bash
# Make executable
chmod +x scripts/compare-blocking-vs-nonblocking.sh

# Run
./scripts/compare-blocking-vs-nonblocking.sh

# With custom parameters
./scripts/compare-blocking-vs-nonblocking.sh --concurrency 20 --duration 60
```

**Parameters**:
- `--concurrency`: Number of concurrent connections (default: 10)
- `--duration`: Test duration in seconds (default: 30)
- `--warmup-duration`: Warmup test duration (default: 10)
- `--warmup-connections`: Warmup connections (default: 5)

**Output**:
- Automated startup and cleanup
- Warmup tests for each app
- Load test results for both apps
- Summary comparison

**Requirements**:
- Bash 4.0+
- npm
- autocannon (global or npx)
- Node.js 25.0.0+

## Quick Start

### Windows (PowerShell)

```powershell
# Navigate to project root
cd e:\Users\<username>\Source\Repos\GitHub\node-blocking-demo

# Run comparison
.\scripts\compare-blocking-vs-nonblocking.ps1
```

### macOS/Linux (Bash)

```bash
# Navigate to project root
cd ~/Source/Repos/GitHub/node-blocking-demo

# Make script executable (first time only)
chmod +x scripts/compare-blocking-vs-nonblocking.sh

# Run comparison
./scripts/compare-blocking-vs-nonblocking.sh
```

## What the Scripts Do

### Step-by-Step Execution

1. **Validation**
   - Check that `blocking/` and `non-blocking/` directories exist
   - Verify npm is available

2. **Start Blocking App**
   - Runs `npm start` in `blocking/` directory
   - Waits for app to start on port 3000
   - Verifies startup with HTTP health check

3. **Start Non-Blocking App**
   - Runs `npm start` in `non-blocking/` directory
   - Waits for app to start on port 3001
   - Verifies startup with HTTP health check

4. **Test Blocking App**
   - Warmup: 5 connections, 10 seconds
   - Main test: 10 connections (configurable), 30 seconds (configurable)
   - Full autocannon output displayed

5. **Wait and Reset**
   - 5-second pause between tests
   - Allows event loops to stabilize

6. **Test Non-Blocking App**
   - Warmup: 5 connections, 10 seconds
   - Main test: 10 connections (configurable), 30 seconds (configurable)
   - Full autocannon output displayed

7. **Cleanup**
   - Gracefully stop both Node.js processes
   - Kill background processes
   - Display summary results

### Expected Output Example

```
╔════════════════════════════════════════════════════════════════╗
║     Blocking vs. Non-Blocking Performance Comparison            ║
╚════════════════════════════════════════════════════════════════╝

⚠ Starting applications...
✓ Blocking app started (PID: 12345)
✓ Non-blocking app started (PID: 12346)

Both apps running. Ready to test.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Testing Blocking App
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠ Running warmup (5c/10s)...
✓ Warmup complete

⚠ Running main test (10c/30s)...

Running 30s test @ http://localhost:3000
10 connections

┌─────────────────┬──────────┬─────────┬──────────┐
│ Stat            │ 2.5%     │ 50%     │ 97.5%    │
├─────────────────┼──────────┼─────────┼──────────┤
│ Latency (ms)    │ 20       │ 45      │ 120      │
└─────────────────┴──────────┴─────────┴──────────┘

Requests/sec: 220
Throughput (MB/sec): 0.18
Errors: 0
Timeouts: 0

[Similar output for Non-Blocking App follows...]

╔════════════════════════════════════════════════════════════════╗
║                    Comparison Complete!                        ║
╚════════════════════════════════════════════════════════════════╝

✓ Check the results above
⚠ Non-blocking app should show:
  • ~2-3x higher throughput
  • ~40-50% lower p99 latency
  • Stable performance across concurrency levels
```

## Reading the Results

### Key Metrics to Compare

| Metric | Blocking App | Non-Blocking App | Typical Gap |
|--------|--------------|------------------|-------------|
| **Requests/sec** | ~220 | ~530 | **2.4x better** |
| **p50 Latency** | ~45ms | ~26ms | **42% lower** |
| **p99 Latency** | ~120ms | ~60ms | **50% lower** |
| **Throughput** | ~0.18 MB/s | ~0.43 MB/s | **2.4x better** |
| **Errors** | 0 | 0 | Same |

### Interpreting Results

**Good Run Indicators** ✓:
- Non-blocking shows 2-3x higher requests/sec
- Non-blocking shows 40-50% lower latency (especially p99)
- Blocking shows increasing latency under concurrency
- Non-blocking latency stays stable

**Poor Run Indicators** ✗:
- Results inconsistent between runs
- Errors appear in either app
- Apps don't start properly
- Timeouts occur

## Customization Examples

### Run Stress Test (High Concurrency)

**PowerShell**:
```powershell
.\scripts\compare-blocking-vs-nonblocking.ps1 -Concurrency 50 -Duration 60
```

**Bash**:
```bash
./scripts/compare-blocking-vs-nonblocking.sh --concurrency 50 --duration 60
```

Expected: Blocking app shows much worse performance at higher concurrency.

### Quick Light Test

**PowerShell**:
```powershell
.\scripts\compare-blocking-vs-nonblocking.ps1 -Concurrency 5 -Duration 10
```

**Bash**:
```bash
./scripts/compare-blocking-vs-nonblocking.sh --concurrency 5 --duration 10
```

Expected: Both apps perform well, difference less pronounced.

### Extended Benchmark

**PowerShell**:
```powershell
.\scripts\compare-blocking-vs-nonblocking.ps1 -Concurrency 10 -Duration 120 -WarmupDuration 30
```

**Bash**:
```bash
./scripts/compare-blocking-vs-nonblocking.sh --concurrency 10 --duration 120 --warmup-duration 30
```

Expected: More data points, more stable averages.

## Troubleshooting

### "Command not found: autocannon"

**Solution**: Install globally or use npx
```bash
npm install -g autocannon
# or script uses npx automatically
```

### Apps don't start

**Check npm is installed**:
```bash
npm --version
```

**Check dependencies installed**:
```bash
cd blocking && npm install
cd ../non-blocking && npm install
```

### Port already in use

**Check what's using the port**:
```bash
# PowerShell
netstat -ano | findstr :3000

# Bash
lsof -i :3000
```

**Kill the process**:
```bash
# PowerShell
taskkill /PID <PID> /F

# Bash
kill -9 <PID>
```

### Results seem wrong (too close, blocking not slower)

**Check**:
1. Apps actually started? Look for "started" messages
2. Server output shows EventLoopMonitor blocking warnings for blocking app
3. Both apps receiving requests
4. System has no other heavy load

**Try**:
- Increase concurrency: `--concurrency 20`
- Increase duration: `--duration 60`
- Run warmup separately first

## Advanced Usage

### Save Results to File

**PowerShell**:
```powershell
.\scripts\compare-blocking-vs-nonblocking.ps1 | Tee-Object -FilePath results.txt
```

**Bash**:
```bash
./scripts/compare-blocking-vs-nonblocking.sh | tee results.txt
```

### Run Comparison with Timestamps

**PowerShell**:
```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
.\scripts\compare-blocking-vs-nonblocking.ps1 | Tee-Object -FilePath "results_$timestamp.txt"
```

**Bash**:
```bash
timestamp=$(date +%Y%m%d_%H%M%S)
./scripts/compare-blocking-vs-nonblocking.sh | tee "results_$timestamp.txt"
```

### Schedule Regular Benchmarks

**PowerShell (Task Scheduler)**:
```powershell
# Run nightly benchmark
Register-ScheduledJob -Name "NightlyBenchmark" `
  -ScriptBlock { 
    Set-Location "C:\path\to\node-blocking-demo"
    .\scripts\compare-blocking-vs-nonblocking.ps1 | Out-File "benchmark_$(Get-Date -Format yyyyMMdd).log"
  } `
  -Trigger (New-JobTrigger -Daily -At 2:00AM) `
  -ScheduledJobOption (New-ScheduledJobOption -RunElevated)
```

**Bash (crontab)**:
```bash
# Run nightly benchmark
0 2 * * * cd /path/to/node-blocking-demo && ./scripts/compare-blocking-vs-nonblocking.sh >> benchmark_$(date +\%Y\%m\%d).log
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Performance Benchmark

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '25.0.0'
      
      - run: npm install -g autocannon
      
      - run: |
          chmod +x scripts/compare-blocking-vs-nonblocking.sh
          ./scripts/compare-blocking-vs-nonblocking.sh | tee benchmark.txt
      
      - uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: benchmark.txt
```

### Jenkins Example

```groovy
pipeline {
  triggers {
    cron('H 2 * * *')  // Daily at 2 AM
  }
  
  stages {
    stage('Benchmark') {
      steps {
        sh '''
          chmod +x scripts/compare-blocking-vs-nonblocking.sh
          ./scripts/compare-blocking-vs-nonblocking.sh | tee benchmark.log
        '''
      }
    }
    
    stage('Archive Results') {
      steps {
        archiveArtifacts artifacts: 'benchmark.log'
      }
    }
  }
}
```

## See Also

- [PROFILING_AUTOCANNON.md](../PROFILING_AUTOCANNON.md) - Detailed autocannon guide
- [PROFILING_DEVTOOLS.md](../PROFILING_DEVTOOLS.md) - Chrome DevTools guide
- [PROFILING_TOOLS.md](../PROFILING_TOOLS.md) - All tools guide
- [PROFILING_TROUBLESHOOTING.md](../PROFILING_TROUBLESHOOTING.md) - Troubleshooting guide
