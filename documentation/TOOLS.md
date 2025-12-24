# Node.js Event Loop Blocking - Tools & Debugging Guide

## Overview

This guide provides detailed documentation of all tools and techniques available for identifying, measuring, and analyzing operations that block the Node.js event loop.

---

## 1. Node.js Built-in Inspector & Chrome DevTools

### What It Does
Browser-based real-time debugging with performance profiling, memory analysis, and visual debugging.

### Installation
Built-in to Node.js - no installation needed.

### Usage

**Start with Inspector:**
```bash
node --inspect src/index.js
# Server running? Go to chrome://inspect
```

**Break on Startup:**
```bash
node --inspect-brk src/index.js
# Execution pauses at first line
```

### Key Features
- ⚡ Real-time execution debugging
- 📊 Performance profiler (CPU sampling)
- 💾 Memory snapshots and heap analysis
- 📈 Allocation timeline
- 🔍 Console debugging
- ⏱️ Timing measurements

### When to Use
- During development for quick diagnosis
- Memory leak detection
- Visual performance analysis
- Step-through debugging

### Example Workflow
1. Start app with `--inspect`
2. Open `chrome://inspect` in Chrome
3. Click "inspect" under your process
4. Use Performance tab to record
5. Look for gaps in requestAnimationFrame calls (event loop blocked)

---

## 2. Clinic.js

### What It Does
Purpose-built Node.js performance diagnostics tool with automatic analysis and visual reports.

### Installation
```bash
npm install -g clinic
```

### Modes

**Doctor Mode (Automatic Analysis)**
```bash
clinic doctor -- node src/index.js
```
- Analyzes CPU, memory, handles
- Generates HTML report
- Provides diagnosis of issues

**Flame Mode (CPU Profiling)**
```bash
clinic flame -- node src/index.js
```
- Shows CPU flame graph
- Interactive visualization
- Identify hot functions

**Bubbleprof Mode (Latency)**
```bash
clinic bubbleprof -- node src/index.js
```
- Analyzes asynchronous operations
- Shows latency distribution
- Identifies blocking operations

### Key Features
- 🤖 Automatic problem detection
- 🔥 Interactive flame graphs
- 📊 Visual performance reports
- ⚡ Low-overhead profiling
- 📈 Before/after comparisons

### When to Use
- Production-like profiling
- Comprehensive diagnostics
- Team sharing (HTML reports)
- When Node.js Inspector isn't enough

### Example Workflow
```bash
clinic doctor -- npm start
# Make requests with load test
# Wait for report generation
# Review HTML report
```

---

## 3. 0x (Flamegraph Generator)

### What It Does
Generates flamegraphs from V8 profiling data for easy visualization of CPU usage.

### Installation
```bash
npm install -g 0x
```

### Usage
```bash
0x -- node src/index.js
```

Features:
- Interactive flamegraph (zoom, search)
- Time-based analysis
- Function-level CPU attribution
- HTML export

### When to Use
- Identifying CPU hotspots
- Comparing before/after optimization
- Understanding call stacks
- Team presentations

---

## 4. autocannon (Load Testing)

### What It Does
High-performance HTTP load testing tool for Node.js applications.

### Installation
```bash
npm install -g autocannon
```

### Usage
```bash
# Basic test
autocannon http://localhost:3000

# 30 second test with 10 connections
autocannon http://localhost:3000 -d 30 -c 10

# Detailed results
autocannon http://localhost:3000 -d 10 -c 20 --verbose
```

### Key Metrics Reported
- Requests/sec
- Latency (mean, median, p99)
- Throughput (bytes/sec)
- Error rate

### Comparison Example
```bash
# Terminal 1: Blocking app
npm run start:blocking

# Terminal 2: Load test
autocannon http://localhost:3000/slow-sync -d 10 -c 5
# Expected: Low throughput, high latency

# Then test non-blocking:
npm run start:non-blocking
autocannon http://localhost:3000/slow-async -d 10 -c 5
# Expected: High throughput, low latency
```

---

## 5. Node.js Native Profiling (--prof)

### What It Does
V8's sampling profiler - creates raw profiling data files.

### Usage
```bash
node --prof src/index.js
# Run for a while, then stop
# Creates isolate-XXXXXXX-v8.log
```

### Processing
```bash
# Convert to readable format
node --prof-process isolate-*.log > processed.txt

# View results
cat processed.txt | head -50
```

### Output Interpretation
```
   ticks  total  nonlib   name
    150   13.5%   14.1%  Function: myBlockingFunction
    120   10.8%   11.2%  String: ...
     80    7.2%    7.5%  Function: fsReadSync
```

### When to Use
- Deep performance analysis
- Production profiling (low overhead)
- Identifying exact hot functions

---

## 6. Event Loop Monitoring (Custom Code)

### What It Does
Measures event loop delay to detect blocking operations.

### Implementation Example
```javascript
import { performance } from 'perf_hooks';

class EventLoopMonitor {
  constructor(thresholdMs = 10) {
    this.thresholdMs = thresholdMs;
    this.lastCheck = performance.now();
  }

  check() {
    const now = performance.now();
    const delay = now - this.lastCheck - 100; // Expected 100ms interval
    
    if (delay > this.thresholdMs) {
      console.warn(`⚠️ Event loop blocked for ${delay.toFixed(2)}ms`);
    }
    
    this.lastCheck = now;
  }

  start() {
    setInterval(() => this.check(), 100);
  }
}

const monitor = new EventLoopMonitor();
monitor.start();
```

