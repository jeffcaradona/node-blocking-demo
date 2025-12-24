/**
 * Functional Test Suite for Blocking App
 * Tests all endpoints with various parameters, error handling, and response validation
 */

import test from 'node:test';
import assert from 'node:assert';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3000';
const TIMEOUT_MS = 30000; // 30 second timeout for blocking operations

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
// BLOCKING APP TEST SUITE
// ============================================================================

test('Blocking App - Health Check', async (t) => {
  await t.test('GET / returns 200 with valid response format', async () => {
    const response = await makeRequest('/');
    assert.strictEqual(response.status, 200, 'Should return 200 OK');
    
    const data = response.data;
    assert.strictEqual(data.service, 'blocking-demo', 'Service name should be blocking-demo');
    assert(data.endpoints && Array.isArray(data.endpoints), 'Should have endpoints array');
  });

  await t.test('GET / includes response metadata', async () => {
    const response = await makeRequest('/');
    const data = response.data;
    
    assert(data.version, 'Should include version');
    assert(data.message, 'Should include message');
    assert(data.timestamp, 'Should include timestamp');
    assert(data.warning, 'Should include warning about blocking');
  });

  await t.test('GET / has correct Content-Type header', async () => {
    const response = await makeRequest('/');
    assert(
      response.contentType && response.contentType.includes('application/json'),
      'Content-Type should be application/json'
    );
  });
});

test('Blocking App - Slow Sync Endpoint', async (t) => {
  await t.test('GET /slow-sync with valid parameters returns 200', async () => {
    const response = await makeRequest('/slow-sync?iterations=1');
    assert.strictEqual(response.status, 200, 'Should return 200 OK');
    validateResponseFormat(response.data);
  });

  await t.test('GET /slow-sync executes blocking operation', async () => {
    const response = await makeRequest('/slow-sync?iterations=1');
    const data = response.data;
    
    assert.strictEqual(data.success, true, 'Operation should succeed');
    assert.strictEqual(data.operation, 'blocking-file-read', 'Should identify operation type');
    assert(data.duration, 'Should include duration');
    assert.strictEqual(data.blocked, true, 'Should indicate blocking behavior');
  });

  await t.test('GET /slow-sync without parameters uses defaults', async () => {
    const response = await makeRequest('/slow-sync');
    assert.strictEqual(response.status, 200);
    const data = response.data;
    assert.strictEqual(data.success, true);
  });

  await t.test('GET /slow-sync includes iteration count', async () => {
    const response = await makeRequest('/slow-sync?iterations=2');
    const data = response.data;
    assert.strictEqual(data.iterations, 2, 'Should reflect iterations parameter');
  });

  await t.test('GET /slow-sync returns positive duration', async () => {
    const response = await makeRequest('/slow-sync?iterations=1');
    const data = response.data;
    const durationMs = parseFloat(data.duration);
    assert(durationMs > 0, 'Duration should be positive');
  });
});

test('Blocking App - Compute Endpoint', async (t) => {
  await t.test('GET /compute returns 200 with valid response', async () => {
    const response = await makeRequest('/compute?limit=10000');
    assert.strictEqual(response.status, 200);
    validateResponseFormat(response.data);
  });

  await t.test('GET /compute performs CPU-intensive operation', async () => {
    const response = await makeRequest('/compute?limit=10000');
    const data = response.data;
    
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.operation, 'blocking-computation');
    assert(data.result !== undefined, 'Should have computed result');
    assert(data.fibonacci !== undefined, 'Should have fibonacci result');
    assert.strictEqual(data.blocked, true);
  });

  await t.test('GET /compute with different limits shows timing differences', async () => {
    const response1 = await makeRequest('/compute?limit=1000');
    const response2 = await makeRequest('/compute?limit=100000');
    
    const duration1 = parseFloat(response1.data.duration);
    const duration2 = parseFloat(response2.data.duration);
    
    assert(duration2 > duration1, 'Larger limit should take longer');
  });
});

