# Phase 4.1: Functional Testing

Complete test procedures for validating all application endpoints, error handling, and response formats.

## Overview

Phase 4.1 validates that both applications (blocking and non-blocking) are fully functional and meet acceptance criteria:
- All documented endpoints are accessible and return correct status codes
- Response formats are consistent (JSON with `status`, `data`, and `timing` fields)
- Error handling works gracefully without crashes
- Parameters are validated and processed correctly
- EventLoopMonitor metrics are included in responses
- Concurrent requests are handled without issues

## Quick Start

### Test Both Applications

```bash
# Terminal 1: Start blocking app
cd blocking
npm start

# Terminal 2: Start non-blocking app
cd non-blocking
npm start

# Terminal 3: Run tests
cd blocking && npm test
cd ../non-blocking && npm test
```

### Test Blocking App Only

```bash
# Terminal 1: Start blocking app
cd blocking
npm start

# Terminal 2: Run tests
cd blocking
npm test
```

### Test Non-Blocking App Only

```bash
# Terminal 1: Start non-blocking app
cd non-blocking
npm start

# Terminal 2: Run tests
cd non-blocking
npm test
```

## Test Structure

### Blocking Application (7 Endpoints)

The blocking app test suite validates:

| Test Name | Endpoint | Method | Purpose | Expected |
|-----------|----------|--------|---------|----------|
| Health Check | GET / | Health check endpoint | Verify basic connectivity | 200 OK + response metadata |
| Slow Sync | GET /slow-sync | Synchronous sleep operation | Validates blocking behavior | 200 OK + timing data |
| Compute | GET /compute | CPU-intensive calculation | Tests CPU blocking | 200 OK + result data |
| Crypto | GET /crypto | Synchronous PBKDF2 hash | Tests blocking crypto | 200 OK + hash result |
| Busy Loop | GET /busy-loop | Infinite loop for duration | Tests event loop blocking | 200 OK + blocked metrics |
| JSON Parse | GET /json-parse | Synchronous JSON parsing | Tests memory blocking | 200 OK + parsed data |
| Multiple | GET /multiple | Multiple blocking ops | Tests op combination | 200 OK + combined results |

#### Test Cases (13 total)

1. **Health Check** - Returns 200 with valid response format
   - Path: `/`
   - Expected: `status: 200, response.status: "ok"`
   - Validates: Basic connectivity

2. **Slow Sync Valid** - Valid request with duration/intensity params
   - Path: `/slow-sync?duration=100&intensity=1`
   - Expected: `status: 200, response.data.blocked !== undefined`
   - Validates: Parameter parsing and blocking detection

3. **Slow Sync Defaults** - Works with default parameters
   - Path: `/slow-sync`
   - Expected: `status: 200, valid response format`
   - Validates: Default parameter handling

4. **Compute** - Returns valid response with iterations param
   - Path: `/compute?iterations=1000`
   - Expected: `status: 200, valid response format`
   - Validates: CPU-intensive operation

5. **Crypto** - Returns hash with valid response format
   - Path: `/crypto?size=1000&iterations=10`
   - Expected: `status: 200, response.data.hash !== undefined`
   - Validates: Cryptographic operation

6. **Busy Loop** - Returns 200 with valid response format
   - Path: `/busy-loop?duration=50`
   - Expected: `status: 200, valid response format`
   - Validates: Busy waiting operation

7. **JSON Parse** - Parses JSON with valid response format
   - Path: `/json-parse?iterations=100`
   - Expected: `status: 200, valid response format`
   - Validates: JSON parsing operation

8. **Multiple Operations** - Executes multiple operations with valid response
   - Path: `/multiple?operations=crypto,compute&intensity=1`
   - Expected: `status: 200, valid response format`
   - Validates: Multiple operation execution

9. **Invalid Parameters** - Handles invalid parameters gracefully
   - Path: `/slow-sync?duration=invalid`
   - Expected: `status: 200-499 (no 500 crash)`
   - Validates: Error handling for bad input

10. **Timing Data Accuracy** - Response timing data is accurate and positive
    - Path: `/slow-sync?duration=100`
    - Expected: `response.timing.duration > 0`
    - Validates: Timing measurement accuracy

