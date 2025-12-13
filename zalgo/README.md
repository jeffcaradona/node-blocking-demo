# Zalgo Anti-Pattern Demo

**Understanding the "Dark Pony Lord" of Node.js** – Mixing Synchronous and Asynchronous Execution

---

## What is Zalgo?

Zalgo is a classic Node.js anti-pattern described by Isaac Schlueter (npm founder) in his famous blog post *"Designing APIs for Asynchrony"*:

> **"If you have an API which takes a callback, and sometimes that callback is called immediately, and other times that callback is called at some point in the future, then you will render any code using this API impossible to reason about, and cause the release of Zalgo."**

### The Problem

When a function **sometimes executes synchronously** and **sometimes asynchronously**, code depending on it becomes unpredictable:

```javascript
// ZALGO! ❌ Sometimes calls callback immediately, sometimes later
function inconsistentRead(file, callback) {
  if (cache[file]) {
    callback(null, cache[file])  // Synchronous!
  } else {
    fs.readFile(file, (err, data) => {
      callback(err, data)  // Asynchronous!
    })
  }
}

// This code breaks in subtle ways
let result
inconsistentRead('file.txt', (err, data) => {
  result = data  // Sometimes runs before next line, sometimes after!
})
console.log(result)  // undefined or filled? Depends on cache!
```

### Why It Matters

1. **Unpredictable Execution**: Code runs in different orders depending on state
2. **Race Conditions**: Variables may or may not be initialized when expected
3. **Impossible to Debug**: Behavior changes based on cache state, not code logic
4. **Breaks Error Handling**: Try/catch patterns don't work for mixed async/sync
5. **Impossible to Test**: Non-deterministic behavior across different runs

---

## The Zalgo Demonstrations

This application demonstrates 5 zalgo scenarios:

### 1. Inconsistent Cache Pattern (Most Common)

**The Code**:
```javascript
function readWithCache(file, callback) {
  if (cached[file]) {
    // SYNC: Call immediately
    callback(null, cached[file])
  } else {
    // ASYNC: Call later
    fs.readFile(file, (err, data) => {
      cached[file] = data
      callback(err, data)
    })
  }
}
```

**The Problem**:
```javascript
let data
readWithCache('file.txt', (err, result) => {
  data = result
})
// Is data set here? DEPENDS ON CACHE!
console.log(data)  // Sometimes undefined, sometimes set
```

**Endpoint**: `GET /cache?file=data.txt`

**Real-World**: Database libraries, caching layers, API wrappers often exhibit this pattern.

---

### 2. Promise.resolve() with Callbacks

**The Code**:
```javascript
function mixedPatternFetch(url, callback) {
  // Sometimes returns cached data immediately (sync)
  if (cache[url]) {
    return callback(null, cache[url])
  }
  
  // Sometimes returns a promise (mixed!)
  return fetch(url)
    .then(response => response.json())
    .then(data => callback(null, data))
    .catch(err => callback(err))
}
```

**The Problem**:
```javascript
// Caller doesn't know if callback runs now or later
const promise = mixedPatternFetch(url, (err, data) => {
  // This might run immediately or later
  // Caller can't know whether to await the promise!
})
```

**Endpoint**: `GET /promise-callback?url=https://example.com`

**Real-World**: Libraries mixing Promises and callbacks, migration code.

---

### 3. Conditional Deferral

**The Code**:
```javascript
function conditionalDefer(data, callback) {
  if (isValid(data)) {
    // Sometimes defer
    setImmediate(() => callback(null, process(data)))
  } else {
    // Sometimes don't defer - execute immediately
    callback(new Error('Invalid data'))
  }
}
```

**The Problem**:
```javascript
let result
conditionalDefer(data, (err, res) => {
  result = res
})
// When is result set?
// If error: immediately (sync)
// If valid: next tick (async)
console.log(result)  // Race condition!
```

**Endpoint**: `GET /conditional-defer?valid=true|false`

**Real-World**: Validation + processing patterns.

---

### 4. Mixed Timing Pattern

**The Code**:
```javascript
function validateAndProcess(request, callback) {
  // Validation is synchronous
  const error = validate(request)
  if (error) {
    // ERROR PATH: Synchronous callback
    return callback(error)
  }
  
  // Processing is asynchronous
  process(request, (err, result) => {
    // SUCCESS PATH: Asynchronous callback
    callback(err, result)
  })
}
```

