import { readFile, writeFile } from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { randomBytes, pbkdf2 } from 'crypto';
import { promisify } from 'util';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pbkdf2Async = promisify(pbkdf2);

/**
 * Non-Blocking Operations Module
 * Demonstrates async patterns that don't block the Node.js event loop
 */

/**
 * Asynchronous file read - Uses promises, doesn't block
 * @param {number} iterations - Number of times to read
 * @returns {Promise<Object>} Result with timing and size
 */
export const asyncFileRead = async (iterations = 1) => {
  const start = performance.now();
  const testFile = join(__dirname, '..', 'test-data.txt');
  
  try {
    // Create test file if it doesn't exist
    try {
      await readFile(testFile);
    } catch {
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB of data
      await writeFile(testFile, largeContent, 'utf8');
    }
    
    let totalSize = 0;
    for (let i = 0; i < iterations; i++) {
      const data = await readFile(testFile, 'utf8');
      totalSize += data.length;
    }
    
    const duration = performance.now() - start;
    
    return {
      success: true,
      operation: 'async-file-read',
      iterations,
      totalSize,
      duration: `${duration.toFixed(2)}ms`,
      blocked: false
    };
  } catch (error) {
    return {
      success: false,
      operation: 'async-file-read',
      error: error.message,
      blocked: false
    };
  }
};

/**
 * Chunked computation with yield points - Allows event loop to process other tasks
 * @param {number} limit - Computation limit
 * @returns {Promise<Object>} Result with timing
 */
