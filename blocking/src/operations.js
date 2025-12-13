import { readFileSync, writeFileSync } from 'fs';
import { randomBytes, pbkdf2Sync } from 'crypto';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Blocking Operations Module
 * Demonstrates various operations that block the Node.js event loop
 */

/**
 * Synchronous file read - Blocks until file is read
 * @param {number} iterations - Number of times to read
 * @returns {Object} Result with timing and size
 */
export const blockingFileRead = (iterations = 1) => {
  const start = performance.now();
  const testFile = join(__dirname, '..', 'test-data.txt');
  
  try {
    // Create test file if it doesn't exist
    try {
      readFileSync(testFile);
    } catch {
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB of data
      writeFileSync(testFile, largeContent, 'utf8');
    }
    
    let totalSize = 0;
    for (let i = 0; i < iterations; i++) {
      const data = readFileSync(testFile, 'utf8');
      totalSize += data.length;
    }
    
    const duration = performance.now() - start;
    
    return {
      success: true,
      operation: 'blocking-file-read',
      iterations,
      totalSize,
      duration: `${duration.toFixed(2)}ms`,
      blocked: true
    };
  } catch (error) {
    return {
      success: false,
      operation: 'blocking-file-read',
      error: error.message,
      blocked: true
    };
  }
};

/**
 * Long-running CPU computation - Blocks event loop
 * @param {number} limit - Computation limit (higher = longer blocking)
 * @returns {Object} Result with timing and computed value
 */
export const blockingComputation = (limit = 1000000) => {
  const start = performance.now();
  
  try {
    // Compute fibonacci numbers inefficiently (intentionally blocking)
    const fibonacci = (n) => {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    };
    
    // Do some heavy computation
    let result = 0;
    for (let i = 0; i < limit; i++) {
      result += Math.sqrt(i) * Math.sin(i);
    }
    
    // Add some fibonacci for extra blocking
    const fibResult = fibonacci(30);
    
    const duration = performance.now() - start;
    
    return {
      success: true,
      operation: 'blocking-computation',
      limit,
      result: result.toFixed(2),
      fibonacci: fibResult,
      duration: `${duration.toFixed(2)}ms`,
      blocked: true
    };
  } catch (error) {
    return {
      success: false,
      operation: 'blocking-computation',
      error: error.message,
      blocked: true
    };
  }
};

/**
 * Synchronous cryptographic operation - Blocks event loop
 * @param {number} iterations - Key derivation iterations
 * @returns {Object} Result with timing
 */
export const blockingCrypto = (iterations = 100000) => {
  const start = performance.now();
  
  try {
    const password = 'user-password';
    const salt = randomBytes(16);
    
    // Synchronous PBKDF2 - very blocking!
    const derivedKey = pbkdf2Sync(password, salt, iterations, 64, 'sha512');
    
    const duration = performance.now() - start;
    
    return {
      success: true,
      operation: 'blocking-crypto',
      iterations,
      keyLength: derivedKey.length,
      duration: `${duration.toFixed(2)}ms`,
      blocked: true
    };
  } catch (error) {
    return {
      success: false,
      operation: 'blocking-crypto',
      error: error.message,
      blocked: true
    };
  }
};

/**
 * Intentional busy loop - Completely blocks event loop
 * @param {number} durationMs - How long to block in milliseconds
 * @returns {Object} Result with timing
 */
export const busyLoop = (durationMs = 1000) => {
  const start = performance.now();
  
  try {
    const endTime = start + durationMs;
    let iterations = 0;
    
    // Busy wait - worst case blocking!
    while (performance.now() < endTime) {
      iterations++;
      // Do some work to prevent optimization
      Math.sqrt(iterations);
    }
    
    const actualDuration = performance.now() - start;
    
    return {
      success: true,
      operation: 'busy-loop',
      requestedDuration: `${durationMs}ms`,
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      iterations,
      blocked: true,
      warning: 'Event loop completely blocked during this operation'
    };
  } catch (error) {
    return {
      success: false,
      operation: 'busy-loop',
      error: error.message,
      blocked: true
    };
  }
};

/**
 * Large JSON parsing - Blocks during parse
 * @param {number} size - Size of JSON object to create
 * @returns {Object} Result with timing
 */
export const blockingJsonParse = (size = 10000) => {
  const start = performance.now();
  
  try {
    // Create large object
    const largeObject = {};
    for (let i = 0; i < size; i++) {
      largeObject[`key_${i}`] = {
        id: i,
        data: 'x'.repeat(100),
        nested: { value: Math.random() }
      };
    }
    
    // Stringify and parse (both block)
    const jsonString = JSON.stringify(largeObject);
    const parsed = JSON.parse(jsonString);
    
    const duration = performance.now() - start;
    
    return {
      success: true,
      operation: 'blocking-json-parse',
      objectSize: size,
      jsonLength: jsonString.length,
      parsedKeys: Object.keys(parsed).length,
      duration: `${duration.toFixed(2)}ms`,
      blocked: true
    };
  } catch (error) {
    return {
      success: false,
      operation: 'blocking-json-parse',
      error: error.message,
      blocked: true
    };
  }
};

/**
 * Combine multiple blocking operations
 * @returns {Object} Result with all operations
 */
export const multipleBlockingOps = () => {
  const start = performance.now();
  
  try {
    const results = {
      fileRead: blockingFileRead(2),
      computation: blockingComputation(500000),
      crypto: blockingCrypto(50000)
    };
    
    const totalDuration = performance.now() - start;
    
    return {
      success: true,
      operation: 'multiple-blocking-ops',
      results,
      totalDuration: `${totalDuration.toFixed(2)}ms`,
      blocked: true,
      warning: 'Event loop blocked for entire duration of all operations'
    };
  } catch (error) {
    return {
      success: false,
      operation: 'multiple-blocking-ops',
      error: error.message,
      blocked: true
    };
  }
};
