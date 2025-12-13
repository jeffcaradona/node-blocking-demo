# Phase 2 Complete - Testing Guide

## 🎉 Phase 2: Applications Built

Both blocking and non-blocking applications are now complete and tested!

---

## 🚀 Running the Applications

### Blocking Application (Port 3000)
```bash
cd blocking
npm start
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

### Blocking App (http://localhost:3000)

```bash
# Health check
curl http://localhost:3000/

# Synchronous file read
curl http://localhost:3000/slow-sync?iterations=3

# CPU computation
curl http://localhost:3000/compute?limit=1000000

# Crypto operation
curl http://localhost:3000/crypto?iterations=100000

# Busy loop (blocks completely!)
curl http://localhost:3000/busy-loop?duration=1000

# JSON parsing
curl http://localhost:3000/json-parse?size=10000

# Multiple blocking operations
curl http://localhost:3000/multiple
```

### Non-Blocking App (http://localhost:3002)

```bash
# Health check
curl http://localhost:3002/

# Async file read
curl http://localhost:3002/slow-async?iterations=3

# Async chunked computation
curl http://localhost:3002/compute-async?limit=1000000

# Async crypto
curl http://localhost:3002/crypto-async?iterations=100000

# Async delay (no blocking!)
curl http://localhost:3002/delay?duration=1000

# Stream processing
curl http://localhost:3002/stream-process?chunks=100

# Parallel operations
curl http://localhost:3002/parallel

# Async JSON processing
curl http://localhost:3002/json-async?size=10000
```

---

## 🔬 Load Testing Comparison

### Using PowerShell (Windows)

```powershell
# Test blocking app
$jobs = 1..5 | ForEach-Object {
    Start-Job -ScriptBlock {
        Measure-Command {
            Invoke-WebRequest -Uri "http://localhost:3000/compute?limit=500000" -UseBasicParsing
        }
    }
}
$jobs | Wait-Job | Receive-Job | Select TotalMilliseconds
$jobs | Remove-Job

# Test non-blocking app  
$jobs = 1..5 | ForEach-Object {
    Start-Job -ScriptBlock {
        Measure-Command {
            Invoke-WebRequest -Uri "http://localhost:3002/compute-async?limit=500000" -UseBasicParsing
        }
    }
}
$jobs | Wait-Job | Receive-Job | Select TotalMilliseconds
$jobs | Remove-Job
```

### Using autocannon (if installed)

```bash
# Install globally
npm install -g autocannon

# Test blocking app
autocannon http://localhost:3000/compute?limit=500000 -d 10 -c 5

# Test non-blocking app
autocannon http://localhost:3002/compute-async?limit=500000 -d 10 -c 5
```

**Expected Results:**
- **Blocking:** High latency, requests queue up and block each other
- **Non-Blocking:** Lower latency, concurrent requests handled smoothly

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

**Phase 2 Status: ✅ COMPLETE**

Ready for Phase 3: Integration & Testing with profiling tools!
