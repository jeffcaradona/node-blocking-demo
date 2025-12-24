# Phase 3: Profiling Troubleshooting & Integration Guide

**Priority: MEDIUM** | **Categories:** Troubleshooting, Best Practices, Tool Integration

---

## Part 1: Troubleshooting Guide

### Common Issues & Solutions

#### 1. Ports Already in Use

**Error Message**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Causes**:
- Previous Node.js process still running
- Another application using the port
- OS socket not released yet

**Solutions**:

**Windows (PowerShell)**:
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID with actual ID)
taskkill /PID 12345 /F

# Or use direct npm stop if available
npm stop
```

**macOS/Linux**:
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Prevention**:
```bash
# Use different ports for testing
NODE_PORT=3010 npm start  # Custom port
```

#### 2. Inspector Connection Failed

**Error Message**:
```
Failed to resolve version of chrome
Cannot connect to inspector
```

**Causes**:
- Chrome/Chromium not installed
- Inspector port blocked
- Incorrect localhost reference

**Solutions**:

**Install Chromium**:
```bash
# macOS
brew install chromium

# Windows (Chocolatey)
choco install chromium

# Ubuntu/Debian
sudo apt-get install chromium-browser
```

**Use Different Browser**:
- Microsoft Edge works great (also Chromium-based)
- Brave browser works
- Even older Chrome versions work

**Manual DevTools Connection**:
```bash
# If automatic opening fails, copy debugger URL:
# Debugger listening on ws://127.0.0.1:9229/...

# Paste into browser:
# devtools://devtools/bundled/js_app.html?ws=127.0.0.1:9229/...
```

**VS Code Alternative**:
- Install "Debugger for Chrome" extension
- No browser needed, debug in editor

#### 3. High Inconsistency in Test Results

**Symptom**:
```
Run 1: 220 req/sec
Run 2: 180 req/sec
Run 3: 250 req/sec
```

**Root Causes**:
- JIT compilation still warming up
- Other processes interfering
- Test too short for statistical significance
- Network variability

**Solutions**:

**Warm-up Iterations**:
```bash
# Run short warm-up first
autocannon -c 5 -d 10 http://localhost:3000

# Wait 5 seconds
sleep 5

# Run actual test
autocannon -c 10 -d 30 http://localhost:3000
```

**Longer Test Duration**:
```bash
# Instead of 30 seconds
autocannon -c 10 -d 60 http://localhost:3000  # 60 seconds

# Or even longer for more confidence
autocannon -c 10 -d 120 http://localhost:3000  # 2 minutes
```

**Isolate System**:
- Close unnecessary applications
- Stop background processes
- Turn off notifications
- Kill other Chrome tabs
- Restart Node.js between runs

**Average Multiple Runs**:
```bash
# Run 3 times and average results
for i in 1 2 3; do
  echo "=== Run $i ==="
  autocannon -c 10 -d 30 http://localhost:3000
  sleep 5
done
```

#### 4. Memory Grows Unbounded

**Symptom**:
```
Heap used: 50MB
Heap used: 75MB
Heap used: 95MB  ← Keeps growing!
```

**Potential Causes**:
- Memory leak in application
- Tool itself has leak
- Garbage collection paused
- Large accumulating buffers

**Diagnosis Steps**:

1. **Check if it's the app or tool**:
```bash
# Stop load test
# Wait 30 seconds
# Take heap snapshot

# Memory should recover if app is fine
```

2. **Enable garbage collection between loads**:
```bash
# Add manual GC in app
setInterval(() => {
  if (global.gc) global.gc()
}, 10000)

# Run with explicit GC
node --expose-gc src/index.js
```

3. **Profile memory allocation**:
```bash
# Use Chrome DevTools Memory profiler
npm run inspect

# Record allocation timeline while load runs
# Look for objects that aren't being freed
```

**Solutions**:

**If It's the App**:
- Check for event listeners not being removed
- Look for accumulating arrays/objects
- Use heap snapshots to identify what's retained
- See PROFILING_DEVTOOLS.md memory section

**If It's the Tool**:
- Reduce test concurrency
- Reduce test duration
- Use different tool (e.g., V8 Profiler instead of Clinic)
- Split into multiple shorter tests

#### 5. Clinic.js Report is Empty or Blank

**Symptom**:
```
Opening clinic report
[HTML file opens but shows no data]
```

**Causes**:
- App didn't handle enough requests
- Test was too short
- Load wasn't realistic

**Solutions**:

**Generate More Load**:
```bash
# Start clinic
cd blocking
npm run clinic:doctor

# In another terminal, run longer test
autocannon -c 20 -d 60 http://localhost:3000  # Longer + higher concurrency
```

**Ensure App is Running**:
```bash
# Verify requests are actually being processed
curl http://localhost:3000/

