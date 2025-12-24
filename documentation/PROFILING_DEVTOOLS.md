# Phase 3: Profiling with Chrome DevTools Inspector

**Priority: HIGH** | **Tool Category:** Visual Debugging & CPU/Memory Profiling

---

## Overview

Chrome DevTools is a visual debugger and profiler accessible through the Node.js Inspector protocol. It provides real-time debugging, CPU profiling, heap snapshots, and event loop inspection - making it ideal for understanding **exactly where** and **why** your code is blocking.

### Why Chrome DevTools?

- **Visual**: See code execution in real-time
- **Interactive**: Pause, step through, inspect variables
- **Multi-faceted**: CPU profiling, memory analysis, debugging
- **Familiar**: Same tools web developers use
- **No dependencies**: Built into Node.js ≥ 6.0

---

## Prerequisites

### Setup

1. **Have Chrome or Chromium installed**
   - Chrome, Chromium, Microsoft Edge, or Brave work
   - Open via `chrome://inspect` (in address bar)

2. **Node.js Inspector Protocol**
   - Built into Node.js (no installation needed)
   - Both apps already have `--inspect` scripts in `package.json`

---

## Workflow 1: Basic Inspector & Debugging

### Purpose
Start the Node.js Inspector and connect Chrome DevTools for real-time debugging.

### Steps

**Terminal 1: Start Inspector Mode**
```bash
cd blocking
npm run inspect
# Output:
# Server running on http://localhost:3000
# Debugger listening on ws://127.0.0.1:9229/...
```

**Terminal 2: Open Chrome DevTools**

1. Open Google Chrome
2. Navigate to `chrome://inspect`
3. Under "Remote Target", you should see your Node.js process
4. Click **Inspect** button

### DevTools Interface

Once opened, you'll see:
- **Sources**: Code editor with breakpoints
- **Console**: JavaScript console
- **Network**: HTTP requests (limited for Node.js)
- **Memory**: Memory usage and heap
- **Performance**: CPU profiling (tab may say "Timeline")

### Setting Breakpoints

1. In the **Sources** tab, locate your code
2. Click line number to set breakpoint
3. Trigger request to hit breakpoint (e.g., visit `http://localhost:3000/slow-sync`)
4. Execution pauses at breakpoint
5. Inspect variables and step through code

### Example: Finding Blocking Code

**Blocking App**
1. Set breakpoint in `/slow-sync` endpoint handler
2. Make request: `curl http://localhost:3000/slow-sync`
3. DevTools pauses at breakpoint
4. Step through to see synchronous file read blocking event loop

