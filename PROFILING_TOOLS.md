# Phase 3: Profiling with Clinic.js, 0x, V8 Profiler & Others

**Priority: MEDIUM** | **Tool Categories:** Automated Diagnosis, Flamegraphs, Profiling, Monitoring

---

## Tool 1: Clinic.js – Automated Diagnosis

### Overview

Clinic.js provides three profiling modes that automatically diagnose performance issues:
- **`clinic doctor`**: Comprehensive diagnosis (CPU, memory, I/O, event loop)
- **`clinic flame`**: CPU flamegraph visualization
- **`clinic bubbleprof`**: Latency and concurrency analysis

### Installation

```bash
npm install -g clinic
```

### Workflow: Clinic Doctor (Recommended Starting Point)

**Purpose**: Get automated diagnosis of performance issues.

**Steps**:

1. **Start Clinic Doctor**
```bash
cd blocking
npm run clinic:doctor
# Starts the app and collects profiling data
```

2. **Generate Load** (in another terminal)
```bash
# Keep it running for 30-45 seconds while profiling
autocannon -c 10 -d 45 http://localhost:3000
```

3. **Stop the app** (Ctrl+C)
```
Ctrl+C to stop blocking app
# Clinic generates HTML report
# Opens automatically in default browser
```

### Reading the Clinic Doctor Report

**The report shows:**

| Section | What It Shows | Good vs. Bad |
|---------|---------------|------------|
| **CPU** | CPU usage % | Blocking app: 80-90% | Non-blocking: 30-50% |
| **Memory** | Heap growth | Blocking: steady | Non-blocking: spiky but recovers |
| **I/O** | File/network ops | Both similar if using same I/O |
| **Event Loop** | Blocking duration | Blocking: HIGH | Non-blocking: LOW |
| **Delay** | Request delay | Blocking: increases with concurrency | Non-blocking: stable |

**Typical Blocking App Diagnosis**:
```
⚠️ EVENT LOOP WARNING
Event loop blocked for 120-250ms
Recommendation: Use async/await for I/O operations

🔴 PERFORMANCE ISSUE
High CPU usage with increasing latency
Root cause: Synchronous operations blocking event loop
```

**Typical Non-Blocking App Diagnosis**:
```
✅ Event loop healthy
No significant blocking detected

✅ Good memory management
Proper garbage collection observed

✅ Scaling efficiently
Latency stable under load
```

### Workflow: Clinic Flame (CPU Flamegraph)

**Purpose**: Visualize which functions consume CPU time.

**Steps**:

1. **Start Clinic Flame**
```bash
cd blocking
npm run clinic:flame
```

2. **Generate Load**
```bash
autocannon -c 5 -d 30 http://localhost:3000/compute
```

3. **Stop and View Flamegraph**
```
# Clinic generates HTML flamegraph
# Opens in browser automatically
```

### Reading the Flamegraph

**Structure**:
- X-axis: Time (proportional to CPU time spent)
- Y-axis: Call stack (bottom = root, top = current function)
- Width: How much CPU time function consumed
- Color: Function name/module

**Blocking App Flamegraph Example**:
```
┌─────────────────────────────────────────────┐
│          blockingCompute (WIDE!)            │  ← Wide block = lots of CPU
├──────────┬──────────────────┬───────────────┤
│ for loop │ Math.sqrt()      │ arithmetic    │  ← Many calls to sqrt
├──────────┴──────────────────┴───────────────┤
│  blockingCompute (called by route handler)  │
├─────────────────────────────────────────────┤
│  request handler / HTTP layer               │
└─────────────────────────────────────────────┘
```

**Non-Blocking App Flamegraph Example**:
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ setImmed │  │  setImmed│  │  setImmed│  ← Short blocks with gaps
├──────────┤  ├──────────┤  ├──────────┤
│ compute  │  │ compute  │  │ compute  │
├──────────┤  ├──────────┤  ├──────────┤
│ route    │  │ route    │  │ route    │
└──────────┘  └──────────┘  └──────────┘
  (yields)      (yields)      (yields)
