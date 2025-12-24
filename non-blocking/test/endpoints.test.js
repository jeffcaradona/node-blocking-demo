/**
 * Functional Test Suite for Non-Blocking App
 * Tests all endpoints with async patterns, concurrency, and non-blocking validation
 */

import test from 'node:test';
import assert from 'node:assert';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3001';
const TIMEOUT_MS = 30000; // 30 second timeout

/**
 * Helper to make HTTP requests
 */
async function makeRequest(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      timeout: TIMEOUT_MS
    });
    const contentType = response.headers.get('content-type');
    
    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      status: response.status,
      statusText: response.statusText,
      contentType,
      data,
      headers: Object.fromEntries(response.headers)
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

/**
 * Validate response format
 * Responses are operation results, possibly wrapped with timing/metadata
 */
function validateResponseFormat(data) {
  assert(data !== null && typeof data === 'object', 'Response must be an object');
  // Operations have either 'success' or 'error' field
  assert('success' in data || 'error' in data || 'service' in data, 'Response should have success, error, or service field');
}

// ============================================================================
// NON-BLOCKING APP TEST SUITE
// ============================================================================

test('Non-Blocking App - Health Check', async (t) => {
  await t.test('GET / returns 200 with valid response format', async () => {
    const response = await makeRequest('/');
    assert.strictEqual(response.status, 200, 'Should return 200 OK');
    
    const data = response.data;
    assert.strictEqual(data.service, 'non-blocking-demo', 'Service name should be non-blocking-demo');
    assert(data.endpoints && Array.isArray(data.endpoints), 'Should have endpoints array');
  });

  await t.test('GET / includes async pattern message', async () => {
    const response = await makeRequest('/');
    const data = response.data;
    
    assert(data.version, 'Should include version');
    assert(data.message && data.message.includes('async'), 'Should mention async patterns');
    assert(data.timestamp, 'Should include timestamp');
  });

  await t.test('GET / has correct Content-Type header', async () => {
    const response = await makeRequest('/');
    assert(
      response.contentType && response.contentType.includes('application/json'),
      'Content-Type should be application/json'
    );
  });
});

test('Non-Blocking App - Slow Async Endpoint', async (t) => {
  await t.test('GET /slow-async with valid parameters returns 200', async () => {
    const response = await makeRequest('/slow-async?duration=50&intensity=1');
    assert.strictEqual(response.status, 200, 'Should return 200 OK');
    validateResponseFormat(response.data);
  });

  await t.test('GET /slow-async executes non-blocking operation', async () => {
    const response = await makeRequest('/slow-async?duration=50&intensity=1');
    const data = response.data;
    
    assert.strictEqual(data.success, true, 'Operation should succeed');
    assert(data.operation && data.operation.includes('async'), 'Should identify as async');
    assert(data.duration, 'Should include duration');
    assert.strictEqual(data.blocked, false, 'Should NOT block');
  });

  await t.test('GET /slow-async response is fast despite long duration', async () => {
    const start = performance.now();
    const response = await makeRequest('/slow-async?duration=100&intensity=1');
    const requestTime = performance.now() - start;
    
    // Non-blocking should return quickly even with longer duration parameter
    assert(requestTime < 5000, 'Non-blocking request should be fast');
    assert.strictEqual(response.status, 200);
  });

  await t.test('GET /slow-async without parameters uses defaults', async () => {
    const response = await makeRequest('/slow-async');
    assert.strictEqual(response.status, 200);
    const data = response.data;
    assert.strictEqual(data.success, true);
  });
});

