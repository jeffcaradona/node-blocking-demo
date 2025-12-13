# Phase 2 Complete - Testing Guide

## 🎉 Phase 2: Applications Built

Both blocking and non-blocking applications are now complete and tested!

---

## 🚀 Running the Applications

### Blocking Application (Port 3000 or 3002)
```bash
cd blocking
npm start

# Note: If port 3000 is in use, it will use 3002
# Or specify a different port:
PORT=3002 npm start
```

**What it demonstrates:**
- Synchronous file I/O blocking
- CPU-intensive blocking computations
- Synchronous crypto operations
- Busy loops (worst case)
- Large JSON parsing blocking
- Multiple sequential blocking ops

### Non-Blocking Application (Port 3001 or 3002)
```bash
cd non-blocking
npm start

# Or specify a different port:
PORT=3002 npm start
```

**What it demonstrates:**
- Asynchronous file operations
- Chunked computation with yield points
- Async crypto with thread pool
- Proper async delays (no busy waiting)
- Stream processing with backpressure
- Parallel async operations with Promise.all
- Async JSON processing with yields

---

## 📍 Testing Endpoints

Update endpoint URLs to match actual running ports

```bash
# Health check
curl http://localhost:3001/

# Async file read
curl http://localhost:3001/slow-async?iterations=3

# Async chunked computation
curl http://localhost:3001/compute-async?limit=1000000

# Async crypto
curl http://localhost:3001/crypto-async?iterations=100000

# Async delay (no blocking!)
curl http://localhost:3001/delay?duration=1000

# Stream processing
curl http://localhost:3001/stream-process?chunks=100

# Parallel operations
curl http://localhost:3001/parallel

# Async JSON processing
curl http://localhost:3001/json-async?size=10000
```

---

## 🔬 Load Testing Comparison

### Using PowerShell (Windows)

```powershell
# Test blocking app
$jobs = 1..5 | ForEach-Object {
    Start-Job -ScriptBlock {
        Measure-Command {
            Invoke-WebRequest -Uri "http://localhost:3002/compute?limit=500000" -UseBasicParsing
        }
    }
}
$jobs | Wait-Job | Receive-Job | Select TotalMilliseconds
$jobs | Remove-Job

# Test non-blocking app  
$jobs = 1..5 | ForEach-Object {
    Start-Job -ScriptBlock {
        Measure-Command {
            Invoke-WebRequest -Uri "http://localhost:3001/compute-async?limit=500000" -UseBasicParsing
        }
    }
}
$jobs | Wait-Job | Receive-Job | Select TotalMilliseconds
$jobs | Remove-Job
```

### Using autocannon (Recommended)

```bash
# Install globally (if not already installed)
npm install -g autocannon

# Test blocking app - 5 connections
autocannon http://localhost:3002/compute?limit=500000 -d 10 -c 5

# Test non-blocking app - 5 connections
autocannon http://localhost:3001/compute-async?limit=500000 -d 10 -c 5

# Test with higher concurrency - 10 connections
autocannon http://localhost:3002/compute?limit=500000 -d 10 -c 10
autocannon http://localhost:3001/compute-async?limit=500000 -d 10 -c 10
```

**Actual Test Results (December 13, 2025):**

#### 5 Concurrent Connections:
- **Blocking (3002):**
  - Avg Latency: **59.85ms**
  - Throughput: **83 req/sec**
  - Total: **835 requests** in 10s

- **Non-Blocking (3001):**
  - Avg Latency: **25.61ms** (57% faster ⚡)
  - Throughput: **192 req/sec** (131% more 🚀)
  - Total: **2,000 requests** in 10s

#### 10 Concurrent Connections:
- **Blocking (3002):**
  - Avg Latency: **121.39ms** (DOUBLED! 🔴)
  - Throughput: **82 req/sec** (no improvement)
  - Total: **829 requests** in 10s

- **Non-Blocking (3001):**
  - Avg Latency: **48.38ms** (graceful scaling 🟢)
  - Throughput: **205 req/sec** (scales up!)
  - Total: **2,000 requests** in 10s

**Key Findings:**
- **Non-blocking is 2.4x faster** in throughput
- **Blocking latency DOUBLES** with higher concurrency (60ms → 121ms)
- **Non-blocking latency scales gracefully** (26ms → 48ms)
- **Blocking throughput doesn't scale** - stuck at ~82 req/sec
- **Non-blocking maintains responsiveness** under load

---

## 🔍 Profiling the Applications

### Chrome DevTools Inspector

**Blocking app:**
```bash
cd blocking
node --inspect src/index.js
# Visit chrome://inspect
```

**Non-blocking app:**
```bash
cd non-blocking
node --inspect src/index.js
# Visit chrome://inspect
```

