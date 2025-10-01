const ChessGame = require('../src/shared/chessGame');

describe('Edge Cases and Boundary Conditions - Comprehensive Testing', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Board Boundary Edge Cases', () => {
    test('should handle moves at board edges correctly', () => {
      // Test simple edge moves with individual setups
      const testCases = [
        { from: { row: 0, col: 0 }, to: { row: 1, col: 0 } },
        { from: { row: 0, col: 0 }, to: { row: 0, col: 1 } },
        { from: { row: 7, col: 0 }, to: { row: 6, col: 0 } },
        { from: { row: 7, col: 7 }, to: { row: 6, col: 7 } }
      ];

      testCases.forEach(({ from, to }) => {
        // Create fresh game state for each test
        const testGame = new ChessGame();
        testGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Place kings to keep game valid
        testGame.board[7][4] = { type: 'king', color: 'white' };
        testGame.board[0][4] = { type: 'king', color: 'black' };
        
        // Skip if position conflicts with king
        if ((from.row === 7 && from.col === 4) || (from.row === 0 && from.col === 4) ||
            (to.row === 7 && to.col === 4) || (to.row === 0 && to.col === 4)) {
          return;
        }
        
        // Place test piece
        testGame.board[from.row][from.col] = { type: 'queen', color: 'white' };
        testGame.currentTurn = 'white';
        
        const result = testGame.makeMove({ from, to });
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
      });
    });

    test('should reject moves outside board boundaries', () => {
      // Place a queen in center
      game.board[4][4] = { type: 'queen', color: 'white' };
      
      const invalidMoves = [
        { row: -1, col: 4 }, { row: 8, col: 4 },
        { row: 4, col: -1 }, { row: 4, col: 8 },
        { row: -1, col: -1 }, { row: 8, col: 8 }
      ];

      invalidMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_COORDINATES');
        expect(result.message).toBeDefined();
      });
    });

    test('should handle edge piece movements correctly', () => {
      // Clear board and set up minimal pieces
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'rook', color: 'white' };
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[1][4] = { type: 'king', color: 'black' }; // Keep black king out of the path
      game.currentTurn = 'white';
      
      // Move along top edge
      const result1 = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 0, col: 7 } });
      expect(result1.success).toBe(true);
      expect(result1.message).toBeDefined();
      
      // Reset and test along left edge
      game.board[0][7] = null;
      game.board[0][0] = { type: 'rook', color: 'white' };
      game.currentTurn = 'white';
      
      const result2 = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 7, col: 0 } });
      expect(result2.success).toBe(true);
      expect(result2.message).toBeDefined();
    });
  });

  describe('Maximum Distance Moves', () => {
    test('should handle maximum distance sliding piece moves', () => {
      // Clear board for maximum distance tests
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[1][4] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      // Test queen maximum diagonal
      game.board[0][0] = { type: 'queen', color: 'white' };
      const result1 = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 7, col: 7 } });
      expect(result1.success).toBe(true);
      expect(result1.message).toBeDefined();
      
      // Reset and test rook maximum horizontal
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[1][4] = { type: 'king', color: 'black' };
      game.board[4][0] = { type: 'rook', color: 'white' };
      game.currentTurn = 'white';
      const result2 = game.makeMove({ from: { row: 4, col: 0 }, to: { row: 4, col: 7 } });
      expect(result2.success).toBe(true);
      expect(result2.message).toBeDefined();
      
      // Reset and test bishop maximum diagonal
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.board[1][1] = { type: 'bishop', color: 'white' };
      game.currentTurn = 'white';
      const result3 = game.makeMove({ from: { row: 1, col: 1 }, to: { row: 6, col: 6 } });
      expect(result3.success).toBe(true);
      expect(result3.message).toBeDefined();
    });

    test('should handle minimum distance moves', () => {
      // Test single square moves for all pieces
      const testCases = [
        { type: 'queen', from: { row: 4, col: 4 }, to: { row: 4, col: 5 } },
        { type: 'queen', from: { row: 4, col: 4 }, to: { row: 5, col: 5 } },
        { type: 'rook', from: { row: 4, col: 4 }, to: { row: 4, col: 5 } },
        { type: 'rook', from: { row: 4, col: 4 }, to: { row: 5, col: 4 } },
        { type: 'bishop', from: { row: 4, col: 4 }, to: { row: 5, col: 5 } },
        { type: 'king', from: { row: 4, col: 4 }, to: { row: 4, col: 5 } },
        { type: 'king', from: { row: 4, col: 4 }, to: { row: 5, col: 4 } }
      ];

      testCases.forEach(({ type, from, to }) => {
        // Create fresh game state for each test
        const testGame = new ChessGame();
        testGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
        testGame.board[7][4] = { type: 'king', color: 'white' };
        testGame.board[0][4] = { type: 'king', color: 'black' };
        testGame.board[from.row][from.col] = { type, color: 'white' };
        testGame.currentTurn = 'white';
        
        const result = testGame.makeMove({ from, to });
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
      });
    });
  });

  describe('Complex Path Obstruction Scenarios', () => {
    test('should handle multiple obstructions in path', () => {
      // Clear board and set up complex obstruction scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Place queen at one end
      game.board[0][0] = { type: 'queen', color: 'white' };
      
      // Place multiple obstructions in diagonal path
      game.board[2][2] = { type: 'pawn', color: 'black' };
      game.board[4][4] = { type: 'pawn', color: 'white' };
      
      // Should not be able to move past first obstruction
      const result1 = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 3, col: 3 } });
      expect(result1.success).toBe(false);
      expect(result1.errorCode).toBe('PATH_BLOCKED');
      expect(result1.message).toBeDefined();
      
      // Should be able to capture first obstruction
      const result2 = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 2, col: 2 } });
      expect(result2.success).toBe(true);
      expect(result2.message).toBeDefined();
    });

    test('should handle path obstruction at destination', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Place rook and target
      game.board[0][0] = { type: 'rook', color: 'white' };
      game.board[0][7] = { type: 'pawn', color: 'black' };
      
      // Should be able to capture at destination
      const result = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 0, col: 7 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(game.board[0][7]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should handle knight jumping over obstructions', () => {
      // Test knight L-shaped moves over obstructions
      const knightMoves = [
        { row: 2, col: 3 }, { row: 2, col: 5 },
        { row: 6, col: 3 }, { row: 6, col: 5 }
      ];
      
      knightMoves.forEach(to => {
        // Create fresh game state for each test
        const testGame = new ChessGame();
        testGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Place kings
        testGame.board[7][4] = { type: 'king', color: 'white' };
        testGame.board[0][4] = { type: 'king', color: 'black' };
        
        // Place knight surrounded by pieces
        testGame.board[4][4] = { type: 'knight', color: 'white' };
        testGame.currentTurn = 'white';
        
        // Surround with pieces
        const surroundingSquares = [
          { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
          { row: 4, col: 3 }, { row: 4, col: 5 },
          { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 }
        ];
        
        surroundingSquares.forEach(pos => {
          testGame.board[pos.row][pos.col] = { type: 'pawn', color: 'black' };
        });
        
        const result = testGame.makeMove({ from: { row: 4, col: 4 }, to });
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
      });
    });
  });

  describe('Piece Interaction Edge Cases', () => {
    test('should handle captures at board edges', () => {
      // Clear board and set up proper game state
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Place kings
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[1][4] = { type: 'king', color: 'black' };
      
      // Place pieces at edges for capture scenarios
      game.board[0][0] = { type: 'rook', color: 'white' };
      game.board[0][7] = { type: 'rook', color: 'black' };
      game.currentTurn = 'white';
      
      const result = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 0, col: 7 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(game.board[0][7]).toEqual({ type: 'rook', color: 'white' });
      expect(game.board[0][0]).toBe(null);
    });

    test('should handle piece promotion at edges', () => {
      // Clear board and set up proper game state
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Place kings
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[2][4] = { type: 'king', color: 'black' };
      
      // Place white pawn ready for promotion
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.currentTurn = 'white';
      
      const result = game.makeMove({ 
        from: { row: 1, col: 0 }, 
        to: { row: 0, col: 0 },
        promotion: 'queen'
      });
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(game.board[0][0]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should handle complex multi-piece interactions', () => {
      // Create fresh game state
      const testGame = new ChessGame();
      testGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Place pieces in a formation where queen can make a valid capture
      testGame.board[4][4] = { type: 'king', color: 'white' };
      testGame.board[4][3] = { type: 'queen', color: 'white' };
      testGame.board[3][3] = { type: 'rook', color: 'black' }; // Queen can capture this
      testGame.board[0][4] = { type: 'king', color: 'black' };
      testGame.currentTurn = 'white';
      
      // Queen should be able to capture rook diagonally
      const result = testGame.makeMove({ from: { row: 4, col: 3 }, to: { row: 3, col: 3 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });
  });

  describe('Invalid Input Handling', () => {
    test('should handle null and undefined inputs gracefully', () => {
      const invalidInputs = [
        null,
        undefined,
        {},
        { from: null },
        { to: null },
        { from: { row: null, col: 0 } },
        { from: { row: 0 }, to: { row: 0, col: 0 } }
      ];

      invalidInputs.forEach(input => {
        const result = game.makeMove(input);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBeDefined();
        expect(result.message).toBeDefined();
      });
    });

    test('should handle malformed coordinate objects', () => {
      const malformedInputs = [
        { from: { x: 0, y: 0 }, to: { row: 1, col: 1 } },
        { from: { row: '0', col: '0' }, to: { row: 1, col: 1 } },
        { from: { row: 0.5, col: 0 }, to: { row: 1, col: 1 } },
        { from: { row: Infinity, col: 0 }, to: { row: 1, col: 1 } },
        { from: { row: NaN, col: 0 }, to: { row: 1, col: 1 } }
      ];

      malformedInputs.forEach(input => {
        const result = game.makeMove(input);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_COORDINATES');
        expect(result.message).toBeDefined();
      });
    });

    test('should handle extreme coordinate values', () => {
      const extremeInputs = [
        { from: { row: -999, col: 0 }, to: { row: 1, col: 1 } },
        { from: { row: 999, col: 0 }, to: { row: 1, col: 1 } },
        { from: { row: 0, col: -999 }, to: { row: 1, col: 1 } },
        { from: { row: 0, col: 999 }, to: { row: 1, col: 1 } }
      ];

      extremeInputs.forEach(input => {
        const result = game.makeMove(input);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_COORDINATES');
        expect(result.message).toBeDefined();
      });
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    test('should handle very long move sequences without memory issues', () => {
      const startMemory = process.memoryUsage().heapUsed;
      
      // Execute many moves
      for (let i = 0; i < 100; i++) {
        // Simple back and forth knight moves
        const move1 = game.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } });
        if (move1.success) {
          game.makeMove({ from: { row: 5, col: 2 }, to: { row: 7, col: 1 } });
        }
      }
      
      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      expect(game.moveHistory.length).toBeGreaterThan(0);
    });

    test('should handle rapid move validation without performance degradation', () => {
      const startTime = Date.now();
      
      // Test rapid move attempts (some valid, some invalid)
      for (let i = 0; i < 100; i++) {
        // Try a simple pawn move
        const result = game.makeMove({ 
          from: { row: 6, col: 4 }, 
          to: { row: 4, col: 4 } 
        });
        // Don't reset - just test the validation speed
        // Most moves after the first will fail, which is fine for performance testing
      }
      
      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('State Consistency Edge Cases', () => {
    test('should maintain board consistency after invalid moves', () => {
      const originalBoard = JSON.parse(JSON.stringify(game.board));
      const originalTurn = game.currentTurn;
      
      // Attempt several invalid moves
      const invalidMoves = [
        { from: { row: 0, col: 0 }, to: { row: 1, col: 1 } }, // No piece
        { from: { row: 6, col: 0 }, to: { row: 3, col: 3 } }, // Invalid pawn move
        { from: { row: 7, col: 0 }, to: { row: 5, col: 2 } }  // Invalid rook move
      ];
      
      invalidMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
      });
      
      // Board and turn should be unchanged
      expect(game.board).toEqual(originalBoard);
      expect(game.currentTurn).toBe(originalTurn);
    });

    test('should handle concurrent state access correctly', () => {
      // Simulate concurrent access patterns
      const state1 = {
        board: JSON.parse(JSON.stringify(game.board)),
        currentTurn: game.currentTurn,
        gameStatus: game.gameStatus,
        moveHistory: [...game.moveHistory]
      };
      const state2 = {
        board: JSON.parse(JSON.stringify(game.board)),
        currentTurn: game.currentTurn,
        gameStatus: game.gameStatus,
        moveHistory: [...game.moveHistory]
      };
      
      // States should be identical
      expect(state1).toEqual(state2);
      
      // Modify game state
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(result.success).toBe(true);
      
      const state3 = {
        board: JSON.parse(JSON.stringify(game.board)),
        currentTurn: game.currentTurn,
        gameStatus: game.gameStatus,
        moveHistory: [...game.moveHistory]
      };
      
      // New state should be different
      expect(state3).not.toEqual(state1);
      expect(state3.moveHistory.length).toBe(state1.moveHistory.length + 1);
    });
  });
});