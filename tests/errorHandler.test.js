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
        if (jest.restoreAllMocks) jest.restoreAllMocks();
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
        test('should initialize with all required error categories', () => {
            expect(errorHandler.errorCategories).toBeDefined();
            expect(errorHandler.errorCategories.FORMAT).toBe('FORMAT_ERROR');
        });
        test('should initialize with comprehensive error codes', () => {
            expect(errorHandler.errorCodes).toBeDefined();
            expect(Object.keys(errorHandler.errorCodes).length).toBeGreaterThan(20);
        });
        test('should initialize with user-friendly messages', () => {
            expect(errorHandler.userFriendlyMessages).toBeDefined();
            expect(errorHandler.userFriendlyMessages.MALFORMED_MOVE).toBeDefined();
        });
        test('should initialize with recovery suggestions', () => {
            expect(errorHandler.recoverySuggestions).toBeDefined();
            expect(Array.isArray(errorHandler.recoverySuggestions.MALFORMED_MOVE)).toBe(true);
        });
        test('should initialize error statistics', () => {
            expect(errorHandler.errorStats).toBeDefined();
            expect(errorHandler.errorStats.totalErrors).toBe(0);
        });
    });

    describe('Error Creation and Structure', () => {
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
            const details = {
                row: 8,
                col: 9
            };
            const error = errorHandler.createError('OUT_OF_BOUNDS', null, details);
            expect(error.details).toEqual(details);
        });
        test('should handle unknown error codes gracefully', () => {
            const error = errorHandler.createError('UNKNOWN_ERROR');
            expect(error.success).toBe(false);
            expect(error.errorCode).toBe('UNKNOWN_ERROR');
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
            const data = {
                move: 'e2-e4'
            };
            const success = errorHandler.createSuccess('Move executed', data);
            expect(success.message).toBe('Move executed');
            expect(success.data).toEqual(data);
        });
        test('should create success response with metadata', () => {
            const metadata = {
                timestamp: Date.now()
            };
            const success = errorHandler.createSuccess('Success', {}, metadata);
            expect(success.metadata).toEqual(metadata);
        });
    });

    describe('Input Validation Errors', () => {
        test('should handle null move input', () => {
            const result = game.makeMove(null);
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('MALFORMED_MOVE');
        });
        test('should handle undefined move input', () => {
            const result = game.makeMove(undefined);
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('MALFORMED_MOVE');
        });
        test('should handle empty object move input', () => {
            const result = game.makeMove({});
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('INVALID_FORMAT');
        });
    });

    describe('Error Recovery', () => {
        describe('Piece Data Recovery', () => {
            test('should recover invalid piece type', () => {
                const context = {
                    piece: {
                        type: 'invalid',
                        color: 'white'
                    },
                    position: {
                        row: 0,
                        col: 0
                    }
                };
                const result = errorHandler.attemptRecovery('INVALID_PIECE_TYPE', context);
                expect(result.success).toBe(true);
                expect(result.recoveredData.type).toBe('pawn');
            });
            test('should recover invalid piece color', () => {
                const context = {
                    piece: {
                        type: 'rook',
                        color: 'invalid'
                    },
                    position: {
                        row: 0,
                        col: 0
                    }
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

        describe('Game Status Recovery', () => {
            test('should recover invalid game status', () => {
                const context = {
                    currentStatus: 'invalid_status'
                };
                const result = errorHandler.attemptRecovery('INVALID_STATUS', context);
                expect(result.success).toBe(true);
                expect(result.recoveredData.status).toBe('active');
                expect(result.recoveredData.winner).toBe(null);
            });
            test('should not recover valid game status', () => {
                const context = {
                    currentStatus: 'checkmate'
                };
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

        describe('Winner Data Recovery', () => {
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

        describe('Turn Sequence Recovery', () => {
            test('should recalculate turn from move history (white turn)', () => {
                const context = {
                    moveHistory: []
                };
                const result = errorHandler.attemptRecovery('TURN_SEQUENCE_VIOLATION', context);
                expect(result.success).toBe(true);
                expect(result.recoveredData.currentTurn).toBe('white');
            });
            test('should recalculate turn from move history (black turn)', () => {
                const context = {
                    moveHistory: [{
                        move: 'e2-e4'
                    }]
                };
                const result = errorHandler.attemptRecovery('TURN_HISTORY_MISMATCH', context);
                expect(result.success).toBe(true);
                expect(result.recoveredData.currentTurn).toBe('black');
            });
            test('should fail recovery without move history', () => {
                const result = errorHandler.attemptRecovery('TURN_SEQUENCE_VIOLATION', {});
                expect(result.success).toBe(false);
            });
        });

        describe('Color Data Recovery', () => {
            test('should recover invalid color', () => {
                const context = {
                    color: 'invalid_color'
                };
                const result = errorHandler.attemptRecovery('INVALID_COLOR', context);
                expect(result.success).toBe(true);
                expect(result.recoveredData.color).toBe('white');
            });
            test('should not recover valid color', () => {
                const context = {
                    color: 'black'
                };
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
        });
    });

    describe('Additional Recovery Scenarios', () => {
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
        test('should recover winner when black is in checkmate', () => {
            const context = {
                gameStatus: 'checkmate',
                currentTurn: 'black',
                winner: null
            };
            const result = errorHandler.recoverWinnerData(context);
            expect(result.success).toBe(true);
            expect(result.recoveredData.winner).toBe('white');
        });
        test('should handle winner recovery with checkmate', () => {
            const context = {
                winner: null,
                gameState: {
                    status: 'checkmate',
                    currentTurn: 'white'
                }
            };
            const result = errorHandler.recoverWinnerData(context); // Check that it returns a result
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

    describe('Recovery Options and Detection', () => {
        test('should provide recovery options for recoverable errors', () => {
            const options = errorHandler.getRecoveryOptions('INVALID_PIECE');
            expect(options.automatic).toBe(true);
            expect(options.suggestions.length).toBeGreaterThan(0);
            expect(options.actions).toBeInstanceOf(Array);
        });
        test('should provide suggestions for format errors', () => {
            const options = errorHandler.getRecoveryOptions('MALFORMED_MOVE');
            expect(options.suggestions).toContain("Ensure move has 'from' and 'to' properties with row/col coordinates");
        });
        test('should identify auto-recoverable errors', () => {
            expect(errorHandler.canAutoRecover('INVALID_PIECE')).toBe(true);
        });
        test('should identify non-auto-recoverable errors', () => {
            expect(errorHandler.canAutoRecover('MALFORMED_MOVE')).toBe(false);
        });

    test('should return manual_intervention for unknown error code in getRecoveryActions', () => {
      const actions = errorHandler.getRecoveryActions('SOME_UNKNOWN_ERROR');
      expect(actions).toEqual(['manual_intervention']);
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
      expect(Object.keys(stats.errorsByCategory).length).toBe(0);
      expect(Object.keys(stats.errorsByCode).length).toBe(0);
      expect(stats.recoveryAttempts).toBe(0);
      expect(stats.successfulRecoveries).toBe(0);
      expect(stats.recoveryRate).toBe('0%');
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
      expect(errorHandler.validateErrorResponse(partiallyValidError)).toBe(false);
    });
    });

    describe('Integration with ChessGame', () => {
        test('should handle format errors', () => {
            const result = game.makeMove(null);
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('MALFORMED_MOVE');
        });
        test('should handle coordinate errors', () => {
            const move = {
                from: {
                    row: -1,
                    col: 0
                },
                to: {
                    row: 0,
                    col: 0
                }
            };
            const result = game.makeMove(move);
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('INVALID_COORDINATES');
        });
        test('should handle piece errors', () => {
            const move = {
                from: {
                    row: 4,
                    col: 4
                },
                to: {
                    row: 3,
                    col: 4
                }
            };
            const result = game.makeMove(move);
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('NO_PIECE');
        });
        test('should handle movement errors', () => {
            const move = {
                from: {
                    row: 6,
                    col: 4
                },
                to: {
                    row: 4,
                    col: 5
                }
            };
            const result = game.makeMove(move);
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('INVALID_MOVEMENT');
        });
        test('should handle path errors', () => {
            const result = game.makeMove({
                from: {
                    row: 7,
                    col: 0
                },
                to: {
                    row: 4,
                    col: 0
                }
            });
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('PATH_BLOCKED');
        });
        test('should handle rule errors', () => {
            const result = game.makeMove({
                from: {
                    row: 6,
                    col: 4
                },
                to: {
                    row: 7,
                    col: 4
                }
            });
            expect(result.success).toBe(false);
            expect(['INVALID_MOVEMENT', 'CAPTURE_OWN_PIECE']).toContain(result.errorCode);
        });
        test('should handle state errors', () => {
            game.gameStatus = 'checkmate';
            const move = {
                from: {
                    row: 6,
                    col: 4
                },
                to: {
                    row: 5,
                    col: 4
                }
            };
            const result = game.makeMove(move);
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('GAME_NOT_ACTIVE');
        });
        test('should handle check errors', () => {
            game.board = Array(8).fill(null).map(() => Array(8).fill(null));
            game.board[7][4] = {
                type: 'king',
                color: 'white'
            };
            game.board[0][3] = {
                type: 'rook',
                color: 'black'
            };
            const result = game.makeMove({
                from: {
                    row: 7,
                    col: 4
                },
                to: {
                    row: 7,
                    col: 3
                }
            });
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('KING_IN_CHECK');
        });
    });
});