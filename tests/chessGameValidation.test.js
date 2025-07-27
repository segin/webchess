const ChessGame = require('../src/shared/chessGame');

// Simple test framework for Node.js
if (typeof describe === 'undefined') {
  global.describe = (name, fn) => { console.log('\n' + name); fn(); };
  global.test = (name, fn) => { 
    try { 
      fn(); 
      console.log('✅', name); 
    } catch(e) { 
      console.log('❌', name, ':', e.message); 
    } 
  };
  global.beforeEach = (fn) => fn();
  global.expect = (actual) => ({
    toBe: (expected) => { 
      if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`); 
      return { toBe: () => {} };
    },
    toEqual: (expected) => { 
      if (JSON.stringify(actual) !== JSON.stringify(expected)) 
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); 
      return { toEqual: () => {} };
    },
    toContain: (expected) => { 
      if (!Array.isArray(actual) || !actual.includes(expected)) 
        throw new Error(`Expected array to contain ${expected}, got ${JSON.stringify(actual)}`); 
      return { toContain: () => {} };
    },
    toBeDefined: () => { 
      if (actual === undefined) throw new Error('Expected value to be defined'); 
      return { toBeDefined: () => {} };
    },
    toBeGreaterThan: (expected) => { 
      if (actual <= expected) throw new Error(`Expected ${actual} to be greater than ${expected}`); 
      return { toBeGreaterThan: () => {} };
    }
  });
  global.jest = { 
    fn: () => ({ 
      mockReturnValue: (val) => () => val 
    }) 
  };
}

describe('ChessGame Enhanced Validation Infrastructure', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('validateMoveFormat', () => {
    test('should reject null move', () => {
      const result = game.validateMoveFormat(null);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('MALFORMED_MOVE');
      expect(result.message).toBe('Move must be an object');
      expect(result.errors).toContain('Move parameter is null, undefined, or not an object');
    });

    test('should reject undefined move', () => {
      const result = game.validateMoveFormat(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('MALFORMED_MOVE');
      expect(result.details.formatValid).toBe(false);
    });

    test('should reject non-object move', () => {
      const result = game.validateMoveFormat('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('MALFORMED_MOVE');
      expect(result.message).toBe('Move must be an object');
    });

    test('should reject move without from square', () => {
      const move = { to: { row: 4, col: 4 } };
      const result = game.validateMoveFormat(move);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
      expect(result.errors).toContain('Move must have a valid "from" square object');
    });

    test('should reject move without to square', () => {
      const move = { from: { row: 6, col: 4 } };
      const result = game.validateMoveFormat(move);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
      expect(result.errors).toContain('Move must have a valid "to" square object');
    });

    test('should reject move with non-numeric coordinates', () => {
      const move = { from: { row: 'a', col: 4 }, to: { row: 4, col: 4 } };
      const result = game.validateMoveFormat(move);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('From square must have numeric row and col properties');
    });

    test('should reject invalid promotion piece', () => {
      const move = { 
        from: { row: 1, col: 0 }, 
        to: { row: 0, col: 0 }, 
        promotion: 'invalid' 
      };
      const result = game.validateMoveFormat(move);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Promotion must be one of: queen, rook, bishop, knight');
    });

    test('should accept valid move format', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = game.validateMoveFormat(move);
      expect(result.isValid).toBe(true);
    });

    test('should accept valid move with promotion', () => {
      const move = { 
        from: { row: 1, col: 0 }, 
        to: { row: 0, col: 0 }, 
        promotion: 'queen' 
      };
      const result = game.validateMoveFormat(move);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCoordinates', () => {
    test('should reject out-of-bounds source coordinates', () => {
      const from = { row: -1, col: 0 };
      const to = { row: 0, col: 0 };
      const result = game.validateCoordinates(from, to);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_COORDINATES');
      expect(result.errors).toContain('Invalid source coordinates: row -1, col 0');
    });

    test('should reject out-of-bounds destination coordinates', () => {
      const from = { row: 0, col: 0 };
      const to = { row: 8, col: 0 };
      const result = game.validateCoordinates(from, to);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_COORDINATES');
      expect(result.errors).toContain('Invalid destination coordinates: row 8, col 0');
    });

    test('should reject same source and destination', () => {
      const from = { row: 0, col: 0 };
      const to = { row: 0, col: 0 };
      const result = game.validateCoordinates(from, to);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_COORDINATES');
      expect(result.errors).toContain('Source and destination squares cannot be the same');
    });

    test('should accept valid coordinates', () => {
      const from = { row: 6, col: 4 };
      const to = { row: 4, col: 4 };
      const result = game.validateCoordinates(from, to);
      expect(result.isValid).toBe(true);
    });

    test('should reject multiple coordinate errors', () => {
      const from = { row: -1, col: 9 };
      const to = { row: 8, col: -2 };
      const result = game.validateCoordinates(from, to);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(2);
      expect(result.details.coordinatesValid).toBe(false);
    });
  });

  describe('validateGameState', () => {
    test('should reject moves when game is not active', () => {
      game.gameStatus = 'checkmate';
      const result = game.validateGameState();
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('GAME_NOT_ACTIVE');
      expect(result.message).toBe('Game is not active');
      expect(result.errors).toContain('Game status is checkmate, moves are not allowed');
    });

    test('should accept moves when game is active', () => {
      game.gameStatus = 'active';
      const result = game.validateGameState();
      expect(result.isValid).toBe(true);
    });
  });

  describe('validatePieceAtSquare', () => {
    test('should reject empty square', () => {
      const from = { row: 4, col: 4 }; // Empty square
      const result = game.validatePieceAtSquare(from);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('NO_PIECE');
      expect(result.message).toBe('No piece at source square');
      expect(result.errors).toContain('No piece found at square row 4, col 4');
    });

    test('should reject invalid piece data', () => {
      // Manually place invalid piece for testing
      game.board[4][4] = { type: null, color: 'white' };
      const from = { row: 4, col: 4 };
      const result = game.validatePieceAtSquare(from);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PIECE');
      expect(result.errors).toContain('Piece missing type or color information');
    });

    test('should reject invalid piece type', () => {
      game.board[4][4] = { type: 'invalid', color: 'white' };
      const from = { row: 4, col: 4 };
      const result = game.validatePieceAtSquare(from);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PIECE_TYPE');
      expect(result.errors).toContain('Invalid piece type: invalid');
    });

    test('should reject invalid piece color', () => {
      game.board[4][4] = { type: 'pawn', color: 'red' };
      const from = { row: 4, col: 4 };
      const result = game.validatePieceAtSquare(from);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PIECE_COLOR');
      expect(result.errors).toContain('Invalid piece color: red');
    });

    test('should accept valid piece', () => {
      const from = { row: 6, col: 4 }; // White pawn
      const result = game.validatePieceAtSquare(from);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateTurn', () => {
    test('should reject wrong color piece', () => {
      const piece = { type: 'pawn', color: 'black' };
      game.currentTurn = 'white';
      const result = game.validateTurn(piece);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('WRONG_TURN');
      expect(result.message).toBe('Not your turn');
      expect(result.errors).toContain("It's white's turn, cannot move black piece");
    });

    test('should accept correct color piece', () => {
      const piece = { type: 'pawn', color: 'white' };
      game.currentTurn = 'white';
      const result = game.validateTurn(piece);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateMovementPattern', () => {
    test('should reject invalid pawn movement', () => {
      const from = { row: 6, col: 4 };
      const to = { row: 4, col: 5 }; // Invalid diagonal without capture
      const piece = { type: 'pawn', color: 'white' };
      const result = game.validateMovementPattern(from, to, piece);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
      expect(result.message).toBe('Invalid pawn movement');
    });

    test('should accept valid pawn movement', () => {
      const from = { row: 6, col: 4 };
      const to = { row: 5, col: 4 };
      const piece = { type: 'pawn', color: 'white' };
      const result = game.validateMovementPattern(from, to, piece);
      expect(result.isValid).toBe(true);
    });

    test('should reject unknown piece type', () => {
      const from = { row: 6, col: 4 };
      const to = { row: 5, col: 4 };
      const piece = { type: 'unknown', color: 'white' };
      const result = game.validateMovementPattern(from, to, piece);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('UNKNOWN_PIECE_TYPE');
      expect(result.errors).toContain('Unknown piece type: unknown');
    });
  });

  describe('validatePath', () => {
    test('should reject blocked path', () => {
      // Place a piece in the path
      game.board[5][4] = { type: 'pawn', color: 'black' };
      const from = { row: 6, col: 4 };
      const to = { row: 4, col: 4 };
      const result = game.validatePath(from, to);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('PATH_BLOCKED');
      expect(result.message).toBe('Path is blocked');
    });

    test('should accept clear path', () => {
      const from = { row: 6, col: 4 };
      const to = { row: 4, col: 4 };
      // Clear any pieces that might be in the path
      game.board[5][4] = null;
      const result = game.validatePath(from, to);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCapture', () => {
    test('should reject capturing own piece', () => {
      const from = { row: 6, col: 4 };
      const to = { row: 7, col: 4 }; // White rook position
      const piece = { type: 'pawn', color: 'white' };
      const result = game.validateCapture(from, to, piece);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('CAPTURE_OWN_PIECE');
      expect(result.message).toBe('Cannot capture own piece');
    });

    test('should accept capturing opponent piece', () => {
      const from = { row: 6, col: 4 };
      const to = { row: 1, col: 4 }; // Black pawn position
      const piece = { type: 'pawn', color: 'white' };
      const result = game.validateCapture(from, to, piece);
      expect(result.isValid).toBe(true);
    });

    test('should accept moving to empty square', () => {
      const from = { row: 6, col: 4 };
      const to = { row: 5, col: 4 }; // Empty square
      const piece = { type: 'pawn', color: 'white' };
      const result = game.validateCapture(from, to, piece);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateSpecialMoves', () => {
    test('should reject invalid promotion piece', () => {
      const from = { row: 1, col: 0 };
      const to = { row: 0, col: 0 };
      const piece = { type: 'pawn', color: 'white' };
      const promotion = 'invalid';
      const result = game.validateSpecialMoves(from, to, piece, promotion);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PROMOTION');
      expect(result.errors[0].includes('Invalid promotion piece: invalid')).toBe(true);
    });

    test('should accept valid promotion piece', () => {
      const from = { row: 1, col: 0 };
      const to = { row: 0, col: 0 };
      const piece = { type: 'pawn', color: 'white' };
      const promotion = 'queen';
      const result = game.validateSpecialMoves(from, to, piece, promotion);
      expect(result.isValid).toBe(true);
    });

    test('should accept pawn promotion without explicit promotion (defaults to queen)', () => {
      const from = { row: 1, col: 0 };
      const to = { row: 0, col: 0 };
      const piece = { type: 'pawn', color: 'white' };
      const result = game.validateSpecialMoves(from, to, piece);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCheckConstraints', () => {
    test('should reject move that puts own king in check', () => {
      // Set up a position where moving would put king in check
      // This is a complex scenario that requires specific board setup
      // For now, we'll test the method structure
      const from = { row: 6, col: 4 };
      const to = { row: 5, col: 4 };
      const piece = { type: 'pawn', color: 'white' };
      
      // Mock wouldBeInCheck to return true for testing
      const originalWouldBeInCheck = game.wouldBeInCheck;
      game.wouldBeInCheck = jest.fn().mockReturnValue(true);
      
      const result = game.validateCheckConstraints(from, to, piece);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('KING_IN_CHECK');
      expect(result.message).toBe('Move would put king in check');
      
      // Restore original method
      game.wouldBeInCheck = originalWouldBeInCheck;
    });

    test('should accept move that does not put king in check', () => {
      const from = { row: 6, col: 4 };
      const to = { row: 5, col: 4 };
      const piece = { type: 'pawn', color: 'white' };
      const result = game.validateCheckConstraints(from, to, piece);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateMove - Integration Tests', () => {
    test('should validate complete valid move', () => {
      // Reset game to ensure clean state
      game = new ChessGame();
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.validateMove(move);
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Valid move');
      expect(result.errorCode).toBe(null);
      expect(result.errors).toEqual([]);
      expect(result.details.formatValid).toBe(true);
      expect(result.details.coordinatesValid).toBe(true);
      expect(result.details.gameStateValid).toBe(true);
      expect(result.details.pieceValid).toBe(true);
      expect(result.details.turnValid).toBe(true);
      expect(result.details.movementValid).toBe(true);
      expect(result.details.captureValid).toBe(true);
      expect(result.details.specialRulesValid).toBe(true);
      expect(result.details.checkValid).toBe(true);
    });

    test('should fail validation at first error encountered', () => {
      const move = null;
      const result = game.validateMove(move);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('MALFORMED_MOVE');
      expect(result.details.formatValid).toBe(false);
    });

    test('should provide detailed error information', () => {
      const move = { from: { row: -1, col: 0 }, to: { row: 0, col: 0 } };
      const result = game.validateMove(move);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_COORDINATES');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.details).toBeDefined();
    });
  });

  describe('makeMove - Enhanced Error Handling', () => {
    test('should return detailed error response for invalid move', () => {
      const move = { from: { row: -1, col: 0 }, to: { row: 0, col: 0 } };
      const result = game.makeMove(move);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.details).toBeDefined();
    });

    test('should execute valid move successfully', () => {
      // Reset game to ensure clean state
      game = new ChessGame();
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      expect(result.success).toBe(true);
      expect(game.currentTurn).toBe('black');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null coordinates gracefully', () => {
      const move = { from: null, to: { row: 0, col: 0 } };
      const result = game.validateMoveFormat(move);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });

    test('should handle undefined coordinates gracefully', () => {
      const move = { from: { row: 6, col: 4 }, to: undefined };
      const result = game.validateMoveFormat(move);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });

    test('should handle fractional coordinates', () => {
      const move = { from: { row: 6.5, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.validateCoordinates(move.from, move.to);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_COORDINATES');
    });

    test('should handle negative coordinates', () => {
      const move = { from: { row: -1, col: -1 }, to: { row: 0, col: 0 } };
      const result = game.validateCoordinates(move.from, move.to);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(1); // Only source coordinates error
    });

    test('should handle coordinates beyond board bounds', () => {
      const move = { from: { row: 8, col: 8 }, to: { row: 9, col: 9 } };
      const result = game.validateCoordinates(move.from, move.to);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(2); // Both source and destination errors
    });
  });

  describe('Comprehensive Pawn Movement Validation', () => {
    beforeEach(() => {
      game = new ChessGame();
    });

    describe('Basic Pawn Forward Moves', () => {
      test('should allow white pawn single square forward move', () => {
        const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(game.board[5][4]).toEqual({ type: 'pawn', color: 'white' });
        expect(game.board[6][4]).toBe(null);
      });

      test('should allow black pawn single square forward move', () => {
        // Make a white move first
        game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
        
        const move = { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(game.board[2][4]).toEqual({ type: 'pawn', color: 'black' });
        expect(game.board[1][4]).toBe(null);
      });

      test('should reject pawn forward move to occupied square', () => {
        game = new ChessGame(); // Reset game
        // Place a piece in front of the pawn
        game.board[5][4] = { type: 'pawn', color: 'black' };
        
        const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });
    });

    describe('Initial Two-Square Pawn Moves', () => {
      test('should allow white pawn initial two-square move', () => {
        game = new ChessGame(); // Reset game
        const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(game.board[4][4]).toEqual({ type: 'pawn', color: 'white' });
        expect(game.board[6][4]).toBe(null);
      });

      test('should allow black pawn initial two-square move', () => {
        game = new ChessGame(); // Reset game
        // Make a white move first
        game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
        
        const move = { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(game.board[3][4]).toEqual({ type: 'pawn', color: 'black' });
        expect(game.board[1][4]).toBe(null);
      });

      test('should reject two-square move when first square is blocked', () => {
        game = new ChessGame(); // Reset game
        // Place a piece one square in front of the pawn
        game.board[5][4] = { type: 'pawn', color: 'black' };
        
        const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });

      test('should reject two-square move when second square is blocked', () => {
        game = new ChessGame(); // Reset game
        // Place a piece two squares in front of the pawn
        game.board[4][4] = { type: 'pawn', color: 'black' };
        
        const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });

      test('should reject two-square move from non-starting position', () => {
        game = new ChessGame(); // Reset game
        // Move pawn first
        game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
        game.makeMove({ from: { row: 1, col: 0 }, to: { row: 2, col: 0 } }); // Black move
        
        // Try to move two squares from non-starting position
        const move = { from: { row: 5, col: 4 }, to: { row: 3, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });

      test('should set en passant target after two-square pawn move', () => {
        game = new ChessGame(); // Reset game
        const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
        game.makeMove(move);
        
        expect(game.enPassantTarget).toEqual({ row: 5, col: 4 });
      });
    });

    describe('Pawn Diagonal Captures', () => {
      test('should allow white pawn diagonal capture', () => {
        game = new ChessGame(); // Reset game
        // Place black piece diagonally
        game.board[5][5] = { type: 'pawn', color: 'black' };
        
        const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 5 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(game.board[5][5]).toEqual({ type: 'pawn', color: 'white' });
        expect(game.board[6][4]).toBe(null);
      });

      test('should allow black pawn diagonal capture', () => {
        game = new ChessGame(); // Reset game
        // Make a white move first
        game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
        
        // Place white piece diagonally from black pawn
        game.board[2][5] = { type: 'pawn', color: 'white' };
        
        const move = { from: { row: 1, col: 4 }, to: { row: 2, col: 5 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(game.board[2][5]).toEqual({ type: 'pawn', color: 'black' });
        expect(game.board[1][4]).toBe(null);
      });

      test('should reject diagonal move to empty square', () => {
        game = new ChessGame(); // Reset game
        const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 5 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });

      test('should reject capturing own piece', () => {
        game = new ChessGame(); // Reset game
        // Place white piece diagonally from white pawn
        game.board[5][5] = { type: 'pawn', color: 'white' };
        
        const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 5 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });
    });

    describe('En Passant Captures', () => {
      test('should allow en passant capture by white pawn', () => {
        game = new ChessGame(); // Reset game
        // Set up en passant scenario
        // 1. Move white pawn to 5th rank
        game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
        game.makeMove({ from: { row: 1, col: 0 }, to: { row: 2, col: 0 } }); // Black move
        game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
        
        // 2. Black pawn moves two squares next to white pawn
        const blackPawnMove = { from: { row: 1, col: 5 }, to: { row: 3, col: 5 } };
        game.makeMove(blackPawnMove);
        
        // 3. White pawn captures en passant
        const enPassantMove = { from: { row: 3, col: 4 }, to: { row: 2, col: 5 } };
        const result = game.makeMove(enPassantMove);
        
        expect(result.success).toBe(true);
        expect(game.board[2][5]).toEqual({ type: 'pawn', color: 'white' });
        expect(game.board[3][5]).toBe(null); // Captured pawn removed
        expect(game.board[3][4]).toBe(null); // Original pawn moved
      });

      test('should allow en passant capture by black pawn', () => {
        game = new ChessGame(); // Reset game
        // Set up en passant scenario for black
        // 1. Move black pawn to 4th rank
        game.makeMove({ from: { row: 6, col: 0 }, to: { row: 5, col: 0 } }); // White move
        game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
        game.makeMove({ from: { row: 5, col: 0 }, to: { row: 4, col: 0 } }); // White move
        game.makeMove({ from: { row: 3, col: 4 }, to: { row: 4, col: 4 } });
        
        // 2. White pawn moves two squares next to black pawn
        const whitePawnMove = { from: { row: 6, col: 5 }, to: { row: 4, col: 5 } };
        game.makeMove(whitePawnMove);
        
        // 3. Black pawn captures en passant
        const enPassantMove = { from: { row: 4, col: 4 }, to: { row: 5, col: 5 } };
        const result = game.makeMove(enPassantMove);
        
        expect(result.success).toBe(true);
        expect(game.board[5][5]).toEqual({ type: 'pawn', color: 'black' });
        expect(game.board[4][5]).toBe(null); // Captured pawn removed
        expect(game.board[4][4]).toBe(null); // Original pawn moved
      });

      test('should reject en passant when no en passant target exists', () => {
        game = new ChessGame(); // Reset game
        // Move white pawn to position where en passant would be possible
        game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
        game.makeMove({ from: { row: 1, col: 0 }, to: { row: 2, col: 0 } }); // Black move
        game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
        game.makeMove({ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }); // Black move (clears en passant)
        
        // Try en passant when no target exists
        const move = { from: { row: 3, col: 4 }, to: { row: 2, col: 5 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });

      test('should clear en passant target after other moves', () => {
        game = new ChessGame(); // Reset game
        // Set up en passant target
        game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
        expect(game.enPassantTarget).toEqual({ row: 5, col: 4 });
        
        // Make another move
        game.makeMove({ from: { row: 1, col: 0 }, to: { row: 2, col: 0 } });
        expect(game.enPassantTarget).toBe(null);
      });
    });

    describe('Pawn Promotion', () => {
      test('should promote white pawn to queen by default', () => {
        game = new ChessGame(); // Reset game
        // Set up pawn near promotion
        game.board[1][0] = { type: 'pawn', color: 'white' };
        game.board[6][0] = null; // Remove original pawn
        game.board[0][0] = null; // Clear the destination square
        
        const move = { from: { row: 1, col: 0 }, to: { row: 0, col: 0 } };
        const result = game.makeMove(move);
        
        expect(result.success).toBe(true);
        expect(game.board[0][0]).toEqual({ type: 'queen', color: 'white' });
      });

      test('should promote black pawn to queen by default', () => {
        game = new ChessGame(); // Reset game
        // Make a white move first
        game.makeMove({ from: { row: 6, col: 0 }, to: { row: 5, col: 0 } });
        
        // Set up black pawn near promotion
        game.board[6][0] = { type: 'pawn', color: 'black' };
        game.board[1][0] = null; // Remove original pawn
        game.board[7][0] = null; // Clear the destination square
        
        const move = { from: { row: 6, col: 0 }, to: { row: 7, col: 0 } };
        const result = game.makeMove(move);
        
        expect(result.success).toBe(true);
        expect(game.board[7][0]).toEqual({ type: 'queen', color: 'black' });
      });

      test('should promote pawn to specified piece - rook', () => {
        game = new ChessGame(); // Reset game
        game.board[1][0] = { type: 'pawn', color: 'white' };
        game.board[6][0] = null;
        game.board[0][0] = null; // Clear the destination square
        
        const move = { from: { row: 1, col: 0 }, to: { row: 0, col: 0 }, promotion: 'rook' };
        const result = game.makeMove(move);
        
        expect(result.success).toBe(true);
        expect(game.board[0][0]).toEqual({ type: 'rook', color: 'white' });
      });

      test('should promote pawn to specified piece - bishop', () => {
        game = new ChessGame(); // Reset game
        game.board[1][0] = { type: 'pawn', color: 'white' };
        game.board[6][0] = null;
        game.board[0][0] = null; // Clear the destination square
        
        const move = { from: { row: 1, col: 0 }, to: { row: 0, col: 0 }, promotion: 'bishop' };
        const result = game.makeMove(move);
        
        expect(result.success).toBe(true);
        expect(game.board[0][0]).toEqual({ type: 'bishop', color: 'white' });
      });

      test('should promote pawn to specified piece - knight', () => {
        game = new ChessGame(); // Reset game
        game.board[1][0] = { type: 'pawn', color: 'white' };
        game.board[6][0] = null;
        game.board[0][0] = null; // Clear the destination square
        
        const move = { from: { row: 1, col: 0 }, to: { row: 0, col: 0 }, promotion: 'knight' };
        const result = game.makeMove(move);
        
        expect(result.success).toBe(true);
        expect(game.board[0][0]).toEqual({ type: 'knight', color: 'white' });
      });

      test('should promote pawn to specified piece - queen', () => {
        game = new ChessGame(); // Reset game
        game.board[1][0] = { type: 'pawn', color: 'white' };
        game.board[6][0] = null;
        game.board[0][0] = null; // Clear the destination square
        
        const move = { from: { row: 1, col: 0 }, to: { row: 0, col: 0 }, promotion: 'queen' };
        const result = game.makeMove(move);
        
        expect(result.success).toBe(true);
        expect(game.board[0][0]).toEqual({ type: 'queen', color: 'white' });
      });

      test('should reject invalid promotion piece', () => {
        game = new ChessGame(); // Reset game
        game.board[1][0] = { type: 'pawn', color: 'white' };
        game.board[6][0] = null;
        game.board[0][0] = null; // Clear the destination square
        
        const move = { from: { row: 1, col: 0 }, to: { row: 0, col: 0 }, promotion: 'king' };
        const result = game.makeMove(move);
        
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_FORMAT');
        expect(result.errors).toContain('Promotion must be one of: queen, rook, bishop, knight');
      });

      test('should promote pawn with capture', () => {
        game = new ChessGame(); // Reset game
        // Set up promotion with capture
        game.board[1][0] = { type: 'pawn', color: 'white' };
        game.board[6][0] = null;
        game.board[0][1] = { type: 'rook', color: 'black' }; // Piece to capture
        
        const move = { from: { row: 1, col: 0 }, to: { row: 0, col: 1 }, promotion: 'queen' };
        const result = game.makeMove(move);
        
        expect(result.success).toBe(true);
        expect(game.board[0][1]).toEqual({ type: 'queen', color: 'white' });
        expect(game.board[1][0]).toBe(null);
      });
    });

    describe('Invalid Pawn Moves', () => {
      test('should reject backward move', () => {
        game = new ChessGame(); // Reset game
        // Move pawn forward first
        game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
        game.makeMove({ from: { row: 1, col: 0 }, to: { row: 2, col: 0 } }); // Black move
        
        // Try to move backward
        const move = { from: { row: 5, col: 4 }, to: { row: 6, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });

      test('should reject sideways move', () => {
        game = new ChessGame(); // Reset game
        const move = { from: { row: 6, col: 4 }, to: { row: 6, col: 5 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });

      test('should reject three-square forward move', () => {
        game = new ChessGame(); // Reset game
        const move = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });

      test('should reject two-square diagonal move', () => {
        game = new ChessGame(); // Reset game
        const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 6 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });

      test('should reject knight-like move', () => {
        game = new ChessGame(); // Reset game
        const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 5 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });
    });

    describe('Blocked Path Scenarios', () => {
      test('should reject forward move when path is blocked', () => {
        game = new ChessGame(); // Reset game
        // Place piece directly in front
        game.board[5][4] = { type: 'pawn', color: 'black' };
        
        const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });

      test('should reject two-square move when intermediate square is blocked', () => {
        game = new ChessGame(); // Reset game
        // Place piece one square in front
        game.board[5][4] = { type: 'pawn', color: 'black' };
        
        const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });

      test('should reject two-square move when destination is blocked', () => {
        game = new ChessGame(); // Reset game
        // Place piece two squares in front
        game.board[4][4] = { type: 'pawn', color: 'black' };
        
        const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });
    });
  });
});