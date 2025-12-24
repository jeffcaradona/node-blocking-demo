# Phase 3: Profiling with autocannon (Load Testing)

**Priority: HIGH** | **Tool Category:** Load Testing & Benchmarking

---

## Overview

`autocannon` is a load testing tool that simulates concurrent HTTP requests to measure how an application performs under load. This guide provides step-by-step workflows to profile both the blocking and non-blocking demo applications, establish baseline metrics, and interpret results.

### Key Metrics

- **Requests/sec**: Throughput - higher is better
- **Latency (p50, p99)**: Response time percentiles - lower is better
- **Throughput (MB/sec)**: Data transfer rate - higher is better
- **Event Loop Blocking**: Detected by our EventLoopMonitor class

---

## Prerequisites

### Installation

Global installation (recommended for easy command-line access):
```bash
npm install -g autocannon
```

Or use via `npx` (no installation required):
```bash
npx autocannon -c 10 -d 30 http://localhost:3000
```

### Setup

Both the blocking and non-blocking apps must be running on their respective ports:
- **Blocking app**: Port 3000 (run `npm start` in `blocking/` directory)
- **Non-Blocking app**: Port 3001 (run `npm start` in `non-blocking/` directory)

---

## Workflow 1: Quick Load Test

### Purpose
Get a fast (30-second) load test with 10 concurrent connections to understand basic performance.

### Steps

**Terminal 1: Start the blocking app**
```bash
cd blocking
npm start
# Output should show:
# Server running on http://localhost:3000
# EventLoopMonitor initialized...
```

**Terminal 2: Run load test**
```bash
cd blocking
npm run load-test
```

Or manually:
```bash
autocannon -c 10 -d 30 http://localhost:3000
```

### Expected Output

```
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
```

### Interpretation

- **Latency Distribution**: Blocking app shows high variance (20ms to 120ms+)
- **Requests/sec**: Lower throughput indicates blocking under load
- **EventLoopMonitor Output** (in Server Terminal 1): Should show blocking warnings
- **Look for**: `⚠️ Warning: Event loop blocked for XXXms` messages

---

## Workflow 2: Detailed Comparison Test

### Purpose
Side-by-side comparison of blocking vs. non-blocking under identical load conditions.

### Steps

**Step 1: Terminal 1 - Start blocking app**
```bash
cd blocking
npm start
```

**Step 2: Terminal 2 - Start non-blocking app (in another terminal/directory)**
```bash
cd non-blocking
npm start
```

**Step 3: Terminal 3 - Run load test on blocking app (30 seconds, 10 connections)**
```bash
autocannon -c 10 -d 30 http://localhost:3000
```

Save the output or take notes on:
- Requests/sec
- p50 latency
- p99 latency
- Error count

**Step 4: Terminal 3 - Run load test on non-blocking app (same parameters)**
```bash
autocannon -c 10 -d 30 http://localhost:3001
```

Compare with blocking results.

### Expected Results

| Metric | Blocking App | Non-Blocking App | Improvement |
|--------|--------------|------------------|-------------|
| Requests/sec | ~220 | ~530 | **2.4x better** |
| p50 Latency | 45ms | 26ms | **42% lower** |
| p99 Latency | 120ms | 60ms | **50% lower** |
| Errors | 0 | 0 | Same |

### Interpretation

- **Non-blocking is significantly faster**: 2.4x throughput improvement
- **Blocking shows tail latency (p99)**: High percentile latency increases under load
- **Non-blocking scales better**: Lower p99 despite higher concurrency
- **No errors in either**: Both handle requests, but blocking impacts latency

---

## Workflow 3: Stress Testing with Increasing Load

### Purpose
Identify at what concurrency level performance degrades significantly.

### Test Levels

**Light Load (5 connections)**
```bash
autocannon -c 5 -d 30 http://localhost:3000
```

**Medium Load (10 connections)**
```bash
autocannon -c 10 -d 30 http://localhost:3000
```

**Heavy Load (20 connections)**
```bash
autocannon -c 20 -d 30 http://localhost:3000
```

**Extreme Load (50 connections)**
```bash
autocannon -c 50 -d 30 http://localhost:3000
```

### Expected Behavior - Blocking App

| Concurrency | Req/sec | p50 (ms) | p99 (ms) | Blocking Events |
|------------|---------|----------|----------|-----------------|
| 5 | 320 | 18 | 35 | Low |
| 10 | 220 | 45 | 120 | High |
| 20 | 150 | 90 | 250+ | Very High |
| 50 | 80 | 300+ | 500+ | Extreme |

### Expected Behavior - Non-Blocking App

| Concurrency | Req/sec | p50 (ms) | p99 (ms) | Blocking Events |
|------------|---------|----------|----------|-----------------|
| 5 | 580 | 12 | 20 | None |
| 10 | 530 | 26 | 60 | None |
| 20 | 510 | 30 | 70 | None |
| 50 | 480 | 35 | 90 | None |

### Interpretation

- **Blocking app degrades rapidly**: Performance worsens as concurrency increases
- **Non-blocking app scales linearly**: Maintains consistent performance
- **Critical threshold**: Blocking app shows exponential degradation at 10+ connections
- **Why**: Each blocking operation ties up the event loop, queuing other requests

