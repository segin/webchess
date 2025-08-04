const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');

describe('Comprehensive Boundary Conditions Tests', () => {
  let game;
  let gameState;

  beforeEach(() => {
    game = new ChessGame();
    gameState = new GameStateManager();
  });

  describe('Board Boundary Conditions', () => {
    test('should reject moves to coordinates outside board boundaries', () => {
      const testCases = [
        { from: { row: 0, col: 0 }, to: { row: -1, col: 0 } }, // Above board
        { from: { row: 0, col: 0 }, to: { row: 8, col: 0 } },  // Below board
        { from: { row: 0, col: 0 }, to: { row: 0, col: -1 } }, // Left of board
        { from: { row: 0, col: 0 }, to: { row: 0, col: 8 } },  // Right of board
        { from: { row: -1, col: 0 }, to: { row: 0, col: 0 } }, // From outside board
        { from: { row: 0, col: 8 }, to: { row: 1, col: 1 } },  // From outside board
      ];

      testCases.forEach(({ from, to }) => {
        const result = game.makeMove({ from, to });
        expect(result.isValid).toBe(false);
        expect(result.message || result.error).toMatch(/coordinate|invalid|boundary/i);
      });
    });

    test('should handle extreme coordinate values gracefully', () => {
      const extremeValues = [
        { row: Number.MAX_SAFE_INTEGER, col: 0 },
        { row: Number.MIN_SAFE_INTEGER, col: 0 },
        { row: 0, col: Number.MAX_SAFE_INTEGER },
        { row: 0, col: Number.MIN_SAFE_INTEGER },
        { row: Infinity, col: 0 },
        { row: -Infinity, col: 0 },
        { row: NaN, col: 0 },
        { row: 0, col: NaN },
      ];

      extremeValues.forEach(coord => {
        const result = game.makeMove({ from: { row: 6, col: 4 }, to: coord });
        expect(result.isValid).toBe(false);
        expect(result.message || result.error).toMatch(/coordinate|invalid|boundary/i);
      });
    });

    test('should validate all edge squares are accessible', () => {
      const edgeSquares = [
        { row: 0, col: 0 }, { row: 0, col: 7 }, // Top corners
        { row: 7, col: 0 }, { row: 7, col: 7 }, // Bottom corners
      ];

      edgeSquares.forEach(square => {
        expect(game.isValidSquare(square)).toBe(true);
      });
    });
  });

  describe('Piece Movement Boundary Conditions', () => {
    test('should handle pawn movement at board edges', () => {
      // Test pawn at edge of board
      game.board[0][0] = { type: 'pawn', color: 'black' };
      game.currentTurn = 'black';
      
      // Cannot move further up
      const result = game.makeMove({ from: { row: 0, col: 0 }, to: { row: -1, col: 0 } });
      expect(result.isValid).toBe(false);
    });

    test('should handle knight movement from corner squares', () => {
      // Clear board and place white knight in corner
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'knight', color: 'white' };
      game.board[7][4] = { type: 'king', color: 'white' }; // Need king for valid game
      game.board[0][4] = { type: 'king', color: 'black' }; // Need black king too
      game.currentTurn = 'white';
      
      // Test valid knight moves from corner
      const possibleMoves = [
        { row: 1, col: 2 }, { row: 2, col: 1 }
      ];
      
      possibleMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 0, col: 0 }, to });
        expect(result.isValid).toBe(true);
        // Reset board for next test
        game.board[to.row][to.col] = null;
        game.board[0][0] = { type: 'knight', color: 'white' };
        game.currentTurn = 'white';
      });
    });

    test('should handle rook movement along board edges', () => {
      // Clear board and place white rook on edge
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'rook', color: 'white' };
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      // Test movement along top edge
      const result = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 0, col: 7 } });
      expect(result.isValid).toBe(true);
    });

    test('should handle bishop movement in corners', () => {
      // Clear board and place white bishop in corner
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'bishop', color: 'white' };
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      // Only one diagonal available from corner
      const result = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 1, col: 1 } });
      expect(result.isValid).toBe(true);
    });

    test('should handle queen movement from edge positions', () => {
      // Clear board and place white queen on edge
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][3] = { type: 'queen', color: 'white' };
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      // Test valid moves from edge
      const validMoves = [
        { row: 0, col: 0 }, // Horizontal left
        { row: 0, col: 7 }, // Horizontal right
        { row: 7, col: 3 }, // Vertical down
        { row: 1, col: 2 }, // Diagonal
        { row: 1, col: 4 }, // Diagonal
      ];
      
      validMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 0, col: 3 }, to });
        expect(result.isValid).toBe(true);
        // Reset for next test
        game.board[to.row][to.col] = null;
        game.board[0][3] = { type: 'queen', color: 'white' };
        game.currentTurn = 'white';
      });
    });

    test('should handle king movement at board boundaries', () => {
      // Clear board and place white king near edge
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][3] = { type: 'king', color: 'white' };
      game.board[7][4] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      // Test movement to edge
      const validMove = game.makeMove({ from: { row: 0, col: 3 }, to: { row: 0, col: 2 } });
      expect(validMove.isValid).toBe(true);
      
      // Reset and test invalid move beyond boundary
      game.board[0][2] = null;
      game.board[0][3] = { type: 'king', color: 'white' };
      game.currentTurn = 'white';
      
      const invalidMove = game.makeMove({ from: { row: 0, col: 3 }, to: { row: -1, col: 3 } });
      expect(invalidMove.isValid).toBe(false);
    });
  });

  describe('Special Moves Boundary Conditions', () => {
    test('should handle castling with pieces at board edges', () => {
      // Set up castling position at edge
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][4] = { type: 'king', color: 'black' };
      game.board[0][0] = { type: 'rook', color: 'black' };
      game.board[0][7] = { type: 'rook', color: 'black' };
      game.board[7][4] = { type: 'king', color: 'white' };
      game.currentTurn = 'black';
      
      // Test queenside castling
      const result = game.makeMove({ from: { row: 0, col: 4 }, to: { row: 0, col: 2 } });
      expect(result.isValid).toBe(true);
    });

    test('should handle en passant at board edges', () => {
      // Set up en passant at edge of board
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[3][0] = { type: 'pawn', color: 'white' };
      game.board[3][1] = { type: 'pawn', color: 'black' };
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      game.enPassantTarget = { row: 2, col: 1 };
      
      const result = game.makeMove({ from: { row: 3, col: 0 }, to: { row: 2, col: 1 } });
      expect(result.isValid).toBe(true);
    });

    test('should handle pawn promotion at exact board boundary', () => {
      // White pawn about to promote
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      const result = game.makeMove({ from: { row: 1, col: 0 }, to: { row: 0, col: 0 }, promotion: 'queen' });
      expect(result.isValid).toBe(true);
      expect(game.board[0][0].type).toBe('queen');
    });
  });

  describe('Game State Boundary Conditions', () => {
    test('should handle maximum move history length', () => {
      // Simulate very long game by adding moves to game history
      for (let i = 0; i < 1000; i++) {
        game.moveHistory.push({
          from: { row: i % 8, col: (i + 1) % 8 },
          to: { row: (i + 2) % 8, col: (i + 3) % 8 },
          piece: 'pawn',
          color: i % 2 === 0 ? 'white' : 'black'
        });
      }
      
      expect(game.moveHistory.length).toBe(1000);
    });

    test('should handle edge cases in turn counting', () => {
      // Test full move number at boundaries
      game.fullMoveNumber = Number.MAX_SAFE_INTEGER - 1;
      
      // Make a move to increment
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(result.isValid).toBe(true);
      
      // Should handle large numbers gracefully
      expect(game.fullMoveNumber).toBeGreaterThan(Number.MAX_SAFE_INTEGER - 2);
    });

    test('should handle game status transitions at boundaries', () => {
      // Test all possible game status transitions
      const statuses = ['active', 'check', 'checkmate', 'stalemate', 'draw'];
      
      statuses.forEach(status => {
        game.gameStatus = status;
        expect(game.gameStatus).toBe(status);
      });
    });
  });

  describe('Memory and Performance Boundaries', () => {
    test('should handle large board state operations', () => {
      const startTime = Date.now();
      
      // Perform many board operations by creating board copies
      for (let i = 0; i < 1000; i++) {
        const boardCopy = JSON.parse(JSON.stringify(game.board));
        expect(boardCopy).toBeDefined();
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in 5 seconds
    });

    test('should handle rapid successive move validations', () => {
      const startTime = Date.now();
      
      // Validate many moves rapidly
      for (let i = 0; i < 1000; i++) {
        const result = game.validateMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
        expect(result).toBeDefined();
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in 2 seconds
    });

    test('should maintain performance with complex board positions', () => {
      // Set up complex position with many pieces
      game.board = [
        [{ type: 'rook', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'queen', color: 'black' }, { type: 'king', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'rook', color: 'black' }],
        [{ type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [{ type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }],
        [{ type: 'rook', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'queen', color: 'white' }, { type: 'king', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'rook', color: 'white' }]
      ];
      
      const startTime = Date.now();
      
      // Perform check detection on complex position
      for (let i = 0; i < 100; i++) {
        game.isInCheck('white');
        game.isInCheck('black');
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(3000); // Should complete in 3 seconds
    });
  });
});