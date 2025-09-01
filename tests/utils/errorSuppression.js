/**
 * Test Error Suppression Utilities
 * Manages console error suppression for tests that intentionally generate errors
 */

class TestErrorSuppression {
  constructor() {
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    this.suppressedErrors = [];
    this.suppressedWarnings = [];
    this.isActive = false;
    this.expectedPatterns = [];
  }

  /**
   * Suppress expected console errors that match specific patterns
   * @param {Array<RegExp|string>} patterns - Patterns to match for suppression
   */
  suppressExpectedErrors(patterns = []) {
    if (this.isActive) {
      this.restoreConsoleError();
    }

    this.expectedPatterns = patterns.map(pattern => 
      typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern
    );
    
    this.suppressedErrors = [];
    this.suppressedWarnings = [];
    
    // Helper function to safely stringify objects
    const safeStringify = (arg) => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          // Handle circular references
          if (e.message.includes('circular')) {
            return '[Circular Object]';
          }
          return '[Object]';
        }
      }
      return String(arg);
    };

    // Override console.error
    console.error = (...args) => {
      const fullMessage = args.map(safeStringify).join(' ');
      
      const isExpected = this.expectedPatterns.some(pattern => 
        pattern.test(fullMessage)
      );
      
      if (!isExpected) {
        // This is a genuine error, let it through
        this.originalConsoleError(...args);
      } else {
        // This is an expected error, suppress it but track it
        this.suppressedErrors.push({
          message: fullMessage,
          args: args,
          timestamp: Date.now()
        });
      }
    };

    // Override console.warn for completeness
    console.warn = (...args) => {
      const fullMessage = args.map(safeStringify).join(' ');
      
      const isExpected = this.expectedPatterns.some(pattern => 
        pattern.test(fullMessage)
      );
      
      if (!isExpected) {
        // This is a genuine warning, let it through
        this.originalConsoleWarn(...args);
      } else {
        // This is an expected warning, suppress it but track it
        this.suppressedWarnings.push({
          message: fullMessage,
          args: args,
          timestamp: Date.now()
        });
      }
    };

    this.isActive = true;
  }

  /**
   * Restore original console.error and console.warn functions
   */
  restoreConsoleError() {
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    this.isActive = false;
  }

  /**
   * Get all suppressed errors
   * @returns {Array} Array of suppressed error objects
   */
  getSuppressedErrors() {
    return [...this.suppressedErrors];
  }

  /**
   * Get all suppressed warnings
   * @returns {Array} Array of suppressed warning objects
   */
  getSuppressedWarnings() {
    return [...this.suppressedWarnings];
  }

  /**
   * Get count of suppressed messages
   * @returns {Object} Counts of suppressed errors and warnings
   */
  getSuppressedCounts() {
    return {
      errors: this.suppressedErrors.length,
      warnings: this.suppressedWarnings.length,
      total: this.suppressedErrors.length + this.suppressedWarnings.length
    };
  }

  /**
   * Clear all suppressed message history
   */
  clearSuppressedHistory() {
    this.suppressedErrors = [];
    this.suppressedWarnings = [];
  }

  /**
   * Check if a specific error pattern was suppressed
   * @param {RegExp|string} pattern - Pattern to check for
   * @returns {boolean} True if pattern was found in suppressed errors
   */
  wasErrorSuppressed(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    return this.suppressedErrors.some(error => regex.test(error.message));
  }

  /**
   * Validate that expected errors were actually generated
   * @param {Array<RegExp|string>} expectedPatterns - Patterns that should have been suppressed
   * @returns {Object} Validation result
   */
  validateExpectedErrors(expectedPatterns) {
    const results = {
      allFound: true,
      missing: [],
      found: [],
      unexpected: []
    };

    // Check if all expected patterns were found
    expectedPatterns.forEach(pattern => {
      const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
      const found = this.suppressedErrors.some(error => regex.test(error.message));
      
      if (found) {
        results.found.push(pattern);
      } else {
        results.missing.push(pattern);
        results.allFound = false;
      }
    });

    return results;
  }
}

// Global instance for easy access
let globalSuppression = null;

/**
 * Test utilities for error suppression
 */
