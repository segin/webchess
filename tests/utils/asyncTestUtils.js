/**
 * Advanced Async Testing Utilities
 * Specialized utilities for testing asynchronous operations, promises, and timing
 */

const ResourceManager = require('./ResourceManager');

/**
 * Promise Testing Utilities
 */
class PromiseTester {
  /**
   * Test that a promise resolves with expected value
   * @param {Promise} promise - Promise to test
   * @param {any} expectedValue - Expected resolution value
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Test promise
   */
  static async expectToResolve(promise, expectedValue = undefined, timeout = 5000) {
    const timeoutPromise = new Promise((_, reject) => {
      const timerId = setTimeout(() => {
        reject(new Error(`Promise did not resolve within ${timeout}ms`));
      }, timeout);
      ResourceManager.trackTimer(timerId);
    });

    const result = await Promise.race([promise, timeoutPromise]);
    
    if (expectedValue !== undefined) {
      expect(result).toEqual(expectedValue);
    }
    
    return result;
  }

  /**
   * Test that a promise rejects with expected error
   * @param {Promise} promise - Promise to test
   * @param {string|RegExp|Error} expectedError - Expected error
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Test promise
   */
  static async expectToReject(promise, expectedError = undefined, timeout = 5000) {
    const timeoutPromise = new Promise((_, reject) => {
      const timerId = setTimeout(() => {
        reject(new Error(`Promise did not reject within ${timeout}ms`));
      }, timeout);
      ResourceManager.trackTimer(timerId);
    });

    try {
      await Promise.race([promise, timeoutPromise]);
      throw new Error('Expected promise to reject, but it resolved');
    } catch (error) {
      if (error.message === 'Expected promise to reject, but it resolved') {
        throw error;
      }
      
      if (expectedError !== undefined) {
        if (expectedError instanceof RegExp) {
          expect(error.message).toMatch(expectedError);
        } else if (typeof expectedError === 'string') {
          expect(error.message).toContain(expectedError);
        } else if (expectedError instanceof Error) {
          expect(error).toEqual(expectedError);
        }
      }
      
      return error;
    }
  }

  /**
   * Test promise timing
   * @param {Promise} promise - Promise to test
   * @param {number} minTime - Minimum expected time in ms
   * @param {number} maxTime - Maximum expected time in ms
   * @returns {Promise<Object>} Result with timing information
   */
  static async expectTiming(promise, minTime = 0, maxTime = Infinity) {
    const startTime = Date.now();
    const result = await promise;
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeGreaterThanOrEqual(minTime);
    expect(duration).toBeLessThanOrEqual(maxTime);

    return { result, duration, startTime, endTime };
  }

  /**
   * Test multiple promises in parallel
   * @param {Array<Promise>} promises - Array of promises to test
   * @param {Object} options - Test options
   * @returns {Promise<Array>} Array of results
   */
  static async testParallel(promises, options = {}) {
    const {
      expectAllToResolve = true,
      timeout = 10000,
      collectTiming = false
    } = options;

    const startTime = collectTiming ? Date.now() : null;
    
    if (expectAllToResolve) {
      const results = await Promise.all(promises.map(p => 
        this.expectToResolve(p, undefined, timeout)
      ));
      
      if (collectTiming) {
        const endTime = Date.now();
        return { results, duration: endTime - startTime };
      }
      
      return results;
    } else {
      const results = await Promise.allSettled(promises);
      
      if (collectTiming) {
        const endTime = Date.now();
        return { results, duration: endTime - startTime };
      }
      
      return results;
    }
  }

  /**
   * Test promise sequence (one after another)
   * @param {Array<Function>} promiseFactories - Array of functions that return promises
   * @param {Object} options - Test options
   * @returns {Promise<Array>} Array of results
   */
  static async testSequence(promiseFactories, options = {}) {
    const {
      stopOnFirstError = false,
      collectTiming = false,
      timeout = 5000
    } = options;

    const results = [];
    const timings = [];
    
    for (let i = 0; i < promiseFactories.length; i++) {
      const factory = promiseFactories[i];
      
      try {
        const startTime = collectTiming ? Date.now() : null;
        const promise = factory();
        const result = await this.expectToResolve(promise, undefined, timeout);
        const endTime = collectTiming ? Date.now() : null;
        
        results.push({ success: true, result, index: i });
        
        if (collectTiming) {
          timings.push({ index: i, duration: endTime - startTime });
        }
        
      } catch (error) {
        results.push({ success: false, error, index: i });
        
        if (stopOnFirstError) {
          break;
        }
      }
    }

    return collectTiming ? { results, timings } : results;
  }
}

/**
 * Event-Driven Testing Utilities
 */
class EventTester {
  constructor() {
    this.eventListeners = new Map();
    this.eventHistory = [];
  }