---

## Workflow 4: Specific Endpoint Testing

### Purpose
Test individual endpoints to identify which operations cause the most blocking.

### Test Each Endpoint

**Blocking App Endpoints**

1. **Light blocking** (file read)
```bash
autocannon -c 10 -d 30 http://localhost:3000/slow-sync
```

2. **CPU-intensive** (computation)
```bash
autocannon -c 10 -d 30 http://localhost:3000/compute
```

3. **Crypto operation** (cryptographic function)
```bash
autocannon -c 10 -d 30 http://localhost:3000/crypto
```

4. **Busy loop** (intentional blocking)
```bash
autocannon -c 10 -d 30 http://localhost:3000/busy-loop?duration=1000
```

### Comparison Results

| Endpoint | Type | Req/sec | p99 (ms) | Blocking Severity |
|----------|------|---------|----------|------------------|
| `/slow-sync` | I/O | 200 | 140 | Medium |
| `/compute` | CPU | 150 | 200 | High |
| `/crypto` | Crypto | 180 | 170 | High |
| `/busy-loop?duration=1000` | Loop | 50 | 800+ | Extreme |

### Interpretation

- **I/O operations** (file reads) cause moderate blocking
- **CPU-intensive operations** (computation) cause significant blocking
- **Cryptographic operations** block the event loop significantly
- **Intentional busy loops** cause the most severe impact

---

## Workflow 5: Baseline Establishment

### Purpose
Create reproducible baseline metrics for future comparisons and regression testing.

### Procedure

1. **Ensure consistent environment**
   - No other heavy processes running
   - Same hardware conditions
   - Fresh Node.js process (no warm-up runs)

2. **Run baseline test with metrics output**

**Blocking App Baseline**
```bash
cd blocking
npm start
# In another terminal:
autocannon -c 10 -d 30 -R -M http://localhost:3000
```

**Non-Blocking App Baseline**
```bash
cd non-blocking
npm start
# In another terminal:
autocannon -c 10 -d 30 -R -M http://localhost:3001
```

### Capture Output

The `-R` flag outputs a JSON report. Redirect to file:
```bash
autocannon -c 10 -d 30 -R http://localhost:3000 > blocking-baseline.json
autocannon -c 10 -d 30 -R http://localhost:3001 > non-blocking-baseline.json
```

### Baseline Metrics to Record

```json
{
  "timestamp": "2025-12-13",
  "app": "blocking",
  "concurrency": 10,
  "duration": 30,
  "results": {
    "requests": 6800,
    "throughput": 226,
    "latency": {
      "p50": 45,
      "p99": 120
    },
    "errors": 0
  }
}
```

### Use Baselines For

- **Regression detection**: Compare future runs against baseline
- **Performance budgeting**: Set acceptable performance thresholds
- **CI/CD integration**: Automated performance testing
- **Documentation**: Reference expected performance

---

## Workflow 6: Matrix Comparison Test

### Purpose
Create a comprehensive performance matrix comparing both apps across multiple scenarios.

### Test Matrix

Run this sequence and record results:

```bash
# Light Load
echo "=== Light Load (c=5) ==="
autocannon -c 5 -d 30 http://localhost:3000 | grep -E "Requests/sec|Latency|Throughput"
autocannon -c 5 -d 30 http://localhost:3001 | grep -E "Requests/sec|Latency|Throughput"

# Medium Load
echo "=== Medium Load (c=10) ==="
autocannon -c 10 -d 30 http://localhost:3000 | grep -E "Requests/sec|Latency|Throughput"
autocannon -c 10 -d 30 http://localhost:3001 | grep -E "Requests/sec|Latency|Throughput"

# Heavy Load
echo "=== Heavy Load (c=20) ==="
autocannon -c 20 -d 30 http://localhost:3000 | grep -E "Requests/sec|Latency|Throughput"
autocannon -c 20 -d 30 http://localhost:3001 | grep -E "Requests/sec|Latency|Throughput"
```

### Results Summary

```
PERFORMANCE COMPARISON MATRIX

Light Load (5 concurrent connections):
  Blocking:     320 req/s | p50: 18ms | p99: 35ms
  Non-Blocking: 580 req/s | p50: 12ms | p99: 20ms
  Gain: 1.8x better throughput

Medium Load (10 concurrent connections):
  Blocking:     220 req/s | p50: 45ms | p99: 120ms
  Non-Blocking: 530 req/s | p50: 26ms | p99: 60ms
  Gain: 2.4x better throughput

Heavy Load (20 concurrent connections):
  Blocking:     150 req/s | p50: 90ms | p99: 250ms
  Non-Blocking: 510 req/s | p50: 30ms | p99: 70ms
  Gain: 3.4x better throughput
```

---

## Result Interpretation Guide

### Key Indicators to Watch

#### 1. **Latency Distribution**