```

**Key Indicators**:
- **Wide, tall block** = Blocking operation
- **Many small blocks with gaps** = Good async pattern
- **Thin, deep call stack** = Efficient code
- **Wide, shallow stack** = CPU-intensive work

### Tips for Clinic

```bash
# Run without opening browser
clinic doctor --no-open -- node src/index.js

# Save results with custom name
clinic doctor --output ./results/blocking-doctor

# Longer profiling for accuracy
# Just keep app running longer under load
clinic doctor -- node src/index.js
# Then run load test for 60+ seconds

# Analyze specific workload
# Run app, trigger specific endpoints while profiling
# Then interpret results
```

---

## Tool 2: 0x – Flamegraph Visualization

### Overview

0x creates interactive HTML flamegraphs with zoom and search capabilities. It's particularly good for understanding call stacks and function execution time.

### Installation

```bash
npm install -g 0x
```

### Workflow

**Steps**:

1. **Start 0x profiling**
```bash
cd blocking
npm run 0x
# Starts the app with V8 profiler enabled
```

2. **Generate Load**
```bash
# In another terminal, create meaningful load
autocannon -c 10 -d 30 http://localhost:3000/compute
```

3. **Stop and Generate Flamegraph**
```
# Stop app (Ctrl+C)
0x automatically generates flamegraph.html
Opens in browser
```

### Reading 0x Flamegraphs

**Interactive Features**:
- **Click block**: Zoom into function
- **Search (Ctrl+F)**: Find functions by name
- **Hover**: Shows function details (time, percentage)
- **Right-click**: Context options

**Interpretation**:

| Indicator | Blocking App | Non-Blocking App |
|-----------|-------------|-----------------|
| **Tallest blocks** | blockingCompute, for loops | setImmediate, Promise.then |
| **Widest blocks** | Computation (many ms) | Short bursts, many yields |
| **Color pattern** | Solid tall blocks | Fragmented short blocks |
| **Depth** | Deep but busy | Shallow busy sections |

### Tips for 0x

```bash
# Profiling takes samples, so longer is better
# Let it run for 60+ seconds for accurate data
cd blocking
npm run 0x
# Keep generating requests for 60 seconds
# Ctrl+C and view results

# Searching for specific functions
# Once flamegraph opens, Ctrl+F
# Search: "blockingCompute" to find where it dominates
```

---

## Tool 3: V8 Profiler (--prof)

### Overview

Node's built-in V8 profiler (`--prof` flag) generates sampling data that can be converted to readable format. It's lightweight and requires no dependencies.

### Workflow

**Steps**:

1. **Start with V8 profiling enabled**
```bash
cd blocking
npm run prof
# Starts app and profiles with --prof flag
```

2. **Generate Load**
```bash
autocannon -c 10 -d 30 http://localhost:3000/compute
```

3. **Stop app and Process Results**
```
# Stop (Ctrl+C)
# Creates isolate-XXXXXXX-v8.log file
```

4. **Convert to Readable Format**
```bash
# Use Node's built-in processor
node --prof-process isolate-*-v8.log > results.txt

# View results
cat results.txt
# or
more results.txt
```

### Reading V8 Profiler Output

**Structure**:
```
ticks  total  nonlib   name
 1523   28.8%   28.8%  /home/user/blocking/src/operations.js:5:15 blockingCompute
  892   16.9%   16.9%  Math.sqrt
  567   10.7%   10.7%  for loop increment
  ...
```

**Interpretation**:
- **ticks**: How many times sampled (more = more CPU time)
- **total %**: Percentage of total time
- **nonlib %**: Time outside Node.js internals
- **name**: Function name and location

**Blocking App Result Example**:
```
 ticks  total  nonlib   name
 8920   89.2%   89.2%  blockingCompute (operations.js:5)
 1234   12.3%   12.3%  Math.sqrt
  456    4.6%    4.6%  for loop
  123    1.2%    1.2%  other
```

**Non-Blocking App Result Example**:
```
 ticks  total  nonlib   name
 2456   24.6%   24.6%  blockingCompute async (operations.js:5)
 1200   12.0%   12.0%  setImmediate internals
  567    5.7%    5.7%  Promise handling
 3456   34.6%   34.6%  [idle]  ← Can process other requests!
  ...