# Should see response
```

**Open Report Manually**:
```bash
# Clinic saves to .clinic directory
cd .clinic

# Look for generated report
ls -la

# Open HTML file directly in browser
open clinic-report.html
```

#### 6. 0x Flamegraph Shows Minimal Data

**Symptom**:
```
Flamegraph loads but shows very little
Most time spent in [idle] or [native]
```

**Causes**:
- App didn't run long enough
- Requests completed too quickly
- Profiling overhead high

**Solutions**:

**Extend Profiling Time**:
```bash
# Let it profile for 60+ seconds
npm run 0x

# In another terminal
# Run load test for entire duration
for i in {1..60}; do
  curl http://localhost:3000/compute &
done
wait
```

**Increase Work Per Request**:
```bash
# Make requests do more work
curl http://localhost:3000/compute?limit=10000000  # Larger computation
```

**Use More Concurrency**:
```bash
# More concurrent requests = more CPU time
autocannon -c 50 -d 60 http://localhost:3000
```

#### 7. Node Process Crashes During Profiling

**Error**:
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed
JavaScript heap out of memory
```

**Causes**:
- Test concurrency too high
- Response bodies too large
- Request accumulation
- Tool memory overhead

**Solutions**:

**Reduce Concurrency**:
```bash
# Instead of -c 50
autocannon -c 10 -d 30 http://localhost:3000
```

**Increase Heap Size**:
```bash
# Run with larger heap
node --max-old-space-size=2048 src/index.js
# or
NODE_OPTIONS='--max-old-space-size=2048' npm start
```

**Reduce Response Size**:
```bash
# Test endpoint that returns less data
curl http://localhost:3000/  # Health check, small response
```

**Use Lighter Tool**:
```bash
# V8 Profiler is lightweight
npm run prof

# Instead of clinic which uses more memory
npm run clinic:doctor
```

#### 8. "Permission Denied" When Installing Global Tools

**Error**:
```
Error: EACCES: permission denied, open '/usr/local/lib/node_modules/clinic'
```

**Causes**:
- npm permissions not configured correctly
- Using sudo (not recommended)
- Node.js installed globally with restricted permissions

**Solutions**:

**Option 1: Fix npm Permissions** (Recommended)
```bash
# Create .npm-global directory
mkdir ~/.npm-global

# Configure npm to use it
npm config set prefix '~/.npm-global'

# Add to PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Now install global packages
npm install -g clinic
```

**Option 2: Use npx** (No Installation)
```bash
# Run tools without installing globally
npx autocannon -c 10 -d 30 http://localhost:3000
npx clinic doctor -- node src/index.js
npx 0x -- node src/index.js
```

**Option 3: Docker** (Isolated Environment)
```bash
# If developing in Docker, permissions are easier
docker run -it node:25
npm install -g clinic
```

#### 9. EventLoopMonitor Shows No Warnings

**Symptom**:
```
App runs, no blocking warnings, but autocannon shows high latency
```

**Possible Causes**:
- Threshold too high (50ms default might miss some blocks)
- Blocking happening in different process/worker
- Network latency, not application blocking

**Solutions**:

**Lower Threshold**:
```javascript
// In src/index.js
const monitor = new EventLoopMonitor(25)  // More sensitive (25ms instead of 50ms)
```

**Check Latency Source**:
```bash
# Is latency from network or app?
# Test with localhost - if still high, it's the app
autocannon -c 10 -d 30 http://localhost:3000

# Test same endpoint multiple times
curl http://localhost:3000/compute
curl http://localhost:3000/compute
curl http://localhost:3000/compute
```

**Verify Load is Real**:
```bash
# Check autocannon is actually hitting your app
# Look for request logs in app output
# Increase concurrency to ensure real load
autocannon -c 20 -d 30 http://localhost:3000
```

---

## Part 2: Tool Integration & Best Practices

### Combining Tools for Maximum Insight

#### Integration Pattern 1: Quick Performance Check

**When to use**: Initial performance assessment, pre-commit checks, CI/CD

**Workflow**:
```
1. Start app: npm start
2. Run load test: npm run load-test
3. Observe EventLoopMonitor output
4. Done! (2 minutes total)
```

**Output**:
- Latency percentiles from autocannon
- Blocking events from EventLoopMonitor
- Pass/fail on performance thresholds

**Example Result**:
```
✅ Throughput: 530 req/sec (target: 400+)
✅ p99 latency: 60ms (target: <100ms)
✅ Blocking events: 0 (target: <10)
```

#### Integration Pattern 2: Root Cause Analysis

**When to use**: Performance degradation detected, debugging specific issue