export const asyncComputation = async (limit = 1000000) => {
  const start = performance.now();
  
  try {
    const chunkSize = 10000;
    let result = 0;
    
    // Break computation into chunks
    for (let i = 0; i < limit; i += chunkSize) {
      const end = Math.min(i + chunkSize, limit);
      
      // Do computation chunk
      for (let j = i; j < end; j++) {
        result += Math.sqrt(j) * Math.sin(j);
      }
      
      // Yield to event loop after each chunk
      await new Promise(resolve => setImmediate(resolve));
    }
    
    // Compute fibonacci with async approach
    const fibonacci = async (n) => {
      if (n <= 1) return n;
      if (n > 35) return 'skipped-too-large'; // Prevent blocking even in async
      
      // Simple iterative approach (non-blocking)
      let a = 0, b = 1;
      for (let i = 2; i <= n; i++) {
        [a, b] = [b, a + b];
        if (i % 5 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
      return b;
    };
    
    const fibResult = await fibonacci(30);
    
    const duration = performance.now() - start;
    
    return {
      success: true,
      operation: 'async-computation',
      limit,
      chunkSize,
      result: result.toFixed(2),
      fibonacci: fibResult,
      duration: `${duration.toFixed(2)}ms`,
      blocked: false,
      note: 'Computation broken into chunks with yield points'
    };
  } catch (error) {
    return {
      success: false,
      operation: 'async-computation',
      error: error.message,
      blocked: false
    };
  }
};

/**
 * Asynchronous cryptographic operation - Uses callback-based crypto with promises
 * @param {number} iterations - Key derivation iterations
 * @returns {Promise<Object>} Result with timing
 */
export const asyncCrypto = async (iterations = 100000) => {
  const start = performance.now();
  
  try {
    const password = 'user-password';
    const salt = randomBytes(16);
    
    // Async PBKDF2 - doesn't block event loop
    const derivedKey = await pbkdf2Async(password, salt, iterations, 64, 'sha512');
    
    const duration = performance.now() - start;
    
    return {
      success: true,
      operation: 'async-crypto',
      iterations,
      keyLength: derivedKey.length,
      duration: `${duration.toFixed(2)}ms`,
      blocked: false,
      note: 'Operation delegated to thread pool'
    };
  } catch (error) {
    return {
      success: false,
      operation: 'async-crypto',
      error: error.message,
      blocked: false
    };
  }
};

/**
 * Delayed operation with proper async - No busy waiting
 * @param {number} durationMs - How long to wait in milliseconds
 * @returns {Promise<Object>} Result with timing
 */
export const asyncDelay = async (durationMs = 1000) => {
  const start = performance.now();
  
  try {
    // Proper async delay - doesn't block!
    await new Promise(resolve => setTimeout(resolve, durationMs));
    
    const actualDuration = performance.now() - start;
    
    return {
      success: true,
      operation: 'async-delay',
      requestedDuration: `${durationMs}ms`,
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      blocked: false,
      note: 'Event loop remained free during delay'
    };
  } catch (error) {
    return {
      success: false,
      operation: 'async-delay',
      error: error.message,
      blocked: false
    };
  }
};

/**
 * Stream processing - Efficient for large data
 * @param {number} chunks - Number of data chunks to process
 * @returns {Promise<Object>} Result with timing
 */
export const streamProcessing = async (chunks = 100) => {
  const start = performance.now();
  const testFile = join(__dirname, '..', 'stream-test.txt');
  const outputFile = join(__dirname, '..', 'stream-output.txt');
  
  try {
    // Create test data
    const data = Array.from({ length: chunks }, (_, i) => 
      `Line ${i}: ${'x'.repeat(1000)}\n`
    ).join('');
    await writeFile(testFile, data, 'utf8');
    
    // Stream processing - memory efficient, non-blocking
    const readStream = createReadStream(testFile, { encoding: 'utf8' });
    const writeStream = createWriteStream(outputFile);
    
    let bytesProcessed = 0;
    
    readStream.on('data', (chunk) => {
      bytesProcessed += chunk.length;
    });
    
    await pipeline(readStream, writeStream);
    
    const duration = performance.now() - start;
    
    return {
      success: true,
      operation: 'stream-processing',
      chunks,
      bytesProcessed,
      duration: `${duration.toFixed(2)}ms`,
      blocked: false,
      note: 'Streams handle backpressure automatically'
    };
  } catch (error) {
    return {
      success: false,
      operation: 'stream-processing',
      error: error.message,
      blocked: false
    };
  }
};

/**
 * Parallel async operations - Uses Promise.all for concurrency
 * @returns {Promise<Object>} Result with all operations
 */
export const parallelAsyncOps = async () => {
  const start = performance.now();
  
  try {
    // Run operations in parallel - much faster than sequential!
    const results = await Promise.all([
      asyncFileRead(2),
      asyncComputation(500000),
      asyncCrypto(50000)
    ]);
    
    const totalDuration = performance.now() - start;
    
    return {
      success: true,
      operation: 'parallel-async-ops',
      results: {
        fileRead: results[0],
        computation: results[1],
        crypto: results[2]
      },
      totalDuration: `${totalDuration.toFixed(2)}ms`,
      blocked: false,
      note: 'Operations ran in parallel, event loop remained responsive'
    };
  } catch (error) {
    return {
      success: false,
      operation: 'parallel-async-ops',
      error: error.message,
      blocked: false
    };
  }
};

/**
 * Large JSON with async chunks - Prevents blocking on huge objects
 * @param {number} size - Size of JSON object
 * @returns {Promise<Object>} Result with timing
 */
export const asyncJsonProcessing = async (size = 10000) => {
  const start = performance.now();
  
  try {
    // Build object with yield points
    const largeObject = {};
    const chunkSize = 1000;
    
    for (let i = 0; i < size; i += chunkSize) {
      const end = Math.min(i + chunkSize, size);
      
      for (let j = i; j < end; j++) {
        largeObject[`key_${j}`] = {
          id: j,
          data: 'x'.repeat(100),
          nested: { value: Math.random() }
        };
      }
      
      // Yield after each chunk
      await new Promise(resolve => setImmediate(resolve));
    }
    
    const jsonString = JSON.stringify(largeObject);
    const parsed = JSON.parse(jsonString);
    
    const duration = performance.now() - start;
    
    return {
      success: true,
      operation: 'async-json-processing',
      objectSize: size,
      jsonLength: jsonString.length,
      parsedKeys: Object.keys(parsed).length,
      duration: `${duration.toFixed(2)}ms`,
      blocked: false,
      note: 'Object creation had yield points to prevent blocking'
    };
  } catch (error) {
    return {
      success: false,
      operation: 'async-json-processing',
      error: error.message,
      blocked: false
    };
  }
};