```

### Tips for V8 Profiler

```bash
# Profile for longer, more accurate results
# Run load test while profiling for 60+ seconds
npm run prof
# autocannon for 60 seconds

# Multiple runs for comparison
npm run prof
# autocannon, then Ctrl+C
node --prof-process isolate-*-v8.log > blocking-profile.txt

# Compare files
diff blocking-profile.txt non-blocking-profile.txt
```

---

## Tool 4: Custom Event Loop Monitor

### Overview

Both apps have built-in EventLoopMonitor that detects blocking in real-time.

### How It Works

**Implementation** (in `src/index.js`):
```javascript
class EventLoopMonitor {
  constructor(thresholdMs = 50) {
    this.thresholdMs = thresholdMs
    this.blockingEvents = 0
    this.maxDelay = 0
    this.lastCheck = Date.now()
  }

  check() {
    const now = Date.now()
    const actualDelay = now - this.lastCheck
    const blockingTime = actualDelay - 100  // Expected ~100ms

    if (blockingTime > this.thresholdMs) {
      console.warn(`⚠️ Event loop blocked for ${blockingTime}ms`)
      this.blockingEvents++
      this.maxDelay = Math.max(this.maxDelay, blockingTime)
    }

    this.lastCheck = now
  }
}
```

### Workflow

**Real-Time Detection During Load Testing**

1. **Start App with Visible Output**
```bash
cd blocking
npm start 2>&1 | tee blocking-test.log
# All output captured to file AND shown
```

2. **Generate Load in Another Terminal**
```bash
autocannon -c 10 -d 30 http://localhost:3000
```

3. **Watch Real-Time Blocking Warnings**
```
⚠️ Warning: Event loop blocked for 120ms (threshold: 50ms)
⚠️ Warning: Event loop blocked for 180ms (threshold: 50ms)
⚠️ Warning: Event loop blocked for 95ms (threshold: 50ms)
⚠️ Warning: Event loop blocked for 160ms (threshold: 50ms)
```

4. **At Shutdown, See Summary**
```
EventLoopMonitor Stats:
- Blocking events: 156
- Max blocking duration: 320ms
- Threshold: 50ms
```

### Interpretation

**Blocking App** (under load):
```
Blocking events: 150+
Max duration: 300-400ms
Pattern: Regular warnings every 100-200ms
Meaning: Consistent blocking under load
```

**Non-Blocking App** (under load):
```
Blocking events: 0-5
Max duration: <50ms
Pattern: Rare or no warnings
Meaning: Event loop stays responsive
```

### Customizing Threshold

Edit `src/index.js`:
```javascript
// Change threshold to 100ms (more lenient)
const monitor = new EventLoopMonitor(100)

// Change check interval to 50ms (more frequent checks)
const monitor = new EventLoopMonitor(50, 50)
```

---

## Tool 5: Winston Logging

### Overview

Winston provides structured logging with JSON output, useful for capturing performance data in logs.

### Integration with Profiling

**Add to operations.js**:
```javascript
import winston from 'winston'

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

function blockingCompute(limit) {
  const start = Date.now()
  let sum = 0
  for (let i = 0; i < limit; i++) {
    sum += Math.sqrt(i)
  }
  const duration = Date.now() - start
  
  logger.info('compute-completed', {
    operation: 'blockingCompute',
    limit,
    duration,
    timestamp: new Date()
  })
  
  return sum
}
```

### Analyzing Logs

After running load test:
```bash
# Filter compute operations
grep 'blockingCompute' combined.log

# Extract durations
jq '.duration' combined.log | sort -n

# Statistics
jq '.duration' combined.log | awk '{sum+=$1; count++} END {print "Avg:", sum/count "ms"}'
```

### Tips

```bash
# Real-time log monitoring
tail -f combined.log | jq .

# Filter by severity
grep '"level":"error"' combined.log
```

---

## Tool 6: Pino Logging

### Overview

Pino is a faster, more lightweight alternative to Winston with similar JSON output capability.

### Integration

**Add to operations.js**:
```javascript
import pino from 'pino'

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino/file',
    options: { destination: './app.log' }
  }
})

