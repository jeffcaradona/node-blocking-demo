# Phase 3: Establishing Performance Baselines

**Priority: HIGH** | **Purpose:** Create reproducible baseline metrics for regression detection

---

## Overview

A baseline is a documented snapshot of expected performance metrics. It serves as a reference point for:
- **Regression Detection**: Identifying when code changes make performance worse
- **Improvement Verification**: Measuring the impact of optimizations
- **CI/CD Integration**: Automated performance tests in pipelines
- **Performance Budgeting**: Setting acceptable thresholds
- **Historical Tracking**: Monitoring performance trends over time

---

## Baseline Metrics to Capture

### Critical Metrics (Always Record)

```json
{
  "timestamp": "2025-12-13T10:30:00Z",
  "app": "blocking",
  "environment": {
    "node_version": "v25.0.0",
    "platform": "Windows 11",
    "cpu_cores": 8,
    "memory_gb": 16
  },
  "test_parameters": {
    "concurrency": 10,
    "duration_seconds": 30,
    "endpoint": "/",
    "method": "GET"
  },
  "results": {
    "requests_total": 6800,
    "requests_per_second": 226,
    "latency_ms": {
      "min": 5,
      "p50": 45,
      "p90": 95,
      "p99": 120,
      "max": 250
    },
    "throughput_mbps": 0.18,
    "errors": 0,
    "timeouts": 0
  },
  "event_loop_monitor": {
    "blocking_events": 156,
    "max_delay_ms": 320,
    "threshold_ms": 50
  }
}
```

### Optional Metrics (Additional Context)

```json
{
  "memory": {
    "heap_used_start_mb": 45,
    "heap_used_peak_mb": 58,
    "heap_used_end_mb": 47
  },
  "cpu": {
    "average_usage_percent": 85,
    "peak_usage_percent": 95
  },
  "gc_events": {
    "count": 5,
    "total_pause_ms": 45
  },
  "notes": "Baseline measurement under typical load"
}
```

---

## Workflow 1: Establishing Initial Baselines

### Prerequisites

- Both apps built and tested
- autocannon installed globally
- System at rest (minimal other processes)
- Fresh Node.js startup for consistent JIT state

### Step-by-Step

**Step 1: Prepare Environment**

```bash
# Close unnecessary applications
# Kill any existing Node.js processes
# Ensure clean system state
```

**Step 2: Create Baseline Directory**

```bash
# Create folder for storing baselines
mkdir baselines
cd baselines
```

**Step 3: Record Environment Details**

Create `environment.json`:
```json
{
  "date": "2025-12-13",
  "node_version": "v25.0.0",
  "npm_version": "10.8.3",
  "platform": "Windows 11",
  "platform_version": "22H2",
  "cpu": "Intel Core i7-12700K",
  "cpu_cores": 12,
  "memory_gb": 32,
  "notes": "Test machine specifications"
}
```

**Step 4: Establish Blocking App Baseline**

```bash
cd blocking

# Terminal 1: Start app with monitoring
npm start > ../blocking-startup.log 2>&1 &
BLOCKING_PID=$!

# Wait for startup
sleep 5

# Terminal 2: Run baseline test with metrics output
autocannon -c 10 -d 30 -R -M http://localhost:3000 > ../baselines/blocking-baseline-2025-12-13.json

# Capture server output (includes EventLoopMonitor stats)
kill $BLOCKING_PID
```

**Step 5: Establish Non-Blocking App Baseline**

```bash
cd non-blocking

# Terminal 1: Start app with monitoring
npm start > ../non-blocking-startup.log 2>&1 &
NONBLOCKING_PID=$!

# Wait for startup
sleep 5

# Terminal 2: Run baseline test with metrics output
autocannon -c 10 -d 30 -R -M http://localhost:3001 > ../baselines/non-blocking-baseline-2025-12-13.json

# Capture server output
kill $NONBLOCKING_PID
```

**Step 6: Analyze and Document**

```bash
# Review results
cat baselines/blocking-baseline-2025-12-13.json | jq .
cat baselines/non-blocking-baseline-2025-12-13.json | jq .
```