### Key Metrics
- Event loop delay (lag)
- Blocked duration
- Frequency of blocking events
- Correlation with request count

### When to Use
- Production monitoring
- Real-time alerting
- Custom metrics collection

---

## 7. Process Monitoring Tools

### Node.js Process Memory
```bash
# Monitor memory usage
node --track-heap-objects src/index.js

# Check available resources
process.memoryUsage()
// Output:
// {
//   rss: 47,000,000,      // Resident set size
//   heapTotal: 9,000,000,  // Total heap
//   heapUsed: 4,000,000,   // Used heap
//   external: 1,000,000,   // External memory
//   arrayBuffers: 500,000  // ArrayBuffer memory
// }
```

### System Tools (Windows)
```powershell
# Task Manager
taskmgr.exe

# Performance Monitor (detailed metrics)
perfmon.exe

# Resource Monitor
resmon.exe
```

### System Tools (Linux/Mac)
```bash
# Real-time monitoring
top -p <PID>

# Detailed process stats
ps aux | grep node

# Memory profiling
valgrind --tool=massif node app.js
```

---

## 8. Distributed Tracing & Logging

### Winston (Structured Logging)
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

logger.info('Request received', { endpoint: '/api/data', duration: 45 });
```

### Pino (High-Performance Logging)
```javascript
import pino from 'pino';

const logger = pino();
logger.info({ endpoint: '/api/data', duration: 45 }, 'Request received');
```

### Debug Module (Development)
```javascript
import debug from 'debug';
const log = debug('app:blocking');

log('Blocking operation starting...');
const result = blockingOperation();
log('Blocking operation completed: %O', result);
```

### When to Use
- Tracking request flow
- Correlating operations
- Post-incident analysis
- Performance metrics collection

---

## 9. Memory Leak Detection

### Chrome DevTools Approach
1. Open DevTools with `--inspect`
2. Go to Memory tab
3. Take initial heap snapshot
4. Perform operations
5. Take second heap snapshot
6. Compare snapshots for growth

### Clinic.js Memory Analysis
```bash
clinic doctor -- node src/index.js
# Review memory growth in report
```

### Code Example: Leak Detection
```javascript
// BAD: Memory leak
const cache = {};
function processRequest(id, data) {
  cache[id] = data; // Growing indefinitely!
}

// GOOD: Bounded cache
import LRU from 'lru-cache';
const cache = new LRU({ max: 100 });
function processRequest(id, data) {
  cache.set(id, data);
}
```

---

## 10. Comparison Matrix

| Tool | CPU | Memory | Latency | Dev | Prod | Cost | Learning Curve |
|------|-----|--------|---------|-----|------|------|-----------------|
| Chrome DevTools | ✅✅ | ✅✅ | ✅ | ✅✅ | ⚠️ | Free | Low |
| Clinic.js | ✅✅ | ✅✅ | ✅✅ | ✅ | ✅ | Free | Low |
| 0x | ✅✅✅ | - | - | ✅✅ | ✅ | Free | Medium |
| autocannon | - | - | ✅✅ | ✅ | ✅ | Free | Low |
| --prof | ✅✅✅ | - | - | ✅✅ | ✅ | Free | High |
| Custom Monitor | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | Free | Medium |

---

## 11. Recommended Workflow

### Development
1. Write code with event loop awareness
2. Use `node --inspect` during development
3. Monitor with custom event loop detector
4. Use `debug` module for logging

### Testing
1. Use autocannon for load testing
2. Run `clinic doctor` for comprehensive analysis
3. Use Chrome DevTools for detailed inspection
4. Check `--prof` output for hotspots

### Production
1. Deploy with custom event loop monitoring
2. Use structured logging (Winston/Pino)
3. Set up alerts for blocking thresholds
4. Regular clinic.js analysis runs

### Optimization
1. Profile with 0x and `--prof`
2. Identify blocking operations
3. Refactor with async patterns
4. Re-test with autocannon
5. Verify with clinic.js

---

## 12. Quick Command Reference

```bash
# Inspection
node --inspect src/index.js
node --inspect-brk src/index.js
chrome://inspect

# Clinic.js
clinic doctor -- node src/index.js
clinic flame -- node src/index.js
clinic bubbleprof -- node src/index.js

# Profiling
node --prof src/index.js
node --prof-process isolate-*.log

# 0x
0x -- node src/index.js

# Load Testing
autocannon http://localhost:3000 -d 10 -c 5

# Memory
node --track-heap-objects src/index.js

# Tracing
node --trace-warnings src/index.js
node --trace-uncaught src/index.js
```

---

## Resources

- [Node.js Inspector Documentation](https://nodejs.org/en/docs/guides/nodejs-debugging-getting-started/)
- [Clinic.js Official Site](https://clinicjs.org/)
- [0x GitHub Repository](https://github.com/davidmarkclements/0x)
- [autocannon GitHub](https://github.com/mcollina/autocannon)
- [Node.js Event Loop Guide](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/)
