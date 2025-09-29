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
   * Validate error response structure using current API
   * @param {Object} response - Response to validate
   * @param {string} expectedErrorCode - Optional expected error code
   */
  validateErrorResponse(response, expectedErrorCode = null) {
    // Use Jest expect if available, otherwise use simple assertions
    if (typeof expect !== 'undefined') {
      expect(response).toBeDefined();
      expect(response.success).toBe(false);
      expect(response.isValid).toBe(false);
      expect(response.errorCode).toBeDefined();
      expect(response.message).toBeDefined();
      expect(typeof response.message).toBe('string');
      expect(response.message.length).toBeGreaterThan(0);
      
      if (expectedErrorCode) {
        expect(response.errorCode).toBe(expectedErrorCode);
      }
    } else {
      // Simple validation for non-Jest environments
      if (!response) throw new Error('Response is undefined');
      if (response.success !== false) throw new Error('Expected success to be false');
      if (response.isValid !== false) throw new Error('Expected isValid to be false');
      if (!response.errorCode) throw new Error('Expected errorCode to be defined');
      if (!response.message) throw new Error('Expected message to be defined');
      if (typeof response.message !== 'string') throw new Error('Expected message to be string');
      if (response.message.length === 0) throw new Error('Expected message to have content');
      
      if (expectedErrorCode && response.errorCode !== expectedErrorCode) {
        throw new Error(`Expected errorCode ${expectedErrorCode}, got ${response.errorCode}`);
      }
    }
  },

  /**
   * Validate success response structure using current API
   * @param {Object} response - Response to validate
   */
  validateSuccessResponse(response) {
    // Use Jest expect if available, otherwise use simple assertions
    if (typeof expect !== 'undefined') {
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.isValid).toBe(true);
      expect(response.errorCode).toBeNull();
      expect(response.message).toBeDefined();
      expect(typeof response.message).toBe('string');
    } else {
      // Simple validation for non-Jest environments
      if (!response) throw new Error('Response is undefined');
      if (response.success !== true) throw new Error('Expected success to be true');
      if (response.isValid !== true) throw new Error('Expected isValid to be true');
      if (response.errorCode !== null) throw new Error('Expected errorCode to be null');
      if (!response.message) throw new Error('Expected message to be defined');
      if (typeof response.message !== 'string') throw new Error('Expected message to be string');
    }
  },

  /**
   * Create a fresh game instance for testing using current constructor
   * @returns {ChessGame} New game instance
   */
  createFreshGame() {
    const ChessGame = require('../../src/shared/chessGame');
    return new ChessGame();
  },

  /**
   * Validate game state properties using current API structure
   * @param {Object} gameState - Game state to validate
   */
  validateGameState(gameState) {
    // Use Jest expect if available, otherwise use simple assertions
    if (typeof expect !== 'undefined') {
      expect(gameState).toBeDefined();
      expect(gameState).toHaveProperty('board');
      expect(gameState).toHaveProperty('currentTurn');
      expect(gameState).toHaveProperty('gameStatus'); // NOT 'status'
      expect(gameState).toHaveProperty('winner');
      expect(gameState).toHaveProperty('moveHistory');
      expect(gameState).toHaveProperty('castlingRights');
      expect(gameState).toHaveProperty('enPassantTarget');
      expect(gameState).toHaveProperty('inCheck');
      
      // Validate property types
      expect(Array.isArray(gameState.board)).toBe(true);
      expect(['white', 'black'].includes(gameState.currentTurn)).toBe(true);
      expect(['active', 'check', 'checkmate', 'stalemate', 'draw'].includes(gameState.gameStatus)).toBe(true);
      expect(Array.isArray(gameState.moveHistory)).toBe(true);
      expect(typeof gameState.inCheck).toBe('boolean');
    } else {
      // Simple validation for non-Jest environments
      if (!gameState) throw new Error('Game state is undefined');
      if (!gameState.hasOwnProperty('board')) throw new Error('Missing board property');
      if (!gameState.hasOwnProperty('currentTurn')) throw new Error('Missing currentTurn property');
      if (!gameState.hasOwnProperty('gameStatus')) throw new Error('Missing gameStatus property (not status)');
      if (!gameState.hasOwnProperty('winner')) throw new Error('Missing winner property');
      if (!gameState.hasOwnProperty('moveHistory')) throw new Error('Missing moveHistory property');
      if (!gameState.hasOwnProperty('castlingRights')) throw new Error('Missing castlingRights property');
      if (!gameState.hasOwnProperty('enPassantTarget')) throw new Error('Missing enPassantTarget property');
      if (!gameState.hasOwnProperty('inCheck')) throw new Error('Missing inCheck property');
      
      // Validate property types
      if (!Array.isArray(gameState.board)) throw new Error('Board must be an array');
      if (!['white', 'black'].includes(gameState.currentTurn)) throw new Error('Invalid currentTurn value');
      if (!['active', 'check', 'checkmate', 'stalemate', 'draw'].includes(gameState.gameStatus)) throw new Error('Invalid gameStatus value');
      if (!Array.isArray(gameState.moveHistory)) throw new Error('moveHistory must be an array');
      if (typeof gameState.inCheck !== 'boolean') throw new Error('inCheck must be boolean');
    }
  },

  /**
   * Validate board position using current board representation
   * @param {Array} board - Game board
   * @param {number} row - Row coordinate
   * @param {number} col - Column coordinate
   * @param {Object|null} expectedPiece - Expected piece or null
   */
  validateBoardPosition(board, row, col, expectedPiece) {
    // Use Jest expect if available, otherwise use simple assertions
    if (typeof expect !== 'undefined') {
      expect(board).toBeDefined();
      expect(Array.isArray(board)).toBe(true);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThan(8);
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThan(8);
      
      if (expectedPiece === null) {
        expect(board[row][col]).toBeNull();
      } else {
        expect(board[row][col]).toEqual(expectedPiece);
      }
    } else {
      // Simple validation for non-Jest environments
      if (!board) throw new Error('Board is undefined');
      if (!Array.isArray(board)) throw new Error('Board must be an array');
      if (row < 0 || row >= 8) throw new Error('Row must be between 0-7');
      if (col < 0 || col >= 8) throw new Error('Col must be between 0-7');
      
      if (expectedPiece === null) {
        if (board[row][col] !== null) throw new Error(`Expected null at [${row}][${col}]`);
      } else {
        if (JSON.stringify(board[row][col]) !== JSON.stringify(expectedPiece)) {
          throw new Error(`Piece mismatch at [${row}][${col}]`);
        }
      }
    }
  },

  /**
   * Test move execution using current API patterns
   * @param {ChessGame} game - Game instance
   * @param {Object} move - Move object with from/to properties
   * @param {boolean} shouldSucceed - Whether move should succeed
   * @param {string} expectedErrorCode - Expected error code if move fails
   * @returns {Object} Move result
   */
  testMove(game, move, shouldSucceed, expectedErrorCode = null) {
    const result = game.makeMove(move);
    
    if (shouldSucceed) {
      testUtils.validateSuccessResponse(result);
    } else {
      testUtils.validateErrorResponse(result, expectedErrorCode);
    }
    
    return result;
  },

  /**
   * Execute a sequence of moves using current API
   * @param {ChessGame} game - Game instance
   * @param {Array} moves - Array of move objects
   * @returns {Array} Array of move results
   */
  executeMovesSequence(game, moves) {
    const results = [];
    moves.forEach(move => {
      const result = game.makeMove(move);
      
      // Use Jest expect if available, otherwise use simple assertion
      if (typeof expect !== 'undefined') {
        expect(result.success).toBe(true);
      } else {
        if (result.success !== true) {
          throw new Error(`Move failed: ${result.message}`);
        }
      }
      
      results.push(result);
    });
    return results;
  },

  /**
   * Validate move object format using current API structure
   * @param {Object} move - Move object to validate
   */
  validateMoveFormat(move) {
    // Use Jest expect if available, otherwise use simple assertions
    if (typeof expect !== 'undefined') {
      expect(move).toBeDefined();
      expect(typeof move).toBe('object');
      expect(move).toHaveProperty('from');
      expect(move).toHaveProperty('to');
      expect(move.from).toHaveProperty('row');
      expect(move.from).toHaveProperty('col');
      expect(move.to).toHaveProperty('row');
      expect(move.to).toHaveProperty('col');
      
      // Validate coordinate ranges
      expect(move.from.row).toBeGreaterThanOrEqual(0);
      expect(move.from.row).toBeLessThan(8);
      expect(move.from.col).toBeGreaterThanOrEqual(0);
      expect(move.from.col).toBeLessThan(8);
      expect(move.to.row).toBeGreaterThanOrEqual(0);
      expect(move.to.row).toBeLessThan(8);
      expect(move.to.col).toBeGreaterThanOrEqual(0);
      expect(move.to.col).toBeLessThan(8);
    } else {
      // Simple validation for non-Jest environments
      if (!move) throw new Error('Move is undefined');
      if (typeof move !== 'object') throw new Error('Move must be an object');
      if (!move.hasOwnProperty('from')) throw new Error('Move must have from property');
      if (!move.hasOwnProperty('to')) throw new Error('Move must have to property');
      if (!move.from.hasOwnProperty('row')) throw new Error('Move.from must have row property');
      if (!move.from.hasOwnProperty('col')) throw new Error('Move.from must have col property');
      if (!move.to.hasOwnProperty('row')) throw new Error('Move.to must have row property');
      if (!move.to.hasOwnProperty('col')) throw new Error('Move.to must have col property');
      
      // Validate coordinate ranges
      if (move.from.row < 0 || move.from.row >= 8) throw new Error('Move.from.row must be 0-7');
      if (move.from.col < 0 || move.from.col >= 8) throw new Error('Move.from.col must be 0-7');
      if (move.to.row < 0 || move.to.row >= 8) throw new Error('Move.to.row must be 0-7');
      if (move.to.col < 0 || move.to.col >= 8) throw new Error('Move.to.col must be 0-7');
    }
  },

  /**
   * Create a standardized move object using current API format
   * @param {number} fromRow - Source row
   * @param {number} fromCol - Source column
   * @param {number} toRow - Destination row
   * @param {number} toCol - Destination column
   * @param {string} promotion - Optional promotion piece
   * @returns {Object} Standardized move object
   */
  createMove(fromRow, fromCol, toRow, toCol, promotion = null) {
    const move = {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol }
    };
    
    if (promotion) {
      move.promotion = promotion;
    }
    
    return move;
  },

  /**
   * Validate special move response using current API patterns
   * @param {Object} response - Move response
   * @param {string} specialMoveType - Type of special move (castling, enPassant, promotion)
   */
  validateSpecialMoveResponse(response, specialMoveType) {
    testUtils.validateSuccessResponse(response);
    
    if (response.data && response.data.specialMove) {
      expect(response.data.specialMove.type).toBe(specialMoveType);
    }
  },

  /**
   * Validate error codes match current implementation
   * @param {string} errorCode - Error code to validate
   */
  validateErrorCode(errorCode) {
    const validErrorCodes = [
      'MALFORMED_MOVE', 'INVALID_FORMAT', 'MISSING_REQUIRED_FIELD',
      'INVALID_COORDINATES', 'OUT_OF_BOUNDS', 'SAME_SQUARE',
      'NO_PIECE', 'INVALID_PIECE', 'INVALID_PIECE_TYPE', 'INVALID_PIECE_COLOR', 'WRONG_TURN',
      'INVALID_MOVE', 'INVALID_MOVEMENT', 'UNKNOWN_PIECE_TYPE',
      'PATH_BLOCKED', 'CAPTURE_OWN_PIECE',
      'INVALID_CASTLING', 'INVALID_PROMOTION', 'INVALID_EN_PASSANT', 'INVALID_EN_PASSANT_TARGET',
      'KING_IN_CHECK', 'PINNED_PIECE_INVALID_MOVE', 'DOUBLE_CHECK_KING_ONLY', 'CHECK_NOT_RESOLVED',
      'GAME_NOT_ACTIVE', 'INVALID_STATUS', 'INVALID_STATUS_TRANSITION', 'MISSING_WINNER',
      'INVALID_WINNER_FOR_DRAW', 'TURN_SEQUENCE_VIOLATION', 'TURN_HISTORY_MISMATCH', 'INVALID_COLOR',
      'SYSTEM_ERROR', 'VALIDATION_FAILURE', 'STATE_CORRUPTION'
    ];
    
    // Use Jest expect if available, otherwise use simple assertion
    if (typeof expect !== 'undefined') {
      expect(validErrorCodes).toContain(errorCode);
    } else {
      if (!validErrorCodes.includes(errorCode)) {
        throw new Error(`Invalid error code: ${errorCode}`);
      }
    }
  }
};