### Example Baseline Files

**blocking-baseline-2025-12-13.json**:
```json
{
  "requests": 6800,
  "throughput": {
    "average": 226,
    "p50": 225,
    "p99": 220
  },
  "latency": {
    "p50": 45,
    "p90": 95,
    "p99": 120
  },
  "errors": 0,
  "timeouts": 0,
  "rps": {
    "average": 226,
    "p50": 225,
    "p99": 220
  }
}
```

**non-blocking-baseline-2025-12-13.json**:
```json
{
  "requests": 15900,
  "throughput": {
    "average": 530,
    "p50": 530,
    "p99": 525
  },
  "latency": {
    "p50": 26,
    "p90": 45,
    "p99": 60
  },
  "errors": 0,
  "timeouts": 0,
  "rps": {
    "average": 530,
    "p50": 530,
    "p99": 525
  }
}
```

---

## Workflow 2: Ongoing Baseline Validation

### Monthly Baseline Refresh

**Purpose**: Ensure baselines remain accurate and detect environment changes

**Procedure**:

```bash
# Month: January 2026

# 1. Verify environment hasn't changed
cat baselines/environment.json

# 2. Run fresh baseline
npm run baseline > baselines/blocking-baseline-2026-01.json
npm run baseline > baselines/non-blocking-baseline-2026-01.json

# 3. Compare to previous month
# If results differ >5%, investigate why
```

### Quarterly Deep Benchmarks

**Purpose**: Extended profiling to catch subtle regressions

```bash
# Run longer, more comprehensive tests
autocannon -c 10 -d 120 -R http://localhost:3000 > quarterly-blocking-q4-2025.json
autocannon -c 10 -d 120 -R http://localhost:3001 > quarterly-nonblocking-q4-2025.json

# Store with version/date
git tag -a "baseline-q4-2025" -m "Q4 2025 baseline measurements"
```

---

## Workflow 3: Using Baselines for Regression Detection

### Before Making Code Changes

```bash
# Save current baseline as reference
cp baselines/blocking-baseline.json baselines/blocking-baseline-reference.json
cp baselines/non-blocking-baseline.json baselines/non-blocking-baseline-reference.json

# Or version with git
git add baselines/
git commit -m "Save baseline before optimization attempt"
```

### After Code Changes

```bash
# Re-run baseline tests
npm run baseline > baselines/blocking-baseline-after.json
npm run baseline > baselines/non-blocking-baseline-after.json

# Compare using script
compare-baselines.sh blocking-baseline-reference.json blocking-baseline-after.json
```

### Comparison Script (bash)

```bash
#!/bin/bash
# compare-baselines.sh

baseline1=$1
baseline2=$2

echo "Comparing $baseline1 vs $baseline2"
echo ""

# Extract key metrics
echo "Requests/sec:"
jq '.throughput.average' $baseline1
jq '.throughput.average' $baseline2

echo "p99 Latency (ms):"
jq '.latency.p99' $baseline1
jq '.latency.p99' $baseline2

echo "Errors:"
jq '.errors' $baseline1
jq '.errors' $baseline2

# Calculate % change
req_before=$(jq '.throughput.average' $baseline1)
req_after=$(jq '.throughput.average' $baseline2)
pct_change=$(echo "scale=2; (($req_after - $req_before) / $req_before) * 100" | bc)

echo ""
echo "Change: ${pct_change}%"

if (( $(echo "$pct_change < -5" | bc -l) )); then
  echo "⚠️ WARNING: Performance regressed more than 5%"
  exit 1
else
  echo "✓ Performance within acceptable range"
  exit 0
fi
```

---

## Workflow 4: Multi-Level Performance Testing

### Baseline Test Matrix

Create baselines across different load scenarios:

