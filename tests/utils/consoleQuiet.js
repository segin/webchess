/**
 * Console Quiet Utility
 * Provides comprehensive console noise reduction for tests
 */

class ConsoleQuiet {
  constructor() {
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug
    };
    
    this.isQuiet = false;
    this.allowedPatterns = [];
    this.suppressedMessages = {
      log: [],
      warn: [],
      error: [],
      info: [],
      debug: []
    };
  }

  /**
   * Enable quiet mode with optional allowed patterns
   * @param {Array<RegExp|string>} allowedPatterns - Patterns that should still be shown
   */
  enableQuietMode(allowedPatterns = []) {
    if (this.isQuiet) {
      this.disableQuietMode();
    }

    this.allowedPatterns = allowedPatterns.map(pattern => 
      typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern
    );

    // Override all console methods
    ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
      console[method] = (...args) => {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');

        // Check if this message should be allowed through
        const shouldShow = this.allowedPatterns.some(pattern => pattern.test(message));

        if (shouldShow) {
          this.originalConsole[method](...args);
        } else {
          // Suppress but track the message
          this.suppressedMessages[method].push({
            message,
            args,
            timestamp: Date.now()
          });
        }
      };
    });

    this.isQuiet = true;
  }

  /**
   * Disable quiet mode and restore original console
   */
  disableQuietMode() {
    if (!this.isQuiet) return;

    // Restore original console methods
    Object.keys(this.originalConsole).forEach(method => {
      console[method] = this.originalConsole[method];
    });

    this.isQuiet = false;
  }

  /**
   * Get suppressed message counts
   * @returns {Object} Counts by console method
   */
  getSuppressedCounts() {
    const counts = {};
    Object.keys(this.suppressedMessages).forEach(method => {
      counts[method] = this.suppressedMessages[method].length;
    });
    counts.total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    return counts;
  }

  /**
   * Clear suppressed message history
   */
  clearSuppressedHistory() {
    Object.keys(this.suppressedMessages).forEach(method => {
      this.suppressedMessages[method] = [];
    });
  }

  /**
   * Get all suppressed messages
   * @returns {Object} Suppressed messages by method
   */
  getSuppressedMessages() {
    return { ...this.suppressedMessages };
  }
}

// Global instance
const globalConsoleQuiet = new ConsoleQuiet();

/**
 * Utility functions for console management
 */
const consoleUtils = {
  /**
   * Enable quiet mode for tests
   * @param {Array<RegExp|string>} allowedPatterns - Patterns to allow through
   */
  enableQuiet(allowedPatterns = [
    // Allow test results and important Jest output
    /PASS|FAIL|Tests:|Test Suites:/,
    /✓|✕|●/,
    /expect\(/,
    /toBe\(/,
    /toEqual\(/,
    /Coverage/,
    /All files/,
    // Allow actual test failures (not suppressed errors)
    /TypeError:|ReferenceError:|SyntaxError:/,
    // Allow important warnings that aren't chess game errors
    /deprecated|warning/i
  ]) {
    globalConsoleQuiet.enableQuietMode(allowedPatterns);
  },

  /**
   * Disable quiet mode
   */
  disableQuiet() {
    globalConsoleQuiet.disableQuietMode();
  },

  /**
   * Get suppressed message statistics
   * @returns {Object} Statistics about suppressed messages
   */
  getStats() {
    return globalConsoleQuiet.getSuppressedCounts();
  },

  /**
   * Clear suppressed message history
   */
  clearHistory() {
    globalConsoleQuiet.clearSuppressedHistory();
  },

  /**
   * Create a scoped quiet mode for specific tests
   * @param {Function} testFunction - Test function to run in quiet mode
   * @param {Array<RegExp|string>} allowedPatterns - Patterns to allow
   * @returns {Promise} Result of test function
   */
  async runQuiet(testFunction, allowedPatterns = []) {
    const wasQuiet = globalConsoleQuiet.isQuiet;
    
    try {
      if (!wasQuiet) {
        this.enableQuiet(allowedPatterns);
      }
      
      return await testFunction();
    } finally {
      if (!wasQuiet) {
        this.disableQuiet();
      }
    }
  }
};

module.exports = {
  ConsoleQuiet,
  consoleUtils
};