11. **EventLoopMonitor Metrics** - Response includes EventLoopMonitor metrics
    - Path: `/slow-sync?duration=50`
    - Expected: `response.data.blocked !== undefined OR response.data.blockingEvents !== undefined`
    - Validates: EventLoopMonitor integration

12. **Concurrent Requests** - Handles 3 simultaneous requests without errors
    - Paths: Multiple concurrent requests
    - Expected: All `status: 200`
    - Validates: Concurrent request handling

13. **Response Headers** - Content-Type is application/json
    - Path: `/`
    - Expected: `headers['content-type'].includes('application/json')`
    - Validates: Response format headers

### Non-Blocking Application (8 Endpoints)

The non-blocking app test suite validates:

| Test Name | Endpoint | Method | Purpose | Expected |
|-----------|----------|--------|---------|----------|
| Health Check | GET / | Health check endpoint | Verify basic connectivity | 200 OK + response metadata |
| Slow Async | GET /slow-async | Asynchronous sleep operation | Validates non-blocking | 200 OK + timing data |
| Compute Async | GET /compute-async | CPU calculation with chunking | Tests async CPU work | 200 OK + result data |
| Crypto Async | GET /crypto-async | Asynchronous PBKDF2 hash | Tests async crypto | 200 OK + hash result |
| Delay | GET /delay | Promise-based delay | Tests async sleep | 200 OK + delay metrics |
| Stream Process | GET /stream-process | Stream-based chunked processing | Tests stream processing | 200 OK + processed bytes |
| Parallel | GET /parallel | Parallel async operations | Tests Promise.all | 200 OK + completed flag |
| JSON Async | GET /json-async | Asynchronous JSON processing | Tests async JSON handling | 200 OK + parsed data |

#### Test Cases (15 total)

All blocking app tests plus:

14. **Slow Async Valid** - Valid request with duration/intensity params
    - Path: `/slow-async?duration=100&intensity=1`
    - Expected: `status: 200, quick response time`
    - Validates: Non-blocking async execution

15. **Parallel Operations** - Executes parallel operations
    - Path: `/parallel?operations=3`
    - Expected: `status: 200, response.data.completed === true`
    - Validates: Promise.all concurrency

## Response Format Requirements

All endpoints must return JSON with this structure:

```json
{
  "status": "ok|error",
  "data": {
    // Operation-specific data
    "blocked": boolean|number,
    "blockingEvents": number,
    // OR operation-specific fields like:
    // "hash": "...",
    // "result": number,
    // "processedBytes": number
  },
  "timing": {
    "duration": number
  }
}
```

**Required Fields:**
- `response.status` - "ok" or "error"
- `response.data` - Object with operation results and/or EventLoopMonitor metrics
- `response.timing.duration` - Numeric milliseconds

**HTTP Status Codes:**
- `200` - Successful operation
- `400` - Invalid parameters
- `500` - Server error (should not occur in functional tests)

## Acceptance Criteria

✅ **All Endpoints Accessible**
- 7/7 blocking endpoints respond with 200 status
- 8/8 non-blocking endpoints respond with 200 status

✅ **Response Format Consistent**
- All responses include `status`, `data`, and `timing` fields
- All responses are valid JSON
- All `timing.duration` values are positive numbers

✅ **Error Handling Works**
- Invalid parameters don't crash server (no 500 errors)
- Invalid parameters are handled gracefully (400 or sanitized)

✅ **Parameters Processed Correctly**
- Query parameters parsed and used
- Default values applied when parameters missing
- Parameter validation prevents crashes

✅ **EventLoopMonitor Integration**
- All blocking app responses include blocking metrics
- All non-blocking app responses include monitoring data
- Metrics are included in `response.data` object

✅ **Concurrent Requests Handled**
- Multiple simultaneous requests complete successfully
- No race conditions or request interference
- All concurrent requests return 200 status

## Running Tests

### Automated Test Runner

```bash
# From blocking directory
npm test

# From non-blocking directory
npm test
```

### Expected Output

