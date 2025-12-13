# Non-Blocking Demo

This application demonstrates **non-blocking, asynchronous patterns** that allow Node.js to handle multiple concurrent requests efficiently without blocking the event loop.

## Non-Blocking Operations Demonstrated

### 1. **Asynchronous File I/O**
- `fs.promises.readFile()` - Non-blocking file reading
- `fs.promises.writeFile()` - Non-blocking file writing
- Impact: Event loop stays responsive

### 2. **Async Computations with Yield Points**
- Breaking computations into chunks with `setImmediate()`
- Using `process.nextTick()` for deferral
- Worker Threads for CPU-intensive tasks (optional)
- Impact: Event loop processes other tasks between chunks

### 3. **Asynchronous Crypto**
- Promise-based crypto operations
- Proper async/await patterns
- Impact: Non-blocking cryptographic operations

### 4. **Stream Processing**
- Using Node.js streams for efficient data handling
- Backpressure handling
- Impact: Memory-efficient processing of large data

### 5. **Proper Async/Await Patterns**
- Top-level async functions
- Proper error handling
- Concurrency with `Promise.all()`
- Impact: Clean, readable, non-blocking code

## Architecture

```
non-blocking/
├── src/
│   ├── index.js           # Main entry, starts server
│   ├── server.js          # HTTP server with non-blocking routes
│   └── operations.js      # Non-blocking operation implementations
└── README.md
```

## Running

```bash
npm start
# Server starts on http://localhost:3000
```

## Available Endpoints

- `GET /` - Health check (non-blocking)
- `GET /slow-async` - Asynchronous file read (non-blocking)
- `GET /compute-async` - Chunked computation with yield (non-blocking)
- `GET /crypto-async` - Async crypto operation (non-blocking)
- `GET /stream-process` - Stream processing (non-blocking)

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

- **Low response latency:** Requests handled quickly without waiting
- **High throughput:** Many requests served per second
- **Even CPU distribution:** No visible blocking spikes
- **Responsive event loop:** Consistent delay metrics
- **Good scalability:** Handles concurrent requests well

## Profiling Output

When running with `npm run prof`, analyze with:
```bash
node --prof-process isolate-*.log > processed.txt
```

Or generate a flamegraph with:
```bash
0x -- npm start
```

## Comparison with Blocking App

| Metric | Blocking | Non-Blocking |
|--------|----------|-------------|
| Latency (p99) | High (seconds) | Low (ms) |
| Throughput | Low | High |
| Event Loop Lag | High | Low |
| Scalability | Poor | Good |
| Code Complexity | Lower | Slightly higher |

## Best Practices Demonstrated

1. ✅ Using `async`/`await` for readability
2. ✅ Proper error handling with try/catch
3. ✅ Breaking up long computations
4. ✅ Using callbacks and promises correctly
5. ✅ Respecting stream backpressure
6. ✅ Avoiding callback hell with modern patterns

## Notes

This app demonstrates **best practices** for Node.js applications that need to handle concurrent load efficiently.