**Workflow**:
```
1. Run autocannon → See problem (high latency/low throughput)
2. Run Clinic Doctor → Get diagnosis
3. Use Chrome DevTools → Pinpoint exact function
4. Use 0x flamegraph → Confirm call stack
5. Review EventLoopMonitor → Verify blocking pattern
```

**Output**:
- Specific function causing blocking
- Exact line number in code
- Call stack showing how we got there
- Visual confirmation in flamegraph

**Example**: "blockingCompute function at operations.js:15 is blocking for 200ms due to for loop"

#### Integration Pattern 3: Memory Issue Investigation

**When to use**: Memory growth detected, potential leak suspected

**Workflow**:
```
1. Monitor memory: npm start (watch output)
2. Run extended load: autocannon -c 10 -d 120
3. Take heap snapshots: Chrome DevTools Memory
4. Compare snapshots: Identify retained objects
5. Use logging: Winston/Pino to track allocations
```

**Output**:
- Heap size over time graph
- Objects retaining memory
- Where allocations come from
- Confirmation of leak vs. normal variation

**Example**: "Event listeners accumulated 1000+ items, never cleaned up"

#### Integration Pattern 4: Performance Optimization Verification

**When to use**: After code change, verify improvement

**Workflow**:
```
1. Establish baseline: npm run baseline
2. Make code changes
3. Re-run baseline: npm run baseline
4. Compare results: Measure improvement
5. Document: Save both for history
```

**Output**:
- Before metrics
- After metrics
- % improvement
- Confirmation regression didn't occur

**Example**: "Latency improved from 120ms p99 to 65ms p99 (46% reduction)"

### Recommended Tool Sequences by Scenario

#### Scenario: "It's Slow"

| Step | Tool | Duration | Goal |
|------|------|----------|------|
| 1 | autocannon | 30s | Quantify slowness |
| 2 | EventLoopMonitor | Passive | Confirm blocking |
| 3 | Clinic Doctor | 45s | Get diagnosis |
| 4 | Chrome DevTools | 5-10min | Debug exact cause |
| 5 | 0x flamegraph | 30s | Visualize call stack |

**Total Time**: ~15-20 minutes to identify root cause

#### Scenario: "Memory is Leaking"

| Step | Tool | Duration | Goal |
|------|------|----------|------|
| 1 | Monitor memory | Continuous | See leak pattern |
| 2 | Heap snapshots | 2-3 min | Capture states |
| 3 | DevTools Memory | 10min | Compare snapshots |
| 4 | V8 Profiler | 60s | Find allocations |
| 5 | Logging | Ongoing | Correlate with code |

**Total Time**: ~20-30 minutes to identify leak source

#### Scenario: "Performance Degraded (Regression)"

| Step | Tool | Duration | Goal |
|------|------|----------|------|
| 1 | Baseline load test | 30s | Compare to baseline |
| 2 | git bisect | 5-10min | Find breaking commit |
| 3 | Chrome DevTools | 5min | See what changed |
| 4 | Clinic Doctor | 45s | Diagnose change |

**Total Time**: ~20-30 minutes to find regression

### Avoiding Common Integration Mistakes

#### ❌ Don't: Profile with Multiple Tools Simultaneously

**Bad**:
```bash
# Running multiple profilers at once
npm run clinic:doctor &
npm run 0x &
npm run prof &
autocannon ...
```

**Problem**: Tools interfere, results are wrong

**Good**:
```bash
# Run one tool at a time
npm run clinic:doctor
# Wait for results
npm run 0x
# Wait for results
npm run prof
```

#### ❌ Don't: Trust Single-Run Results

**Bad**:
```
One test run shows:
  Requests/sec: 220
Conclusion: Performance is 220 req/sec
```

**Problem**: One-time variance (GC, system load, etc.) distorts results

**Good**:
```
Three test runs show:
  Run 1: 220 req/sec
  Run 2: 225 req/sec
  Run 3: 218 req/sec
Average: 221 ± 3 req/sec
Conclusion: Stable at ~221 req/sec
```

#### ❌ Don't: Mix Different Load Profiles

**Bad**:
```
Blocking app: Test with 10 connections for 30 seconds
Non-blocking app: Test with 20 connections for 60 seconds
```

**Problem**: Results aren't comparable

**Good**:
```
Both apps: Test with 10 connections for 30 seconds
Same parameters → Fair comparison
```

#### ❌ Don't: Profile Code That's Still Warming Up

**Bad**:
```bash
npm start
# Immediately:
autocannon -c 10 -d 30 http://localhost:3000
```

**Problem**: JIT compilation happening, results unreliable

**Good**:
```bash
npm start
# Wait 10-20 seconds
# Then:
autocannon -c 10 -d 30 http://localhost:3000
```

