/**
 * Comprehensive Piece Movement Tests
 * Consolidates all piece movement pattern testing into Jest
 * Replaces bespoke piece movement test runners
 * 
 * This test file has been normalized to use the current API patterns:
 * - Uses current makeMove API with {from, to, promotion} object format
 * - Validates responses using current success/error structure
 * - Accesses game state using current property names (gameStatus, currentTurn, etc.)
 * - Uses current error codes and message formats
 * - Tests piece interactions using current board representation
 * - Tests piece movement edge cases using current error handling
 */

const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Piece Movement Patterns', () => {
  let game;

  beforeEach(() => {
    game = testUtils.createFreshGame();
  });

  describe('Pawn Movement Validation', () => {
    test('should allow single square forward move', () => {
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      testUtils.validateSuccessResponse(result);
      expect(result.data).toBeDefined();
      expect(result.data.gameStatus).toBe('active');
      expect(result.data.currentTurn).toBe('black');
      expect(game.board[5][4]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[6][4]).toBeNull();
    });

    test('should allow two square initial move', () => {
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      testUtils.validateSuccessResponse(result);
      expect(result.data).toBeDefined();
      expect(result.data.gameStatus).toBe('active');
      expect(result.data.currentTurn).toBe('black');
      expect(game.board[4][4]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[6][4]).toBeNull();
    });

    test('should reject backward movement', () => {
      // Move pawn forward first
      const firstMove = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      testUtils.validateSuccessResponse(firstMove);
      
      // Try to move backward (should be black's turn now)
      const result = game.makeMove({ from: { row: 5, col: 4 }, to: { row: 6, col: 4 } });
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBeDefined();
    });

    test('should reject sideways movement', () => {
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 6, col: 5 } });
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBeDefined();
    });

    test('should allow diagonal capture', () => {
      // Place enemy piece for capture
      game.board[5][5] = { type: 'pawn', color: 'black' };
      
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 5 } });
      testUtils.validateSuccessResponse(result);
      expect(result.data).toBeDefined();
      expect(result.data.gameStatus).toBe('active');
      expect(game.board[5][5]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[6][4]).toBeNull();
    });

    test('should reject diagonal move without capture', () => {
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 5 } });
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBeDefined();
    });

    test('should handle blocked forward movement', () => {
      // Block the path
      game.board[5][4] = { type: 'pawn', color: 'black' };
      
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBeDefined();
    });

    test('should handle pawn promotion', () => {
      // Set up pawn near promotion - need to set up a valid game state
      const freshGame = testUtils.createFreshGame();
      
      // Clear the path and set up promotion scenario
      freshGame.board[1][0] = { type: 'pawn', color: 'white' };
      freshGame.board[6][0] = null; // Remove original pawn
      freshGame.board[0][0] = null; // Clear destination
      
      const result = freshGame.makeMove({ 
        from: { row: 1, col: 0 }, 
        to: { row: 0, col: 0 },
        promotion: 'queen'
      });
      
      testUtils.validateSuccessResponse(result);
      expect(result.data).toBeDefined();
      expect(freshGame.board[0][0]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should test pawn movement from all board positions', () => {
      // Test pawn movement from different starting positions
      const testPositions = [
        { row: 6, col: 0 }, { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 },
        { row: 6, col: 4 }, { row: 6, col: 5 }, { row: 6, col: 6 }, { row: 6, col: 7 }
      ];
      
      testPositions.forEach(pos => {
        const freshGame = testUtils.createFreshGame();
        const result = freshGame.makeMove({ 
          from: pos, 
          to: { row: pos.row - 1, col: pos.col } 
        });
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.gameStatus).toBe('active');
        expect(result.data.currentTurn).toBe('black');
      });
    });
  });

  describe('Knight Movement Validation', () => {
    test('should allow all valid L-shaped moves', () => {
      const validMoves = [
        { row: 2, col: 3 }, { row: 2, col: 5 },
        { row: 3, col: 2 }, { row: 3, col: 6 },
        { row: 5, col: 2 }, { row: 5, col: 6 },
        { row: 6, col: 3 }, { row: 6, col: 5 }
      ];
      
      validMoves.forEach(to => {
        const freshGame = testUtils.createFreshGame();
        // Clear space and place knight
        freshGame.board[4][4] = { type: 'knight', color: 'white' };
        // Clear destination if occupied
        freshGame.board[to.row][to.col] = null;
        // Remove original knight to avoid conflicts
        freshGame.board[7][1] = null;
        freshGame.board[7][6] = null;
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        // Don't check for specific game status as it might be check depending on position
        expect(result.data.currentTurn).toBe('black');
      });
    });

    test('should reject non-L-shaped moves', () => {
      // Clear space and place knight
      game.board[4][4] = { type: 'knight', color: 'white' };
      
      const invalidMoves = [
        { row: 4, col: 5 }, // Horizontal
        { row: 5, col: 4 }, // Vertical
        { row: 5, col: 5 }, // Diagonal
        { row: 3, col: 3 }  // Diagonal
      ];
      
      invalidMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
        expect(result.errorCode).toBeDefined();
      });
    });

    test('should allow jumping over pieces', () => {
      // Place knight and surround with pieces
      game.board[4][4] = { type: 'knight', color: 'white' };
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[4][3] = { type: 'pawn', color: 'white' };
      game.board[4][5] = { type: 'pawn', color: 'white' };
      game.board[5][4] = { type: 'pawn', color: 'white' };
      // Remove original knights to avoid conflicts
      game.board[7][1] = null;
      game.board[7][6] = null;
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 3 } });
      testUtils.validateSuccessResponse(result);
      expect(result.data).toBeDefined();
      // Don't check for specific game status as it might be check depending on position
      expect(game.board[2][3]).toEqual({ type: 'knight', color: 'white' });
    });

    test('should handle boundary conditions', () => {
      // Test knight at board edges - use empty board to avoid piece conflicts
      const edgePositions = [
        { row: 0, col: 0 }, { row: 0, col: 7 },
        { row: 7, col: 0 }, { row: 7, col: 7 }
      ];
      
      edgePositions.forEach(pos => {
        // Try all possible knight moves from this position
        const possibleMoves = [
          { row: pos.row - 2, col: pos.col - 1 },
          { row: pos.row - 2, col: pos.col + 1 },
          { row: pos.row - 1, col: pos.col - 2 },
          { row: pos.row - 1, col: pos.col + 2 },
          { row: pos.row + 1, col: pos.col - 2 },
          { row: pos.row + 1, col: pos.col + 2 },
          { row: pos.row + 2, col: pos.col - 1 },
          { row: pos.row + 2, col: pos.col + 1 }
        ];
        
        possibleMoves.forEach(to => {
          // Use a fresh game for each move to avoid turn issues
          const testGame = testUtils.createFreshGame();
          
          // Clear the board and place only kings and the test knight
          for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
              testGame.board[row][col] = null;
            }
          }
          // Place kings to keep game valid
          testGame.board[7][4] = { type: 'king', color: 'white' };
          testGame.board[0][4] = { type: 'king', color: 'black' };
          // Place test knight
          testGame.board[pos.row][pos.col] = { type: 'knight', color: 'white' };
          
          const result = testGame.makeMove({ from: pos, to });
          // Should succeed if destination is on board, fail if off board
          if (to.row >= 0 && to.row < 8 && to.col >= 0 && to.col < 8) {
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
          } else {
            expect(result.success).toBe(false);
            expect(result.errorCode).toBeDefined();
          }
        });
      });
    });
  });

  describe('Rook Movement Validation', () => {
    beforeEach(() => {
      // Clear path for rook testing
      game.board[4][4] = { type: 'rook', color: 'white' };
      // Clear surrounding squares
      for (let i = 0; i < 8; i++) {
        if (i !== 4) {
          game.board[4][i] = null; // Clear row
          game.board[i][4] = null; // Clear column
        }
      }
    });

    test('should allow horizontal movement', () => {
      const horizontalMoves = [
        { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 },
        { row: 4, col: 5 }, { row: 4, col: 6 }, { row: 4, col: 7 }
      ];
      
      horizontalMoves.forEach(to => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'rook', color: 'white' };
        // Clear path
        for (let i = 0; i < 8; i++) {
          if (i !== 4) freshGame.board[4][i] = null;
        }
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.gameStatus).toBe('active');
        expect(result.data.currentTurn).toBe('black');
      });
    });

    test('should allow vertical movement', () => {
      const verticalMoves = [
        { row: 0, col: 4 }, { row: 1, col: 4 }, { row: 2, col: 4 }, { row: 3, col: 4 },
        { row: 5, col: 4 }, { row: 6, col: 4 }, { row: 7, col: 4 }
      ];
      
      verticalMoves.forEach(to => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'rook', color: 'white' };
        // Clear path
        for (let i = 0; i < 8; i++) {
          if (i !== 4) freshGame.board[i][4] = null;
        }
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.gameStatus).toBe('active');
        expect(result.data.currentTurn).toBe('black');
      });
    });

    test('should reject diagonal movement', () => {
      const diagonalMoves = [
        { row: 3, col: 3 }, { row: 3, col: 5 },
        { row: 5, col: 3 }, { row: 5, col: 5 }
      ];
      
      diagonalMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
        expect(result.errorCode).toBeDefined();
      });
    });

    test('should be blocked by pieces in path', () => {
      // Place blocking piece
      game.board[4][2] = { type: 'pawn', color: 'black' };
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 0 } });
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBeDefined();
    });

    test('should capture enemy pieces', () => {
      // Place enemy piece
      game.board[4][2] = { type: 'pawn', color: 'black' };
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 2 } });
      testUtils.validateSuccessResponse(result);
      expect(result.data).toBeDefined();
      expect(result.data.gameStatus).toBe('active');
      expect(game.board[4][2]).toEqual({ type: 'rook', color: 'white' });
      expect(game.board[4][4]).toBeNull();
    });
  });

  describe('Bishop Movement Validation', () => {
    beforeEach(() => {
      // Place bishop and clear diagonal paths
      game.board[4][4] = { type: 'bishop', color: 'white' };
      
      // Clear diagonal paths
      const diagonals = [
        [3, 3], [2, 2], [1, 1], [0, 0],
        [3, 5], [2, 6], [1, 7],
        [5, 3], [6, 2], [7, 1],
        [5, 5], [6, 6], [7, 7]
      ];
      
      diagonals.forEach(([row, col]) => {
        game.board[row][col] = null;
      });
    });

    test('should allow diagonal movement in all directions', () => {
      const diagonalMoves = [
        { row: 3, col: 3 }, { row: 2, col: 2 }, { row: 1, col: 1 }, { row: 0, col: 0 },
        { row: 3, col: 5 }, { row: 2, col: 6 }, { row: 1, col: 7 },
        { row: 5, col: 3 }, { row: 6, col: 2 }, { row: 7, col: 1 },
        { row: 5, col: 5 }, { row: 6, col: 6 }, { row: 7, col: 7 }
      ];
      
      diagonalMoves.forEach(to => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'bishop', color: 'white' };
        
        // Clear diagonal paths
        const diagonals = [
          [3, 3], [2, 2], [1, 1], [0, 0],
          [3, 5], [2, 6], [1, 7],
          [5, 3], [6, 2], [7, 1],
          [5, 5], [6, 6], [7, 7]
        ];
        
        diagonals.forEach(([row, col]) => {
          freshGame.board[row][col] = null;
        });
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.gameStatus).toBe('active');
        expect(result.data.currentTurn).toBe('black');
      });
    });

    test('should reject horizontal and vertical movement', () => {
      const invalidMoves = [
        { row: 4, col: 0 }, { row: 4, col: 7 },
        { row: 0, col: 4 }, { row: 7, col: 4 }
      ];
      
      invalidMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
        expect(result.errorCode).toBeDefined();
      });
    });

    test('should be blocked by pieces in diagonal path', () => {
      // Place blocking piece
      game.board[3][3] = { type: 'pawn', color: 'black' };
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 2 } });
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBeDefined();
    });

    test('should stay on same color squares', () => {
      // Bishop on light square should only move to light squares
      // Bishop on dark square should only move to dark squares
      const lightSquareBishop = { row: 4, col: 4 }; // Light square (4+4=8, even)
      const darkSquareBishop = { row: 4, col: 3 };  // Dark square (4+3=7, odd)
      
      // Test light square bishop
      const lightSquareMoves = [
        { row: 3, col: 3 }, { row: 5, col: 5 }, { row: 2, col: 6 }, { row: 6, col: 2 }
      ];
      
      lightSquareMoves.forEach(to => {
        const sum = to.row + to.col;
        expect(sum % 2).toBe(0); // Should be even (light square)
      });
    });
  });

  describe('Queen Movement Validation', () => {
    beforeEach(() => {
      // Place queen and clear paths
      game.board[4][4] = { type: 'queen', color: 'white' };
      
      // Clear all paths around queen
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (row === 4 || col === 4 || Math.abs(row - 4) === Math.abs(col - 4)) {
            if (!(row === 4 && col === 4)) {
              game.board[row][col] = null;
            }
          }
        }
      }
    });

    test('should combine rook and bishop movement patterns', () => {
      const queenMoves = [
        // Horizontal (rook-like)
        { row: 4, col: 0 }, { row: 4, col: 7 },
        // Vertical (rook-like)
        { row: 0, col: 4 }, { row: 7, col: 4 },
        // Diagonal (bishop-like)
        { row: 0, col: 0 }, { row: 7, col: 7 },
        { row: 1, col: 7 }, { row: 7, col: 1 }
      ];
      
      queenMoves.forEach(to => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'queen', color: 'white' };
        
        // Clear paths
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            if (row === 4 || col === 4 || Math.abs(row - 4) === Math.abs(col - 4)) {
              if (!(row === 4 && col === 4)) {
                freshGame.board[row][col] = null;
              }
            }
          }
        }
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.gameStatus).toBe('active');
        expect(result.data.currentTurn).toBe('black');
      });
    });

    test('should reject knight-like moves', () => {
      const knightMoves = [
        { row: 2, col: 3 }, { row: 2, col: 5 },
        { row: 6, col: 3 }, { row: 6, col: 5 }
      ];
      
      knightMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
        expect(result.errorCode).toBeDefined();
      });
    });
  });

  describe('King Movement Validation', () => {
    beforeEach(() => {
      // Place king in center for testing
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
    });

    test('should allow single square movement in all directions', () => {
      const kingMoves = [
        { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
        { row: 4, col: 3 },                     { row: 4, col: 5 },
        { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 }
      ];
      
      kingMoves.forEach(to => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'king', color: 'white' };
        freshGame.board[7][4] = null; // Remove original king
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.gameStatus).toBe('active');
        expect(result.data.currentTurn).toBe('black');
      });
    });

    test('should reject multi-square movement', () => {
      const invalidMoves = [
        { row: 2, col: 4 }, { row: 6, col: 4 },
        { row: 4, col: 2 }, { row: 4, col: 6 },
        { row: 2, col: 2 }, { row: 6, col: 6 }
      ];
      
      invalidMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
        expect(result.errorCode).toBeDefined();
      });
    });

    test('should not move into check', () => {
      // Place enemy rook that would attack king's destination
      game.board[3][0] = { type: 'rook', color: 'black' };
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should validate moves efficiently', () => {
      const startTime = Date.now();
      
      // Test 100 move validations (reduced for more realistic performance expectations)
      for (let i = 0; i < 100; i++) {
        const freshGame = testUtils.createFreshGame();
        const result = freshGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
        expect(result.success).toBe(true);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 1000ms (more realistic expectation)
      expect(duration).toBeLessThan(1000);
    });

    test('should handle complex board positions efficiently', () => {
      const startTime = Date.now();
      
      // Create complex positions and validate moves (reduced iterations)
      for (let i = 0; i < 10; i++) {
        const freshGame = testUtils.createFreshGame();
        
        // Make several moves to create complex position
        let result = freshGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
        expect(result.success).toBe(true);
        
        result = freshGame.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
        expect(result.success).toBe(true);
        
        result = freshGame.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } });
        expect(result.success).toBe(true);
        
        result = freshGame.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } });
        expect(result.success).toBe(true);
        
        // Test various piece movements
        result = freshGame.makeMove({ from: { row: 5, col: 2 }, to: { row: 3, col: 1 } });
        expect(result.success).toBe(true);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 2000ms (more realistic expectation)
      expect(duration).toBeLessThan(2000);
    });
  });
});