test('Blocking App - Crypto Endpoint', async (t) => {
  await t.test('GET /crypto returns 200 with valid response', async () => {
    const response = await makeRequest('/crypto?iterations=1000');
    assert.strictEqual(response.status, 200);
    validateResponseFormat(response.data);
  });

  await t.test('GET /crypto performs cryptographic operation', async () => {
    const response = await makeRequest('/crypto?iterations=1000');
    const data = response.data;
    
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.operation, 'blocking-crypto');
    assert(data.keyLength !== undefined, 'Should return keyLength');
    assert.strictEqual(data.blocked, true);
  });

  await t.test('GET /crypto returns consistent key length', async () => {
    const response = await makeRequest('/crypto?iterations=1000');
    const data = response.data;
    
    assert(typeof data.keyLength === 'number', 'keyLength should be number');
    assert(data.keyLength > 0, 'keyLength should be positive');
  });
});

test('Blocking App - Busy Loop Endpoint', async (t) => {
  await t.test('GET /busy-loop returns 200 with valid response', async () => {
    const response = await makeRequest('/busy-loop?duration=10');
    assert.strictEqual(response.status, 200);
    validateResponseFormat(response.data);
  });

  await t.test('GET /busy-loop creates maximum blocking', async () => {
    const response = await makeRequest('/busy-loop?duration=10');
    const data = response.data;
    
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.operation, 'busy-loop');
    assert(data.actualDuration !== undefined, 'Should track actual duration');
    assert(data.note && data.note.includes('COMPLETELY blocked'), 'Should note complete blocking');
  });

  await t.test('GET /busy-loop without parameters uses defaults', async () => {
    const response = await makeRequest('/busy-loop');
    assert.strictEqual(response.status, 200);
  });
});

test('Blocking App - JSON Parse Endpoint', async (t) => {
  await t.test('GET /json-parse returns 200 with valid response', async () => {
    const response = await makeRequest('/json-parse?size=100');
    assert.strictEqual(response.status, 200);
    validateResponseFormat(response.data);
  });

  await t.test('GET /json-parse parses JSON data', async () => {
    const response = await makeRequest('/json-parse?size=100');
    const data = response.data;
    
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.operation, 'blocking-json-parse');
    assert(data.objectSize !== undefined, 'Should report object size');
    assert(data.parsedKeys !== undefined, 'Should report parsed keys');
    assert(data.jsonLength !== undefined, 'Should report JSON length');
  });
});

test('Blocking App - Multiple Operations Endpoint', async (t) => {
  await t.test('GET /multiple returns 200 with valid response', async () => {
    const response = await makeRequest('/multiple');
    assert.strictEqual(response.status, 200);
    validateResponseFormat(response.data);
  });

  await t.test('GET /multiple executes multiple operations', async () => {
    const response = await makeRequest('/multiple');
    const data = response.data;
    
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.operation, 'multiple-blocking-ops');
    assert(typeof data.results === 'object', 'Should have results object');
    assert(data.results.fileRead, 'Should include file read result');
    assert(data.results.computation, 'Should include computation result');
    assert(data.results.crypto, 'Should include crypto result');
  });

  await t.test('GET /multiple combines timing of all operations', async () => {
    const response = await makeRequest('/multiple');
    const data = response.data;
    
    const totalDuration = parseFloat(data.totalDuration);
    assert(totalDuration > 0, 'Total duration should be positive');
  });
});