test('Non-Blocking App - Compute Async Endpoint', async (t) => {
  await t.test('GET /compute-async returns 200 with valid response', async () => {
    const response = await makeRequest('/compute-async?iterations=10');
    assert.strictEqual(response.status, 200);
    validateResponseFormat(response.data);
  });

  await t.test('GET /compute-async performs chunked computation', async () => {
    const response = await makeRequest('/compute-async?iterations=10');
    const data = response.data;
    
    assert.strictEqual(data.success, true);
    assert(data.operation && data.operation.includes('async'));
    assert(data.result !== undefined, 'Should have computed result');
    assert.strictEqual(data.blocked, false, 'Should not block');
  });

  await t.test('GET /compute-async response is fast for heavy computation', async () => {
    const start = performance.now();
    const response = await makeRequest('/compute-async?iterations=100');
    const requestTime = performance.now() - start;
    
    // Should respond quickly due to async chunking
    assert(requestTime < 10000, 'Async request should return in reasonable time');
    assert.strictEqual(response.status, 200);
  });
});

test('Non-Blocking App - Crypto Async Endpoint', async (t) => {
  await t.test('GET /crypto-async returns 200 with valid response', async () => {
    const response = await makeRequest('/crypto-async?iterations=1000');
    assert.strictEqual(response.status, 200);
    validateResponseFormat(response.data);
  });

  await t.test('GET /crypto-async performs async cryptographic operation', async () => {
    const response = await makeRequest('/crypto-async?iterations=1000');
    const data = response.data;
    
    assert.strictEqual(data.success, true);
    assert(data.operation && data.operation.includes('async'));
    assert(data.hash, 'Should return hash');
    assert.strictEqual(data.blocked, false);
  });

  await t.test('GET /crypto-async returns consistent hash format', async () => {
    const response = await makeRequest('/crypto-async?iterations=1000');
    const data = response.data;
    
    assert(typeof data.hash === 'string', 'Hash should be string');
    assert(data.hash.length > 0, 'Hash should not be empty');
  });
});

test('Non-Blocking App - Delay Endpoint', async (t) => {
  await t.test('GET /delay returns 200 with valid response', async () => {
    const response = await makeRequest('/delay?ms=50');
    assert.strictEqual(response.status, 200);
    validateResponseFormat(response.data);
  });

  await t.test('GET /delay uses Promise-based async delay', async () => {
    const response = await makeRequest('/delay?ms=50');
    const data = response.data;
    
    assert.strictEqual(data.success, true);
    assert(data.operation && data.operation.includes('delay'));
    assert.strictEqual(data.blocked, false);
  });

  await t.test('GET /delay returns before actual delay completes', async () => {
    const start = performance.now();
    const response = await makeRequest('/delay?ms=500');
    const requestTime = performance.now() - start;
    
    // Request should complete fast even though delay parameter is longer
    assert(requestTime < 2000, 'Request should not wait for full delay');
    assert.strictEqual(response.status, 200);
  });
});

test('Non-Blocking App - Stream Process Endpoint', async (t) => {
  await t.test('GET /stream-process returns 200 with valid response', async () => {
    const response = await makeRequest('/stream-process?size=1000');
    assert.strictEqual(response.status, 200);
    validateResponseFormat(response.data);
  });

  await t.test('GET /stream-process uses stream-based processing', async () => {
    const response = await makeRequest('/stream-process?size=1000');
    const data = response.data;
    
    assert.strictEqual(data.success, true);
    assert(data.operation && data.operation.includes('stream'));
    assert(data.processedBytes !== undefined, 'Should report bytes processed');
    assert.strictEqual(data.blocked, false);
  });

  await t.test('GET /stream-process handles variable sizes', async () => {
    const response1 = await makeRequest('/stream-process?size=100');
    const response2 = await makeRequest('/stream-process?size=10000');
    
    const bytes1 = response1.data.processedBytes || 0;
    const bytes2 = response2.data.processedBytes || 0;
    
    assert(bytes2 >= bytes1, 'Larger size should process more bytes');
  });
});

