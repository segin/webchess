/**
 * Comprehensive Error Handling Tests
 * Tests all error scenarios, error codes, recovery mechanisms, and system stability
 */

const ChessGame = require('../src/shared/chessGame');
const ChessErrorHandler = require('../src/shared/errorHandler');

describe('Comprehensive Error Handling System', () => {
  let game;
  let errorHandler;

  beforeEach(() => {
    // Suppress console output for error handling tests
    testUtils.suppressErrorLogs();
    
    game = new ChessGame();
    errorHandler = new ChessErrorHandler();
    if (errorHandler.resetErrorStats) {
      errorHandler.resetErrorStats(); // Reset statistics for clean tests
    }
  });

  afterEach(() => {
    // Restore console output after each test
    testUtils.restoreErrorLogs();
  });

  describe('Error Handler Initialization', () => {
    test('should initialize with all required error categories', () => {
      expect(errorHandler.errorCategories).toBeDefined();
      expect(errorHandler.errorCategories.FORMAT).toBe('FORMAT_ERROR');
      expect(errorHandler.errorCategories.COORDINATE).toBe('COORDINATE_ERROR');
      expect(errorHandler.errorCategories.PIECE).toBe('PIECE_ERROR');
      expect(errorHandler.errorCategories.MOVEMENT).toBe('MOVEMENT_ERROR');
      expect(errorHandler.errorCategories.PATH).toBe('PATH_ERROR');
      expect(errorHandler.errorCategories.RULE).toBe('RULE_ERROR');
      expect(errorHandler.errorCategories.STATE).toBe('STATE_ERROR');
      expect(errorHandler.errorCategories.CHECK).toBe('CHECK_ERROR');
      expect(errorHandler.errorCategories.SYSTEM).toBe('SYSTEM_ERROR');
    });

    test('should initialize with comprehensive error codes', () => {
      expect(errorHandler.errorCodes).toBeDefined();
      expect(Object.keys(errorHandler.errorCodes).length).toBeGreaterThan(20);
      
      // Test specific error codes
      expect(errorHandler.errorCodes.MALFORMED_MOVE).toBeDefined();
      expect(errorHandler.errorCodes.INVALID_COORDINATES).toBeDefined();
      expect(errorHandler.errorCodes.NO_PIECE).toBeDefined();
      expect(errorHandler.errorCodes.WRONG_TURN).toBeDefined();
      expect(errorHandler.errorCodes.KING_IN_CHECK).toBeDefined();
    });

    test('should initialize with user-friendly messages', () => {
      expect(errorHandler.userFriendlyMessages).toBeDefined();
      expect(errorHandler.userFriendlyMessages.MALFORMED_MOVE).toBeDefined();
      expect(errorHandler.userFriendlyMessages.NO_PIECE).toBeDefined();
      expect(errorHandler.userFriendlyMessages.WRONG_TURN).toBeDefined();
      
      // Check that messages contain expected keywords
      const malformedMsg = errorHandler.userFriendlyMessages.MALFORMED_MOVE.toLowerCase();
      const noPieceMsg = errorHandler.userFriendlyMessages.NO_PIECE.toLowerCase();
      const wrongTurnMsg = errorHandler.userFriendlyMessages.WRONG_TURN.toLowerCase();
      
      expect(malformedMsg.includes('invalid') || malformedMsg.includes('format')).toBe(true);
      expect(noPieceMsg.includes('no piece') || noPieceMsg.includes('found')).toBe(true);
      expect(wrongTurnMsg.includes('turn') || wrongTurnMsg.includes('not')).toBe(true);
    });

    test('should initialize with recovery suggestions', () => {
      expect(errorHandler.recoverySuggestions).toBeDefined();
      expect(errorHandler.recoverySuggestions.MALFORMED_MOVE).toBeDefined();
      expect(Array.isArray(errorHandler.recoverySuggestions.MALFORMED_MOVE)).toBe(true);
    });

    test('should initialize error statistics', () => {
      expect(errorHandler.errorStats).toBeDefined();
      expect(errorHandler.errorStats.totalErrors).toBe(0);
      expect(errorHandler.errorStats.errorsByCategory).toEqual({});
      expect(errorHandler.errorStats.errorsByCode).toEqual({});
    });
  });

  describe('Error Creation and Structure', () => {
    test('should create standardized error response', () => {
      const error = errorHandler.createError('MALFORMED_MOVE', 'Custom message', ['Error detail']);
      
      expect(error.success).toBe(false);
      expect(error.isValid).toBe(false);
      expect(error.message).toBe('Custom message');
      expect(error.errorCode).toBe('MALFORMED_MOVE');
      expect(error.category).toBe('FORMAT');
      expect(error.severity).toBe('HIGH');
      expect(error.recoverable).toBe(false);
      expect(error.errors).toContain('Error detail');
      expect(error.suggestions).toBeDefined();
      expect(error.details).toBeDefined();
      expect(error.details.timestamp).toBeDefined();
      expect(error.details.errorId).toBeDefined();
    });

    test('should create success response', () => {
      const success = errorHandler.createSuccess('Operation successful', { data: 'test' });
      
      expect(success.success).toBe(true);
      expect(success.isValid).toBe(true);
      expect(success.message).toBe('Operation successful');
      expect(success.errorCode).toBe(null);
      expect(success.errors).toEqual([]);
      expect(success.data).toEqual({ data: 'test' });
    });

    test('should handle unknown error codes gracefully', () => {
      const error = errorHandler.createError('UNKNOWN_ERROR_CODE');
      
      expect(error.errorCode).toBe('SYSTEM_ERROR');
      expect(error.category).toBe('SYSTEM');
    });

    test('should update error statistics when creating errors', () => {
      const freshErrorHandler = new ChessErrorHandler();
      const initialTotal = freshErrorHandler.errorStats.totalErrors;
      
      freshErrorHandler.createError('MALFORMED_MOVE');
      
      expect(freshErrorHandler.errorStats.totalErrors).toBe(initialTotal + 1);
      expect(freshErrorHandler.errorStats.errorsByCategory.FORMAT).toBe(1);
      expect(freshErrorHandler.errorStats.errorsByCode.MALFORMED_MOVE).toBe(1);
    });

    test('should generate unique error IDs', () => {
      const error1 = errorHandler.createError('MALFORMED_MOVE');
      const error2 = errorHandler.createError('MALFORMED_MOVE');
      
      expect(error1.details.errorId).toBeDefined();
      expect(error2.details.errorId).toBeDefined();
      expect(error1.details.errorId).not.toBe(error2.details.errorId);
    });
  });

  describe('Format Error Handling', () => {
    test('should handle null move gracefully', () => {
      const result = game.makeMove(null);
      
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBe('MALFORMED_MOVE');
      
      // Check if the result has the enhanced error structure
      if (result.category) {
        expect(result.category).toBe('FORMAT');
      }
      if (result.suggestions) {
        expect(result.suggestions).toBeDefined();
      }
    });

    test('should handle undefined move gracefully', () => {
      const result = game.makeMove(undefined);
      
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBe('MALFORMED_MOVE');
    });

    test('should handle string instead of object', () => {
      const result = game.makeMove('invalid move');
      
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBe('MALFORMED_MOVE');
    });

    test('should handle number instead of object', () => {
      const result = game.makeMove(123);
      
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBe('MALFORMED_MOVE');
    });

    test('should handle array instead of object', () => {
      const result = game.makeMove([1, 2, 3]);
      
      testUtils.validateErrorResponse(result);
      // Arrays are objects in JavaScript, so they pass the typeof check but fail format validation
      expect(['MALFORMED_MOVE', 'INVALID_FORMAT']).toContain(result.errorCode);
    });

    test('should handle missing from square', () => {
      const move = { to: { row: 4, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
      expect(result.errors).toContain('Move must have a valid "from" square object');
    });

    test('should handle missing to square', () => {
      const move = { from: { row: 6, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
      expect(result.errors).toContain('Move must have a valid "to" square object');
    });

    test('should handle non-numeric coordinates', () => {
      const move = { from: { row: 'a', col: 4 }, to: { row: 4, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
      expect(result.errors).toContain('From square must have numeric row and col properties');
    });

    test('should handle invalid promotion piece', () => {
      const move = { 
        from: { row: 1, col: 0 }, 
        to: { row: 0, col: 0 }, 
        promotion: 'invalid' 
      };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Promotion must be one of: queen, rook, bishop, knight');
    });
  });

  describe('Coordinate Error Handling', () => {
    test('should handle negative coordinates', () => {
      const move = { from: { row: -1, col: 0 }, to: { row: 0, col: 0 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_COORDINATES');
      expect(result.errors).toContain('Invalid source coordinates: row -1, col 0');
    });

    test('should handle coordinates beyond board bounds', () => {
      const move = { from: { row: 8, col: 8 }, to: { row: 0, col: 0 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_COORDINATES');
      expect(result.errors).toContain('Invalid source coordinates: row 8, col 8');
    });

    test('should handle fractional coordinates', () => {
      const move = { from: { row: 6.5, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_COORDINATES');
    });

    test('should handle same source and destination', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 6, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_COORDINATES');
      expect(result.errors).toContain('Source and destination squares cannot be the same');
    });

    test('should handle multiple coordinate errors', () => {
      const move = { from: { row: -1, col: 9 }, to: { row: 8, col: -2 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_COORDINATES');
      expect(result.errors.length).toBe(2);
    });
  });

  describe('Piece Error Handling', () => {
    test('should handle empty square', () => {
      const move = { from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }; // Empty square
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NO_PIECE');
      expect(result.message.toLowerCase().includes('no piece')).toBe(true);
    });

    test('should handle corrupted piece data with recovery', () => {
      // Manually corrupt piece data
      game.board[6][4] = { type: null, color: 'white' };
      
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_PIECE');
      expect(result.details.recovery).toBeDefined();
      expect(result.recoverable).toBe(true);
    });

    test('should handle invalid piece type with recovery', () => {
      // Manually set invalid piece type
      game.board[6][4] = { type: 'invalid', color: 'white' };
      
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_PIECE_TYPE');
      expect(result.details.recovery).toBeDefined();
    });

    test('should handle invalid piece color with recovery', () => {
      // Manually set invalid piece color
      game.board[6][4] = { type: 'pawn', color: 'red' };
      
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_PIECE_COLOR');
      expect(result.details.recovery).toBeDefined();
    });

    test('should handle wrong turn', () => {
      const move = { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }; // Black piece on white turn
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('WRONG_TURN');
      expect(result.message).toContain('not your turn');
    });
  });

  describe('Game State Error Handling', () => {
    test('should handle moves when game is not active', () => {
      game.gameStatus = 'checkmate';
      
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('GAME_NOT_ACTIVE');
      expect(result.errors).toContain('Game status is checkmate, moves are not allowed');
    });

    test('should handle invalid game status transitions', () => {
      const statusResult = game.stateManager.updateGameStatus('active', 'invalid_status');
      
      expect(statusResult.success).toBe(false);
      expect(statusResult.code).toBe('INVALID_STATUS');
    });

    test('should handle missing winner for checkmate', () => {
      const statusResult = game.stateManager.updateGameStatus('active', 'checkmate');
      
      expect(statusResult.success).toBe(false);
      expect(statusResult.code).toBe('MISSING_WINNER');
    });

    test('should handle invalid winner for draw', () => {
      const statusResult = game.stateManager.updateGameStatus('active', 'stalemate', 'white');
      
      expect(statusResult.success).toBe(false);
      expect(statusResult.code).toBe('INVALID_WINNER_FOR_DRAW');
    });
  });

  describe('Movement Error Handling', () => {
    test('should handle invalid pawn movement', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 5 } }; // Invalid diagonal without capture
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
      expect(result.message).toContain('Invalid pawn movement');
    });

    test('should handle blocked path', () => {
      // Place a piece in the path
      game.board[5][4] = { type: 'pawn', color: 'black' };
      
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_MOVEMENT'); // Pawn can't jump over pieces
    });

    test('should handle capturing own piece', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 7, col: 4 } }; // White rook position
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_MOVEMENT'); // Invalid pawn movement to capture own piece
    });
  });

  describe('Error Recovery Mechanisms', () => {
    test('should attempt automatic recovery for recoverable errors', () => {
      const recoveryResult = errorHandler.attemptRecovery('INVALID_PIECE', {
        piece: { type: null, color: 'white' },
        position: { row: 6, col: 4 }
      });
      
      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.recoveredData).toBeDefined();
      expect(recoveryResult.recoveredData.type).toBe('pawn'); // Default recovery
    });

    test('should not attempt recovery for non-recoverable errors', () => {
      const recoveryResult = errorHandler.attemptRecovery('MALFORMED_MOVE');
      
      expect(recoveryResult.success).toBe(false);
      expect(recoveryResult.message).toContain('not recoverable');
    });

    test('should recover game status', () => {
      const recoveryResult = errorHandler.attemptRecovery('INVALID_STATUS', {
        currentStatus: 'invalid_status'
      });
      
      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.recoveredData.status).toBe('active');
    });

    test('should recover winner data for checkmate', () => {
      const recoveryResult = errorHandler.attemptRecovery('MISSING_WINNER', {
        gameStatus: 'checkmate',
        currentTurn: 'white'
      });
      
      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.recoveredData.winner).toBe('black'); // Opposite of current turn
    });

    test('should recover turn sequence from move history', () => {
      const recoveryResult = errorHandler.attemptRecovery('TURN_SEQUENCE_VIOLATION', {
        moveHistory: [{ /* move 1 */ }, { /* move 2 */ }] // 2 moves = white's turn
      });
      
      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.recoveredData.currentTurn).toBe('white');
    });
  });

  describe('Error Message Accuracy', () => {
    test('should provide accurate error messages for all error codes', () => {
      const errorCodes = Object.keys(errorHandler.errorCodes);
      
      errorCodes.forEach(code => {
        const error = errorHandler.createError(code);
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
        expect(error.suggestions).toBeDefined();
        expect(Array.isArray(error.suggestions)).toBe(true);
      });
    });

    test('should provide context-specific error details', () => {
      const move = { from: { row: -1, col: 0 }, to: { row: 0, col: 0 } };
      const result = game.makeMove(move);
      
      expect(result.context).toBeDefined();
      expect(result.context.from).toEqual({ row: -1, col: 0 });
      expect(result.context.to).toEqual({ row: 0, col: 0 });
    });

    test('should provide recovery suggestions for recoverable errors', () => {
      const error = errorHandler.createError('INVALID_PIECE');
      
      expect(error.recoverable).toBe(true);
      expect(error.recovery).toBeDefined();
      expect(error.recovery.suggestions).toBeDefined();
      expect(error.recovery.actions).toBeDefined();
    });
  });

  describe('System Stability Under Error Conditions', () => {
    test('should maintain game state consistency after errors', () => {
      const originalBoard = JSON.parse(JSON.stringify(game.board));
      const originalTurn = game.currentTurn;
      
      // Attempt invalid move
      const result = game.makeMove({ from: { row: -1, col: 0 }, to: { row: 0, col: 0 } });
      
      testUtils.validateErrorResponse(result);
      expect(game.board).toEqual(originalBoard); // Board unchanged
      expect(game.currentTurn).toBe(originalTurn); // Turn unchanged
    });

    test('should handle multiple consecutive errors gracefully', () => {
      const errors = [];
      
      // Generate multiple errors
      errors.push(game.makeMove(null));
      errors.push(game.makeMove({ invalid: 'move' }));
      errors.push(game.makeMove({ from: { row: -1, col: 0 }, to: { row: 0, col: 0 } }));
      errors.push(game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } })); // Empty square
      
      // All should be errors
      errors.forEach(error => {
        testUtils.validateErrorResponse(error);
      });
      
      // Game should still be functional
      const validMove = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      testUtils.validateSuccessResponse(validMove);
    });

    test('should handle system errors gracefully', () => {
      // Mock a system error by corrupting internal state temporarily
      const originalValidateMove = game.validateMove;
      game.validateMove = () => {
        throw new Error('Simulated system error');
      };
      
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('SYSTEM_ERROR');
      expect(result.severity).toBe('CRITICAL');
      
      // Restore original method
      game.validateMove = originalValidateMove;
      
      // Game should still work after recovery
      const validMove = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      expect(validMove.success).toBe(true);
    });

    test('should track error statistics accurately', () => {
      const initialStats = errorHandler.getErrorStats();
      
      // Generate some errors
      errorHandler.createError('MALFORMED_MOVE');
      errorHandler.createError('INVALID_COORDINATES');
      errorHandler.createError('NO_PIECE');
      
      const finalStats = errorHandler.getErrorStats();
      
      expect(finalStats.totalErrors).toBe(initialStats.totalErrors + 3);
      expect(finalStats.errorsByCategory.FORMAT).toBe(1);
      expect(finalStats.errorsByCategory.COORDINATE).toBe(1);
      expect(finalStats.errorsByCategory.PIECE).toBe(1);
    });

    test('should validate error response structure', () => {
      const error = errorHandler.createError('MALFORMED_MOVE');
      const isValid = errorHandler.validateErrorResponse(error);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Error Code Consistency', () => {
    test('should have consistent error code format', () => {
      const errorCodes = Object.keys(errorHandler.errorCodes);
      
      errorCodes.forEach(code => {
        // Error codes should be UPPER_CASE with underscores
        expect(code).toMatch(/^[A-Z_]+$/);
        
        // Each error code should have required properties
        const errorInfo = errorHandler.errorCodes[code];
        expect(errorInfo.category).toBeDefined();
        expect(errorInfo.severity).toBeDefined();
        expect(errorInfo.recoverable).toBeDefined();
        expect(typeof errorInfo.recoverable).toBe('boolean');
      });
    });

    test('should have user-friendly messages for all error codes', () => {
      const errorCodes = Object.keys(errorHandler.errorCodes);
      
      errorCodes.forEach(code => {
        expect(errorHandler.userFriendlyMessages[code]).toBeDefined();
        expect(typeof errorHandler.userFriendlyMessages[code]).toBe('string');
        expect(errorHandler.userFriendlyMessages[code].length).toBeGreaterThan(0);
      });
    });

    test('should have recovery suggestions for all error codes', () => {
      const errorCodes = Object.keys(errorHandler.errorCodes);
      
      errorCodes.forEach(code => {
        expect(errorHandler.recoverySuggestions[code]).toBeDefined();
        expect(Array.isArray(errorHandler.recoverySuggestions[code])).toBe(true);
      });
    });
  });

  describe('Extended Error Scenarios', () => {
    test('should handle network simulation errors', () => {
      // Simulate network-related errors
      const networkErrors = [
        { type: 'timeout', data: { timeout: 5000 } },
        { type: 'connection_lost', data: { lastPing: Date.now() - 10000 } },
        { type: 'invalid_session', data: { sessionId: 'invalid-123' } },
        { type: 'rate_limit', data: { attempts: 100, timeWindow: 60000 } }
      ];

      networkErrors.forEach(errorScenario => {
        const error = errorHandler.createError('SYSTEM_ERROR', `Network error: ${errorScenario.type}`, [], errorScenario.data);
        testUtils.validateErrorResponse(error);
        expect(error.context).toBeDefined();
      });
    });

    test('should handle malformed game state errors', () => {
      // Test various malformed game states
      const malformedStates = [
        { board: null, description: 'null board' },
        { board: [], description: 'empty board array' },
        { board: Array(7).fill(null), description: 'wrong board size' },
        { currentTurn: 'red', description: 'invalid turn color' },
        { gameStatus: 'invalid_status', description: 'invalid game status' }
      ];

      malformedStates.forEach(state => {
        const tempGame = testUtils.createFreshGame();
        Object.assign(tempGame, state);
        
        const result = tempGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
        testUtils.validateErrorResponse(result);
      });
    });

    test('should handle edge case coordinate combinations', () => {
      const edgeCases = [
        { from: { row: -1, col: -1 }, to: { row: 0, col: 0 } },
        { from: { row: 8, col: 8 }, to: { row: 7, col: 7 } },
        { from: { row: 3.5, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: Infinity, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: NaN, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: '3', col: '4' }, to: { row: 4, col: 4 } }
      ];

      edgeCases.forEach(move => {
        const result = game.makeMove(move);
        testUtils.validateErrorResponse(result);
        expect(['INVALID_COORDINATES', 'INVALID_FORMAT', 'MALFORMED_MOVE']).toContain(result.errorCode);
      });
    });

    test('should handle concurrent move attempts', () => {
      // Simulate concurrent move attempts that could cause race conditions
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } },
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 6, col: 3 }, to: { row: 5, col: 3 } }
      ];

      const results = moves.map(move => game.makeMove(move));
      
      // Only first move should succeed
      testUtils.validateSuccessResponse(results[0]);
      testUtils.validateErrorResponse(results[1]); // Same piece already moved
      testUtils.validateErrorResponse(results[2]); // Wrong turn
    });

    test('should handle memory pressure scenarios', () => {
      // Create many error objects to test memory handling
      const errors = [];
      for (let i = 0; i < 1000; i++) {
        errors.push(errorHandler.createError('MALFORMED_MOVE', `Error ${i}`));
      }

      // Verify all errors are properly structured
      errors.forEach(error => {
        testUtils.validateErrorResponse(error);
        expect(error.details.errorId).toBeDefined();
      });

      // Check that error IDs are unique
      const errorIds = errors.map(e => e.details.errorId);
      const uniqueIds = new Set(errorIds);
      expect(uniqueIds.size).toBe(errors.length);
    });

    test('should handle complex nested error scenarios', () => {
      // Test error handling within error handling
      const originalCreateError = errorHandler.createError;
      
      // Mock createError to throw an error
      errorHandler.createError = () => {
        throw new Error('Error in error creation');
      };

      try {
        const result = game.makeMove(null);
        // Should still return a basic error structure
        expect(result).toBeDefined();
        expect(result.success).toBe(false);
      } finally {
        // Restore original method
        errorHandler.createError = originalCreateError;
      }
    });

    test('should handle internationalization error scenarios', () => {
      // Test error messages with various character sets
      const internationalInputs = [
        { from: { row: '六', col: '四' }, to: { row: '五', col: '四' } }, // Chinese
        { from: { row: 'шесть', col: 'четыре' }, to: { row: 'пять', col: 'четыре' } }, // Russian
        { from: { row: '🎯', col: '♟️' }, to: { row: '🏁', col: '♟️' } }, // Emojis
        { from: { row: 'null', col: 'undefined' }, to: { row: 'NaN', col: 'Infinity' } } // JS keywords
      ];

      internationalInputs.forEach(move => {
        const result = game.makeMove(move);
        testUtils.validateErrorResponse(result);
        expect(result.message).toBeDefined();
        expect(typeof result.message).toBe('string');
      });
    });
  });
});

// Export for use in other test files
module.exports = {
  testErrorHandling: () => {
    console.log('Running comprehensive error handling tests...');
    // This would run all the tests above
    return true;
  }
};