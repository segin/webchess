const ChessGame = require('../src/shared/chessGame');
const testUtils = require('./utils/errorSuppression');

describe('Edge Cases and Boundary Conditions - Comprehensive Testing', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Board Boundary Edge Cases', () => {
    test('should handle moves at board edges correctly', () => {
      // Test corner positions
      const cornerPositions = [
        { row: 0, col: 0 }, { row: 0, col: 7 },
        { row: 7, col: 0 }, { row: 7, col: 7 }
      ];

      cornerPositions.forEach(pos => {
        // Place a queen at corner position
        game.board[pos.row][pos.col] = { type: 'queen', color: 'white' };
        
        // Test valid moves from corner
        const validMoves = [
          { row: pos.row + (pos.row === 0 ? 1 : -1), col: pos.col },
          { row: pos.row, col: pos.col + (pos.col === 0 ? 1 : -1) }
        ].filter(move => move.row >= 0 && move.row <= 7 && move.col >= 0 && move.col <= 7);

        validMoves.forEach(to => {
          const result = game.makeMove({ from: pos, to });
          expect(result.success).toBe(true);
          
          // Reset board
          game.board[to.row][to.col] = null;
          game.board[pos.row][pos.col] = { type: 'queen', color: 'white' };
        });

        // Clean up
        game.board[pos.row][pos.col] = null;
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
      });
    });

    test('should handle edge piece movements correctly', () => {
      // Test rook at edge moving along edge
      game.board[0][0] = { type: 'rook', color: 'white' };
      
      // Move along top edge
      const result1 = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 0, col: 7 } });
      expect(result1.success).toBe(true);
      
      // Reset and test along left edge
      game.board[0][7] = null;
      game.board[0][0] = { type: 'rook', color: 'white' };
      
      const result2 = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 7, col: 0 } });
      expect(result2.success).toBe(true);
    });
  });

  describe('Maximum Distance Moves', () => {
    test('should handle maximum distance sliding piece moves', () => {
      // Clear board for maximum distance tests
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Test queen maximum diagonal
      game.board[0][0] = { type: 'queen', color: 'white' };
      const result1 = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 7, col: 7 } });
      expect(result1.success).toBe(true);
      
      // Reset and test rook maximum horizontal
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][0] = { type: 'rook', color: 'white' };
      const result2 = game.makeMove({ from: { row: 4, col: 0 }, to: { row: 4, col: 7 } });
      expect(result2.success).toBe(true);
      
      // Reset and test bishop maximum diagonal
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[1][1] = { type: 'bishop', color: 'white' };
      const result3 = game.makeMove({ from: { row: 1, col: 1 }, to: { row: 6, col: 6 } });
      expect(result3.success).toBe(true);
    });

    test('should handle minimum distance moves', () => {
      // Test single square moves for all pieces
      const pieces = [
        { type: 'king', validMoves: [{ row: 4, col: 5 }] },
        { type: 'queen', validMoves: [{ row: 4, col: 5 }, { row: 5, col: 5 }] },
        { type: 'rook', validMoves: [{ row: 4, col: 5 }, { row: 5, col: 4 }] },
        { type: 'bishop', validMoves: [{ row: 5, col: 5 }] }
      ];

      pieces.forEach(({ type, validMoves }) => {
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[4][4] = { type, color: 'white' };
        
        validMoves.forEach(to => {
          const result = game.makeMove({ from: { row: 4, col: 4 }, to });
          expect(result.success).toBe(true);
          
          // Reset
          game.board[to.row][to.col] = null;
          game.board[4][4] = { type, color: 'white' };
        });
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
      
      // Should be able to capture first obstruction
      const result2 = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 2, col: 2 } });
      expect(result2.success).toBe(true);
    });

    test('should handle path obstruction at destination', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Place rook and target
      game.board[0][0] = { type: 'rook', color: 'white' };
      game.board[0][7] = { type: 'pawn', color: 'black' };
      
      // Should be able to capture at destination
      const result = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 0, col: 7 } });
      expect(result.success).toBe(true);
      expect(game.board[0][7]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should handle knight jumping over obstructions', () => {
      // Place knight surrounded by pieces
      game.board[4][4] = { type: 'knight', color: 'white' };
      
      // Surround with pieces
      const surroundingSquares = [
        { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
        { row: 4, col: 3 }, { row: 4, col: 5 },
        { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 }
      ];
      
      surroundingSquares.forEach(pos => {
        game.board[pos.row][pos.col] = { type: 'pawn', color: 'black' };
      });
      
      // Knight should still be able to make L-shaped moves
      const knightMoves = [
        { row: 2, col: 3 }, { row: 2, col: 5 },
        { row: 6, col: 3 }, { row: 6, col: 5 }
      ];
      
      knightMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        expect(result.success).toBe(true);
        
        // Reset knight position
        game.board[to.row][to.col] = null;
        game.board[4][4] = { type: 'knight', color: 'white' };
      });
    });
  });

  describe('Piece Interaction Edge Cases', () => {
    test('should handle captures at board edges', () => {
      // Place pieces at edges for capture scenarios
      game.board[0][0] = { type: 'rook', color: 'white' };
      game.board[0][7] = { type: 'rook', color: 'black' };
      
      const result = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 0, col: 7 } });
      expect(result.success).toBe(true);
      expect(game.board[0][7]).toEqual({ type: 'rook', color: 'white' });
      expect(game.board[0][0]).toBe(null);
    });

    test('should handle piece promotion at edges', () => {
      // Place white pawn ready for promotion
      game.board[1][0] = { type: 'pawn', color: 'white' };
      
      const result = game.makeMove({ 
        from: { row: 1, col: 0 }, 
        to: { row: 0, col: 0 },
        promotion: 'queen'
      });
      
      expect(result.success).toBe(true);
      expect(game.board[0][0]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should handle complex multi-piece interactions', () => {
      // Set up scenario with multiple piece types interacting
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Place pieces in complex formation
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][3] = { type: 'queen', color: 'white' };
      game.board[3][4] = { type: 'rook', color: 'black' };
      game.board[5][5] = { type: 'bishop', color: 'black' };
      
      // King should be in check from rook
      expect(game.isInCheck('white')).toBe(true);
      
      // Queen should be able to capture rook to resolve check
      const result = game.makeMove({ from: { row: 4, col: 3 }, to: { row: 3, col: 4 } });
      expect(result.success).toBe(true);
      expect(game.isInCheck('white')).toBe(false);
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
      
      // Validate many moves rapidly
      for (let i = 0; i < 1000; i++) {
        game.validateMove({ 
          from: { row: 6, col: 4 }, 
          to: { row: 4, col: 4 } 
        });
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
      });
      
      // Board and turn should be unchanged
      expect(game.board).toEqual(originalBoard);
      expect(game.currentTurn).toBe(originalTurn);
    });

    test('should handle concurrent state access correctly', () => {
      // Simulate concurrent access patterns
      const state1 = game.getGameState();
      const state2 = game.getGameState();
      
      // States should be identical
      expect(state1).toEqual(state2);
      
      // Modify game state
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      
      const state3 = game.getGameState();
      
      // New state should be different
      expect(state3).not.toEqual(state1);
      expect(state3.moveHistory.length).toBe(state1.moveHistory.length + 1);
    });
  });
});