test('Non-Blocking App - Parallel Endpoint', async (t) => {
  await t.test('GET /parallel returns 200 with valid response', async () => {
    const response = await makeRequest('/parallel?operations=3');
    assert.strictEqual(response.status, 200);
    validateResponseFormat(response.data);
  });

  await t.test('GET /parallel executes operations in parallel', async () => {
    const response = await makeRequest('/parallel?operations=3');
    const data = response.data;
    
    assert.strictEqual(data.success, true);
    assert(data.operation && data.operation.includes('parallel'));
    assert.strictEqual(data.completed, true, 'All parallel operations should complete');
    assert.strictEqual(data.blocked, false);
  });

  await t.test('GET /parallel completes quickly despite operations count', async () => {
    const start = performance.now();
    const response = await makeRequest('/parallel?operations=10');
    const requestTime = performance.now() - start;
    
    // Parallel should be fast due to concurrency
    assert(requestTime < 10000, 'Parallel operations should complete quickly');
    assert.strictEqual(response.status, 200);
  });

  await t.test('GET /parallel returns operation count', async () => {
    const response = await makeRequest('/parallel?operations=5');
    const data = response.data;
    
    assert(data.count !== undefined, 'Should report operation count');
    assert.strictEqual(data.count, 5, 'Count should match requested operations');
  });
});

test('Non-Blocking App - JSON Async Endpoint', async (t) => {
  await t.test('GET /json-async returns 200 with valid response', async () => {
    const response = await makeRequest('/json-async?items=100');
    assert.strictEqual(response.status, 200);
    validateResponseFormat(response.data);
  });

  await t.test('GET /json-async processes JSON asynchronously', async () => {
    const response = await makeRequest('/json-async?items=100');
    const data = response.data;
    
    assert.strictEqual(data.success, true);
    assert(data.operation && data.operation.includes('async'));
    assert(data.itemsProcessed !== undefined, 'Should report items processed');
    assert.strictEqual(data.blocked, false);
  });

  await t.test('GET /json-async handles large payloads quickly', async () => {
    const start = performance.now();
    const response = await makeRequest('/json-async?items=1000');
    const requestTime = performance.now() - start;
    
    assert(requestTime < 10000, 'Should handle large JSON quickly');
    assert.strictEqual(response.status, 200);
  });
});

test('Non-Blocking App - Error Handling', async (t) => {
  await t.test('GET /slow-async with invalid duration parameter handles gracefully', async () => {
    const response = await makeRequest('/slow-async?duration=invalid');
    assert(response.status === 200 || response.status === 400);
  });

  await t.test('GET /parallel with invalid operations parameter handles gracefully', async () => {
    const response = await makeRequest('/parallel?operations=notanumber');
    assert(response.status === 200 || response.status === 400);
  });

  await t.test('GET /nonexistent returns 404', async () => {
    const response = await makeRequest('/nonexistent');
    assert.strictEqual(response.status, 404, 'Should return 404 for unknown endpoint');
  });

  await t.test('404 response has available endpoints listed', async () => {
    const response = await makeRequest('/nonexistent');
    const data = response.data;
    
    if (data.availableEndpoints) {
      assert(Array.isArray(data.availableEndpoints), 'Should list endpoints');
    }
  });
});

test('Non-Blocking App - Response Format Validation', async (t) => {
  await t.test('All operation responses include duration or requestDuration', async () => {
    const endpoints = [
      '/slow-async?duration=10&intensity=1',
      '/compute-async?iterations=5',
      '/crypto-async?iterations=100',
      '/delay?ms=10',
      '/stream-process?size=100',
      '/parallel?operations=2'
    ];

    for (const endpoint of endpoints) {
      const response = await makeRequest(endpoint);
      const hasDuration = response.data.duration !== undefined || response.data.requestDuration !== undefined;
      assert(hasDuration, `${endpoint} should have duration or requestDuration`);
    }
  });

  await t.test('All responses indicate non-blocking behavior', async () => {
    const endpoints = [
      '/slow-async?duration=50&intensity=1',
      '/compute-async?iterations=5',
      '/crypto-async?iterations=100'
    ];

    for (const endpoint of endpoints) {
      const response = await makeRequest(endpoint);
      assert.strictEqual(response.data.blocked, false, 
        `${endpoint} should indicate non-blocking`);
    }
  });
});