  /**
   * Wait for a specific event to be emitted
   * @param {EventEmitter} emitter - Event emitter to listen to
   * @param {string} eventName - Name of event to wait for
   * @param {number} timeout - Timeout in milliseconds
   * @param {Function} validator - Optional function to validate event data
   * @returns {Promise} Promise that resolves with event data
   */
  async waitForEvent(emitter, eventName, timeout = 5000, validator = null) {
    return new Promise((resolve, reject) => {
      const timerId = setTimeout(() => {
        cleanup();
        reject(new Error(`Event '${eventName}' not emitted within ${timeout}ms`));
      }, timeout);
      
      ResourceManager.trackTimer(timerId);

      const handler = (...args) => {
        if (validator && !validator(...args)) {
          return; // Continue waiting if validator fails
        }
        
        cleanup();
        resolve(args.length === 1 ? args[0] : args);
      };

      const cleanup = () => {
        clearTimeout(timerId);
        emitter.off(eventName, handler);
        this.eventListeners.delete(`${emitter}_${eventName}`);
      };

      emitter.on(eventName, handler);
      this.eventListeners.set(`${emitter}_${eventName}`, { handler, cleanup });
    });
  }

  /**
   * Wait for multiple events in sequence
   * @param {EventEmitter} emitter - Event emitter to listen to
   * @param {Array<string>} eventNames - Array of event names to wait for
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Array>} Promise that resolves with array of event data
   */
  async waitForEventSequence(emitter, eventNames, timeout = 10000) {
    const results = [];
    const startTime = Date.now();

    for (const eventName of eventNames) {
      const remainingTime = timeout - (Date.now() - startTime);
      if (remainingTime <= 0) {
        throw new Error(`Timeout waiting for event sequence at '${eventName}'`);
      }

      const eventData = await this.waitForEvent(emitter, eventName, remainingTime);
      results.push({ event: eventName, data: eventData });
    }

    return results;
  }