```
📋 Starting Functional Test Suite for Blocking Application...

ℹ️  Target: http://localhost:3000
ℹ️  Timeout: 30000ms

======================================================================
FUNCTIONAL TEST RESULTS - BLOCKING APP
======================================================================
✓ PASS: GET / (Health Check) - Returns 200 with valid response format
✓ PASS: GET /slow-sync - Valid request with duration/intensity params
✓ PASS: GET /slow-sync - Works with default parameters
✓ PASS: GET /compute - Returns valid response with iterations param
✓ PASS: GET /crypto - Returns hash with valid response format
✓ PASS: GET /busy-loop - Returns 200 with valid response format
✓ PASS: GET /json-parse - Parses JSON with valid response format
✓ PASS: GET /multiple - Executes multiple operations with valid response
✓ PASS: GET /slow-sync - Handles invalid parameters gracefully
✓ PASS: GET /slow-sync - Response timing data is accurate and positive
✓ PASS: GET /slow-sync - Response includes EventLoopMonitor metrics
✓ PASS: Concurrent Requests - Handles 3 simultaneous requests
✓ PASS: Response Headers - Content-Type is application/json
======================================================================
Total: 13 passed, 0 failed, 13 total
======================================================================
```

### Manual Testing with curl

```bash
# Health check
curl http://localhost:3000/

# Slow sync with parameters
curl "http://localhost:3000/?duration=100&intensity=1"

# Compute endpoint
curl "http://localhost:3000/?iterations=1000"

# Invalid parameter
curl "http://localhost:3000/?duration=invalid"
```

## Troubleshooting

### Tests Fail with "Connection Refused"

**Problem:** `ECONNREFUSED` error when connecting to localhost:3000 or :3001

**Solution:**
1. Verify app is running: `npm start` in blocking or non-blocking directory
2. Verify port is correct:
   - Blocking: port 3000
   - Non-blocking: port 3001
3. Check for port conflicts: `netstat -ano | findstr :3000` (Windows)

### Tests Timeout

**Problem:** Tests fail with "Request timeout" after 30 seconds

**Solution:**
1. Check app responsiveness: `curl http://localhost:3000/`
2. Check system resources (CPU, memory)
3. Increase timeout in test file if needed (modify `TIMEOUT` constant)
4. Try with shorter operation durations: `?duration=50`

### Invalid JSON Response Error

**Problem:** `Failed to parse JSON response`

**Solution:**
1. Check app logs for errors
2. Verify endpoint is implemented correctly
3. Test with curl to see raw response
4. Check response is being sent as JSON with `Content-Type: application/json`

### Endpoint Not Found (404)

**Problem:** Test fails with 404 status for valid endpoints

**Solution:**
1. Verify endpoint is implemented in server.js
2. Check endpoint path matches (case-sensitive)
3. Verify route handler is registered correctly
4. Restart app if code was modified

### "Server error (should not occur)" in Tests

**Problem:** Test gets 500 status code

**Solution:**
1. Check app logs for error details
2. Try simpler endpoint parameters
3. Check for uncaught exceptions in app logs
4. Verify dependencies are installed

## Performance Expectations

### Blocking App (Port 3000)

- **Health Check**: < 10ms
- **Slow Sync (100ms)**: 100-150ms (blocking operation)
- **Compute**: 50-200ms (depends on iterations)
- **Crypto**: 100-500ms (blocking crypto operation)
- **Concurrent Requests**: Sequential queueing (requests wait for each other)

### Non-Blocking App (Port 3001)

- **Health Check**: < 10ms
- **Slow Async (100ms)**: 10-50ms (non-blocking, quick response)
- **Compute Async**: 20-100ms (async CPU work)
- **Crypto Async**: 50-200ms (async crypto operation)
- **Concurrent Requests**: Parallel handling (requests execute concurrently)

**Note:** Timing expectations are approximate. Actual values depend on system resources. Phase 4.2 provides detailed performance baselines.

## Next Steps

After Phase 4.1 completion:
1. ✅ All functional tests passing
2. 🔄 Phase 4.2: Performance Validation (measure latency differences)
3. 🔄 Phase 4.3: Profiling Validation (verify all tools work)

## References

- [Node.js http module](https://nodejs.org/api/http.html)
- [Response format specification](../README.md#response-format)
- [EventLoopMonitor documentation](../TOOLING_ECOSYSTEM.md#event-loop-monitor)
- [Endpoint documentation](../README.md#endpoints)