**Non-Blocking App**
1. Set same breakpoint in `/slow-async` endpoint
2. Make request: `curl http://localhost:3001/slow-async`
3. Notice: Code runs then **continues immediately** (doesn't wait)
4. Response comes later via Promise callback

---

## Workflow 2: CPU Profiling

### Purpose
Identify which functions consume the most CPU time and cause blocking.

### Steps

**Start Inspector Mode**
```bash
cd blocking
npm run inspect
# Debugger listening on ws://127.0.0.1:9229/...
```

**Open Chrome DevTools** (same as Workflow 1)

**Start Recording CPU Profile**

1. Go to **Performance** tab (may be labeled "Timeline" in older Chrome)
2. Click **Record** circle button (or Cmd/Ctrl+Shift+E)
3. Make requests to the app (10-15 seconds of activity)
   ```bash
   # Send multiple requests
   for i in {1..5}; do curl http://localhost:3000/compute; done
   for i in {1..5}; do curl http://localhost:3000/crypto; done
   ```
4. Click **Record** button again to stop

### Reading the CPU Profile

**Timeline View**:
- X-axis: Time (in milliseconds)
- Y-axis: Function call stack
- Height: Time spent in each function
- Color: Different functions (not meaningful)

**Frame Rate**:
- Expect smooth 60fps when not blocking
- Drops to <30fps during blocking operations

**Main Thread**:
- Shows what Node.js is doing
- Watch for tall stacks = blocking code

### Interpreting Results - Blocking App

```
Timeline shows:
- /compute request arrives
- Main thread goes 100% busy
- Other requests queue up
- Can't process them until compute finishes
```

### Interpreting Results - Non-Blocking App

```
Timeline shows:
- /compute-async request arrives
- Main thread briefly busy (setting up async operation)
- Returns to idle
- Other requests process immediately
- Compute finishes in background
```

---

## Workflow 3: Heap Snapshots (Memory Analysis)

### Purpose
Identify memory leaks and verify proper memory release after operations.

### Steps

**Start Inspector Mode**
```bash
cd blocking
npm run inspect
```

**Open Chrome DevTools**

1. Go to **Memory** tab
2. Select "Heap snapshot" from dropdown
3. Click **Take snapshot** button
4. This captures current memory state

**Take Multiple Snapshots**

1. Take initial snapshot (baseline)
2. Generate load: Run many requests
   ```bash
   autocannon -c 10 -d 30 http://localhost:3000
   ```
3. Take second snapshot (after load)
4. Take third snapshot (after waiting 30 seconds)

### Comparing Snapshots

**In DevTools Memory tab**:

1. Select "Comparison" from dropdown
2. Choose snapshot 1 as baseline
3. Click on snapshot 2 to compare
4. Shows what changed:
   - **[Δ] Delta**: How much memory changed
   - **Objects created**: New allocations
   - **Objects freed**: Deallocations

### What to Look For

**Good (Non-Blocking)**:
- Memory grows during load
- Memory returns to baseline after load ends
- Objects are freed (garbage collected)
- No retained references to request data

**Bad (Blocking)**:
- Memory keeps growing even after load
- Memory doesn't return to baseline
- Large objects retained indefinitely
- Indicates memory leak

### Example: Heap Snapshot Analysis

**Non-Blocking App Result**:
```
Baseline: 45 MB
After load: 52 MB
After waiting: 46 MB ← Memory recovered!
Interpretation: ✓ No leak, normal operation
```

**Memory Leak Example**:
```
Baseline: 45 MB
After load: 52 MB
After waiting: 75 MB ← Memory increased!
Interpretation: ✗ Memory leak detected
```

---

## Workflow 4: Debugging with Breakpoints & Stepping

### Purpose
Step through blocking code to understand exactly where event loop gets stuck.

### Steps

**Start with breakpoint mode** (pauses on startup):
```bash
cd blocking
npm run inspect-brk
```

**Open Chrome DevTools**

**Set Breakpoints**

1. Go to **Sources** tab
2. Find `src/server.js`
3. Find the endpoint handler you want to debug
4. Click line number to set breakpoint
5. Click **Resume** button (play icon) to continue

**Trigger the Code**

```bash
curl http://localhost:3000/compute?limit=1000000
```

DevTools pauses at your breakpoint.

### Stepping Commands

| Command | Keyboard | Meaning |
|---------|----------|---------|
| Resume | F8 | Continue execution |
| Step Over | F10 | Execute current line, move to next |
| Step Into | F11 | Enter function call |
| Step Out | Shift+F11 | Exit current function |

### Inspecting State

While paused:
- **Scope panel**: Local variables, closure variables
- **Watch**: Add custom expressions to watch
- **Console**: Execute code in paused context

### Example: Debugging Blocking

```javascript
// In operations.js - blocking compute
function blockingCompute(limit) {
  let sum = 0;
  for (let i = 0; i < limit; i++) {  // ← Breakpoint here
    sum += Math.sqrt(i);
  }
  return sum;
}
```

**Steps**:
1. Set breakpoint at loop start
2. Run: `curl http://localhost:3000/compute?limit=1000000`
3. Pauses at loop
4. Step through iterations (very slow!)
5. **See exactly** why event loop is stuck: tight synchronous loop

**Contrast with non-blocking**:
```javascript
// In operations.js - non-blocking
async function nonBlockingCompute(limit, chunkSize = 100000) {
  let sum = 0;
  for (let i = 0; i < limit; i++) {  // ← Breakpoint here
    sum += Math.sqrt(i);
    if (i % chunkSize === 0) {
      await new Promise(resolve => setImmediate(resolve));  // ← Yields control!
    }
  }
  return sum;
}
```

1. Set same breakpoint
2. Run: `curl http://localhost:3001/compute-async?limit=1000000`
3. Pauses at loop
4. Step a few iterations
5. Notice: After `setImmediate`, execution returns to event loop
6. Other requests process while compute happens

---

## Workflow 5: Side-by-Side Comparison

### Purpose
Visually compare blocking vs. non-blocking code execution patterns.

### Setup: Two Inspector Windows

**Terminal 1: Start blocking app**
```bash
cd blocking
npm run inspect
# Debugger listening on ws://127.0.0.1:9229/...
```

**Terminal 2: Start non-blocking app (different debug port)**
```bash
cd non-blocking
DEBUG_PORT=9230 node --inspect=127.0.0.1:9230 src/index.js
# Debugger listening on ws://127.0.0.1:9230/...
```

**Chrome: Open two inspection windows**

1. `chrome://inspect`
2. You should see two remote targets
3. Click **Inspect** on first (blocking, port 9229)
4. Open in new window
5. Click **Inspect** on second (non-blocking, port 9230)
6. Arrange windows side-by-side

### Comparison Protocol

**Step 1: Start CPU profiling in both windows**

In blocking DevTools (left):
- Go to **Performance** tab
- Click **Record**

In non-blocking DevTools (right):
- Go to **Performance** tab  
- Click **Record**

**Step 2: Send identical requests**

Open third terminal:
```bash
# Send compute request to both apps simultaneously
curl http://localhost:3000/compute?limit=1000000 &
curl http://localhost:3001/compute-async?limit=1000000 &
wait
```

**Step 3: Stop profiling in both**

Left DevTools: Click **Record** to stop
Right DevTools: Click **Record** to stop

**Step 4: Compare Results**

**Blocking (Left)**:
- CPU usage: ~90-100% continuously
- Main thread: Shows tall continuous stack
- Smooth frame rate: Drops to <10fps
- Timeline: Single tall block (nothing else running)

**Non-Blocking (Right)**:
- CPU usage: ~50% (bursty)
- Main thread: Short bursts with gaps
- Frame rate: Maintains ~50fps
- Timeline: Multiple small blocks with gaps for other requests

---

## Workflow 6: Real-Time Monitoring

### Purpose
Watch application behavior in real-time while under load.

### Steps

**Start Inspector**
```bash
cd non-blocking
npm run inspect
```

**Open DevTools → Console Tab**

You can execute JavaScript while app runs:

```javascript
// Check current memory
process.memoryUsage()

// Output:
// {
//   rss: 83968000,    // Resident set size (physical memory)
//   heapTotal: 9109504,
//   heapUsed: 4567890,
//   external: 123456
// }

// Watch event loop status
setInterval(() => {
  console.log(`Heap used: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`)
}, 1000)
```

**Generate Load While Monitoring**

```bash
# In separate terminal
autocannon -c 10 -d 30 http://localhost:3001
```

Watch the console output in DevTools showing memory changes in real-time.

---

## Result Interpretation Guide

### CPU Profile Analysis

#### Blocking Pattern
```
Timeline visualization:
████████████████████████████████████ (30 seconds of computation)
←─────────────────────────────────→
  One request blocking entire event loop
  No interleaving with other requests
```

**Indicators**:
- Tall, continuous stack in timeline
- p100 frame rate (no frames dropped, but frozen)
- Long gaps = waiting for blocking to finish

#### Non-Blocking Pattern
```
Timeline visualization:
██ ░░░░ ██ ░░░░ ██ ░░░░ ██ ░░░░ (30 seconds interleaved)
←→ ←──→ ←→ ←──→ ←→ ←──→ ←→
 Work  Idle  Work  Idle  Work  Idle
```

**Indicators**:
- Short stacks with gaps
- Multiple requests visible
- Frame rate maintained >30fps
- Timeline shows interleaving

### Memory Profile Interpretation

#### Normal Memory Pattern
```
Memory over time (non-blocking):
80 MB │      ╱╲    ╱╲    ╱╲
      │     ╱  ╲  ╱  ╲  ╱  ╲
60 MB │────────────────────────
      │
      └─────────────────────────
         0s   10s   20s   30s
         
Pattern: Spikes during load, recovers after
Interpretation: ✓ Garbage collection working properly
```

#### Memory Leak Pattern
```
Memory over time (leak):
200 MB│                 ╱
      │                ╱
100 MB│       ╱────────
      │      ╱
 60 MB│─────
      │
      └─────────────────────────
         0s   10s   20s   30s
         
Pattern: Continuously increasing
Interpretation: ✗ Memory not being freed (leak detected)
```

### Common Issues to Spot

| Issue | CPU Timeline | Memory Profile | Heap Snapshot |
|-------|--------------|----------------|---------------|
| **Blocking** | Long continuous stack | Spiky with recovery | Normal sizes |
| **Memory Leak** | Normal CPU usage | Continuous increase | Retained objects |
| **Infinite Loop** | Stuck at 100% CPU | Rapidly increasing | Memory errors |
| **Event Listener Leak** | Normal CPU | Increasing over time | Many listeners |

---

## Tips & Tricks

### Conditional Breakpoints
```javascript
// In DevTools, right-click breakpoint
// Add condition:
i > 500000  // Only break when i exceeds 500000

// Useful for:
// - Breaking in specific scenarios
// - Avoiding noise from early iterations
// - Testing edge cases
```

### Watch Expressions
```javascript
// In Watch panel, add:
process.memoryUsage().heapUsed / 1024 / 1024  // Show heap in MB
performance.now()  // Current timestamp
```

### Call Stack Navigation
```
When paused, the "Call Stack" panel shows:
- Current function
- Who called it
- Who called them (full trace)

Click any entry to jump to that function
Helps trace where blocking originated
```

### Performance API
```javascript
// In DevTools console:
performance.mark('start-compute')
// ... do some work ...
performance.mark('end-compute')
performance.measure('compute', 'start-compute', 'end-compute')
performance.getEntriesByName('compute')[0].duration
```

### Long Stack Traces
```javascript
// Enable longer async stack traces:
chrome://flags/#enable-javascript-harmony
// Search for "stack trace" (may help with async debugging)
```

---

## Troubleshooting

### "Cannot connect to Inspector"

**Error**: `Failed to resolve version of chrome`

**Solution 1: Use chromium instead**
```bash
# Install chromium
npm install -g chromium
# Run with custom path
chromium chrome://inspect
```

**Solution 2: Use DevTools in VS Code**
- Install "Debugger for Chrome" extension
- Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "attach",
      "name": "Attach to Node",
      "address": "127.0.0.1",
      "port": 9229,
      "pathMapping": {
        "/": "${workspaceFolder}/",
        "http://localhost:3000/": "${workspaceFolder}/blocking/src/"
      }
    }
  ]
}
```

### DevTools Freezes When Attached

**Cause**: Intensive breakpoint checking

**Solution**:
- Remove all breakpoints (Ctrl+Shift+F8)
- Use conditional breakpoints instead of many breakpoints
- Disconnect and reconnect debugger

### Memory Snapshots Too Large

**Cause**: Heap snapshots can be large (100s of MB)

**Solution**:
- Reduce application runtime
- Focus on comparing specific snapshots
- Use heap timeline instead of snapshots

---

## Integration with Other Tools

### Combine with autocannon

1. Start Inspector: `npm run inspect`
2. Open DevTools and start **Performance** recording
3. In separate terminal: `npm run load-test`
4. Stop recording and analyze timeline

**Result**: See how blocking manifests visually

### Combine with EventLoopMonitor

1. Keep server terminal visible showing EventLoopMonitor output
2. See blocking warnings in real-time
3. Switch to DevTools to see **exact** code causing it
4. Connect the data points!

### Combine with 0x Flamegraph

1. Use DevTools for interactive debugging
2. Use 0x for static flamegraph visualization
3. Both complement each other

---

## Next Steps

After profiling with DevTools:

1. **Dive deeper with Clinic.js** (automated diagnosis)
2. **Examine flamegraphs with 0x** (stack visualization)
3. **Establish baselines** with autocannon
4. **Check memory** with heap snapshots periodically

---

## Summary

| Task | How | Best For |
|------|-----|----------|
| Breakpoint debugging | Set breakpoint, trigger code | Understanding flow |
| CPU profiling | Record timeline | Finding hot functions |
| Memory analysis | Take heap snapshots | Detecting leaks |
| Real-time monitoring | Watch expressions | Live observation |
| Side-by-side comparison | Two debuggers | Visual comparison |
| Variable inspection | Watch panel | Understanding state |

**Key Takeaway**: Chrome DevTools lets you **see exactly** where blocking happens and compare execution patterns visually between blocking and non-blocking code.