  /**
   * Wait for any of multiple events
   * @param {EventEmitter} emitter - Event emitter to listen to
   * @param {Array<string>} eventNames - Array of event names to wait for
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} Promise that resolves with first event data
   */
  async waitForAnyEvent(emitter, eventNames, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timerId = setTimeout(() => {
        cleanup();
        reject(new Error(`None of events [${eventNames.join(', ')}] emitted within ${timeout}ms`));
      }, timeout);
      
      ResourceManager.trackTimer(timerId);

      const handlers = new Map();
      
      const cleanup = () => {
        clearTimeout(timerId);
        for (const [eventName, handler] of handlers) {
          emitter.off(eventName, handler);
        }
        handlers.clear();
      };

      for (const eventName of eventNames) {
        const handler = (...args) => {
          cleanup();
          resolve({
            event: eventName,
            data: args.length === 1 ? args[0] : args
          });
        };
        
        handlers.set(eventName, handler);
        emitter.on(eventName, handler);
      }
    });
  }

  /**
   * Track all events emitted by an emitter
   * @param {EventEmitter} emitter - Event emitter to track
   * @param {Array<string>} eventNames - Array of event names to track
   * @param {number} duration - Duration to track in milliseconds
   * @returns {Promise<Array>} Promise that resolves with array of tracked events
   */
  async trackEvents(emitter, eventNames, duration = 1000) {
    const trackedEvents = [];
    const handlers = new Map();

    // Set up event handlers
    for (const eventName of eventNames) {
      const handler = (...args) => {
        trackedEvents.push({
          event: eventName,
          data: args.length === 1 ? args[0] : args,
          timestamp: Date.now()
        });
      };
      
      handlers.set(eventName, handler);
      emitter.on(eventName, handler);
    }

    // Wait for specified duration
    await new Promise(resolve => {
      const timerId = setTimeout(resolve, duration);
      ResourceManager.trackTimer(timerId);
    });

    // Clean up handlers
    for (const [eventName, handler] of handlers) {
      emitter.off(eventName, handler);
    }

    return trackedEvents;
  }

  /**
   * Clean up all event listeners
   */
  cleanup() {
    for (const [key, { cleanup }] of this.eventListeners) {
      try {
        cleanup();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    this.eventListeners.clear();
    this.eventHistory = [];
  }
}

/**
 * Timing and Delay Utilities
 */
class TimingTester {
  /**
   * Create a delay with proper resource tracking
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  static delay(ms) {
    return new Promise(resolve => {
      const timerId = setTimeout(resolve, ms);
      ResourceManager.trackTimer(timerId);
    });
  }

  /**
   * Wait for a condition to become true
   * @param {Function} condition - Function that returns boolean
   * @param {Object} options - Wait options
   * @returns {Promise} Promise that resolves when condition is true
   */
  static async waitForCondition(condition, options = {}) {
    const {
      timeout = 5000,
      interval = 100,
      timeoutMessage = 'Condition not met within timeout'
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await this.delay(interval);
    }

    throw new Error(timeoutMessage);
  }

  /**
   * Measure execution time of a function
   * @param {Function} fn - Function to measure
   * @param {Array} args - Arguments to pass to function
   * @returns {Promise<Object>} Result with timing information
   */
  static async measureExecutionTime(fn, ...args) {
    const startTime = Date.now();
    const startHrTime = process.hrtime();
    
    const result = await fn(...args);
    
    const endTime = Date.now();
    const endHrTime = process.hrtime(startHrTime);
    
    return {
      result,
      duration: endTime - startTime,
      precisionDuration: endHrTime[0] * 1000 + endHrTime[1] / 1000000
    };
  }

  /**
   * Test function execution within time bounds
   * @param {Function} fn - Function to test
   * @param {number} minTime - Minimum expected time in ms
   * @param {number} maxTime - Maximum expected time in ms
   * @param {Array} args - Arguments to pass to function
   * @returns {Promise<Object>} Result with timing validation
   */
  static async expectExecutionTime(fn, minTime, maxTime, ...args) {
    const { result, duration } = await this.measureExecutionTime(fn, ...args);
    
    expect(duration).toBeGreaterThanOrEqual(minTime);
    expect(duration).toBeLessThanOrEqual(maxTime);
    
    return { result, duration };
  }

  /**
   * Create a timeout promise for racing
   * @param {number} ms - Timeout in milliseconds
   * @param {string} message - Timeout error message
   * @returns {Promise} Promise that rejects after timeout
   */
  static createTimeout(ms, message = `Operation timed out after ${ms}ms`) {
    return new Promise((_, reject) => {
      const timerId = setTimeout(() => reject(new Error(message)), ms);
      ResourceManager.trackTimer(timerId);
    });
  }

  /**
   * Race a promise against a timeout
   * @param {Promise} promise - Promise to race
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} timeoutMessage - Timeout error message
   * @returns {Promise} Promise that resolves or rejects based on race result
   */
  static async withTimeout(promise, timeout, timeoutMessage) {
    return Promise.race([
      promise,
      this.createTimeout(timeout, timeoutMessage)
    ]);
  }
}

/**
 * Retry and Resilience Testing Utilities
 */
class RetryTester {
  /**
   * Test retry logic
   * @param {Function} operation - Operation to retry
   * @param {Object} options - Retry options
   * @returns {Promise<Object>} Result with retry information
   */
  static async testRetry(operation, options = {}) {
    const {
      maxAttempts = 3,
      delay = 100,
      backoffMultiplier = 1,
      shouldRetry = (error) => true
    } = options;

    const attempts = [];
    let currentDelay = delay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const attemptStart = Date.now();
      
      try {
        const result = await operation();
        const attemptEnd = Date.now();
        
        attempts.push({
          attempt,
          success: true,
          duration: attemptEnd - attemptStart,
          result
        });
        
        return {
          success: true,
          attempts,
          totalAttempts: attempt,
          finalResult: result
        };
        
      } catch (error) {
        const attemptEnd = Date.now();
        
        attempts.push({
          attempt,
          success: false,
          duration: attemptEnd - attemptStart,
          error: error.message
        });

        if (attempt === maxAttempts || !shouldRetry(error)) {
          return {
            success: false,
            attempts,
            totalAttempts: attempt,
            finalError: error
          };
        }

        // Wait before next attempt
        if (attempt < maxAttempts) {
          await TimingTester.delay(currentDelay);
          currentDelay *= backoffMultiplier;
        }
      }
    }
  }

  /**
   * Test circuit breaker pattern
   * @param {Function} operation - Operation to test
   * @param {Object} options - Circuit breaker options
   * @returns {Promise<Object>} Circuit breaker test results
   */
  static async testCircuitBreaker(operation, options = {}) {
    const {
      failureThreshold = 3,
      resetTimeout = 1000,
      testOperations = 10
    } = options;

    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    let failureCount = 0;
    let lastFailureTime = null;
    const results = [];

    for (let i = 0; i < testOperations; i++) {
      const operationStart = Date.now();
      
      // Check if circuit should be half-open
      if (state === 'OPEN' && Date.now() - lastFailureTime > resetTimeout) {
        state = 'HALF_OPEN';
      }

      // Execute operation based on circuit state
      if (state === 'OPEN') {
        results.push({
          operation: i + 1,
          circuitState: state,
          executed: false,
          reason: 'Circuit breaker open'
        });
        continue;
      }

      try {
        const result = await operation();
        const operationEnd = Date.now();
        
        // Success - reset failure count if half-open, close circuit
        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
        }
        failureCount = 0;
        
        results.push({
          operation: i + 1,
          circuitState: state,
          executed: true,
          success: true,
          duration: operationEnd - operationStart,
          result
        });
        
      } catch (error) {
        const operationEnd = Date.now();
        failureCount++;
        lastFailureTime = Date.now();
        
        // Open circuit if failure threshold reached
        if (failureCount >= failureThreshold) {
          state = 'OPEN';
        }
        
        results.push({
          operation: i + 1,
          circuitState: state,
          executed: true,
          success: false,
          duration: operationEnd - operationStart,
          error: error.message,
          failureCount
        });
      }
    }

    return {
      finalState: state,
      totalFailures: failureCount,
      results
    };
  }
}

module.exports = {
  PromiseTester,
  EventTester,
  TimingTester,
  RetryTester
};