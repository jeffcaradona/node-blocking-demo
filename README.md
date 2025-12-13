# node-blocking-demo

A monorepo demonstration of identifying and diagnosing operations that block the Node.js 25.x event loop.

## Overview

This project contains two Node.js applications that demonstrate blocking vs. non-blocking operations, along with various tools and techniques for identifying performance bottlenecks caused by blocking code.

### Project Goals

1. **Demonstrate blocking operations** - Show how synchronous operations and long-running tasks block the event loop
2. **Inspect performance** - Use Node.js built-in and third-party tools to identify blocking code
3. **Compare patterns** - Side-by-side comparison of blocking and non-blocking implementations
4. **Document tools** - Comprehensive guide to available debugging and profiling utilities

## Monorepo Structure

```
node-blocking-demo/
├── package.json                 # Root monorepo config
├── README.md                    # This file
├── blocking/                    # App demonstrating blocking operations
│   ├── package.json
│   ├── src/
│   │   ├── index.js             # Main entry point
│   │   ├── server.js            # HTTP server with blocking operations
│   │   └── operations.js        # Example blocking operations
│   └── README.md                # Blocking app documentation
└── non-blocking/                # App demonstrating non-blocking operations
    ├── package.json
    ├── src/
    │   ├── index.js             # Main entry point
    │   ├── server.js            # HTTP server with async operations
    │   └── operations.js        # Example non-blocking operations
    └── README.md                # Non-blocking app documentation
```

## Tools & Techniques

### 1. **Node.js Inspector & DevTools**
- Browser-based debugging via Chrome DevTools
- Real-time performance profiling
- Memory snapshots and heap analysis
- **Launch:** `node --inspect app.js` or `node --inspect-brk app.js`

### 2. **Clinic.js** 
- Purpose-built Node.js performance diagnostics
- Doctor (automatic analysis)
- Flame graphs for CPU profiling
- **Install:** `npm install -g clinic`
- **Usage:** `clinic doctor -- node app.js`

### 3. **Node.js Perf Hooks**
- Built-in performance measurement API
- Measure function execution time
- Track event loop lag
- **API:** `require('perf_hooks')`

### 4. **Node.js Event Loop Monitor**
- Custom monitoring to detect blocking
- Track event loop delay/lag
- Automatic alerts when threshold exceeded
- **Implementation:** Built into apps

### 5. **Native Profiling Tools**
- `node --prof` for V8 profiler output
- `node --prof-process` to analyze profiles
- Generate flamegraph with `0x` package
- **Usage:** `0x -- node app.js`

### 6. **External Load Testing**
- **Apache Bench (ab)** - Simple HTTP benchmarking
- **AutoCannon** - Node.js load testing
- Measure throughput under blocking/non-blocking scenarios
- **Compare:** Response times and request handling

### 7. **Tracing & Logging**
- Structured logging to track execution flow
- Distributed tracing patterns
- Timeline view of operations
- **Tools:** Winston, Pino, debug module

## Getting Started

### Prerequisites
- Node.js 25.x
- npm 10.x or later
- Chrome/Edge (for DevTools inspection)

### Installation

```bash
# Install root dependencies
npm install

# Install blocking app dependencies
cd blocking && npm install && cd ..

# Install non-blocking app dependencies
cd non-blocking && npm install && cd ..

# Optional: Install global tools
npm install -g clinic
npm install -g 0x
npm install -g autocannon
```

### Running the Applications

**Blocking App:**
```bash
cd blocking
npm start
```

**Non-blocking App:**
```bash
cd non-blocking
npm start
```

### Profiling & Inspection

**Inspector (DevTools):**
```bash
node --inspect blocking/src/index.js
# Visit: chrome://inspect
```

**Clinic.js Doctor:**
```bash
clinic doctor -- node blocking/src/index.js
```

**0x Flamegraph:**
```bash
0x -- node blocking/src/index.js
```

**Load Testing:**
```bash
# In another terminal
autocannon http://localhost:3000 -d 10
```

## What We'll Demonstrate

### Blocking Operations
- Synchronous file I/O
- Long-running computations
- Large JSON parsing
- Synchronous crypto operations
- Thread pool exhaustion

### Detection Techniques
- Event loop lag monitoring
- Performance profiling
- Flame graphs
- CPU sampling
- Response time analysis

### Metrics to Track
- Request latency (p50, p95, p99)
- Throughput (requests/sec)
- Event loop delay
- Memory usage
- CPU utilization

## Expected Results

- **Blocking app:** High latency, low throughput, visible blocking periods
- **Non-blocking app:** Lower latency, higher throughput, smooth distribution
- **Visual profiling:** Clear differences in flame graphs and performance traces

## Further Reading

- [Node.js Documentation - Performance Hooks](https://nodejs.org/api/perf_hooks.html)
- [Clinic.js Documentation](https://clinicjs.org/)
- [0x - Node.js Flamegraph Profiler](https://github.com/davidmarkclements/0x)
- [Node.js Best Practices - Event Loop](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/)