#### ❌ Don't: Ignore System Load

**Bad**:
```
Profile while:
- Compiling in another terminal
- Video call running
- Browser with 50 tabs open
- Large download in progress
```

**Problem**: System contention affects results

**Good**:
```
Profile while:
- System idle
- No competing processes
- Fresh Node.js startup
- Network clear
```

### Best Practices Checklist

**Before Each Profiling Session** ✓

- [ ] Close unnecessary applications
- [ ] Kill previous Node.js processes
- [ ] Clear any `isolate-*.log` files
- [ ] Ensure app runs successfully (`npm start`)
- [ ] Verify endpoints respond (`curl http://localhost:3000`)
- [ ] Plan which tool to use and test parameters

**During Profiling** ✓

- [ ] Keep server terminal visible for EventLoopMonitor output
- [ ] Monitor memory usage if concerned about leaks
- [ ] Note any errors or warnings
- [ ] Keep test parameters consistent
- [ ] Run warm-up iteration first
- [ ] Record test parameters (concurrency, duration, endpoint)

**After Profiling** ✓

- [ ] Save results with descriptive names
- [ ] Compare both apps (blocking vs. non-blocking)
- [ ] Document findings
- [ ] Clean up temporary files
- [ ] Share results with team if collaborative

### Creating Reproducible Benchmarks

**Template for Benchmark Script**:
```bash
#!/bin/bash
# benchmark-blocking.sh

echo "=== Blocking App Benchmark ==="
echo "Date: $(date)"
echo "Parameters: 10 connections, 30 seconds"

cd blocking
npm start &
PID=$!

sleep 5

echo "Running warmup..."
autocannon -c 5 -d 10 http://localhost:3000 > /dev/null

sleep 2

echo "Running benchmark..."
autocannon -c 10 -d 30 -R > results-blocking-$(date +%s).json

kill $PID
```

**Template for Comparison**:
```bash
#!/bin/bash
# benchmark-compare.sh

echo "=== Performance Comparison ==="
echo "Timestamp: $(date)" | tee comparison.log

# Blocking
cd blocking
npm start &
PID_BLOCK=$!
sleep 5
echo "Testing blocking app..." | tee -a comparison.log
autocannon -c 10 -d 30 http://localhost:3000 >> comparison.log
kill $PID_BLOCK

sleep 5

# Non-blocking
cd ../non-blocking
npm start &
PID_NONBLOCK=$!
sleep 5
echo "Testing non-blocking app..." | tee -a comparison.log
autocannon -c 10 -d 30 http://localhost:3001 >> comparison.log
kill $PID_NONBLOCK

echo "Results saved to comparison.log"
```

---

## Part 3: Platform-Specific Notes

### Windows (PowerShell)

**Starting Multiple Apps**:
```powershell
# Terminal 1
cd blocking
npm start

# Terminal 2 (new PowerShell window)
cd non-blocking
npm start

# Terminal 3
cd blocking
npm run load-test
```

**Killing Processes**:
```powershell
# Find by port
netstat -ano | findstr :3000

# Kill by PID (replace 12345)
taskkill /PID 12345 /F
```

**Path Issues**:
- Use backslashes or forward slashes in paths
- UNC paths work: `\\server\share\path`
- Avoid spaces in filenames/paths

### macOS

**Brew Installation for Tools**:
```bash
brew install node
brew install chromium
brew install llvm  # If needed for profiling
```

**Memory Profiling**:
```bash
# macOS has Instruments (built-in profiler)
# Alternative to Chrome DevTools:
instruments -t "System Trace" -l 30 node src/index.js
```

### Linux (Ubuntu/Debian)

**Package Installation**:
```bash
sudo apt-get update
sudo apt-get install nodejs npm
sudo apt-get install chromium-browser
```

**Permissions**:
```bash
# If npm permission issues
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=$PATH:~/.npm-global/bin' >> ~/.bashrc
source ~/.bashrc
```

---

## Summary

**Key Takeaways**:

1. **Start Simple**: autocannon + EventLoopMonitor = most issues identified
2. **Use Sequences**: Follow workflows, don't use all tools at once
3. **Control Variables**: Same parameters for fair comparison
4. **Document**: Save results for baseline and regression detection
5. **Trust Patterns**: Individual runs vary, look for consistent patterns

**When in Doubt**:
1. Run `npm run load-test` → See baseline latency
2. Watch server output → See blocking events
3. If high latency + blocking → Issue confirmed
4. Use Chrome DevTools → Find exact function
5. Fix → Re-run to verify improvement

You now have a complete profiling and troubleshooting guide! Start with the tools and workflows that match your needs.