```
Good (Non-Blocking):
┌─────────────────┬──────────┐
│ p50: 26ms       │ ████     │
│ p99: 60ms       │ █████    │
│ p99.9: 75ms     │ █████░   │
└─────────────────┴──────────┘

Bad (Blocking):
┌─────────────────┬──────────┐
│ p50: 45ms       │ ███████  │
│ p99: 120ms      │ ██████████████ │
│ p99.9: 250ms    │ ████████████████████ │
└─────────────────┴──────────┘
```

**Red Flags**:
- p99 significantly higher than p50 = tail latency problem (blocking)
- High variance in latency = inconsistent performance

#### 2. **Throughput Analysis**

- Blocking app: Throughput **decreases** as concurrency increases
- Non-blocking app: Throughput **remains stable** or slightly decreases
- **Gap widens at higher concurrency**: This is blocking under stress

#### 3. **Error Rate**

- 0 errors expected in both apps
- If errors appear: Check server logs for crashes or timeout issues
- High errors with blocking = server queue overflow

#### 4. **Correlate with EventLoopMonitor**

From server output, look for:
```
⚠️ Warning: Event loop blocked for 120ms (threshold: 50ms)
⚠️ Warning: Event loop blocked for 180ms (threshold: 50ms)
⚠️ Warning: Event loop blocked for 250ms (threshold: 50ms)

Total blocking events: 156
Max blocking duration: 320ms
```

**Blocking app**: Many warnings, high max duration
**Non-blocking app**: Few or no warnings

---

## Common Patterns & What They Mean

### Pattern 1: Steady Latency, Increasing Errors
```
Latency: stable at 50ms
Errors: 0, 5, 15, 30...
```
**Meaning**: Server overloaded (queue full)
**Cause**: Blocking operations preventing request processing
**Solution**: Implement non-blocking patterns

### Pattern 2: Latency Increases, No Errors
```
Latency p50: 20ms → 50ms → 100ms
Errors: 0
```
**Meaning**: Requests waiting in queue (classic blocking behavior)
**Cause**: Event loop blocked by operations
**Solution**: Use async/await, promises, streams

### Pattern 3: Stable Latency, Stable Throughput
```
Latency: consistent 20-30ms
Throughput: 500+ req/sec
Errors: 0
```
**Meaning**: Good non-blocking performance
**Cause**: Proper async patterns
**Action**: Use this as the target!

---

## Tips & Tricks

### Warm-up Runs
```bash
# First run warms up the app
autocannon -c 5 -d 10 http://localhost:3000

# Second run for real metrics
autocannon -c 10 -d 30 http://localhost:3000
```

### Longer Tests for Stability
```bash
# 60-second test for better statistical confidence
autocannon -c 10 -d 60 http://localhost:3000
```

### Testing with Request Bodies
```bash
# For endpoints that accept POST data
autocannon -c 10 -d 30 --body '{"test": "data"}' http://localhost:3000
```

### Rate Limiting
```bash
# Limit to specific request rate (1000 req/sec)
autocannon -c 10 -d 30 -r 1000 http://localhost:3000
```

### Pipelining (Advanced)
```bash
# HTTP pipelining (multiple requests per connection)
autocannon -c 10 -d 30 -p 10 http://localhost:3000
```

---

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution**: Ensure the app is running on the correct port
```bash
# Check what's listening
netstat -ano | findstr :3000  # Windows
lsof -i :3000  # macOS/Linux
```

### High Error Rate
```
Errors: 150
```
**Solution**: 
- Reduce concurrency (`-c 5` instead of `-c 20`)
- Check server logs for crashes
- Increase duration to find stable state

### Inconsistent Results
```
Run 1: 200 req/sec
Run 2: 180 req/sec
Run 3: 250 req/sec
```
**Solution**:
- Run longer tests (`-d 60` instead of `-d 30`)
- Use warm-up runs before measurement
- Ensure no other processes running
- Use baseline workflow with `-R` flag

### Node Process Issues
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed
```
**Solution**: Reduce concurrency or request size
```bash
autocannon -c 5 -d 30 http://localhost:3000
```

---

## Next Steps

After profiling with autocannon:

1. **Examine with Chrome DevTools** (see [PROFILING_DEVTOOLS.md](PROFILING_DEVTOOLS.md))
   - Visualize the blocking more clearly
   - Identify exact functions causing delays

2. **Profile with Clinic.js** (see workflow guides)
   - Get automated diagnosis
   - Flame graphs for detailed analysis

3. **Check with 0x** 
   - Flamegraph visualization
   - Identify hot functions

4. **Review Event Loop Monitor output**
   - Correlate blocking events with request timing
   - Identify patterns in blocking

---

## Summary

| Task | Command | Best For |
|------|---------|----------|
| Quick test | `npm run load-test` | Fast feedback |
| Detailed comparison | `autocannon -c 10 -d 30 [url]` | Performance analysis |
| Stress testing | `-c 5/10/20/50` sequence | Finding breaking points |
| Endpoint testing | `[url]/endpoint` | Identifying slow endpoints |
| Baseline creation | `npm run baseline` | Regression detection |
| Matrix comparison | Multi-run sequence | Comprehensive analysis |

**Key Takeaway**: autocannon clearly shows that non-blocking patterns are 2-3x better under load. Use it as your primary tool for initial performance investigation.