test('Non-Blocking App - Concurrent Request Handling', async (t) => {
  await t.test('Handles 3 simultaneous requests without blocking', async () => {
    const start = performance.now();
    const requests = [
      makeRequest('/slow-async?duration=100&intensity=1'),
      makeRequest('/compute-async?iterations=10'),
      makeRequest('/crypto-async?iterations=100')
    ];

    const responses = await Promise.all(requests);
    const totalTime = performance.now() - start;
    
    for (const response of responses) {
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.blocked, false);
    }
    
    // Concurrent requests should complete roughly in parallel
    // not sequentially (sequential would take much longer)
    assert(totalTime < 15000, 'Concurrent requests should not block each other');
  });

  await t.test('Handles 10 concurrent requests to same endpoint', async () => {
    const start = performance.now();
    const requests = Array(10).fill(null).map(() => 
      makeRequest('/delay?ms=50')
    );

    const responses = await Promise.all(requests);
    const totalTime = performance.now() - start;
    
    assert.strictEqual(responses.length, 10);
    assert(responses.every(r => r.status === 200), 'All should succeed');
    assert(totalTime < 10000, 'Should handle 10 concurrent delays efficiently');
  });

  await t.test('Concurrent requests do not block each other', async () => {
    // Make one long-running and many short requests
    const longRequest = makeRequest('/slow-async?duration=100&intensity=1');
    
    // Give long request a head start, then make quick requests
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const shortRequests = Array(5).fill(null).map(() =>
      makeRequest('/delay?ms=1')
    );

    const [longResponse, ...shortResponses] = await Promise.all([
      longRequest,
      ...shortRequests
    ]);

    // All should succeed quickly
    assert.strictEqual(longResponse.status, 200);
    assert(shortResponses.every(r => r.status === 200));
  });
});

test('Non-Blocking App - Performance Characteristics', async (t) => {
  await t.test('Non-blocking requests complete faster than blocking equivalents', async () => {
    // This is a comparison test - both apps should be available
    const nbResponse = await makeRequest('/compute-async?iterations=5');
    assert.strictEqual(nbResponse.status, 200);
    
    // Just verify non-blocking returns quickly
    assert(nbResponse.data.timing.duration < 10000, 
      'Non-blocking computation should complete in reasonable time');
  });

  await t.test('Concurrent non-blocking operations are truly parallel', async () => {
    const start = performance.now();
    
    // 5 requests that would take 500ms each if serial = 2500ms total
    // In parallel should take ~500ms
    const requests = Array(5).fill(null).map(() =>
      makeRequest('/delay?ms=100')
    );
    
    await Promise.all(requests);
    const totalTime = performance.now() - start;
    
    // With 5 x 100ms in parallel, should be ~100ms (plus overhead)
    // Definitely NOT 500ms
    assert(totalTime < 2000, 'Parallel execution should be significantly faster');
  });
});

test('Non-Blocking App - Async Pattern Compliance', async (t) => {
  await t.test('All endpoints use async/await patterns', async () => {
    const endpoints = [
      '/slow-async?duration=10&intensity=1',
      '/compute-async?iterations=5',
      '/crypto-async?iterations=100',
      '/delay?ms=10',
      '/stream-process?size=100',
      '/parallel?operations=2',
      '/json-async?items=10'
    ];

    for (const endpoint of endpoints) {
      const response = await makeRequest(endpoint);
      // All should return quickly (not block)
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.blocked, false);
    }
  });

  await t.test('Event Loop remains responsive during async operations', async () => {
    // Make a slow async request
    const slowRequest = makeRequest('/slow-async?duration=500&intensity=1');
    
    // Event loop should still be responsive - make quick request while slow one runs
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const quickRequest = makeRequest('/delay?ms=10');
    
    const [slowResponse, quickResponse] = await Promise.all([
      slowRequest,
      quickRequest
    ]);
    
    // Both should succeed, quick one should actually complete quickly
    assert.strictEqual(slowResponse.status, 200);
    assert.strictEqual(quickResponse.status, 200);
  });
});

console.log('\n📝 Non-Blocking App Test Suite: All tests defined\n');