### Clinic.js Doctor

**Blocking app:**
```bash
cd blocking
clinic doctor -- node src/index.js
# Make some requests
# Ctrl+C to stop
# Opens HTML report automatically
```

**Non-blocking app:**
```bash
cd non-blocking
clinic doctor -- node src/index.js
# Make some requests
# Ctrl+C to stop
# Opens HTML report automatically
```

### 0x Flamegraph

**Blocking app:**
```bash
cd blocking
0x -- node src/index.js
# Make some requests
# Ctrl+C to stop
# Opens flamegraph
```

**Non-blocking app:**
```bash
cd non-blocking
0x -- node src/index.js
# Make some requests
# Ctrl+C to stop
# Opens flamegraph
```

---

## ⚠️ Event Loop Monitoring

Both applications include built-in event loop monitoring:

**Features:**
- Monitors every 100ms
- Alerts when event loop is blocked > 50ms
- Shows statistics on shutdown
- Helps visualize blocking in real-time

**What you'll see:**
- **Blocking app:** Many warnings during blocking operations
- **Non-blocking app:** Few or no warnings

---

## 🎯 Key Observations

### Blocking Application
- ✅ Server starts successfully
- ✅ All endpoints respond correctly
- ✅ Event loop monitor detects blocking
- ✅ Concurrent requests show cascading delays
- ✅ Response times increase with concurrency

### Non-Blocking Application
- ✅ Server starts successfully
- ✅ All endpoints respond correctly
- ✅ Event loop monitor shows minimal/no blocking
- ✅ Concurrent requests handled efficiently
- ✅ Response times remain consistent

---

## 📊 Features Implemented

### Modern Node.js Features
- ✅ ES Modules (import/export)
- ✅ Async/await patterns
- ✅ Promise-based APIs
- ✅ Stream processing
- ✅ Performance hooks
- ✅ Proper error handling

### Functional Paradigms
- ✅ Pure functions in operations
- ✅ Immutable data patterns
- ✅ Function composition
- ✅ Higher-order functions
- ✅ Declarative code style

### Error Handling
- ✅ Try-catch in all operations
- ✅ Proper async error handling
- ✅ Graceful shutdown
- ✅ Uncaught exception handlers
- ✅ Unhandled rejection handlers

### Code Quality
- ✅ JSDoc comments
- ✅ Descriptive function names
- ✅ Consistent formatting
- ✅ Clean separation of concerns
- ✅ DRY principles

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Windows - Find and kill process
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Or use different port
PORT=3003 npm start
```

### Module Not Found

```bash
# Make sure you're in the right directory
cd blocking  # or cd non-blocking
npm install  # if needed
node src/index.js
```

### SIGINT Issues with PowerShell

The Windows PowerShell `Invoke-WebRequest` and `Invoke-RestMethod` cmdlets send SIGINT to Node.js processes. Use `curl` or `Start-Job` for testing.

---

## ✨ Next Steps

Phase 2 is complete! You can now:

1. **Compare the applications** side-by-side
2. **Profile with different tools** (Chrome DevTools, Clinic.js, 0x)
3. **Load test** to see blocking impact
4. **Learn from the code** - well-documented examples
5. **Modify and experiment** - understand async patterns

---

## 📁 Files Created

```
blocking/
├── src/
│   ├── index.js         ✅ Server startup with monitoring
│   ├── server.js        ✅ HTTP routes (blocking)
│   └── operations.js    ✅ Blocking operations

non-blocking/
├── src/
│   ├── index.js         ✅ Server startup with monitoring
│   ├── server.js        ✅ HTTP routes (async)
│   └── operations.js    ✅ Non-blocking operations
```

---

## 🧪 Complete autocannon Testing Guide

### Step-by-Step Testing Process

**1. Start Both Servers**

```bash
# Terminal 1: Start blocking server
cd blocking
npm start
# Note the port (likely 3002)

# Terminal 2: Start non-blocking server
cd non-blocking
npm start
# Note the port (likely 3001)
```

**2. Basic Health Check**

```bash
# Quick test to confirm both are running
curl http://localhost:3002/
curl http://localhost:3001/
```

**3. Run autocannon Tests**

```bash
# Low concurrency test (5 connections)
autocannon http://localhost:3002/compute?limit=500000 -d 10 -c 5
autocannon http://localhost:3001/compute-async?limit=500000 -d 10 -c 5

# High concurrency test (10 connections)
autocannon http://localhost:3002/compute?limit=500000 -d 10 -c 10
autocannon http://localhost:3001/compute-async?limit=500000 -d 10 -c 10