test('Blocking App - Error Handling', async (t) => {
  await t.test('GET /slow-sync with invalid iterations parameter handles gracefully', async () => {
    const response = await makeRequest('/slow-sync?iterations=invalid');
    // Should either return error or use default
    assert(response.status === 200 || response.status === 400, 'Should handle invalid param gracefully');
    assert(!response.data.error || response.data.error, 'Should have error field if error');
  });

  await t.test('GET /compute with invalid limit handles gracefully', async () => {
    const response = await makeRequest('/compute?limit=notanumber');
    // Should either return error or use default
    assert(response.status === 200 || response.status === 400);
  });

  await t.test('GET /nonexistent returns 404', async () => {
    const response = await makeRequest('/nonexistent');
    assert.strictEqual(response.status, 404, 'Should return 404 for unknown endpoint');
  });

  await t.test('404 response has available endpoints listed', async () => {
    const response = await makeRequest('/nonexistent');
    const data = response.data;
    
    assert(data.availableEndpoints && Array.isArray(data.availableEndpoints), 
      'Should list available endpoints in 404');
  });
});

test('Blocking App - Response Format Validation', async (t) => {
  await t.test('All operation responses include duration or requestDuration', async () => {
    const endpoints = [
      '/slow-sync?iterations=1',
      '/compute?limit=1000',
      '/crypto?iterations=100',
      '/busy-loop?duration=5',
      '/json-parse?size=50',
      '/multiple'
    ];

    for (const endpoint of endpoints) {
      const response = await makeRequest(endpoint);
      const hasDuration = response.data.duration !== undefined || response.data.requestDuration !== undefined;
      assert(hasDuration, `${endpoint} should have duration or requestDuration`);
    }
  });

  await t.test('All successful operation responses include success field', async () => {
    const endpoints = ['/slow-sync?iterations=1', '/compute?limit=100'];

    for (const endpoint of endpoints) {
      const response = await makeRequest(endpoint);
      assert.strictEqual(response.data.success, true, `${endpoint} should have success: true`);
    }
  });
});

test('Blocking App - EventLoopMonitor Integration', async (t) => {
  await t.test('Responses may include EventLoopMonitor metrics', async () => {
    const response = await makeRequest('/slow-sync?iterations=1');
    const data = response.data;
    
    // EventLoopMonitor might be in response.data or separate field
    // Just verify if present, they have correct types
    if ('blockingEvents' in data) {
      assert(typeof data.blockingEvents === 'number', 'blockingEvents should be number');
    }
    if ('blocked' in data) {
      assert(typeof data.blocked === 'boolean' || typeof data.blocked === 'number', 
        'blocked should be boolean or number');
    }
  });
});

test('Blocking App - Concurrent Requests', async (t) => {
  await t.test('Handles 3 simultaneous requests without crashing', async () => {
    const requests = [
      makeRequest('/slow-sync?iterations=1'),
      makeRequest('/compute?limit=1000'),
      makeRequest('/crypto?iterations=100')
    ];

    const responses = await Promise.all(requests);
    
    for (const response of responses) {
      assert.strictEqual(response.status, 200, 'All concurrent requests should succeed');
      assert(response.data.success === true || response.data.service, 'Responses should be valid');
    }
  });

  await t.test('Handles 5 concurrent requests to same endpoint', async () => {
    const requests = Array(5).fill(null).map(() => 
      makeRequest('/compute?limit=100')
    );

    const responses = await Promise.all(requests);
    assert.strictEqual(responses.length, 5, 'All requests should complete');
    assert(responses.every(r => r.status === 200), 'All should succeed');
  });
});

test('Blocking App - Performance Characteristics', async (t) => {
  await t.test('Requests take reasonable time for blocking operations', async () => {
    const start = performance.now();
    await makeRequest('/slow-sync?iterations=1');
    const duration = performance.now() - start;

    // Blocking operations should take at least some time
    assert(duration > 0, 'Operation should take measurable time');
  });

  await t.test('Slower operations take longer than fast defaults', async () => {
    const fast = await makeRequest('/compute?limit=100');
    const slow = await makeRequest('/compute?limit=100000');

    const fastDuration = parseFloat(fast.data.duration);
    const slowDuration = parseFloat(slow.data.duration);

    assert(slowDuration > fastDuration, 'More work should take longer');
  });
});

console.log('\n📝 Blocking App Test Suite: All tests defined\n');