**The Problem**:
```javascript
let processed = false
validateAndProcess(req, (err, res) => {
  processed = true  // Set immediately or later?
})

// This runs immediately:
console.log('Starting')

// But processed may not be set yet!
// Depends on validation success
if (processed) { /* ... */ }
```

**Endpoint**: `GET /mixed-timing?data=...`

**Real-World**: Validation + async processing (very common).

---

### 5. Fixed Pattern (The Solution)

**The Code**:
```javascript
// ✅ CORRECT: Always defer asynchronously
function alwaysAsync(data, callback) {
  // Even simple operations are deferred
  setImmediate(() => {
    try {
      const error = validate(data)
      if (error) {
        callback(error)
      } else {
        process(data, callback)
      }
    } catch (err) {
      callback(err)
    }
  })
}
```

**Why This Works**:
```javascript
let result
alwaysAsync(data, (err, res) => {
  result = res  // Always set on next tick
})
console.log(result)  // Always undefined here - predictable!

setImmediate(() => {
  console.log(result)  // Always set here - predictable!
})
```

**Endpoint**: `GET /fixed-pattern?data=...`

**Key Principle**: If ANY code path is asynchronous, ALL paths must be asynchronous.

---

## How to Run

### Prerequisites
```bash
# Node.js 25.0.0+
node --version

# npm (should come with Node.js)
npm --version
```

### Install & Start

```bash
# Navigate to project root (if not already there)
cd node-blocking-demo

# Start the zalgo demo app
cd zalgo
npm start

# Output:
# Server running on http://localhost:3002
# EventLoopMonitor initialized...
```

### Try Each Endpoint

**Terminal 2**:

```bash
# 1. Inconsistent cache - sometimes fast, sometimes slow
curl http://localhost:3002/cache?file=data.txt

# 2. Mixed promise/callback - confusing execution
curl http://localhost:3002/promise-callback

# 3. Conditional deferral - unpredictable timing
curl http://localhost:3002/conditional-defer?valid=true
curl http://localhost:3002/conditional-defer?valid=false

# 4. Mixed timing - race condition showcase
curl http://localhost:3002/mixed-timing?data=test

# 5. Fixed version - predictable execution
curl http://localhost:3002/fixed-pattern?data=test

# Health check
curl http://localhost:3002/
```

---

## Load Testing to See Unpredictability

The Zalgo patterns become more obvious under load:

```bash
# Terminal 2: Generate load while watching request order
autocannon -c 10 -d 30 http://localhost:3002/cache

# Watch server output (Terminal 1)
# Notice:
# - Execution order is unpredictable
# - Some operations faster than others
# - Race conditions visible in logs
# - Request order doesn't match completion order
```

---

## Expected Output

### Blocking/Non-Blocking (for comparison)

```
GET /cache - Response Time
  With cache hit:   ~1ms (Synchronous)
  Without cache:    ~50ms (Asynchronous)
  PROBLEM: Caller code can't depend on timing!
```

### What You'll See

**Response Format** (all endpoints):
```json
{
  "pattern": "cache",
  "status": "success|error",
  "data": "...",
  "executionTime": 25,
  "executionMode": "async|sync",
  "message": "Execution unpredictable - sometimes sync, sometimes async!"
}
```

**Server Logs**:
```
[CACHE] Cache hit - executing SYNCHRONOUSLY
[CACHE] Cache miss - executing ASYNCHRONOUSLY
[MIXED] Validation passed - executing async process
[MIXED] Validation failed - returning error SYNCHRONOUSLY
```

---

## Why This Matters - Real-World Examples

### Database Driver (Old Code)

```javascript
// This is why old callback-style database drivers were dangerous
db.query('SELECT * FROM users', (err, rows) => {
  // If result is in query cache: runs immediately (sync)
  // If query hits database: runs later (async)
  // Impossible to know which!
})
```

### Caching Layer

```javascript
// Cache libraries that return data sync when cached,
// but async when fetching
cache.get(key, (err, value) => {
  // Hot cache? Sync. Cold cache? Async.
  // Your code breaks in subtle ways.
})
```

### Migration Code

```javascript
// Mixing promises and callbacks during migration
async function migratedFunction(input) {
  if (cachedResult) {
    return callback(null, cachedResult)  // SYNC + CALLBACK
  }
  return await fetch(input)  // ASYNC + PROMISE
  // Caller confused about what to do!
}
```