```bash
# Light Load
autocannon -c 5 -d 30 -R http://localhost:3000 > baselines/blocking-light-load.json
autocannon -c 5 -d 30 -R http://localhost:3001 > baselines/non-blocking-light-load.json

# Medium Load
autocannon -c 10 -d 30 -R http://localhost:3000 > baselines/blocking-medium-load.json
autocannon -c 10 -d 30 -R http://localhost:3001 > baselines/non-blocking-medium-load.json

# Heavy Load
autocannon -c 20 -d 30 -R http://localhost:3000 > baselines/blocking-heavy-load.json
autocannon -c 20 -d 30 -R http://localhost:3001 > baselines/non-blocking-heavy-load.json
```

### Baseline Matrix Table

```
Load Level | Blocking Req/s | Non-Blocking Req/s | Ratio
-----------|----------------|-------------------|-------
Light (5c) | 320            | 580                | 1.8x
Medium (10c)| 220           | 530                | 2.4x
Heavy (20c)| 150            | 510                | 3.4x
```

**Use for**:
- Performance scaling analysis
- Identifying breaking points
- Concurrency sensitivity analysis

---

## Workflow 5: Endpoint-Specific Baselines

### By Operation Type

```bash
# Blocking app endpoints
autocannon -c 10 -d 30 -R http://localhost:3000/slow-sync > baselines/blocking-slow-sync.json
autocannon -c 10 -d 30 -R http://localhost:3000/compute > baselines/blocking-compute.json
autocannon -c 10 -d 30 -R http://localhost:3000/crypto > baselines/blocking-crypto.json

# Non-blocking app endpoints
autocannon -c 10 -d 30 -R http://localhost:3001/slow-async > baselines/non-blocking-slow-async.json
autocannon -c 10 -d 30 -R http://localhost:3001/compute-async > baselines/non-blocking-compute-async.json
autocannon -c 10 -d 30 -R http://localhost:3001/crypto-async > baselines/non-blocking-crypto-async.json
```

### Endpoint Baseline Matrix

```
Endpoint | Blocking Latency p99 | Non-Blocking Latency p99 | Improvement
---------|----------------------|--------------------------|--------
slow-sync| 140ms                | 25ms                     | 82%
compute  | 200ms                | 35ms                     | 82%
crypto   | 170ms                | 30ms                     | 82%
```

**Use for**:
- Identifying slowest endpoints
- Prioritizing optimization efforts
- Tracking endpoint-specific improvements

---

## Workflow 6: Continuous Integration Integration

### GitHub Actions Workflow

```yaml
name: Baseline Validation

on:
  pull_request:
    branches: [main]

jobs:
  baseline-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v3
        with:
          node-version: '25'
      
      - run: npm install -g autocannon
      
      - name: Run Blocking App
        run: |
          cd blocking
          npm start &
          sleep 3
      
      - name: Baseline Test - Blocking
        run: |
          autocannon -c 10 -d 30 -R http://localhost:3000 > results-blocking.json
      
      - name: Run Non-Blocking App
        run: |
          cd non-blocking
          npm start &
          sleep 3
      
      - name: Baseline Test - Non-Blocking
        run: |
          autocannon -c 10 -d 30 -R http://localhost:3001 > results-nonblocking.json
      
      - name: Compare to Baseline
        run: |
          # Get baseline from main
          git show origin/main:baselines/blocking-baseline.json > baseline-blocking.json
          
          # Compare
          node scripts/compare-baselines.js baseline-blocking.json results-blocking.json
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: baseline-results
          path: |
            results-*.json
            baseline-*.json
```

### Jenkins Pipeline

```groovy
pipeline {
  agent any
  
  environment {
    NODE_VERSION = '25.0.0'
  }
  
  stages {
    stage('Prepare') {
      steps {
        sh 'npm install -g autocannon'
      }
    }
    
    stage('Baseline - Blocking') {
      steps {
        dir('blocking') {
          sh '''
            npm start &
            sleep 3
            autocannon -c 10 -d 30 -R http://localhost:3000 > ../results-blocking.json
          '''
        }
      }
    }
    
    stage('Baseline - Non-Blocking') {
      steps {
        dir('non-blocking') {
          sh '''
            npm start &
            sleep 3
            autocannon -c 10 -d 30 -R http://localhost:3001 > ../results-nonblocking.json
          '''
        }
      }
    }
    
    stage('Validate') {
      steps {
        sh 'node scripts/validate-baselines.js results-blocking.json results-nonblocking.json'
      }
    }
    
    stage('Archive') {
      steps {
        archiveArtifacts artifacts: 'results-*.json'
      }
    }
  }
}
```

