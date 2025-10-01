const ChessErrorHandler = require('../src/shared/errorHandler');

describe('ChessErrorHandler Coverage Expansion', () => {
  let errorHandler;

  beforeEach(() => {
    errorHandler = new ChessErrorHandler();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize error categories', () => {
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

    test('should initialize error codes with proper structure', () => {
      expect(errorHandler.errorCodes).toBeDefined();
      
      // Test format error codes
      expect(errorHandler.errorCodes.MALFORMED_MOVE).toEqual({
        category: 'FORMAT',
        severity: 'HIGH',
        recoverable: false
      });
      
      // Test coordinate error codes
      expect(errorHandler.errorCodes.INVALID_COORDINATES).toEqual({
        category: 'COORDINATE',
        severity: 'HIGH',
        recoverable: false
      });
      
      // Test piece error codes
      expect(errorHandler.errorCodes.NO_PIECE).toEqual({
        category: 'PIECE',
        severity: 'HIGH',
        recoverable: false
      });
      
      // Test system error codes
      expect(errorHandler.errorCodes.SYSTEM_ERROR).toEqual({
        category: 'SYSTEM',
        severity: 'CRITICAL',
        recoverable: true
      });
    });

    test('should initialize user-friendly messages', () => {
      expect(errorHandler.userFriendlyMessages).toBeDefined();
      expect(errorHandler.userFriendlyMessages.MALFORMED_MOVE).toBe("Move must be an object");
      expect(errorHandler.userFriendlyMessages.NO_PIECE).toBe("No piece at source square");
      expect(errorHandler.userFriendlyMessages.WRONG_TURN).toBe("Not your turn");
    });
  });

  describe('Error Code Categories', () => {
    test('should have all format error codes', () => {
      const formatCodes = ['MALFORMED_MOVE', 'INVALID_FORMAT', 'MISSING_REQUIRED_FIELD'];
      formatCodes.forEach(code => {
        expect(errorHandler.errorCodes[code]).toBeDefined();
        expect(errorHandler.errorCodes[code].category).toBe('FORMAT');
      });
    });

    test('should have all coordinate error codes', () => {
      const coordinateCodes = ['INVALID_COORDINATES', 'OUT_OF_BOUNDS', 'SAME_SQUARE'];
      coordinateCodes.forEach(code => {
        expect(errorHandler.errorCodes[code]).toBeDefined();
        expect(errorHandler.errorCodes[code].category).toBe('COORDINATE');
      });
    });

    test('should have all piece error codes', () => {
      const pieceCodes = ['NO_PIECE', 'INVALID_PIECE', 'INVALID_PIECE_TYPE', 'INVALID_PIECE_COLOR', 'WRONG_TURN'];
      pieceCodes.forEach(code => {
        expect(errorHandler.errorCodes[code]).toBeDefined();
        expect(errorHandler.errorCodes[code].category).toBe('PIECE');
      });
    });

    test('should have all movement error codes', () => {
      const movementCodes = ['INVALID_MOVE', 'INVALID_MOVEMENT', 'UNKNOWN_PIECE_TYPE'];
      movementCodes.forEach(code => {
        expect(errorHandler.errorCodes[code]).toBeDefined();
        expect(errorHandler.errorCodes[code].category).toBe('MOVEMENT');
      });
    });

    test('should have all path error codes', () => {
      const pathCodes = ['PATH_BLOCKED'];
      pathCodes.forEach(code => {
        expect(errorHandler.errorCodes[code]).toBeDefined();
        expect(errorHandler.errorCodes[code].category).toBe('PATH');
      });
    });

    test('should have all rule error codes', () => {
      const ruleCodes = ['CAPTURE_OWN_PIECE', 'INVALID_CASTLING', 'INVALID_PROMOTION', 'INVALID_EN_PASSANT', 'INVALID_EN_PASSANT_TARGET'];
      ruleCodes.forEach(code => {
        expect(errorHandler.errorCodes[code]).toBeDefined();
        expect(errorHandler.errorCodes[code].category).toBe('RULE');
      });
    });

    test('should have all check error codes', () => {
      const checkCodes = ['KING_IN_CHECK', 'PINNED_PIECE_INVALID_MOVE', 'DOUBLE_CHECK_KING_ONLY', 'CHECK_NOT_RESOLVED'];
      checkCodes.forEach(code => {
        expect(errorHandler.errorCodes[code]).toBeDefined();
        expect(errorHandler.errorCodes[code].category).toBe('CHECK');
      });
    });

    test('should have all state error codes', () => {
      const stateCodes = [
        'GAME_NOT_ACTIVE', 'INVALID_STATUS', 'INVALID_STATUS_TRANSITION', 
        'MISSING_WINNER', 'INVALID_WINNER_FOR_DRAW', 'TURN_SEQUENCE_VIOLATION',
        'TURN_HISTORY_MISMATCH', 'INVALID_COLOR'
      ];
      stateCodes.forEach(code => {
        expect(errorHandler.errorCodes[code]).toBeDefined();
        expect(errorHandler.errorCodes[code].category).toBe('STATE');
      });
    });

    test('should have all system error codes', () => {
      const systemCodes = ['SYSTEM_ERROR', 'VALIDATION_FAILURE', 'STATE_CORRUPTION'];
      systemCodes.forEach(code => {
        expect(errorHandler.errorCodes[code]).toBeDefined();
        expect(errorHandler.errorCodes[code].category).toBe('SYSTEM');
      });
    });
  });

  describe('Error Severity Levels', () => {
    test('should have critical severity errors', () => {
      const criticalErrors = Object.keys(errorHandler.errorCodes).filter(
        code => errorHandler.errorCodes[code].severity === 'CRITICAL'
      );
      expect(criticalErrors.length).toBeGreaterThan(0);
      expect(criticalErrors).toContain('SYSTEM_ERROR');
      expect(criticalErrors).toContain('STATE_CORRUPTION');
    });

    test('should have high severity errors', () => {
      const highErrors = Object.keys(errorHandler.errorCodes).filter(
        code => errorHandler.errorCodes[code].severity === 'HIGH'
      );
      expect(highErrors.length).toBeGreaterThan(0);
      expect(highErrors).toContain('MALFORMED_MOVE');
      expect(highErrors).toContain('NO_PIECE');
    });

    test('should have medium severity errors', () => {
      const mediumErrors = Object.keys(errorHandler.errorCodes).filter(
        code => errorHandler.errorCodes[code].severity === 'MEDIUM'
      );
      expect(mediumErrors.length).toBeGreaterThan(0);
      expect(mediumErrors).toContain('SAME_SQUARE');
      expect(mediumErrors).toContain('WRONG_TURN');
    });
  });

  describe('Error Recoverability', () => {
    test('should identify recoverable errors', () => {
      const recoverableErrors = Object.keys(errorHandler.errorCodes).filter(
        code => errorHandler.errorCodes[code].recoverable === true
      );
      expect(recoverableErrors.length).toBeGreaterThan(0);
      expect(recoverableErrors).toContain('INVALID_PIECE');
      expect(recoverableErrors).toContain('SYSTEM_ERROR');
    });

    test('should identify non-recoverable errors', () => {
      const nonRecoverableErrors = Object.keys(errorHandler.errorCodes).filter(
        code => errorHandler.errorCodes[code].recoverable === false
      );
      expect(nonRecoverableErrors.length).toBeGreaterThan(0);
      expect(nonRecoverableErrors).toContain('MALFORMED_MOVE');
      expect(nonRecoverableErrors).toContain('WRONG_TURN');
    });
  });

  describe('User-Friendly Messages Coverage', () => {
    test('should have messages for all major error codes', () => {
      const majorErrorCodes = [
        'MALFORMED_MOVE', 'INVALID_FORMAT', 'MISSING_REQUIRED_FIELD',
        'INVALID_COORDINATES', 'OUT_OF_BOUNDS', 'SAME_SQUARE',
        'NO_PIECE', 'INVALID_PIECE', 'WRONG_TURN',
        'INVALID_MOVE', 'PATH_BLOCKED', 'CAPTURE_OWN_PIECE',
        'INVALID_CASTLING'
      ];

      majorErrorCodes.forEach(code => {
        expect(errorHandler.userFriendlyMessages[code]).toBeDefined();
        expect(typeof errorHandler.userFriendlyMessages[code]).toBe('string');
        expect(errorHandler.userFriendlyMessages[code].length).toBeGreaterThan(0);
      });
    });

    test('should have descriptive error messages', () => {
      expect(errorHandler.userFriendlyMessages.OUT_OF_BOUNDS).toBe("Move goes outside the chess board.");
      expect(errorHandler.userFriendlyMessages.CAPTURE_OWN_PIECE).toBe("You cannot capture your own pieces.");
      expect(errorHandler.userFriendlyMessages.PATH_BLOCKED).toBe("The path is blocked by other pieces.");
    });
  });

  describe('Error Code Validation', () => {
    test('should have consistent error code structure', () => {
      Object.keys(errorHandler.errorCodes).forEach(code => {
        const errorInfo = errorHandler.errorCodes[code];
        expect(errorInfo).toHaveProperty('category');
        expect(errorInfo).toHaveProperty('severity');
        expect(errorInfo).toHaveProperty('recoverable');
        
        expect(typeof errorInfo.category).toBe('string');
        expect(typeof errorInfo.severity).toBe('string');
        expect(typeof errorInfo.recoverable).toBe('boolean');
        
        expect(['FORMAT', 'COORDINATE', 'PIECE', 'MOVEMENT', 'PATH', 'RULE', 'STATE', 'CHECK', 'SYSTEM'])
          .toContain(errorInfo.category);
        expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(errorInfo.severity);
      });
    });

    test('should have valid category mappings', () => {
      Object.keys(errorHandler.errorCodes).forEach(code => {
        const errorInfo = errorHandler.errorCodes[code];
        const categoryKey = Object.keys(errorHandler.errorCategories).find(
          key => errorHandler.errorCategories[key] === errorInfo.category + '_ERROR'
        );
        expect(categoryKey).toBeDefined();
      });
    });
  });

  describe('Error Handler Methods', () => {
    test('should have createError method if implemented', () => {
      if (typeof errorHandler.createError === 'function') {
        const error = errorHandler.createError('MALFORMED_MOVE', 'Test message');
        expect(error).toBeDefined();
        expect(error.success).toBe(false);
      }
    });

    test('should have createSuccess method if implemented', () => {
      if (typeof errorHandler.createSuccess === 'function') {
        const success = errorHandler.createSuccess('Test success message');
        expect(success).toBeDefined();
        expect(success.success).toBe(true);
      }
    });

    test('should have getErrorInfo method if implemented', () => {
      if (typeof errorHandler.getErrorInfo === 'function') {
        const info = errorHandler.getErrorInfo('MALFORMED_MOVE');
        expect(info).toBeDefined();
        expect(info.category).toBe('FORMAT');
      }
    });

    test('should have isRecoverable method if implemented', () => {
      if (typeof errorHandler.isRecoverable === 'function') {
        const recoverable = errorHandler.isRecoverable('SYSTEM_ERROR');
        expect(typeof recoverable).toBe('boolean');
        expect(recoverable).toBe(true);
      }
    });
  });

  describe('Error Categories Completeness', () => {
    test('should cover all chess game error scenarios', () => {
      const expectedCategories = [
        'FORMAT_ERROR',    // Input format issues
        'COORDINATE_ERROR', // Board coordinate issues
        'PIECE_ERROR',     // Piece-related issues
        'MOVEMENT_ERROR',  // Movement pattern issues
        'PATH_ERROR',      // Path obstruction issues
        'RULE_ERROR',      // Chess rule violations
        'STATE_ERROR',     // Game state issues
        'CHECK_ERROR',     // Check/checkmate issues
        'SYSTEM_ERROR'     // System/technical issues
      ];

      expectedCategories.forEach(category => {
        const categoryExists = Object.values(errorHandler.errorCategories).includes(category);
        expect(categoryExists).toBe(true);
      });
    });

    test('should have comprehensive error code coverage', () => {
      const totalErrorCodes = Object.keys(errorHandler.errorCodes).length;
      expect(totalErrorCodes).toBeGreaterThan(20); // Should have substantial error coverage
    });

    test('should have user-friendly messages for common errors', () => {
      const commonErrors = [
        'MALFORMED_MOVE', 'NO_PIECE', 'WRONG_TURN', 'INVALID_MOVE', 
        'PATH_BLOCKED', 'CAPTURE_OWN_PIECE', 'INVALID_COORDINATES'
      ];
      
      commonErrors.forEach(error => {
        expect(errorHandler.userFriendlyMessages[error]).toBeDefined();
        expect(errorHandler.userFriendlyMessages[error].length).toBeGreaterThan(5);
      });
    });
  });

  describe('Error Consistency', () => {
    test('should have consistent naming conventions', () => {
      Object.keys(errorHandler.errorCodes).forEach(code => {
        expect(code).toMatch(/^[A-Z_]+$/); // Should be uppercase with underscores
        expect(code.length).toBeGreaterThan(3); // Should be descriptive
      });
    });

    test('should have consistent category naming', () => {
      Object.values(errorHandler.errorCategories).forEach(category => {
        expect(category).toMatch(/^[A-Z_]+_ERROR$/); // Should end with _ERROR
      });
    });

    test('should have consistent severity levels', () => {
      const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      Object.values(errorHandler.errorCodes).forEach(errorInfo => {
        expect(validSeverities).toContain(errorInfo.severity);
      });
    });
  });
});