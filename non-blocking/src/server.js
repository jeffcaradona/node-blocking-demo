import { createServer } from 'http';
import { URL } from 'url';
import { performance } from 'perf_hooks';
import {
  asyncFileRead,
  asyncComputation,
  asyncCrypto,
  asyncDelay,
  streamProcessing,
  parallelAsyncOps,
  asyncJsonProcessing
} from './operations.js';

/**
 * HTTP Server with non-blocking async route handlers
 */

const PORT = process.env.PORT || 3001;

/**
 * Parse URL and query parameters
 */
const parseRequest = (req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  return {
    pathname: url.pathname,
    query: Object.fromEntries(url.searchParams)
  };
};

/**
 * Send JSON response
 */
const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
};

/**
 * Async route handlers
 */
const routes = {
  '/': async (req, res, query) => {
    sendJson(res, 200, {
      service: 'non-blocking-demo',
      version: '1.0.0',
      message: 'Demonstrating non-blocking async operations',
      endpoints: [
        'GET / - Health check',
        'GET /slow-async - Asynchronous file read',
        'GET /compute-async - Chunked computation with yield',
        'GET /crypto-async - Async cryptographic operation',
        'GET /delay - Async delay (no busy waiting)',
        'GET /stream-process - Stream processing',
        'GET /parallel - Parallel async operations',
        'GET /json-async - Async JSON processing'
      ],
      note: 'All endpoints are non-blocking!',
      timestamp: new Date().toISOString()
    });
  },

  '/slow-async': async (req, res, query) => {
    const start = performance.now();
    const iterations = parseInt(query.iterations) || 3;
    
    try {
      const result = await asyncFileRead(iterations);
      const requestDuration = performance.now() - start;
      
      sendJson(res, 200, {
        ...result,
        requestDuration: `${requestDuration.toFixed(2)}ms`,
        note: 'Event loop remained free during file read'
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error.message,
        endpoint: '/slow-async'
      });
    }
  },

  '/compute-async': async (req, res, query) => {
    const start = performance.now();
    const limit = parseInt(query.limit) || 1000000;
    
    try {
      const result = await asyncComputation(limit);
      const requestDuration = performance.now() - start;
      
      sendJson(res, 200, {
        ...result,
        requestDuration: `${requestDuration.toFixed(2)}ms`,
        note: 'Computation yielded to event loop between chunks'
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error.message,
        endpoint: '/compute-async'
      });
    }
  },

  '/crypto-async': async (req, res, query) => {
    const start = performance.now();
    const iterations = parseInt(query.iterations) || 100000;
    
    try {
      const result = await asyncCrypto(iterations);
      const requestDuration = performance.now() - start;
      
      sendJson(res, 200, {
        ...result,
        requestDuration: `${requestDuration.toFixed(2)}ms`,
        note: 'Crypto operation ran in thread pool - non-blocking'
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error.message,
        endpoint: '/crypto-async'
      });
    }
  },

  '/delay': async (req, res, query) => {
    const start = performance.now();
    const duration = parseInt(query.duration) || 1000;
    
    try {
      const result = await asyncDelay(duration);
      const requestDuration = performance.now() - start;
      
      sendJson(res, 200, {
        ...result,
        requestDuration: `${requestDuration.toFixed(2)}ms`,
        note: 'Proper async delay - no blocking!'
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error.message,
        endpoint: '/delay'
      });
    }
  },

  '/stream-process': async (req, res, query) => {
    const start = performance.now();
    const chunks = parseInt(query.chunks) || 100;
    
    try {
      const result = await streamProcessing(chunks);
      const requestDuration = performance.now() - start;
      
      sendJson(res, 200, {
        ...result,
        requestDuration: `${requestDuration.toFixed(2)}ms`,
        note: 'Stream processing with automatic backpressure'
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error.message,
        endpoint: '/stream-process'
      });
    }
  },

  '/parallel': async (req, res, query) => {
    const start = performance.now();
    
    try {
      const result = await parallelAsyncOps();
      const requestDuration = performance.now() - start;
      
      sendJson(res, 200, {
        ...result,
        requestDuration: `${requestDuration.toFixed(2)}ms`,
        note: 'Multiple operations ran in parallel - much faster!'
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error.message,
        endpoint: '/parallel'
      });
    }
  },

  '/json-async': async (req, res, query) => {
    const start = performance.now();
    const size = parseInt(query.size) || 10000;
    
    try {
      const result = await asyncJsonProcessing(size);
      const requestDuration = performance.now() - start;
      
      sendJson(res, 200, {
        ...result,
        requestDuration: `${requestDuration.toFixed(2)}ms`,
        note: 'JSON processing with yield points to prevent blocking'
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error.message,
        endpoint: '/json-async'
      });
    }
  }
};

/**
 * Async request handler
 */
const handleRequest = async (req, res) => {
  const requestStart = performance.now();
  const { pathname, query } = parseRequest(req);
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);
  
  // Handle routes
  const handler = routes[pathname];
  
  if (handler) {
    try {
      await handler(req, res, query);
      const duration = performance.now() - requestStart;
      console.log(`  ✓ Completed in ${duration.toFixed(2)}ms (NON-BLOCKING)`);
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
      sendJson(res, 500, {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  } else {
    sendJson(res, 404, {
      success: false,
      error: 'Not Found',
      path: pathname,
      availableEndpoints: Object.keys(routes)
    });
  }
};

/**
 * Create and export server
 */
export const createNonBlockingServer = () => {
  // Wrap async handler for http.createServer
  const server = createServer((req, res) => {
    handleRequest(req, res).catch(error => {
      console.error('Unhandled error in request handler:', error);
      if (!res.headersSent) {
        sendJson(res, 500, {
          success: false,
          error: 'Internal Server Error'
        });
      }
    });
  });
  
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', error.message);
      throw error;
    }
  });
  
  return server;
};

/**
 * Start server
 */
export const startServer = () => {
  const server = createNonBlockingServer();
  
  return new Promise((resolve, reject) => {
    server.listen(PORT, () => {
      console.log(`\n🟢 Non-blocking server started on http://localhost:${PORT}`);
      console.log(`✨ All endpoints use async/await patterns`);
      console.log(`\n📍 Available endpoints:`);
      Object.keys(routes).forEach(route => {
        console.log(`   http://localhost:${PORT}${route}`);
      });
      console.log('');
      resolve(server);
    });
    
    server.on('error', reject);
  });
};