---

## Baseline Management Best Practices

### ✓ DO

- **Document everything**: Timestamps, environment, parameters
- **Store baselines in version control**: Track changes over time
- **Use consistent test parameters**: Same concurrency, duration, endpoint
- **Run warm-up iterations**: Before capturing baseline
- **Multiple runs**: Average 3+ runs for stability
- **Review monthly**: Ensure baselines remain relevant
- **Keep historical data**: For trend analysis

### ✗ DON'T

- **Use stale baselines**: They become irrelevant as code evolves
- **Compare different test parameters**: 10c vs 20c aren't comparable
- **Trust single runs**: Variance is too high
- **Ignore environment changes**: CPU, OS updates affect results
- **Manually track results**: Use files/databases for accuracy

---

## Baseline File Organization

### Recommended Directory Structure

```
node-blocking-demo/
├── baselines/
│   ├── environment.json                    # Test environment specs
│   ├── 2025-12/
│   │   ├── blocking-baseline-2025-12-13.json
│   │   ├── non-blocking-baseline-2025-12-13.json
│   │   └── notes-2025-12-13.md
│   └── latest/
│       ├── blocking-baseline.json          # Current baseline
│       └── non-blocking-baseline.json      # Current baseline
├── results/                                 # Test result artifacts
│   └── 2025-12-13/
│       ├── load-test-results.json
│       └── profiling-output.log
└── scripts/
    ├── baseline.sh
    ├── compare-baselines.sh
    └── validate-baselines.js
```

### Baseline Naming Convention

```
{app}-{scenario}-{date}-{note}.json

Examples:
- blocking-baseline-2025-12-13.json
- blocking-load-5c-2025-12-13.json
- non-blocking-compute-endpoint-2025-12-13.json
- baseline-before-optimization-2025-12-13.json
```

---

## Baseline Analysis Tools

### Simple Comparison (jq)

```bash
# Extract and compare metrics
jq '.throughput.average' baseline1.json
jq '.throughput.average' baseline2.json

# Calculate percentage change
req1=$(jq '.throughput.average' baseline1.json)
req2=$(jq '.throughput.average' baseline2.json)
echo "Change: $(echo "scale=1; (($req2-$req1)/$req1)*100" | bc)%"
```

### Node.js Comparison Script

```javascript
// compare-baselines.js
const fs = require('fs');

const baseline1 = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const baseline2 = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));

const metrics = ['throughput', 'latency'];

console.log('Baseline Comparison:');
console.log('-------------------');

const req1 = baseline1.throughput.average;
const req2 = baseline2.throughput.average;
const pctChange = ((req2 - req1) / req1 * 100).toFixed(1);

console.log(`Requests/sec: ${req1} → ${req2} (${pctChange}%)`);

const lat1 = baseline1.latency.p99;
const lat2 = baseline2.latency.p99;
const latChange = ((lat2 - lat1) / lat1 * 100).toFixed(1);

console.log(`p99 Latency: ${lat1}ms → ${lat2}ms (${latChange}%)`);

// Fail if regression > 5%
if (pctChange < -5) {
  console.error('❌ PERFORMANCE REGRESSION DETECTED');
  process.exit(1);
}

console.log('✓ Baseline acceptable');
process.exit(0);
```

---

## Summary

**Baseline establishment enables**:
- ✓ Regression detection
- ✓ Improvement measurement
- ✓ CI/CD automation
- ✓ Performance budgeting
- ✓ Historical tracking

**Start now**:
1. Run initial baselines (blocking and non-blocking)
2. Store in version control
3. Document environment
4. Use for regression detection
5. Refresh monthly

Your baselines are your performance safety net!