# Very high concurrency (20 connections) - really see the difference!
autocannon http://localhost:3002/compute?limit=500000 -d 10 -c 20
autocannon http://localhost:3001/compute-async?limit=500000 -d 10 -c 20
```

### Understanding autocannon Output

```
┌─────────┬───────┬───────┬───────┬───────┬──────────┬─────────┬───────┐
│ Stat    │ 2.5%  │ 50%   │ 97.5% │ 99%   │ Avg      │ Stdev   │ Max   │
├─────────┼───────┼───────┼───────┼───────┼──────────┼─────────┼───────┤
│ Latency │ 23 ms │ 25 ms │ 36 ms │ 37 ms │ 25.61 ms │ 2.96 ms │ 43 ms │
└─────────┴───────┴───────┴───────┴───────┴──────────┴─────────┴───────┘
```

- **50% (Median):** Half of requests completed faster than this
- **99%:** 99% of requests completed faster (important for user experience)
- **Avg:** Average latency
- **Stdev:** Standard deviation (consistency indicator)

```
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev   │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Req/Sec   │ 166     │ 166     │ 195     │ 206     │ 192.1   │ 13.17   │ 166     │
└───────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

- **Avg Req/Sec:** Throughput - higher is better
- **This is the key metric** for comparing blocking vs non-blocking

### Testing Different Endpoints

```bash
# Test file I/O
autocannon http://localhost:3002/slow-sync?iterations=3 -d 10 -c 5
autocannon http://localhost:3001/slow-async?iterations=3 -d 10 -c 5

# Test crypto operations
autocannon http://localhost:3002/crypto?iterations=50000 -d 10 -c 5
autocannon http://localhost:3001/crypto-async?iterations=50000 -d 10 -c 5

# Test busy loop (worst case for blocking!)
autocannon http://localhost:3002/busy-loop?duration=500 -d 10 -c 5
autocannon http://localhost:3001/delay?duration=500 -d 10 -c 5

# Test parallel operations (should show biggest difference)
autocannon http://localhost:3002/multiple -d 10 -c 5
autocannon http://localhost:3001/parallel -d 10 -c 5
```

### Advanced autocannon Options

```bash
# Longer duration test
autocannon http://localhost:3001/compute-async -d 30 -c 10

# More connections (stress test)
autocannon http://localhost:3001/compute-async -d 10 -c 50

# Custom timeout
autocannon http://localhost:3002/compute -d 10 -c 5 -t 30

# Pipeline requests (HTTP pipelining)
autocannon http://localhost:3001/compute-async -d 10 -c 5 -p 10

# JSON output for analysis
autocannon http://localhost:3001/compute-async -d 10 -c 5 --json > results.json

# Show detailed percentiles
autocannon http://localhost:3001/compute-async -d 10 -c 5 --renderLatencyTable
```

### Quick Comparison Script (PowerShell)

```powershell
# Save as test-comparison.ps1
Write-Host "`nTesting Blocking Server (Port 3002)..." -ForegroundColor Red
autocannon http://localhost:3002/compute?limit=500000 -d 10 -c 5

Write-Host "`nTesting Non-Blocking Server (Port 3001)..." -ForegroundColor Green
autocannon http://localhost:3001/compute-async?limit=500000 -d 10 -c 5

Write-Host "`n=== High Concurrency Test ===" -ForegroundColor Yellow
Write-Host "`nTesting Blocking Server (Port 3002) - 10 connections..." -ForegroundColor Red
autocannon http://localhost:3002/compute?limit=500000 -d 10 -c 10

Write-Host "`nTesting Non-Blocking Server (Port 3001) - 10 connections..." -ForegroundColor Green
autocannon http://localhost:3001/compute-async?limit=500000 -d 10 -c 10
```

### What to Look For

**🔴 Blocking Server:**
- Latency increases significantly with concurrency
- Throughput stays low regardless of demand
- High standard deviation (inconsistent)
- Event loop warnings in console
- Total requests stays low

**🟢 Non-Blocking Server:**
- Latency increases gradually
- Throughput scales with concurrency
- Lower standard deviation (consistent)
- Few/no event loop warnings
- Total requests much higher

### Troubleshooting autocannon Tests

**Error: "ECONNREFUSED"**
- Server isn't running on that port
- Check `Get-NetTCPConnection -State Listen` to find actual ports

**Error: "Too many open files"**
- Lower the connection count (`-c` parameter)
- Or increase system limits

**All requests showing 0ms latency**
- Server crashed or port is wrong
- Check server console for errors

---

**Phase 2 Status: ✅ COMPLETE**

**Verified with autocannon load testing showing:**
- 2.4x better throughput on non-blocking
- 57-60% lower latency on non-blocking  
- Blocking latency doubles with concurrency
- Non-blocking scales gracefully

Ready for Phase 3: Integration & Testing with profiling tools!