function blockingCompute(limit) {
  const start = Date.now()
  let sum = 0
  for (let i = 0; i < limit; i++) {
    sum += Math.sqrt(i)
  }
  const duration = Date.now() - start
  
  logger.info({
    operation: 'blockingCompute',
    limit,
    duration
  })
  
  return sum
}
```

### Advantages over Winston

- **Faster**: 6x faster logging
- **Lower overhead**: Less impact on profiling results
- **JSON-first**: All output is JSON
- **Same analysis**: Same filtering and analysis techniques

---

## Tool 7: Memory Leak Detection

### Overview

Detecting memory leaks using heap snapshots and timeline analysis.

### Workflow

**Step 1: Take Baseline Heap Snapshot**

Using Chrome DevTools (see PROFILING_DEVTOOLS.md):
1. Connect Inspector: `npm run inspect`
2. Go to Memory tab
3. Click "Take heap snapshot"
4. Save as `baseline.heapsnapshot`

**Step 2: Run Heavy Load**

```bash
# Run for 60+ seconds to see memory patterns
autocannon -c 20 -d 60 http://localhost:3000
```

Monitor memory in DevTools console:
```javascript
setInterval(() => {
  const mb = process.memoryUsage().heapUsed / 1024 / 1024
  console.log(`Heap: ${mb.toFixed(2)}MB`)
}, 1000)
```

**Step 3: Take Load Snapshot**

While load is running:
1. In DevTools, take another heap snapshot
2. Save as `loaded.heapsnapshot`

**Step 4: Take Recovery Snapshot**

After load stops:
1. Wait 30 seconds for garbage collection
2. Take final snapshot
3. Save as `recovered.heapsnapshot`

### Analysis

**In DevTools Memory tab**:

1. Select "Comparison" mode
2. Choose recovered vs baseline
3. Look for objects that remain allocated

**Normal Pattern** (No Leak):
```
Baseline: 45 MB
Loaded: 52 MB
Recovered: 46 MB  ← Returns to baseline
Delta: +1 MB (normal variation)
```

**Leak Pattern**:
```
Baseline: 45 MB
Loaded: 52 MB
Recovered: 75 MB  ← Stays high!
Delta: +30 MB (objects retained)
```

### Identifying Leak Source

In "Comparison" view:
- Look for "Δ Delta" column
- Click largest delta entries
- DevTools shows what's being retained
- Look for request handlers, socket buffers, listener arrays

**Common Leak Causes**:
- Event listeners not removed
- Timer callbacks not cleared
- Socket references held
- Large response buffers cached

---

## Tool 8: Comparison Matrix & Summary

### Overview

A summary table comparing all tools and their strengths.

### Comprehensive Comparison Matrix

| Tool | Type | Setup Time | Learning Curve | Best For | Output |
|------|------|-----------|---------------|---------|---------| 
| **autocannon** | Load Testing | 1 min | Easy | Throughput, latency | Text table |
| **Chrome DevTools** | Visual Debugger | 2 min | Medium | Real-time debugging | Interactive UI |
| **Clinic.js** | Diagnosis | 2 min | Easy | Automated diagnosis | HTML report |
| **0x** | Flamegraph | 1 min | Easy | Call stack viz | HTML flamegraph |
| **V8 Profiler** | Profiler | 3 min | Medium | Low-overhead prof | Text format |
| **EventLoopMonitor** | Real-time Monitor | Built-in | Easy | Blocking detection | Console output |
| **Winston/Pino** | Logging | 3 min | Medium | Data correlation | JSON logs |
| **Heap Snapshot** | Memory | 2 min | Medium | Leak detection | HTML snapshot |

### Decision Tree: Which Tool to Use?

```
Question 1: Want quick initial assessment?
  YES → autocannon (1 minute)
  NO  → Continue

Question 2: Want visual debugging?
  YES → Chrome DevTools
  NO  → Continue

Question 3: Want automated diagnosis?
  YES → Clinic.js
  NO  → Continue

