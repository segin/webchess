/**
 * Piece Movement Patterns Tests - Normalized API
 * Tests for all piece movement patterns using current API structure
 */

const ChessGame = require('../src/shared/chessGame');

describe('Piece Movement Patterns - Normalized API', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  // Helper to create custom test positions
  const createTestPosition = (pieces) => {
    const testGame = new ChessGame();
    
    // Clear board
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        testGame.board[row][col] = null;
      }
    }
    
    // Place pieces
    pieces.forEach(({ row, col, type, color }) => {
      testGame.board[row][col] = { type, color };
    });
    
    // Ensure kings exist
    const hasWhiteKing = pieces.some(p => p.type === 'king' && p.color === 'white');
    const hasBlackKing = pieces.some(p => p.type === 'king' && p.color === 'black');
    
    if (!hasWhiteKing) {
      testGame.board[7][4] = { type: 'king', color: 'white' };
    }
    if (!hasBlackKing) {
      testGame.board[0][4] = { type: 'king', color: 'black' };
    }
    
    testGame.gameStatus = 'active';
    return testGame;
  };

  describe('Pawn Movement Patterns', () => {
    test('should allow single forward move using current API', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.gameStatus).toBe('active');
      expect(result.data.currentTurn).toBe('black');
      expect(game.board[5][4]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[6][4]).toBe(null);
    });

    test('should allow initial two-square move using current API', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(game.board[4][4]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.enPassantTarget).toEqual({ row: 5, col: 4 });
    });

    test('should reject diagonal moves to empty squares using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'pawn', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 3, col: 3 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    test('should allow diagonal capture using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'pawn', color: 'white' },
        { row: 3, col: 3, type: 'pawn', color: 'black' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 3, col: 3 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(testGame.board[3][3]).toEqual({ type: 'pawn', color: 'white' });
    });
  });

  describe('Knight Movement Patterns', () => {
    test('should allow L-shaped moves using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'knight', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 2, col: 3 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(testGame.board[2][3]).toEqual({ type: 'knight', color: 'white' });
    });

    test('should reject non-L-shaped moves using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'knight', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 4, col: 5 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    test('should allow jumping over pieces using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'knight', color: 'white' },
        { row: 3, col: 4, type: 'pawn', color: 'black' },
        { row: 4, col: 3, type: 'pawn', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 2, col: 3 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Rook Movement Patterns', () => {
    test('should allow horizontal movement using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'rook', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 4, col: 7 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(testGame.board[4][7]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should allow vertical movement using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'rook', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 0, col: 4 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(testGame.board[0][4]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should reject diagonal moves using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'rook', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 3, col: 3 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    test('should reject moves when path blocked using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 0, type: 'rook', color: 'white' },
        { row: 4, col: 3, type: 'pawn', color: 'black' }
      ]);
      
      const move = { from: { row: 4, col: 0 }, to: { row: 4, col: 7 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('Bishop Movement Patterns', () => {
    test('should allow diagonal movement using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'bishop', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 0, col: 0 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(testGame.board[0][0]).toEqual({ type: 'bishop', color: 'white' });
    });

    test('should reject horizontal/vertical moves using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'bishop', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 4, col: 7 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    test('should reject moves when path blocked using current API', () => {
      const testGame = createTestPosition([
        { row: 0, col: 0, type: 'bishop', color: 'white' },
        { row: 3, col: 3, type: 'pawn', color: 'black' }
      ]);
      
      const move = { from: { row: 0, col: 0 }, to: { row: 7, col: 7 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('Queen Movement Patterns', () => {
    test('should allow horizontal movement using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'queen', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 4, col: 0 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(testGame.board[4][0]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should allow vertical movement using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'queen', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 0, col: 4 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(testGame.board[0][4]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should allow diagonal movement using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'queen', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 7, col: 7 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(testGame.board[7][7]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should reject L-shaped moves using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'queen', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 2, col: 3 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('King Movement Patterns', () => {
    test('should allow single-square movement using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'king', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 3, col: 3 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(testGame.board[3][3]).toEqual({ type: 'king', color: 'white' });
    });

    test('should reject multi-square moves using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'king', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: 2, col: 4 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('Pattern Consistency Tests', () => {
    test('should maintain consistent response structure using current API', () => {
      const pieces = [
        { piece: 'pawn', from: { row: 6, col: 0 }, to: { row: 5, col: 0 } },
        { piece: 'knight', from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }
      ];
      
      pieces.forEach(({ from, to }) => {
        const testGame = new ChessGame();
        const move = { from, to };
        const result = testGame.makeMove(move);
        
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('message');
        
        if (result.success) {
          expect(result).toHaveProperty('data');
          expect(result.data).toHaveProperty('gameStatus');
          expect(result.data).toHaveProperty('currentTurn');
        }
      });
    });

    test('should validate movement rules consistently using current API', () => {
      const testCases = [
        {
          piece: { row: 4, col: 4, type: 'pawn', color: 'white' },
          validMove: { row: 3, col: 4 },
          invalidMove: { row: 2, col: 4 }
        },
        {
          piece: { row: 4, col: 4, type: 'knight', color: 'white' },
          validMove: { row: 2, col: 3 },
          invalidMove: { row: 3, col: 3 }
        }
      ];
      
      testCases.forEach(({ piece, validMove, invalidMove }) => {
        // Test valid move
        let testGame = createTestPosition([piece]);
        let move = { from: { row: piece.row, col: piece.col }, to: validMove };
        let result = testGame.makeMove(move);
        expect(result.success).toBe(true);
        
        // Test invalid move
        testGame = createTestPosition([piece]);
        move = { from: { row: piece.row, col: piece.col }, to: invalidMove };
        result = testGame.makeMove(move);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should reject moves outside board boundaries using current API', () => {
      const testGame = createTestPosition([
        { row: 4, col: 4, type: 'queen', color: 'white' }
      ]);
      
      const move = { from: { row: 4, col: 4 }, to: { row: -1, col: 0 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    test('should handle maximum distance moves using current API', () => {
      const testGame = createTestPosition([
        { row: 0, col: 0, type: 'rook', color: 'white' }
      ]);
      
      const move = { from: { row: 0, col: 0 }, to: { row: 7, col: 0 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(testGame.board[7][0]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should handle corner positions correctly using current API', () => {
      const testGame = createTestPosition([
        { row: 0, col: 0, type: 'king', color: 'white' }
      ]);
      
      const move = { from: { row: 0, col: 0 }, to: { row: 1, col: 1 } };
      const result = testGame.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(testGame.board[1][1]).toEqual({ type: 'king', color: 'white' });
    });

    test('should reject moves from empty squares using current API', () => {
      const move = { from: { row: 4, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });
});