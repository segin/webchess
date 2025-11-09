/**
 * Test Isolation Utilities
 * Ensures tests run independently without side effects
 */

const ResourceManager = require('./ResourceManager');

/**
 * Test isolation manager for ensuring clean test execution
 */
class TestIsolation {
  constructor() {
    this.testState = new Map();
    this.globalState = {};
    this.originalEnv = {};
    this.originalGlobals = {};
  }

  /**
   * Initialize test isolation for a test suite
   * @param {string} suiteName - Name of the test suite
   */
  initializeSuite(suiteName) {
    this.testState.set(suiteName, {
      startTime: Date.now(),
      resources: [],
      mocks: [],
      timers: [],
      processes: []
    });

    // Store original environment
    this.originalEnv = { ...process.env };
    
    // Store original global state
    this.originalGlobals = {
      setTimeout: global.setTimeout,
      setInterval: global.setInterval,
      clearTimeout: global.clearTimeout,
      clearInterval: global.clearInterval,
      console: { ...console }
    };
  }

  /**
   * Clean up test suite isolation
   * @param {string} suiteName - Name of the test suite
   */
  async cleanupSuite(suiteName) {
    const state = this.testState.get(suiteName);
    if (!state) return;

    // Clean up resources
    for (const resource of state.resources) {
      try {
        if (typeof resource.cleanup === 'function') {
          await resource.cleanup();
        }
      } catch (error) {
        // Ignore cleanup errors in isolation
      }
    }

    // Clear timers
    for (const timer of state.timers) {
      try {
        clearTimeout(timer);
        clearInterval(timer);
      } catch (error) {
        // Ignore timer cleanup errors
      }
    }

    // Clean up mocks
    for (const mock of state.mocks) {
      try {
        if (typeof mock.restore === 'function') {
          mock.restore();
        }
      } catch (error) {
        // Ignore mock cleanup errors
      }
    }

    // Restore environment
    process.env = { ...this.originalEnv };

    // Restore globals
    Object.assign(global, this.originalGlobals);

    // Remove test state
    this.testState.delete(suiteName);
  }

  /**
   * Register a resource for cleanup
   * @param {string} suiteName - Name of the test suite
   * @param {Object} resource - Resource to track
   */
  registerResource(suiteName, resource) {
    const state = this.testState.get(suiteName);
    if (state) {
      state.resources.push(resource);
    }
  }

  /**
   * Register a mock for cleanup
   * @param {string} suiteName - Name of the test suite
   * @param {Object} mock - Mock to track
   */
  registerMock(suiteName, mock) {
    const state = this.testState.get(suiteName);
    if (state) {
      state.mocks.push(mock);
    }
  }

  /**
   * Register a timer for cleanup
   * @param {string} suiteName - Name of the test suite
   * @param {number} timerId - Timer ID to track
   */
  registerTimer(suiteName, timerId) {
    const state = this.testState.get(suiteName);
    if (state) {
      state.timers.push(timerId);
    }
  }

  /**
   * Create isolated environment for a test
   * @param {Object} options - Isolation options
   * @returns {Function} Cleanup function
   */
  createIsolatedEnvironment(options = {}) {
    const {
      mockConsole = false,
      mockTimers = false,
      mockProcess = false,
      suppressOutput = false
    } = options;

    const cleanup = [];

    // Mock console if requested
    if (mockConsole || suppressOutput) {
      const originalConsole = { ...console };
      
      if (suppressOutput) {
        console.log = () => {};
        console.info = () => {};
        console.debug = () => {};
      }
      
      cleanup.push(() => {
        Object.assign(console, originalConsole);
      });
    }

    // Mock timers if requested
    if (mockTimers) {
      jest.useFakeTimers();
      cleanup.push(() => {
        jest.useRealTimers();
      });
    }

    // Mock process if requested
    if (mockProcess) {
      const originalExit = process.exit;
      process.exit = jest.fn();
      
      cleanup.push(() => {
        process.exit = originalExit;
      });
    }

    // Return cleanup function
    return async () => {
      for (const cleanupFn of cleanup.reverse()) {
        try {
          await cleanupFn();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }

  /**
   * Ensure test isolation between test runs
   */
  static ensureIsolation() {
    // Clear all Jest mocks
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.restoreAllMocks();

    // Clear module cache for fresh imports
    jest.resetModules();

    // Clean up resource manager
    ResourceManager.cleanupAll();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Create a test wrapper that ensures isolation
   * @param {Function} testFn - Test function to wrap
   * @param {Object} options - Isolation options
   * @returns {Function} Wrapped test function
   */
  static wrapTest(testFn, options = {}) {
    return async function wrappedTest(...args) {
      const isolation = new TestIsolation();
      const suiteName = this.currentTest?.fullName || 'unknown';
      
      try {
        // Initialize isolation
        isolation.initializeSuite(suiteName);
        
        // Create isolated environment
        const cleanup = isolation.createIsolatedEnvironment(options);
        
        // Run the test
        const result = await testFn.apply(this, args);
        
        // Clean up environment
        await cleanup();
        
        return result;
      } finally {
        // Clean up suite
        await isolation.cleanupSuite(suiteName);
        
        // Ensure global isolation
        TestIsolation.ensureIsolation();
      }
    };
  }

  /**
   * Apply isolation to a describe block
   * @param {string} suiteName - Name of the test suite
   * @param {Object} options - Isolation options
   */
  static applyToSuite(suiteName, options = {}) {
    const isolation = new TestIsolation();
    
    beforeAll(() => {
      isolation.initializeSuite(suiteName);
    });
    
    beforeEach(() => {
      TestIsolation.ensureIsolation();
    });
    
    afterEach(() => {
      TestIsolation.ensureIsolation();
    });
    
    afterAll(async () => {
      await isolation.cleanupSuite(suiteName);
    });
  }
}

module.exports = TestIsolation;