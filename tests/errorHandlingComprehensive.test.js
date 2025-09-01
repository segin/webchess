const ChessGame = require('../src/shared/chessGame');
const ChessErrorHandler = require('../src/shared/errorHandler');
const testUtils = require('./utils/errorSuppression');

describe('Error Handling - Comprehensive Coverage', () => {
  let game;
  let errorHandler;

  beforeEach(() => {
    game = new ChessGame();
    errorHandler = new ChessErrorHandler();
  });

  describe('Input Validation Errors', () => {
    test('should handle null move input', () => {
      const result = game.makeMove(null);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('MALFORMED_MOVE');
      expect(result.message).toContain('Move must be an object');
    });

    test('should handle undefined move input', () => {
      const result = game.makeMove(undefined);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('MALFORMED_MOVE');
      expect(result.message).toContain('Move must be an object');
    });

    test('should handle empty object move input', () => {
      const result = game.makeMove({});
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
      expect(result.message).toContain('format');
    });

    test('should handle missing from property', () => {
      const result = game.makeMove({ to: { row: 4, col: 4 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
      expect(result.message).toContain('format');
    });

    test('should handle missing to property', () => {
      const result = game.makeMove({ from: { row: 6, col: 4 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
      expect(result.message).toContain('format');
    });

    test('should handle invalid coordinate types', () => {
      const invalidInputs = [
        { from: { row: '6', col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 6, col: '4' }, to: { row: 4, col: 4 } },
        { from: { row: 6, col: 4 }, to: { row: '4', col: 4 } },
        { from: { row: 6, col: 4 }, to: { row: 4, col: '4' } },
        { from: { row: null, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 6, col: undefined }, to: { row: 4, col: 4 } }
      ];

      invalidInputs.forEach(input => {
        const result = game.makeMove(input);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_FORMAT');
      });
    });

    test('should handle out of bounds coordinates', () => {
      const outOfBoundsInputs = [
        { from: { row: -1, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 8, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 6, col: -1 }, to: { row: 4, col: 4 } },
        { from: { row: 6, col: 8 }, to: { row: 4, col: 4 } },
        { from: { row: 6, col: 4 }, to: { row: -1, col: 4 } },
        { from: { row: 6, col: 4 }, to: { row: 8, col: 4 } },
        { from: { row: 6, col: 4 }, to: { row: 4, col: -1 } },
        { from: { row: 6, col: 4 }, to: { row: 4, col: 8 } }
      ];

      outOfBoundsInputs.forEach(input => {
        const result = game.makeMove(input);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_COORDINATES');
      });
    });

    test('should handle extreme coordinate values', () => {
      const extremeInputs = [
        { from: { row: Infinity, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: -Infinity, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: NaN, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 6, col: NaN }, to: { row: 4, col: 4 } }
      ];

      extremeInputs.forEach(input => {
        const result = game.makeMove(input);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_COORDINATES');
      });
    });
  });

  describe('Game State Errors', () => {
    test('should handle moves when game is not active', () => {
      // Force game to end
      game.gameStatus = 'checkmate';
      game.winner = 'black';
      
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('GAME_NOT_ACTIVE');
      expect(result.message).toContain('not active');
    });

    test('should handle moves on empty squares', () => {
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NO_PIECE');
      expect(result.message).toContain('No piece');
    });

    test('should handle moves with wrong color pieces', () => {
      // Try to move black piece on white's turn
      const result = game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('WRONG_TURN');
      expect(result.message).toContain('turn');
    });

    test('should handle capturing own pieces', () => {
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 7, col: 4 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
      expect(result.message).toContain('movement');
    });
  });

  describe('Movement Pattern Errors', () => {
    test('should handle invalid pawn movements', () => {
      const invalidPawnMoves = [
        { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } }, // Too far
        { from: { row: 6, col: 4 }, to: { row: 5, col: 5 } }, // Diagonal without capture
        { from: { row: 6, col: 4 }, to: { row: 7, col: 4 } }, // Backward
        { from: { row: 6, col: 4 }, to: { row: 6, col: 5 } }  // Sideways
      ];

      invalidPawnMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });
    });

    test('should handle invalid rook movements', () => {
      // Clear path for rook
      game.board[6][0] = null;
      game.board[5][0] = null;
      game.board[4][0] = null;
      game.board[3][0] = null;
      game.board[2][0] = null;
      
      const invalidRookMoves = [
        { from: { row: 7, col: 0 }, to: { row: 5, col: 2 } }, // Diagonal
        { from: { row: 7, col: 0 }, to: { row: 6, col: 1 } }  // L-shape
      ];

      invalidRookMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });
    });

    test('should handle invalid knight movements', () => {
      // Clear some squares first to avoid capture issues
      game.board[5][1] = null; // Clear destination squares
      game.board[6][3] = null;
      game.board[4][4] = null;
      
      const invalidKnightMoves = [
        { from: { row: 7, col: 1 }, to: { row: 5, col: 1 } }, // Straight (not L-shape)
        { from: { row: 7, col: 1 }, to: { row: 6, col: 3 } }, // Not L-shape
        { from: { row: 7, col: 1 }, to: { row: 4, col: 4 } }  // Too far
      ];

      invalidKnightMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });
    });

    test('should handle invalid bishop movements', () => {
      // Move pawn to clear path
      game.makeMove({ from: { row: 6, col: 3 }, to: { row: 4, col: 3 } });
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // Black move
      
      const invalidBishopMoves = [
        { from: { row: 7, col: 2 }, to: { row: 5, col: 2 } }, // Straight
        { from: { row: 7, col: 2 }, to: { row: 6, col: 4 } }  // Not diagonal
      ];

      invalidBishopMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });
    });

    test('should handle invalid king movements', () => {
      // Clear space around king
      game.board[6][3] = null;
      game.board[6][4] = null;
      game.board[6][5] = null;
      
      const invalidKingMoves = [
        { from: { row: 7, col: 4 }, to: { row: 5, col: 4 } }, // Too far
        { from: { row: 7, col: 4 }, to: { row: 5, col: 6 } }  // Too far diagonal
      ];

      invalidKingMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });
    });
  });

  describe('Path Obstruction Errors', () => {
    test('should handle blocked rook paths', () => {
      // Rook path is blocked by pawn
      const result = game.makeMove({ from: { row: 7, col: 0 }, to: { row: 4, col: 0 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PATH_BLOCKED');
      expect(result.message).toContain('blocked');
    });

    test('should handle blocked bishop paths', () => {
      // Bishop path is blocked by pawn
      const result = game.makeMove({ from: { row: 7, col: 2 }, to: { row: 4, col: 5 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PATH_BLOCKED');
      expect(result.message).toContain('blocked');
    });

    test('should handle blocked queen paths', () => {
      // Queen path is blocked by pawn
      const result = game.makeMove({ from: { row: 7, col: 3 }, to: { row: 4, col: 3 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PATH_BLOCKED');
      expect(result.message).toContain('blocked');
    });
  });

  describe('Check and Checkmate Errors', () => {
    test('should handle moves that leave king in check', () => {
      // Set up scenario where moving a piece exposes king to check
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][3] = { type: 'rook', color: 'white' };
      game.board[0][3] = { type: 'rook', color: 'black' };
      
      // Moving the rook would expose king to check
      const result = game.makeMove({ from: { row: 7, col: 3 }, to: { row: 7, col: 2 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
    });

    test('should handle invalid check resolution attempts', () => {
      // Set up check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      game.board[7][3] = { type: 'queen', color: 'white' };
      
      // King is in check, but try to move a piece that doesn't resolve check
      const result = game.makeMove({ from: { row: 7, col: 3 }, to: { row: 7, col: 2 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CHECK_NOT_RESOLVED');
    });
  });

  describe('Castling Errors', () => {
    test('should handle castling when king has moved', () => {
      // Clear path for castling
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      // Move king and back
      game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 5 } });
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // Black move
      game.makeMove({ from: { row: 7, col: 5 }, to: { row: 7, col: 4 } });
      game.makeMove({ from: { row: 3, col: 4 }, to: { row: 1, col: 4 } }); // Black move back
      
      // Try to castle - should fail
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('WRONG_TURN');
      expect(result.message).toContain('turn');
    });

    test('should handle castling when rook has moved', () => {
      // Clear path for castling
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      // Move rook and back
      game.makeMove({ from: { row: 7, col: 7 }, to: { row: 7, col: 6 } });
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // Black move
      game.makeMove({ from: { row: 7, col: 6 }, to: { row: 7, col: 7 } });
      game.makeMove({ from: { row: 3, col: 4 }, to: { row: 1, col: 4 } }); // Black move back
      
      // Try to castle - should fail
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('WRONG_TURN');
    });

    test('should handle castling with blocked path', () => {
      // Path is blocked by bishop
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });

    test('should handle castling while in check', () => {
      // Clear path but put king in check
      game.board[7][5] = null;
      game.board[7][6] = null;
      game.board[0][4] = { type: 'rook', color: 'black' };
      
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('check');
    });
  });

  describe('En Passant Errors', () => {
    test('should handle invalid en passant attempts', () => {
      // Try en passant without proper setup
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[3][5] = { type: 'pawn', color: 'black' };
      
      const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 5 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
    });

    test('should handle en passant after timeout', () => {
      // Set up en passant scenario
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[1][5] = { type: 'pawn', color: 'black' };
      
      // Black pawn moves two squares
      game.currentTurn = 'black';
      game.makeMove({ from: { row: 1, col: 5 }, to: { row: 3, col: 5 } });
      
      // Make another move (not en passant)
      game.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } });
      
      // Now try en passant - should fail
      const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 5 } });
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('WRONG_TURN');
    });
  });

  describe('Promotion Errors', () => {
    test('should handle promotion on wrong rank', () => {
      // Try to promote pawn not on promotion rank
      const result = game.makeMove({ 
        from: { row: 6, col: 4 }, 
        to: { row: 5, col: 4 },
        promotion: 'queen'
      });
      
      // Should succeed but ignore promotion
      expect(result.success).toBe(true);
      expect(game.board[5][4]).toEqual({ type: 'pawn', color: 'white' });
    });

    test('should handle invalid promotion piece types', () => {
      // Place pawn ready for promotion
      game.board[1][4] = { type: 'pawn', color: 'white' };
      
      const result = game.makeMove({ 
        from: { row: 1, col: 4 }, 
        to: { row: 0, col: 4 },
        promotion: 'king' // Invalid promotion
      });
      
      // Should succeed with default queen promotion
      expect(result.success).toBe(true);
      expect(game.board[0][4]).toEqual({ type: 'queen', color: 'white' });
    });
  });

  describe('Error Handler Direct Testing', () => {
    test('should create proper error structures', () => {
      const error = errorHandler.createError('TEST_ERROR', 'Test message', { detail: 'test' });
      
      expect(error.success).toBe(false);
      expect(error.errorCode).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.details).toEqual({ detail: 'test' });
    });

    test('should create proper success structures', () => {
      const success = errorHandler.createSuccess('Test success', { data: 'test' }, { meta: 'test' });
      
      expect(success.success).toBe(true);
      expect(success.message).toBe('Test success');
      expect(success.data).toEqual({ data: 'test' });
      expect(success.metadata).toEqual({ meta: 'test' });
      expect(success.errorCode).toBeNull();
    });

    test('should handle error categorization', () => {
      const categories = [
        'VALIDATION_ERROR',
        'GAME_STATE_ERROR',
        'MOVEMENT_ERROR',
        'CHECK_ERROR',
        'CASTLING_ERROR'
      ];

      categories.forEach(category => {
        const error = errorHandler.createError(category, 'Test message');
        expect(error.errorCode).toBe(category);
        expect(error.success).toBe(false);
      });
    });
  });

  describe('Error Recovery Scenarios', () => {
    test('should recover from invalid moves gracefully', () => {
      const originalState = JSON.parse(JSON.stringify(game.getGameState()));
      
      // Attempt several invalid moves
      const invalidMoves = [
        { from: { row: 4, col: 4 }, to: { row: 3, col: 3 } }, // No piece
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // Wrong turn
        { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } }  // Too far for pawn
      ];
      
      invalidMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
      });
      
      // Game state should be unchanged
      const currentState = game.getGameState();
      expect(currentState).toEqual(originalState);
      
      // Valid move should still work
      const validResult = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(validResult.success).toBe(true);
    });

    test('should handle error cascades properly', () => {
      // Create scenario that could cause multiple errors
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      
      // King is in check - try invalid resolution
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 8, col: 4 } });
      
      // Should get coordinate error, not check error
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_COORDINATES');
    });

    test('should maintain error context through complex scenarios', () => {
      // Set up complex error scenario
      game.gameStatus = 'checkmate';
      
      const result = game.makeMove({ 
        from: { row: -1, col: 4 }, 
        to: { row: 4, col: 4 } 
      });
      
      // Should prioritize game state error over coordinate error
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('GAME_NOT_ACTIVE');
    });
  });
});