/**
 * Comprehensive Error Handler Tests
 * Tests for ChessErrorHandler class covering all error categories and recovery mechanisms
 *
 * vim: sw=4 ts=4 et fenc=utf-8 ft=javascript
 */
const ChessErrorHandler = require('../src/shared/errorHandler');
const ChessGame = require('../src/shared/chessGame');

describe('ChessErrorHandler', () => {
  let errorHandler;
  let game;

  beforeEach(() => {
    errorHandler = new ChessErrorHandler();
    game = new ChessGame();
  });

  afterEach(() => {
      jest.restoreAllMocks();
  })

  describe('Error Creation', () => {
    test('should create format error with standard message', () => {
      const error = errorHandler.createError('MALFORMED_MOVE');
      
      expect(error.success).toBe(false);
      expect(error.isValid).toBe(false);
      expect(error.message).toBe('Move must be an object');
      expect(error.errorCode).toBe('MALFORMED_MOVE');
    });

    test('should create error with custom message', () => {
      const customMsg = 'Custom error message';
      const error = errorHandler.createError('INVALID_MOVE', customMsg);
      
      expect(error.message).toBe(customMsg);
      expect(error.errorCode).toBe('INVALID_MOVE');
    });

    test('should create error with additional details', () => {
      const details = { row: 8, col: 9 };
      const error = errorHandler.createError('OUT_OF_BOUNDS', null, details);
      
      expect(error.details).toEqual(details);
    });

    test('should handle unknown error codes gracefully', () => {
      const error = errorHandler.createError('UNKNOWN_ERROR');
      
      expect(error.success).toBe(false);
      expect(error.errorCode).toBe('UNKNOWN_ERROR');
    });

    test('should return specific actions for a known error code in getRecoveryActions', () => {
      const actions = errorHandler.getRecoveryActions('INVALID_PIECE');
      expect(actions).toEqual(['refresh_board', 'reset_piece_data']);
    });
    });

    describe('Error Statistics and Logging', () => {
        test('should update error statistics on error creation', () => {
            errorHandler.createError('MALFORMED_MOVE');
            errorHandler.createError('INVALID_COORDINATES');
            errorHandler.createError('MALFORMED_MOVE');
            const stats = errorHandler.getErrorStats();
            expect(stats.totalErrors).toBe(3);
            expect(stats.errorsByCode.MALFORMED_MOVE).toBe(2);
        });
        test('should track recovery attempts and successes', () => {
            errorHandler.attemptRecovery('INVALID_PIECE', {
                piece: {
                    type: 'invalid',
                    color: 'white'
                },
                position: {
                    row: 0,
                    col: 0
                }
            });
            errorHandler.attemptRecovery('MALFORMED_MOVE'); // Will fail
            const stats = errorHandler.getErrorStats();
            expect(stats.recoveryAttempts).toBe(2);
            expect(stats.successfulRecoveries).toBe(1);
            expect(stats.recoveryRate).toBe('50.00%');
        });
        test('should reset statistics', () => {
            errorHandler.createError('INVALID_MOVE');
            errorHandler.resetErrorStats();
            const stats = errorHandler.getErrorStats();
            expect(stats.totalErrors).toBe(0);
        });
        test('should log critical errors', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const errorResponse = {
                severity: 'CRITICAL',
                errorCode: 'TEST',
                message: 'Test'
            };
            errorHandler.logError(errorResponse);
            expect(consoleSpy).toHaveBeenCalledWith('CRITICAL ERROR:', errorResponse);
        });

    test('should reset all error statistics to zero', () => {
      errorHandler.createError('MALFORMED_MOVE');
      
      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCode.MALFORMED_MOVE).toBe(2);
      expect(stats.errorsByCode.INVALID_COORDINATES).toBe(1);
    });
  });

  describe('Success Response Creation', () => {
    test('should create success response with default message', () => {
      const success = errorHandler.createSuccess();
      
      expect(success.success).toBe(true);
      expect(success.isValid).toBe(true);
      expect(success.message).toBe('Operation successful');
      expect(success.errorCode).toBe(null);
    });

    test('should create success response with custom message and data', () => {
      const data = { move: 'e2-e4' };
      const success = errorHandler.createSuccess('Move executed', data);
      
      expect(success.message).toBe('Move executed');
      expect(success.data).toEqual(data);
    });

    test('should create success response with metadata', () => {
      const metadata = { timestamp: Date.now() };
      const success = errorHandler.createSuccess('Success', {}, metadata);
      
      expect(success.metadata).toEqual(metadata);
    });
  });

  describe('Error Recovery - Piece Data', () => {
    test('should recover invalid piece type', () => {
      const context = {
        piece: { type: 'invalid', color: 'white' },
        position: { row: 0, col: 0 }
      };
      
      const result = errorHandler.attemptRecovery('INVALID_PIECE_TYPE', context);
      
      expect(result.success).toBe(true);
      expect(result.recoveredData.type).toBe('pawn');
    });

    test('should recover invalid piece color', () => {
      const context = {
        piece: { type: 'rook', color: 'invalid' },
        position: { row: 0, col: 0 }
      };
      
      const result = errorHandler.attemptRecovery('INVALID_PIECE_COLOR', context);
      
      expect(result.success).toBe(true);
      expect(result.recoveredData.color).toBe('white');
    });

    test('should fail recovery without sufficient context', () => {
      const result = errorHandler.attemptRecovery('INVALID_PIECE', {});
      
      expect(result.success).toBe(false);
      expect(result.action).toBe('manual_intervention');
    });
  });

  describe('Error Recovery - Game Status', () => {
    test('should recover invalid game status', () => {
      const context = { currentStatus: 'invalid_status' };
      
      const result = errorHandler.attemptRecovery('INVALID_STATUS', context);
      
      expect(result.success).toBe(true);
      expect(result.recoveredData.status).toBe('active');
      expect(result.recoveredData.winner).toBe(null);
    });

    test('should not recover valid game status', () => {
        const context = { currentStatus: 'checkmate' };
        const result = errorHandler.recoverGameStatus(context);
        expect(result.success).toBe(false);
      });

    test('should fail to recover game status with no currentStatus property', () => {
        const result = errorHandler.recoverGameStatus({});
        expect(result.success).toBe(false);
        expect(result.message).toBe('Cannot recover game status');
        expect(result.action).toBe('manual_intervention');
    });
  });

  describe('Error Recovery - Winner Data', () => {
    test('should determine winner for checkmate without winner', () => {
      const context = {
        gameStatus: 'checkmate',
        currentTurn: 'white',
        winner: null
      };
      
      const result = errorHandler.attemptRecovery('MISSING_WINNER', context);
      
      expect(result.success).toBe(true);
      expect(result.recoveredData.winner).toBe('black');
    });

    test('should clear winner for draw games', () => {
      const context = {
        gameStatus: 'draw',
        winner: 'white'
      };
      
      const result = errorHandler.attemptRecovery('INVALID_WINNER_FOR_DRAW', context);
      
      expect(result.success).toBe(true);
      expect(result.recoveredData.winner).toBe(null);
    });

    test('should clear winner for stalemate', () => {
      const context = {
        gameStatus: 'stalemate',
        winner: 'black'
      };
      
      const result = errorHandler.attemptRecovery('INVALID_WINNER_FOR_DRAW', context);
      
      expect(result.success).toBe(true);
      expect(result.recoveredData.winner).toBe(null);
    });
  });

  describe('Error Recovery - Turn Sequence', () => {
    test('should recalculate turn from move history (white turn)', () => {
      const context = {
        moveHistory: [] // Empty = white's turn
      };
      
      const result = errorHandler.attemptRecovery('TURN_SEQUENCE_VIOLATION', context);
      
      expect(result.success).toBe(true);
      expect(result.recoveredData.currentTurn).toBe('white');
    });

    test('should recalculate turn from move history (black turn)', () => {
      const context = {
        moveHistory: [{ move: 'e2-e4' }] // One move = black's turn
      };
      
      const result = errorHandler.attemptRecovery('TURN_HISTORY_MISMATCH', context);
      
      expect(result.success).toBe(true);
      expect(result.recoveredData.currentTurn).toBe('black');
    });

    test('should fail recovery without move history', () => {
      const result = errorHandler.attemptRecovery('TURN_SEQUENCE_VIOLATION', {});
      
      expect(result.success).toBe(false);
    });

    test('should fail to recover color with no color property', () => {
        const result = errorHandler.recoverColorData({});
        expect(result.success).toBe(false);
        expect(result.message).toBe('Cannot recover color data');
        expect(result.action).toBe('manual_intervention');
    });
  });

  describe('Error Recovery - Color Data', () => {
    test('should recover invalid color', () => {
      const context = { color: 'invalid_color' };
      
      const result = errorHandler.attemptRecovery('INVALID_COLOR', context);
      
      expect(result.success).toBe(true);
      expect(result.recoveredData.color).toBe('white');
    });

    test('should not recover valid color', () => {
      const context = { color: 'black' };
      
      const result = errorHandler.attemptRecovery('INVALID_COLOR', context);
      
      expect(result.success).toBe(false);
    });
  });

  describe('Non-Recoverable Errors', () => {
    test('should not attempt recovery for non-recoverable errors', () => {
      const result = errorHandler.attemptRecovery('MALFORMED_MOVE');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Error is not recoverable');
    });

    test('should identify non-recoverable coordinate errors', () => {
      const result = errorHandler.attemptRecovery('OUT_OF_BOUNDS');
      
      expect(result.success).toBe(false);
    });

    test('should identify non-recoverable movement errors', () => {
      const result = errorHandler.attemptRecovery('PATH_BLOCKED');
      
      expect(result.success).toBe(false);
    });
  });

  describe('Recovery Options', () => {
    test('should provide recovery options for recoverable errors', () => {
      const options = errorHandler.getRecoveryOptions('INVALID_PIECE');
      
      expect(options.automatic).toBe(true);
      expect(options.suggestions).toBeInstanceOf(Array);
      expect(options.suggestions.length).toBeGreaterThan(0);
      expect(options.actions).toBeInstanceOf(Array);
    });

    test('should provide suggestions for format errors', () => {
      const options = errorHandler.getRecoveryOptions('MALFORMED_MOVE');
      
      expect(options.suggestions).toContain("Ensure move has 'from' and 'to' properties with row/col coordinates");
    });

    test('should provide actions for piece errors', () => {
      const options = errorHandler.getRecoveryOptions('INVALID_PIECE_TYPE');
      
      expect(options.actions).toContain('validate_piece_data');
      expect(options.actions).toContain('reset_board');
    });

    test('should provide manual intervention for unknown errors', () => {
      const options = errorHandler.getRecoveryOptions('UNKNOWN_ERROR');
      
      expect(options.suggestions).toEqual([]);
    });
  });

  describe('Auto-Recovery Detection', () => {
    test('should identify auto-recoverable errors', () => {
      expect(errorHandler.canAutoRecover('INVALID_PIECE')).toBe(true);
      expect(errorHandler.canAutoRecover('INVALID_STATUS')).toBe(true);
      expect(errorHandler.canAutoRecover('TURN_SEQUENCE_VIOLATION')).toBe(true);
    });

    test('should identify non-auto-recoverable errors', () => {
      expect(errorHandler.canAutoRecover('MALFORMED_MOVE')).toBe(false);
      expect(errorHandler.canAutoRecover('PATH_BLOCKED')).toBe(false);
      expect(errorHandler.canAutoRecover('KING_IN_CHECK')).toBe(false);
    });
  });

  describe('Error Statistics', () => {
    test('should track total errors', () => {
      errorHandler.createError('INVALID_MOVE');
      errorHandler.createError('PATH_BLOCKED');
      
      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(2);
    });

    test('should track errors by category', () => {
      errorHandler.createError('MALFORMED_MOVE'); // FORMAT
      errorHandler.createError('INVALID_FORMAT'); // FORMAT
      errorHandler.createError('OUT_OF_BOUNDS'); // COORDINATE
      
      const stats = errorHandler.getErrorStats();
      expect(stats.errorsByCategory.FORMAT).toBe(2);
      expect(stats.errorsByCategory.COORDINATE).toBe(1);
    });

    test('should track errors by code', () => {
      errorHandler.createError('INVALID_MOVE');
      errorHandler.createError('INVALID_MOVE');
      errorHandler.createError('PATH_BLOCKED');
      
      const stats = errorHandler.getErrorStats();
      expect(stats.errorsByCode.INVALID_MOVE).toBe(2);
      expect(stats.errorsByCode.PATH_BLOCKED).toBe(1);
    });

    test('should track recovery attempts and successes', () => {
      errorHandler.attemptRecovery('INVALID_PIECE', {
        piece: {
          type: 'invalid',
          color: 'white'
        },
        position: {
          row: 0,
          col: 0
        }
      });
      errorHandler.resetErrorStats();
      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByCategory).toEqual({});
      expect(stats.errorsByCode).toEqual({});
    });
  });

  describe('Error ID Generation', () => {
    test('should generate unique error IDs', () => {
      const id1 = errorHandler.generateErrorId();
      const id2 = errorHandler.generateErrorId();
      
      expect(id1).toMatch(/^err_\d+_[a-z0-9]{6}$/);
      expect(id2).toMatch(/^err_\d+_[a-z0-9]{6}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Recovery Actions', () => {
    test('should get specific recovery actions for piece errors', () => {
      const actions = errorHandler.getRecoveryActions('INVALID_PIECE');
      expect(actions).toContain('refresh_board');
      expect(actions).toContain('reset_piece_data');
    });

    test('should get recovery actions for status errors', () => {
      const actions = errorHandler.getRecoveryActions('INVALID_STATUS_TRANSITION');
      expect(actions).toContain('revert_status');
      expect(actions).toContain('validate_transition');
    });

    test('should get recovery actions for system errors', () => {
      const actions = errorHandler.getRecoveryActions('SYSTEM_ERROR');
      expect(actions).toContain('reset_state');
      expect(actions).toContain('reload_game');
    });

    test('should default to manual intervention for unknown errors', () => {
      const actions = errorHandler.getRecoveryActions('UNKNOWN_ERROR');
      expect(actions).toEqual(['manual_intervention']);
    });

    test('should get recovery actions for color errors', () => {
      const actions = errorHandler.getRecoveryActions('INVALID_COLOR');
      expect(actions).toContain('set_default_color');
      expect(actions).toContain('validate_color');
    });
  });

  describe('Error Logging', () => {
    test('should log critical errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorResponse = { severity: 'CRITICAL', errorCode: 'TEST', message: 'Test' };
      
      errorHandler.logError(errorResponse);
      
      expect(consoleSpy).toHaveBeenCalledWith('CRITICAL ERROR:', errorResponse);
      consoleSpy.mockRestore();
    });

    test('should log high severity errors', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorResponse = {
        severity: 'HIGH',
        errorCode: 'TEST',
        message: 'Test'
      };
      errorHandler.logError(errorResponse);
      expect(consoleSpy).toHaveBeenCalledWith('HIGH SEVERITY ERROR:', errorResponse.errorCode, errorResponse.message);
    });

    test('should log low severity errors', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const errorResponse = {
          severity: 'LOW',
          errorCode: 'TEST',
          message: 'Test'
        };
        errorHandler.logError(errorResponse);
        expect(consoleSpy).toHaveBeenCalledWith('Error:', errorResponse.errorCode, errorResponse.message);
      });
    });

    describe('Error ID and Validation', () => {
        test('should generate unique error IDs', () => {
            const id1 = errorHandler.generateErrorId();
            const id2 = errorHandler.generateErrorId();
            expect(id1).not.toBe(id2);
        });
        test('should validate complete error response structure', () => {
            const validResponse = {
                success: false,
                isValid: false,
                message: 'Error',
                errorCode: 'TEST',
                category: 'SYSTEM',
                severity: 'HIGH',
                recoverable: false,
                errors: [],
                suggestions: [],
                details: {}
            };
            const isValid = errorHandler.validateErrorResponse(validResponse);
            expect(isValid).toBe(true);
        });
        test('should reject incomplete error response', () => {
            const invalidResponse = {
                success: false,
                message: 'Error'
            };
            const isValid = errorHandler.validateErrorResponse(invalidResponse);
            expect(isValid).toBe(false);
        });
        test('should return false for object with some missing properties', () => {
            const invalidResponse = {
                success: false,
                message: 'Error',
                errorCode: 'TEST'
            };
            const isValid = errorHandler.validateErrorResponse(invalidResponse);
            expect(isValid).toBe(false);
        });
        test('should reject error response with missing properties', () => {
            const invalidResponse = {
                success: false,
                isValid: false,
                message: 'Error',
                errorCode: 'TEST',
                category: 'SYSTEM',
                severity: 'HIGH',
                recoverable: false,
                errors: [],
                suggestions: []
            };
            const isValid = errorHandler.validateErrorResponse(invalidResponse);
            expect(isValid).toBe(false);
        });
    });

    describe('Error Code Coverage', () => {
        test('should create errors for all error codes', () => {
            const errorCodes = Object.keys(errorHandler.errorCodes);
            errorCodes.forEach(code => {
                const error = errorHandler.createError(code);
                expect(error.success).toBe(false);
                expect(error.errorCode).toBe(code);
            });
        });
    });

    describe('validateErrorResponse', () => {
        test('should return true for a valid error response structure', () => {
            const validError = {
                success: false,
                isValid: false,
                message: 'Test error',
                errorCode: 'TEST_CODE',
                category: 'TEST',
                severity: 'HIGH',
                recoverable: false,
                errors: [],
                suggestions: [],
                details: {}
            };
            expect(errorHandler.validateErrorResponse(validError)).toBe(true);
        });
        test('should return false for an invalid error response structure', () => {
            const invalidError = {
                success: false,
                message: 'Test error'
            };
            expect(errorHandler.validateErrorResponse(invalidError)).toBe(false);
        });

    test('should return false for a partially valid error response structure', () => {
      const partiallyValidError = {
        success: false,
        isValid: false,
        message: 'Test error',
        errorCode: 'TEST_CODE',
        category: 'TEST',
        severity: 'HIGH',
        recoverable: false,
        errors: [],
        suggestions: []
      };
      
      const isValid = errorHandler.validateErrorResponse(validResponse);
      expect(isValid).toBe(true);
    });

    test('should reject incomplete error response', () => {
      const invalidResponse = {
        success: false,
        message: 'Error'
      };
      
      const isValid = errorHandler.validateErrorResponse(invalidResponse);
      expect(isValid).toBe(false);
    });
  });

  describe('All Error Codes Coverage', () => {
    test('should create errors for all coordinate error codes', () => {
      const codes = ['INVALID_COORDINATES', 'OUT_OF_BOUNDS', 'SAME_SQUARE'];
      
      codes.forEach(code => {
        const error = errorHandler.createError(code);
        expect(error.success).toBe(false);
        expect(error.errorCode).toBe(code);
      });
    });

    test('should create errors for all piece error codes', () => {
      const codes = ['NO_PIECE', 'INVALID_PIECE', 'INVALID_PIECE_TYPE', 
                     'INVALID_PIECE_COLOR', 'WRONG_TURN'];
      
      codes.forEach(code => {
        const error = errorHandler.createError(code);
        expect(error.success).toBe(false);
        expect(error.errorCode).toBe(code);
      });
    });

    test('should create errors for all movement error codes', () => {
      const codes = ['INVALID_MOVE', 'INVALID_MOVEMENT', 'UNKNOWN_PIECE_TYPE'];
      
      codes.forEach(code => {
        const error = errorHandler.createError(code);
        expect(error.success).toBe(false);
        expect(error.errorCode).toBe(code);
      });
    });

    test('should create errors for all special move error codes', () => {
      const codes = ['INVALID_CASTLING', 'INVALID_PROMOTION', 
                     'INVALID_EN_PASSANT', 'INVALID_EN_PASSANT_TARGET'];
      
      codes.forEach(code => {
        const error = errorHandler.createError(code);
        expect(error.success).toBe(false);
        expect(error.errorCode).toBe(code);
      });
    });

    test('should create errors for all check error codes', () => {
      const codes = ['KING_IN_CHECK', 'PINNED_PIECE_INVALID_MOVE', 
                     'DOUBLE_CHECK_KING_ONLY', 'CHECK_NOT_RESOLVED'];
      
      codes.forEach(code => {
        const error = errorHandler.createError(code);
        expect(error.success).toBe(false);
        expect(error.errorCode).toBe(code);
      });
    });

    test('should create errors for all state error codes', () => {
      const codes = ['GAME_NOT_ACTIVE', 'INVALID_STATUS', 'INVALID_STATUS_TRANSITION',
                     'MISSING_WINNER', 'INVALID_WINNER_FOR_DRAW', 'TURN_SEQUENCE_VIOLATION',
                     'TURN_HISTORY_MISMATCH', 'INVALID_COLOR'];
      
      codes.forEach(code => {
        const error = errorHandler.createError(code);
        expect(error.success).toBe(false);
        expect(error.errorCode).toBe(code);
      });
    });

    test('should create errors for all system error codes', () => {
      const codes = ['SYSTEM_ERROR', 'VALIDATION_FAILURE', 'STATE_CORRUPTION'];
      
      codes.forEach(code => {
        const error = errorHandler.createError(code);
        expect(error.success).toBe(false);
        expect(error.errorCode).toBe(code);
      });
    });
  });

  describe('Constructor and Initialization', () => {
    test('should initialize error categories', () => {
      expect(errorHandler.errorCategories).toBeDefined();
      expect(errorHandler.errorCategories.FORMAT).toBe('FORMAT_ERROR');
    });

    test('should initialize error codes with proper structure', () => {
      expect(errorHandler.errorCodes).toBeDefined();
      expect(errorHandler.errorCodes.MALFORMED_MOVE).toEqual({
        category: 'FORMAT',
        severity: 'HIGH',
        recoverable: false
      });
    });
  });

  // Integration tests from errorHandling.test.js
  describe('Integration with ChessGame', () => {
    test('should handle null move gracefully', () => {
      const result = game.makeMove(null);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('MALFORMED_MOVE');
    });

    test('should handle empty square', () => {
      const move = { from: { row: 4, col: 4 }, to: { row: 3, col: 4 } };
      const result = game.makeMove(move);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NO_PIECE');
    });

    test('should handle wrong turn', () => {
      const move = { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } };
      const result = game.makeMove(move);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('WRONG_TURN');
    });

    test('should handle moves when game is not active', () => {
        game.gameStatus = 'checkmate';
        const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('GAME_NOT_ACTIVE');
    });
  });
});
