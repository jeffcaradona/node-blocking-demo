# Node.js Event Loop Blocking Demo - Project Plan

## Project Scope

Build a complete monorepo demonstrating Node.js event loop blocking detection and diagnosis using Node.js 25.x with comprehensive tooling integration.

---

## Phase 1: Foundation & Documentation ✅ COMPLETED

### Deliverables
- ✅ Root `package.json` with workspace configuration
- ✅ Comprehensive README.md with project overview
- ✅ Individual README files for blocking and non-blocking apps
- ✅ TOOLS.md - Complete tooling reference guide
- ✅ PROJECT_PLAN.md (this document)

### Key Documentation
1. **Project Overview** - Goals, structure, expected outcomes
2. **Tools Reference** - 10 different profiling/debugging tools documented
3. **Installation Guide** - Prerequisites and setup instructions
4. **Comparison Matrix** - Tools vs. capabilities

---

## Phase 2: Application Development (NEXT)

### 2.1 Blocking Application
**Files to create:**
- `blocking/src/index.js` - Main entry point and server startup
- `blocking/src/server.js` - HTTP server with blocking routes
- `blocking/src/operations.js` - Blocking operation implementations

**Endpoints to implement:**
- `GET /` - Health check (instant response)
- `GET /slow-sync` - Synchronous file read (blocks event loop)
- `GET /compute` - Long CPU computation (blocks event loop)
- `GET /crypto` - Synchronous crypto operation (blocks event loop)
- `GET /busy-loop` - Intentional busy loop (blocks event loop)

**Features:**
- Configurable blocking duration
- Event loop monitoring and reporting
- Detailed request timing
- Error handling

### 2.2 Non-Blocking Application
**Files to create:**
- `non-blocking/src/index.js` - Main entry point and server startup
- `non-blocking/src/server.js` - HTTP server with async routes
- `non-blocking/src/operations.js` - Non-blocking operation implementations

**Endpoints to implement:**
- `GET /` - Health check (instant response)
- `GET /slow-async` - Asynchronous file read (non-blocking)
- `GET /compute-async` - Chunked computation with yield (non-blocking)
- `GET /crypto-async` - Async crypto operation (non-blocking)
- `GET /stream-process` - Stream-based processing (non-blocking)

**Features:**
- Proper async/await patterns
- Event loop monitoring
- Stream backpressure handling
- Chunked processing with yield points

### 2.3 Common Modules
**Shared utilities:**
- Event loop delay monitoring class
- Request timing utilities
- Logging setup
- Performance metrics collector

### 2.4 Zalgo Anti-Pattern Application (The Dark Pony Lord)

**Purpose:** Demonstrate the infamous "Zalgo" anti-pattern - when callbacks execute sometimes synchronously, sometimes asynchronously, making code impossible to reason about.

**Files to create:**
- `zalgo/src/index.js` - Main entry point and server startup
- `zalgo/src/server.js` - HTTP server with zalgo-pattern routes
- `zalgo/src/operations.js` - Zalgo anti-pattern demonstrations

**Anti-Pattern Demonstrations:**

1. **Inconsistent Cache Pattern** (Most Common Zalgo)
   - Returns cached data synchronously
   - Fetches fresh data asynchronously
   - Endpoint: `GET /cache` - Shows unpredictable timing
   - Problem: Caller code can't know when data arrives

2. **Promise.resolve() with Callbacks**
   - Mixes Promise and callback conventions
   - Sometimes resolves immediately, sometimes later
   - Endpoint: `GET /promise-callback` - Confusing control flow
   - Problem: Breaks callback contract

3. **Conditional Deferral**
   - Uses `setImmediate()` conditionally based on state
   - Sometimes defers, sometimes doesn't
   - Endpoint: `GET /conditional-defer` - Unpredictable execution
   - Problem: Race conditions and event loop unpredictability

4. **Mixed Timing Pattern**
   - Synchronous validation + asynchronous processing
   - Execution timing depends on data state
   - Endpoint: `GET /mixed-timing` - Difficult to debug
   - Problem: Cascading failures in dependent code

5. **Comparison: Fixed Version**
   - Shows how to properly defer everything
   - Uses `setImmediate()` consistently
   - Endpoint: `GET /fixed-pattern` - Predictable timing
   - Problem: Teaches the solution

**Features:**
- Same EventLoopMonitor as blocking/non-blocking
- Request logging showing actual vs. expected execution order
- Unpredictability metrics (execution time variance)
- Comparison output showing problems vs. solutions

**Expected Behavior:**
- Requests succeed but timing is unpredictable
- Race conditions visible under load
- Promises resolve in unexpected order
- Callback order breaks expectations
- Fixed version maintains predictability

---

## Phase 3: Integration & Tooling

### 3.1 Profiling Support
- ✅ `npm run inspect` - Inspector mode
- ✅ `npm run inspect-brk` - Inspector with breakpoint
- ✅ `npm run prof` - V8 profiler

### 3.2 Package Dependencies
**blocking/package.json:**
- `debug` - Development logging

**non-blocking/package.json:**
- `debug` - Development logging

### 3.3 Optional Global Installations
```bash
npm install -g clinic
npm install -g 0x
npm install -g autocannon
```

---

## Phase 4: Testing & Validation

### 4.1 Functional Testing
- [ ] All endpoints return correct responses
- [ ] Blocking app requests queue up
- [ ] Non-blocking app handles concurrent requests
- [ ] Error handling works correctly

### 4.2 Performance Validation
**Blocking Application:**
- [ ] Single request latency > 500ms
- [ ] Concurrent requests show cascading latency
- [ ] Event loop lag detectable
- [ ] Visible in flame graphs/profiles