Question 4: Need flamegraph visualization?
  YES → 0x or Clinic flame
  NO  → Continue

Question 5: Hunting for memory leak?
  YES → Heap snapshots + DevTools Memory
  NO  → Continue

Question 6: Need low-level profiling data?
  YES → V8 Profiler (--prof)
  NO  → Use EventLoopMonitor for monitoring
```

### Recommended Profiling Sequence

**Quick Diagnosis (10 minutes)**:
1. `npm run load-test` → See latency/throughput
2. Watch EventLoopMonitor output → See blocking events
3. Done! Clear pattern visible

**Detailed Analysis (30 minutes)**:
1. `npm run clinic:doctor` → Automated diagnosis
2. `npm run load-test` while profiling → Generate data
3. Review report → Understand issues

**Deep Dive (60+ minutes)**:
1. Chrome DevTools → Interactive debugging
2. `npm run 0x` → Flamegraph analysis
3. Heap snapshots → Memory analysis
4. V8 Profiler → Low-level data
5. Create comparison report

---

## Integration: Using Multiple Tools Together

### Scenario 1: Identify Blocking Issue

```
Step 1: autocannon shows latency increasing
  ↓
Step 2: EventLoopMonitor confirms blocking warnings
  ↓
Step 3: Chrome DevTools shows which function blocks
  ↓
Step 4: 0x flamegraph shows exact call stack
  ↓
Result: Precise identification of problem
```

### Scenario 2: Memory Concern

```
Step 1: EventLoopMonitor + logging shows memory growth
  ↓
Step 2: Heap snapshots confirm retention
  ↓
Step 3: Chrome DevTools identifies retained objects
  ↓
Step 4: V8 Profiler shows allocation sources
  ↓
Result: Memory leak found and fixed
```

### Scenario 3: Performance Optimization

```
Step 1: autocannon baseline establishes metrics
  ↓
Step 2: Clinic.js identifies bottleneck
  ↓
Step 3: Code change implemented
  ↓
Step 4: autocannon re-run compares improvement
  ↓
Result: Measurable performance gain
```

---

## Troubleshooting Guide for All Tools

### Common Issues Across Tools

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Port already in use** | `EADDRINUSE 3000` | Kill existing process or use different port |
| **Permission denied** | When installing global tools | Use `sudo` or configure npm |
| **Tool not found** | `command not found: clinic` | Reinstall: `npm install -g clinic` |
| **No output** | Tool runs but shows nothing | Check app is actually handling requests |
| **Large memory usage** | Tool itself uses 500MB+ | Reduce test duration or concurrency |

### Tool-Specific Solutions

**autocannon**:
- If results inconsistent: Use warm-up run first
- If errors appear: Reduce concurrency

**Chrome DevTools**:
- If won't connect: Restart inspector with `-brk` flag
- If slow: Remove all breakpoints

**Clinic.js**:
- If report empty: Run longer with more load
- If won't open: Use `--no-open` flag, open manually

**0x**:
- If flamegraph cuts off: Make sure app ran long enough
- If colors confusing: Use search to find your functions

**V8 Profiler**:
- If log file huge: Use shorter profiling time
- If unreadable: Make sure to run `--prof-process`

---

## Best Practices Summary

✅ **DO**:
- Use multiple tools to corroborate findings
- Run warm-up iterations before measuring
- Profile under realistic load (10+ connections)
- Compare blocking vs. non-blocking with identical parameters
- Keep results for baseline/regression comparison
- Document your findings for future reference

❌ **DON'T**:
- Trust single-run results (variance is high)
- Profile with no load (won't show real issues)
- Mix results from different profiling sessions
- Change code between profiling runs
- Profile with too many connections at once (>50)
- Trust memory in first 30 seconds (JIT warmup)

---

## Next Steps

1. **Try each tool** on both blocking and non-blocking apps
2. **Compare results** - they should align
3. **Create baseline** with all tools
4. **Establish thresholds** for acceptable performance
5. **Use in CI/CD** for regression detection

Your profiling toolkit is now complete! Start with autocannon and Chrome DevTools, then drill deeper with the other tools as needed.
