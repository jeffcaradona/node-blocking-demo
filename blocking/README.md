# Blocking Demo

This application demonstrates operations that **block the Node.js event loop**, causing performance degradation and preventing concurrent request handling.

## Blocking Operations Demonstrated

### 1. **Synchronous File I/O**
- `fs.readFileSync()` - Blocks reading large files
- `fs.writeFileSync()` - Blocks writing operations
- Impact: Entire server stalls until file operation completes

### 2. **Long-Running Computations**
- CPU-intensive calculations without yielding
- JSON parsing of massive objects
- String manipulation on large datasets
- Impact: Event loop unavailable for other tasks

### 3. **Synchronous Crypto Operations**
- `crypto.randomBytes()` with large sizes
- Heavy cryptographic operations
- Impact: Significant blocking on computation-heavy tasks

### 4. **Thread Pool Exhaustion**
- Multiple blocking operations overwhelming libuv thread pool
- Default pool size is 4 threads (configurable via `UV_THREADPOOL_SIZE`)
- Impact: Queue buildup and cascading failures

### 5. **Busy Loops**
- Intentional loops without yield points
- Simulating heavy processing
- Impact: Clear event loop starvation

## Architecture

```
blocking/
├── src/
│   ├── index.js           # Main entry, starts server
│   ├── server.js          # HTTP server with blocking routes
│   └── operations.js      # Blocking operation implementations
└── README.md
```

## Running

```bash
npm start
# Server starts on http://localhost:3000
```

## Available Endpoints

- `GET /` - Health check (non-blocking)
- `GET /slow-sync` - Synchronous file read (blocking)
- `GET /compute` - Long computation (blocking)
- `GET /crypto` - Crypto operation (blocking)
- `GET /busy-loop` - Intentional busy loop (blocking)

## Inspection Methods

### Chrome DevTools
```bash
npm run inspect
# Visit chrome://inspect
```

### Clinic.js Doctor
```bash
clinic doctor -- npm start
# Generates performance analysis
```

### V8 Profiling
```bash
npm run prof
# Creates isolate-*.log file
```

## Expected Observations

- **High response latency:** Requests queue up waiting for blocking operations
- **Low throughput:** Fewer requests served per second
- **CPU usage spikes:** Visible blocking periods in CPU profile
- **Event loop blocking:** Detectable delay in event loop processing
- **Cascading failures:** Early requests block subsequent ones

## Profiling Output

When running with `npm run prof`, analyze with:
```bash
node --prof-process isolate-*.log > processed.txt
```

Or generate a flamegraph with:
```bash
0x -- npm start
```

## Notes

This app intentionally demonstrates **anti-patterns**. See the `non-blocking/` app for proper async implementations.