**Non-Blocking Application:**
- [ ] Single request latency < 50ms
- [ ] Concurrent requests maintain low latency
- [ ] Event loop lag minimal
- [ ] Smooth distribution in flame graphs

### 4.3 Profiling Validation
- [ ] Chrome DevTools inspection works
- [ ] Clinic.js doctor produces report
- [ ] 0x generates flamegraph
- [ ] autocannon shows differences
- [ ] --prof-process output is readable

---

## Phase 5: Documentation & Examples

### 5.1 Usage Examples
- [ ] How to run each app
- [ ] How to load test
- [ ] How to profile with each tool
- [ ] How to interpret results

### 5.2 Result Interpretation Guide
- [ ] Reading flame graphs
- [ ] Understanding latency distribution
- [ ] Identifying blocking operations
- [ ] Memory leak patterns

### 5.3 Troubleshooting Guide
- [ ] Port already in use
- [ ] Permissions issues
- [ ] Tool installation problems
- [ ] Interpreting errors

---

## Technical Decisions

### Node.js 25.x Features Used
- **ES Modules (import/export)** - Modern JavaScript syntax
- **fetch API** - Built-in HTTP client
- **perf_hooks** - Performance measurement
- **stream API** - Efficient data handling
- **async/await** - Promise-based async operations

### Architecture Decisions
1. **ES Modules** - All code uses `type: "module"` in package.json
2. **Monorepo** - npm workspaces for shared scripts and dependencies
3. **No frameworks** - Core Node.js only for clarity
4. **Event loop monitoring** - Built into each app
5. **Debug module** - Selective logging without console spam

### Performance Considerations
- Blocking app: Intentional degradation to demonstrate problems
- Non-blocking app: Optimized for throughput
- Both apps: Event loop monitoring overhead minimal
- Profiling: Tools should have low performance impact

---

## Success Criteria

✅ **Documentation Complete**
- Comprehensive README files
- Tool reference guide with examples
- Project plan with clear phases

📊 **Applications Functional**
- Both apps start without errors
- All endpoints respond
- Clear differences visible in profiling

🔍 **Debugging Tools Work**
- Inspector integration
- Clinic.js analysis
- Load test comparison
- Flame graphs generated

🎯 **Learning Goals Met**
- Clear demonstration of blocking impact
- Multiple detection techniques shown
- Easy-to-understand comparisons
- Well-documented code

---

## Dependencies Matrix

### Root Level
```json
{
  "workspaces": ["blocking", "non-blocking"],
  "devDependencies": {}
}
```

### Blocking App
```json
{
  "dependencies": {
    "debug": "^4.3.4"
  }
}
```

### Non-Blocking App
```json
{
  "dependencies": {
    "debug": "^4.3.4"
  }
}
```

### Global Tools (Optional)
- `clinic` - Comprehensive diagnostics
- `0x` - Flamegraph visualization
- `autocannon` - Load testing

---

## Timeline Estimate

| Phase | Component | Estimate | Status |
|-------|-----------|----------|--------|
| 1 | Documentation | ✅ Complete | ✅ Done |
| 2 | Blocking App | 2 hours | 📋 Next |
| 2 | Non-Blocking App | 2 hours | 📋 Queued |
| 3 | Integration & Testing | 2 hours | 📋 Queued |
| 4 | Validation & Examples | 2 hours | 📋 Queued |
| 5 | Final Documentation | 1 hour | 📋 Queued |
| | **Total** | **~9 hours** | |

---

## Next Steps

1. ✅ Phase 1: Documentation complete
2. 📋 Phase 2: Start blocking application development
   - Create `blocking/src/index.js` (server setup)
   - Create `blocking/src/server.js` (route handlers)
   - Create `blocking/src/operations.js` (blocking operations)
3. 📋 Then create non-blocking counterpart
4. 📋 Validate with profiling tools
5. 📋 Create final example documentation

---

## File Structure Checklist

```
✅ Root Level
  ✅ package.json (monorepo config)
  ✅ README.md (project overview)
  ✅ TOOLS.md (tooling reference)
  ✅ PROJECT_PLAN.md (this file)

✅ blocking/
  ✅ package.json
  ✅ README.md
  ☐ src/
    ☐ index.js
    ☐ server.js
    ☐ operations.js

✅ non-blocking/
  ✅ package.json
  ✅ README.md
  ☐ src/
    ☐ index.js
    ☐ server.js
    ☐ operations.js

☐ Shared (Optional)
  ☐ utils/
    ☐ eventLoopMonitor.js
    ☐ timingUtils.js
```

---

## Questions for Development

1. **Event Loop Monitoring**
   - Should we use `setInterval` or `process.nextTick()`?
   - What threshold should we use for warnings? (10ms, 50ms, 100ms?)

2. **Server Port**
   - Hardcoded to 3000 or configurable via environment?

3. **Data Files**
   - Generate test files on startup or pre-create?
   - How large should files be for realistic blocking?

4. **Concurrency Testing**
   - How many concurrent requests should we simulate?
   - Should we have a stress-test endpoint?

5. **Output Format**
   - JSON responses for easy parsing?
   - HTML output for manual testing?
   - Both?

---

## Success Metrics

After completion, this project will provide:

✅ **2 fully functional Node.js 25.x applications**
- One demonstrating blocking operations
- One demonstrating non-blocking best practices

✅ **10 documented profiling techniques**
- With examples and expected output
- With comparison metrics

✅ **Clear visual differences**
- In profiling tools
- In load testing results
- In response time distribution

✅ **Complete learning resource**
- For understanding event loop behavior
- For identifying performance problems
- For optimizing Node.js applications

---

## References

- [Node.js Event Loop Documentation](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/nodejs-performance/)
- [Clinic.js Guides](https://clinicjs.org/documentation/)
- [Understanding the Node.js Event Loop](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