const testUtils = {
  /**
   * Suppress error logs for tests that intentionally generate errors
   * @param {Array<RegExp|string>} patterns - Optional patterns to match
   */
  suppressErrorLogs(patterns = [
    // Critical and high severity errors
    /CRITICAL ERROR/,
    /HIGH SEVERITY ERROR/,
    /Recovery failed/,
    /Error in error creation/,
    /Simulated system error/,
    /Network error/,
    
    // Chess game specific errors
    /Invalid piece/,
    /Malformed move/,
    /Invalid coordinates/,
    /Wrong turn/,
    /Game not active/,
    /No piece found/,
    /Path blocked/,
    /King in check/,
    /Invalid movement/,
    /System error/,
    
    // Error codes
    /MALFORMED_MOVE/,
    /INVALID_COORDINATES/,
    /NO_PIECE/,
    /WRONG_TURN/,
    /INVALID_PIECE/,
    /STATE_CORRUPTION/,
    /Circular Object/,
    /PATH_BLOCKED/,
    /CAPTURE_OWN_PIECE/,
    /INVALID_CASTLING/,
    /INVALID_MOVEMENT/,
    /INVALID_FORMAT/,
    /CHECK_NOT_RESOLVED/,
    /PINNED_PIECE_INVALID_MOVE/,
    /MUST_RESOLVE_CHECK/,
    /GAME_NOT_ACTIVE/,
    /SYSTEM_ERROR/,
    /TEST_ERROR/,
    /VALIDATION_ERROR/,
    /EMPTY_SQUARE/,
    
    // Error messages with "Error:" prefix
    /Error: PATH_BLOCKED/,
    /Error: CAPTURE_OWN_PIECE/,
    /Error: WRONG_TURN/,
    /Error: INVALID_CASTLING/,
    /Error: INVALID_MOVEMENT/,
    /Error: INVALID_FORMAT/,
    /Error: NO_PIECE/,
    /Error: SYSTEM_ERROR/,
    /Error: TEST_ERROR/,
    
    // Descriptive error messages
    /Path is blocked/,
    /Cannot capture own piece/,
    /Not your turn/,
    /Invalid kingside castling/,
    /Invalid queenside castling/,
    /Invalid pawn movement/,
    /Invalid rook movement/,
    /Invalid bishop movement/,
    /Invalid knight movement/,
    /Invalid queen movement/,
    /Invalid king movement/,
    /Move must be an object/,
    /Move format is incorrect/,
    /No piece at source square/,
    /Invalid board coordinates/,
    /Game is not active/,
    /Test message/,
    /Test success/,
    
    // Unknown error code warnings
    /Unknown error code/,
    
    // Stack trace noise reduction
    /at ChessErrorHandler/,
    /at ChessGame/,
    /at Object\./,
    /at Array\.forEach/,
    /src\/shared\/errorHandler\.js/,
    /src\/shared\/chessGame\.js/,
    /tests\//
  ]) {
    if (!globalSuppression) {
      globalSuppression = new TestErrorSuppression();
    }
    globalSuppression.suppressExpectedErrors(patterns);
  },

  /**
   * Restore error logs after test completion
   */
  restoreErrorLogs() {
    if (globalSuppression) {
      globalSuppression.restoreConsoleError();
    }
  },

  /**
   * Get suppressed error information
   * @returns {Object} Suppressed error data
   */
  getSuppressedInfo() {
    if (!globalSuppression) {
      return { errors: [], warnings: [], counts: { errors: 0, warnings: 0, total: 0 } };
    }
    
    return {
      errors: globalSuppression.getSuppressedErrors(),
      warnings: globalSuppression.getSuppressedWarnings(),
      counts: globalSuppression.getSuppressedCounts()
    };
  },

  /**
   * Validate that expected errors were suppressed
   * @param {Array<RegExp|string>} expectedPatterns - Patterns that should have been suppressed
   * @returns {Object} Validation result
   */
  validateSuppressedErrors(expectedPatterns) {
    if (!globalSuppression) {
      return { allFound: false, missing: expectedPatterns, found: [], unexpected: [] };
    }
    
    return globalSuppression.validateExpectedErrors(expectedPatterns);
  },

  /**
   * Clear suppressed error history
   */
  clearSuppressedHistory() {
    if (globalSuppression) {
      globalSuppression.clearSuppressedHistory();
    }
  },

  /**
   * Create a fresh error suppression instance for isolated testing
   * @returns {TestErrorSuppression} New suppression instance
   */
  createErrorSuppression() {
    return new TestErrorSuppression();
  },

  /**
   * Validate error response structure
   * @param {Object} response - Response to validate
   */
  validateErrorResponse(response) {
    expect(response).toBeDefined();
    expect(response.success).toBe(false);
    expect(response.errorCode).toBeDefined();
    expect(response.message).toBeDefined();
    expect(typeof response.message).toBe('string');
    expect(response.message.length).toBeGreaterThan(0);
  },

  /**
   * Validate success response structure
   * @param {Object} response - Response to validate
   */
  validateSuccessResponse(response) {
    expect(response).toBeDefined();
    expect(response.success).toBe(true);
    expect(response.errorCode).toBeNull();
  },

  /**
   * Create a fresh game instance for testing
   * @returns {ChessGame} New game instance
   */
  createFreshGame() {
    const ChessGame = require('../../src/shared/chessGame');
    return new ChessGame();
  }
};

module.exports = {
  TestErrorSuppression,
  testUtils
};