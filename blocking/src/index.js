import { performance } from 'perf_hooks';
import { startServer } from './server.js';

/**
 * Event Loop Monitor
 * Detects when the event loop is blocked
 */
class EventLoopMonitor {
  constructor(thresholdMs = 50, checkIntervalMs = 100) {
    this.thresholdMs = thresholdMs;
    this.checkIntervalMs = checkIntervalMs;
    this.lastCheck = performance.now();
    this.blockingEvents = 0;
    this.maxDelay = 0;
  }

  check() {
    const now = performance.now();
    const expectedDelay = this.checkIntervalMs;
    const actualDelay = now - this.lastCheck;
    const blockingTime = actualDelay - expectedDelay;

    if (blockingTime > this.thresholdMs) {
      this.blockingEvents++;
      this.maxDelay = Math.max(this.maxDelay, blockingTime);
      console.warn(
        `⚠️  Event loop blocked for ${blockingTime.toFixed(2)}ms ` +
        `(threshold: ${this.thresholdMs}ms)`
      );
    }

    this.lastCheck = now;
  }

  start() {
    console.log(`\n📊 Event Loop Monitor started`);
    console.log(`   Threshold: ${this.thresholdMs}ms`);
    console.log(`   Check interval: ${this.checkIntervalMs}ms\n`);

    this.interval = setInterval(() => this.check(), this.checkIntervalMs);
    this.lastCheck = performance.now();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  getStats() {
    return {
      blockingEvents: this.blockingEvents,
      maxDelay: `${this.maxDelay.toFixed(2)}ms`,
      thresholdMs: this.thresholdMs
    };
  }
}

/**
 * Graceful shutdown handler
 */
const setupShutdownHandler = (server, monitor) => {
  const shutdown = async (signal) => {
    console.log(`\n\n🛑 Received ${signal}, shutting down gracefully...`);
    
    // Stop monitoring
    monitor.stop();
    
    // Print final stats
    const stats = monitor.getStats();
    console.log(`\n📊 Final Event Loop Statistics:`);
    console.log(`   Total blocking events: ${stats.blockingEvents}`);
    console.log(`   Max delay observed: ${stats.maxDelay}`);
    console.log(`   Threshold: ${stats.thresholdMs}ms`);
    
    // Close server
    server.close(() => {
      console.log('✓ Server closed');
      process.exit(0);
    });
    
    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 5000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

/**
 * Main entry point
 */
const main = async () => {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   BLOCKING DEMO - Event Loop Blocking Demonstration           ║');
  console.log('║   Node.js ' + process.version.padEnd(50) + '║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  try {
    // Start event loop monitor
    const monitor = new EventLoopMonitor(50, 100);
    monitor.start();
    
    // Start server
    const server = await startServer();
    
    // Setup graceful shutdown
    setupShutdownHandler(server, monitor);
    
    console.log('💡 Tip: Try concurrent requests to see cascading blocking');
    console.log('   Example: autocannon http://localhost:3000/compute -d 10 -c 5\n');
    
  } catch (error) {
    console.error('❌ Failed to start application:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Start the application
main();