---

## The Solution Pattern

### Rule 1: Always Defer

```javascript
// ❌ WRONG: Sometimes sync, sometimes async
function bad(callback) {
  if (condition) {
    callback(result)  // Sync!
  } else {
    setTimeout(() => callback(result), 100)  // Async!
  }
}

// ✅ RIGHT: Always async
function good(callback) {
  setImmediate(() => {
    if (condition) {
      callback(result)
    } else {
      callback(result)
    }
  })
}
```

### Rule 2: Use the Same Mechanism

```javascript
// ❌ WRONG: Different async mechanisms
function bad(callback) {
  if (a) {
    callback(result)  // Sync
  } else if (b) {
    setImmediate(() => callback(result))  // Next tick
  } else {
    setTimeout(() => callback(result), 0)  // SetTimeout
  }
}

// ✅ RIGHT: Consistent mechanism
function good(callback) {
  setImmediate(() => callback(result))  // Always same
}
```

### Rule 3: Prefer Promises or Async/Await

```javascript
// ✅ BEST: Modern approach (predictable by design)
async function good(input) {
  const result = await processAsync(input)
  return result  // Always async, always awaitable
}
```

---

## Profiling Zalgo

### What to Look For

1. **Variable Timing**
   - Run the same request multiple times
   - Latency varies unpredictably
   - Sometimes fast (cache hit = sync)
   - Sometimes slow (cache miss = async)

2. **Event Loop Warnings**
   - EventLoopMonitor shows sporadic blocking
   - Not consistent like blocking app
   - Depends on execution path taken

3. **Request Order Issues**
   - Requests complete in different order than received
   - Request 2 completes before Request 1
   - Visible in logs when watching load test

### Using Phase 3 Tools

```bash
# Chrome DevTools to watch execution order
npm run inspect
# Open devtools, set breakpoints in callbacks
# Make requests - watch when callbacks execute

# autocannon to see latency variance
npm run load-test
# High variance in latency = Zalgo signature

# EventLoopMonitor output
# Watch server logs during load test
# Erratic blocking patterns
```

---

## Learning Outcomes

After exploring this application, you'll understand:

✅ **Why Zalgo is dangerous**: Code becomes impossible to reason about
✅ **How it happens**: Mixing sync and async execution paths
✅ **Real-world examples**: Cache libraries, database drivers, migration code
✅ **How to identify it**: Variable latency, unpredictable execution order
✅ **How to fix it**: Always defer asynchronously, use promises/async-await
✅ **Why consistency matters**: Predictable execution enables reliable code

---

## Files in This Demo

- `src/index.js` - Server setup with EventLoopMonitor (140 lines)
- `src/server.js` - HTTP routes for each Zalgo pattern (~150 lines)
- `src/operations.js` - Anti-pattern implementations (~200 lines)
- `package.json` - Dependencies and scripts

---

## Comparison with Other Demos

| App | Pattern | Predictability | Reliability |
|-----|---------|-----------------|------------|
| **blocking/** | Synchronous | ✓ Predictable (slow) | ✓ Consistent |
| **non-blocking/** | Asynchronous | ✓ Predictable (fast) | ✓ Consistent |
| **zalgo/** | Mixed Sync/Async | ✗ Unpredictable | ✗ Unreliable |

---

## References

- [Isaac Schlueter - "Designing APIs for Asynchrony"](https://blog.izs.me/post/59142742143/designing-apis-for-asynchrony)
- [Node.js Best Practices - Zalgo Pattern](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/)
- [Callback Hell - Zalgo Discussion](http://callbackhell.com/)

---

## Port

This demo runs on **port 3002** to avoid conflicts:
- Port 3000: Blocking app
- Port 3001: Non-blocking app
- **Port 3002: Zalgo app (this one)**

---

## Next Steps

1. **Run the app**: `npm start`
2. **Try each endpoint**: See unpredictability firsthand
3. **Watch logs**: Observe execution order confusion
4. **Load test**: `npm run load-test` - see variance
5. **Fix it**: Study the `/fixed-pattern` endpoint
6. **Learn**: Understand why consistency matters

**Remember**: If you're using callbacks, make them always async. Better yet, use Promises or async/await!