/**
 * Additional utilities for current API pattern support
 */
const apiUtils = {
  /**
   * Create standardized test patterns for current API
   * @returns {Object} Test patterns for current API structure
   */
  getCurrentApiTestPatterns() {
    return {
      successResponse: {
        success: true,
        isValid: true,
        message: typeof expect !== 'undefined' ? expect.any(String) : 'string',
        errorCode: null
      },
      errorResponse: {
        success: false,
        isValid: false,
        message: typeof expect !== 'undefined' ? expect.any(String) : 'string',
        errorCode: typeof expect !== 'undefined' ? expect.any(String) : 'string'
      },
      gameStateProperties: [
        'board', 'currentTurn', 'gameStatus', 'winner', 
        'moveHistory', 'castlingRights', 'enPassantTarget', 'inCheck'
      ],
      validGameStatuses: ['active', 'check', 'checkmate', 'stalemate', 'draw'],
      validColors: ['white', 'black'],
      validPieceTypes: ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king']
    };
  },

  /**
   * Normalize legacy test expectations to current API
   * @param {Object} legacyExpectation - Old test expectation
   * @returns {Object} Normalized expectation for current API
   */
  normalizeLegacyExpectation(legacyExpectation) {
    const normalized = { ...legacyExpectation };

    // Map old property names to current ones
    if (normalized.status !== undefined) {
      normalized.gameStatus = normalized.status;
      delete normalized.status;
    }

    if (normalized.isValid !== undefined) {
      normalized.success = normalized.isValid;
      // Keep isValid for backward compatibility in current API
    }

    if (normalized.error !== undefined) {
      normalized.message = normalized.error;
      delete normalized.error;
    }

    return normalized;
  },

  /**
   * Validate that a test follows current API patterns
   * @param {Function} testFunction - Test function to validate
   * @returns {Object} Validation result
   */
  validateTestApiUsage(testFunction) {
    const testString = testFunction.toString();
    
    const issues = [];
    const suggestions = [];

    // Check for old property access patterns
    if (testString.includes('.status') && !testString.includes('.gameStatus')) {
      issues.push('Uses old .status property instead of .gameStatus');
      suggestions.push('Replace .status with .gameStatus');
    }

    if (testString.includes('.isValid') && !testString.includes('.success')) {
      issues.push('Uses .isValid without .success validation');
      suggestions.push('Validate both .success and .isValid properties');
    }

    if (testString.includes('.error') && !testString.includes('.message')) {
      issues.push('Uses old .error property instead of .message');
      suggestions.push('Replace .error with .message');
    }

    return {
      isValid: issues.length === 0,
      issues: issues,
      suggestions: suggestions
    };
  }
};

module.exports = {
  TestErrorSuppression,
  testUtils,
  apiUtils
};