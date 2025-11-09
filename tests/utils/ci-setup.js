/**
 * CI-Specific Test Setup
 * Optimizes test environment for CI execution
 */

// Set CI environment variables
process.env.NODE_ENV = 'test';
process.env.CI = 'true';

// Optimize Node.js for CI environment
process.env.NODE_OPTIONS = '--max-old-space-size=2048 --optimize-for-size';

// Disable unnecessary features for CI
process.env.NO_COLOR = '1'; // Disable colored output
process.env.FORCE_COLOR = '0'; // Force no color

// Set timezone for consistent test results
process.env.TZ = 'UTC';

// Optimize garbage collection for CI
if (global.gc) {
  // Force garbage collection before tests start
  global.gc();
}

// Set up CI-specific console overrides
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug
};

// Suppress non-critical console output in CI
if (process.env.CI === 'true') {
  console.log = (...args) => {
    // Only log test results and critical information
    const message = args.join(' ');
    if (message.includes('PASS') || 
        message.includes('FAIL') || 
        message.includes('Coverage') ||
        message.includes('Test Suites') ||
        message.includes('Tests:') ||
        message.includes('Time:')) {
      originalConsole.log(...args);
    }
  };
  
  console.info = () => {}; // Suppress info logs
  console.debug = () => {}; // Suppress debug logs
  
  // Only show warnings and errors
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
}

// Set up process event handlers for CI
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Optimize timers for CI
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;

global.setTimeout = (fn, delay, ...args) => {
  // Reduce timer delays in CI for faster test execution
  const ciDelay = process.env.CI === 'true' ? Math.min(delay, 100) : delay;
  return originalSetTimeout(fn, ciDelay, ...args);
};

global.setInterval = (fn, delay, ...args) => {
  // Reduce interval delays in CI
  const ciDelay = process.env.CI === 'true' ? Math.min(delay, 100) : delay;
  return originalSetInterval(fn, ciDelay, ...args);
};

// Set up memory monitoring for CI
let memoryWarningShown = false;

const checkMemoryUsage = () => {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  
  if (heapUsedMB > 1024 && !memoryWarningShown) {
    console.warn(`High memory usage detected: ${heapUsedMB}MB`);
    memoryWarningShown = true;
    
    if (global.gc) {
      global.gc();
    }
  }
};

// Check memory usage periodically in CI
if (process.env.CI === 'true') {
  setInterval(checkMemoryUsage, 30000); // Check every 30 seconds
}

// Export original console methods for restoration if needed
module.exports = {
  originalConsole,
  checkMemoryUsage
};