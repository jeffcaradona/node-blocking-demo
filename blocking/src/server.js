import { createServer } from 'http';
import { URL } from 'url';
import { performance } from 'perf_hooks';
import {
  blockingFileRead,
  blockingComputation,
  blockingCrypto,
  busyLoop,
  blockingJsonParse,
  multipleBlockingOps
} from './operations.js';

/**
 * HTTP Server with blocking route handlers
 */

const PORT = process.env.PORT || 3000;

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
 * Route handlers
 */
const routes = {
  '/': (req, res, query) => {
    sendJson(res, 200, {
      service: 'blocking-demo',
      version: '1.0.0',
      message: 'Demonstrating blocking operations',
      endpoints: [
        'GET / - Health check',
        'GET /slow-sync - Synchronous file read',
        'GET /compute - CPU-intensive computation',
        'GET /crypto - Cryptographic operation',
        'GET /busy-loop - Intentional busy loop',
        'GET /json-parse - Large JSON parsing',
        'GET /multiple - Multiple blocking operations'
      ],
      warning: 'All endpoints block the event loop!',
      timestamp: new Date().toISOString()
    });
  },

  '/slow-sync': (req, res, query) => {
    const start = performance.now();
    const iterations = parseInt(query.iterations) || 3;
    
    try {
      const result = blockingFileRead(iterations);
      const requestDuration = performance.now() - start;
      
      sendJson(res, 200, {
        ...result,
        requestDuration: `${requestDuration.toFixed(2)}ms`,
        note: 'Event loop was blocked during file read'
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error.message,
        endpoint: '/slow-sync'
      });
    }
  },

  '/compute': (req, res, query) => {
    const start = performance.now();
    const limit = parseInt(query.limit) || 1000000;
    
    try {
      const result = blockingComputation(limit);
      const requestDuration = performance.now() - start;
      
      sendJson(res, 200, {
        ...result,
        requestDuration: `${requestDuration.toFixed(2)}ms`,
        note: 'Event loop was blocked during computation'
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error.message,
        endpoint: '/compute'
      });
    }
  },

  '/crypto': (req, res, query) => {
    const start = performance.now();
    const iterations = parseInt(query.iterations) || 100000;
    
    try {
      const result = blockingCrypto(iterations);
      const requestDuration = performance.now() - start;
      
      sendJson(res, 200, {
        ...result,
        requestDuration: `${requestDuration.toFixed(2)}ms`,
        note: 'Event loop was blocked during crypto operation'
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error.message,
        endpoint: '/crypto'
      });
    }
  },

  '/busy-loop': (req, res, query) => {
    const start = performance.now();
    const duration = parseInt(query.duration) || 1000;
    
    try {
      const result = busyLoop(duration);
      const requestDuration = performance.now() - start;
      
      sendJson(res, 200, {
        ...result,
        requestDuration: `${requestDuration.toFixed(2)}ms`,
        note: 'Event loop was COMPLETELY blocked - worst case!'
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error.message,
        endpoint: '/busy-loop'
      });
    }
  },

  '/json-parse': (req, res, query) => {
    const start = performance.now();
    const size = parseInt(query.size) || 10000;
    
    try {
      const result = blockingJsonParse(size);
      const requestDuration = performance.now() - start;
      
      sendJson(res, 200, {
        ...result,
        requestDuration: `${requestDuration.toFixed(2)}ms`,
        note: 'Event loop was blocked during JSON operations'
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error.message,
        endpoint: '/json-parse'
      });
    }
  },

  '/multiple': (req, res, query) => {
    const start = performance.now();
    
    try {
      const result = multipleBlockingOps();
      const requestDuration = performance.now() - start;
      
      sendJson(res, 200, {
        ...result,
        requestDuration: `${requestDuration.toFixed(2)}ms`,
        note: 'Event loop was blocked for entire duration of all operations'
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error.message,
        endpoint: '/multiple'
      });
    }
  }
};

/**
 * Request handler
 */
const handleRequest = (req, res) => {
  const requestStart = performance.now();
  const { pathname, query } = parseRequest(req);
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);
  
  // Handle routes
  const handler = routes[pathname];
  
  if (handler) {
    try {
      handler(req, res, query);
      const duration = performance.now() - requestStart;
      console.log(`  ✓ Completed in ${duration.toFixed(2)}ms (BLOCKING)`);
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
export const createBlockingServer = () => {
  const server = createServer(handleRequest);
  
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
  const server = createBlockingServer();
  
  return new Promise((resolve, reject) => {
    server.listen(PORT, () => {
      console.log(`\n🔴 Blocking server started on http://localhost:${PORT}`);
      console.log(`⚠️  Warning: All endpoints will BLOCK the event loop!`);
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
