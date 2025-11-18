/**
 * ErrorHandler Complete Coverage Tests
 * Tests to achieve 100% coverage on errorHandler.js
 */

const ChessErrorHandler = require('../src/shared/errorHandler');

describe('ErrorHandler Complete Coverage', () => {
  let errorHandler;

  beforeEach(() => {
    errorHandler = new ChessErrorHandler();
  });

  describe('Recovery Actions - Default Cases', () => {
    test('should handle unknown error code in attemptRecovery', () => {
      const result = errorHandler.attemptRecovery('UNKNOWN_ERROR_CODE', {});
      expect(result.success).toBe(false);
      expect(result.message).toBe('Error is not recoverable');
    });

    test('should handle unknown error code in getRecoveryAction', () => {
      const result = errorHandler.getRecoveryAction('UNKNOWN_CODE', {});
      expect(result.success).toBe(false);
      expect(result.message).toBe('No specific recovery action available');
      expect(result.action).toBe('manual_intervention');
    });

    test('should handle INVALID_COLOR recovery', () => {
      const context = {
        color: 'invalid',
        gameState: {}
      };
      
      const result = errorHandler.getRecoveryAction('INVALID_COLOR', context);
      expect(result).toBeDefined();
    });

    test('should handle unrecoverable winner data', () => {
      const context = {
        winner: 'invalid_winner',
        gameState: {
          status: 'active'
        }
      };
      
      const result = errorHandler.recoverWinnerData(context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot recover winner data');
      expect(result.action).toBe('manual_intervention');
    });
  });

  describe('Recoverable Error Paths', () => {
    test('should attempt recovery for INVALID_PIECE', () => {
      const result = errorHandler.attemptRecovery('INVALID_PIECE', {});
      expect(result).toBeDefined();
    });

    test('should attempt recovery for INVALID_PIECE_TYPE', () => {
      const result = errorHandler.attemptRecovery('INVALID_PIECE_TYPE', {});
      expect(result).toBeDefined();
    });

    test('should attempt recovery for INVALID_PIECE_COLOR', () => {
      const result = errorHandler.attemptRecovery('INVALID_PIECE_COLOR', {});
      expect(result).toBeDefined();
    });

    test('should not recover non-recoverable errors', () => {
      const result = errorHandler.attemptRecovery('INVALID_MOVE', {});
      expect(result.success).toBe(false);
      expect(result.message).toBe('Error is not recoverable');
    });
  });

  describe('Winner Recovery Edge Cases', () => {
    test('should handle winner recovery with checkmate', () => {
      const context = {
        winner: null,
        gameState: {
          status: 'checkmate',
          currentTurn: 'white'
        }
      };
      
      const result = errorHandler.recoverWinnerData(context);
      // Check that it returns a result
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    test('should fail winner recovery with invalid state', () => {
      const context = {
        winner: 'invalid',
        gameState: {
          status: 'active'
        }
      };
      
      const result = errorHandler.recoverWinnerData(context);
      expect(result.success).toBe(false);
      expect(result.action).toBe('manual_intervention');
    });
  });

  describe('Error Statistics', () => {
    test('should track recovery attempts', () => {
      const initialAttempts = errorHandler.errorStats.recoveryAttempts;
      errorHandler.attemptRecovery('INVALID_PIECE', {});
      expect(errorHandler.errorStats.recoveryAttempts).toBeGreaterThan(initialAttempts);
    });

    test('should get error statistics', () => {
      const stats = errorHandler.getErrorStats();
      expect(stats).toBeDefined();
      expect(stats.totalErrors).toBeDefined();
    });
  });
});
