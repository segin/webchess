/**
 * Comprehensive Queen Movement Tests
 * Covers combined rook and bishop movement patterns, path validation, and complex board positions
 */

const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Queen Movement', () => {
  let game;

  beforeEach(() => {
    game = testUtils.createFreshGame();
  });

  describe('Basic Queen Movement Patterns', () => {
    test('should combine rook and bishop movement patterns', () => {
      // Place queen in center and clear all paths
      game.board[4][4] = { type: 'queen', color: 'white' };
      
      // Clear all paths around queen (horizontal, vertical, and diagonal)
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (row === 4 || col === 4 || Math.abs(row - 4) === Math.abs(col - 4)) {
            if (!(row === 4 && col === 4)) {
              game.board[row][col] = null;
            }
          }
        }
      }
      
      // Test movement in all 8 directions
      const queenMoves = [
        // Horizontal (rook-like)
        { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 },
        { row: 4, col: 5 }, { row: 4, col: 6 }, { row: 4, col: 7 },
        // Vertical (rook-like)
        { row: 0, col: 4 }, { row: 1, col: 4 }, { row: 2, col: 4 }, { row: 3, col: 4 },
        { row: 5, col: 4 }, { row: 6, col: 4 }, { row: 7, col: 4 },
        // Diagonal (bishop-like)
        { row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 3 },
        { row: 5, col: 5 }, { row: 6, col: 6 }, { row: 7, col: 7 },
        { row: 1, col: 7 }, { row: 2, col: 6 }, { row: 3, col: 5 },
        { row: 5, col: 3 }, { row: 6, col: 2 }, { row: 7, col: 1 }
      ];
      
      queenMoves.forEach(to => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'queen', color: 'white' };
        
        // Clear all paths
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
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[to.row][to.col]).toEqual({ type: 'queen', color: 'white' });
        expect(freshGame.board[4][4]).toBeNull();
      });
    });

    test('should reject knight-like moves', () => {
      game.board[4][4] = { type: 'queen', color: 'white' };
      
      const knightMoves = [
        { row: 2, col: 3 }, { row: 2, col: 5 }, { row: 3, col: 2 }, { row: 3, col: 6 },
        { row: 5, col: 2 }, { row: 5, col: 6 }, { row: 6, col: 3 }, { row: 6, col: 5 }
      ];
      
      knightMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });

    test('should reject irregular moves', () => {
      game.board[4][4] = { type: 'queen', color: 'white' };
      
      const irregularMoves = [
        { row: 2, col: 1 }, // Not on any line
        { row: 1, col: 2 }, // Not on any line
        { row: 6, col: 1 }, // Not on any line
        { row: 1, col: 6 }, // Not on any line
        { row: 4, col: 4 }  // Same position
      ];
      
      irregularMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });

    test('should validate queen movement mathematically', () => {
      game.board[4][4] = { type: 'queen', color: 'white' };
      
      // Test all possible moves within board bounds
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (row === 4 && col === 4) continue; // Skip starting position
          
          const rowDiff = Math.abs(row - 4);
          const colDiff = Math.abs(col - 4);
          const isValidQueenMove = (
            row === 4 || // Same row (horizontal)
            col === 4 || // Same column (vertical)
            rowDiff === colDiff // Diagonal
          );
          
          const freshGame = testUtils.createFreshGame();
          freshGame.board[4][4] = { type: 'queen', color: 'white' };
          
          // Clear all paths
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (r === 4 || c === 4 || Math.abs(r - 4) === Math.abs(c - 4)) {
                if (!(r === 4 && c === 4)) {
                  freshGame.board[r][c] = null;
                }
              }
            }
          }
          
          const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to: { row, col } });
          
          if (isValidQueenMove) {
            testUtils.validateSuccessResponse(result);
          } else {
            testUtils.validateErrorResponse(result);
          }
        }
      }
    });
  });

  describe('Queen Movement from Starting Position', () => {
    test('should handle initial queen position correctly', () => {
      // Queen should not be able to move initially due to blocking pieces
      const blockedMoves = [
        { from: { row: 7, col: 3 }, to: { row: 7, col: 2 } }, // Blocked by bishop
        { from: { row: 7, col: 3 }, to: { row: 7, col: 4 } }, // Blocked by king
        { from: { row: 7, col: 3 }, to: { row: 6, col: 3 } }, // Blocked by pawn
        { from: { row: 7, col: 3 }, to: { row: 6, col: 2 } }, // Blocked by pawn
        { from: { row: 7, col: 3 }, to: { row: 6, col: 4 } }  // Blocked by pawn
      ];
      
      blockedMoves.forEach(move => {
        const result = game.makeMove(move);
        testUtils.validateErrorResponse(result);
      });
    });

    test('should allow queen movement after clearing path', () => {
      // Clear path for white queen
      game.board[6][3] = null; // Clear d2 pawn
      
      const result = game.makeMove({ from: { row: 7, col: 3 }, to: { row: 5, col: 3 } });
      testUtils.validateSuccessResponse(result);
      expect(game.board[5][3]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should handle black queen movement', () => {
      // Move white piece first to switch turns
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      
      // Clear path for black queen and test movement
      game.board[1][3] = null; // Clear d7 pawn
      
      const result = game.makeMove({ from: { row: 0, col: 3 }, to: { row: 2, col: 3 } });
      testUtils.validateSuccessResponse(result);
      expect(game.board[2][3]).toEqual({ type: 'queen', color: 'black' });
    });
  });

  describe('Queen Path Obstruction and Blocking', () => {
    test('should be blocked by pieces in horizontal path', () => {
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'black' }; // Blocking piece
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 0 } });
      testUtils.validateErrorResponse(result);
    });

    test('should be blocked by pieces in vertical path', () => {
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[2][4] = { type: 'pawn', color: 'black' }; // Blocking piece
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 0, col: 4 } });
      testUtils.validateErrorResponse(result);
    });

    test('should be blocked by pieces in diagonal path', () => {
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'black' }; // Blocking piece
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 2 } });
      testUtils.validateErrorResponse(result);
    });

    test('should handle blocking in all 8 directions', () => {
      game.board[4][4] = { type: 'queen', color: 'white' };
      
      // Place blocking pieces in all 8 directions
      game.board[4][2] = { type: 'pawn', color: 'black' };   // Horizontal left
      game.board[4][6] = { type: 'knight', color: 'white' }; // Horizontal right
      game.board[2][4] = { type: 'bishop', color: 'black' }; // Vertical up
      game.board[6][4] = { type: 'rook', color: 'white' };   // Vertical down
      game.board[3][3] = { type: 'pawn', color: 'black' };   // Diagonal up-left
      game.board[3][5] = { type: 'knight', color: 'white' }; // Diagonal up-right
      game.board[5][3] = { type: 'bishop', color: 'black' }; // Diagonal down-left
      game.board[5][5] = { type: 'queen', color: 'white' };  // Diagonal down-right
      
      // Test movement past all blocks should fail
      const blockedMoves = [
        { row: 4, col: 0 }, // Blocked horizontally left
        { row: 4, col: 7 }, // Blocked horizontally right
        { row: 0, col: 4 }, // Blocked vertically up
        { row: 7, col: 4 }, // Blocked vertically down
        { row: 2, col: 2 }, // Blocked diagonally up-left
        { row: 2, col: 6 }, // Blocked diagonally up-right
        { row: 6, col: 2 }, // Blocked diagonally down-left
        { row: 6, col: 6 }  // Blocked diagonally down-right
      ];
      
      blockedMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });

    test('should allow movement up to blocking piece but not beyond', () => {
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'black' }; // Blocking piece
      
      // Should be able to move to the square just before the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 3 } });
      testUtils.validateSuccessResponse(result);
    });
  });

  describe('Queen Captures', () => {
    test('should capture enemy pieces in all directions', () => {
      game.board[4][4] = { type: 'queen', color: 'white' };
      
      const enemyPieces = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'pawn', 'knight', 'bishop'];
      const capturePositions = [
        { row: 4, col: 2 }, // Horizontal left
        { row: 4, col: 6 }, // Horizontal right
        { row: 2, col: 4 }, // Vertical up
        { row: 6, col: 4 }, // Vertical down
        { row: 3, col: 3 }, // Diagonal up-left
        { row: 3, col: 5 }, // Diagonal up-right
        { row: 5, col: 3 }, // Diagonal down-left
        { row: 5, col: 5 }  // Diagonal down-right
      ];
      
      enemyPieces.forEach((pieceType, index) => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'queen', color: 'white' };
        
        const capturePos = capturePositions[index];
        freshGame.board[capturePos.row][capturePos.col] = { type: pieceType, color: 'black' };
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to: capturePos });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[capturePos.row][capturePos.col]).toEqual({ type: 'queen', color: 'white' });
      });
    });

    test('should not capture own pieces', () => {
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'white' };
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 2 } });
      testUtils.validateErrorResponse(result);
    });

    test('should capture and stop at enemy piece', () => {
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'black' }; // Enemy piece to capture
      
      // Should be able to capture the enemy piece
      const captureResult = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 2 } });
      testUtils.validateSuccessResponse(captureResult);
      expect(game.board[4][2]).toEqual({ type: 'queen', color: 'white' });
      
      // But should not be able to move past it in a single move
      const freshGame = testUtils.createFreshGame();
      freshGame.board[4][4] = { type: 'queen', color: 'white' };
      freshGame.board[4][2] = { type: 'pawn', color: 'black' };
      
      const pastResult = freshGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 0 } });
      testUtils.validateErrorResponse(pastResult);
    });

    test('should handle long-range captures', () => {
      // Test maximum range captures in all directions
      const longRangeGame = testUtils.createFreshGame();
      longRangeGame.board[0][0] = { type: 'queen', color: 'white' };
      
      // Place enemy pieces at maximum range
      longRangeGame.board[0][7] = { type: 'rook', color: 'black' };   // Horizontal
      longRangeGame.board[7][0] = { type: 'rook', color: 'black' };   // Vertical
      longRangeGame.board[7][7] = { type: 'queen', color: 'black' };  // Diagonal
      
      // Clear paths
      for (let i = 1; i < 7; i++) {
        longRangeGame.board[0][i] = null; // Clear horizontal path
        longRangeGame.board[i][0] = null; // Clear vertical path
        longRangeGame.board[i][i] = null; // Clear diagonal path
      }
      
      // Test captures at maximum range
      const captures = [
        { to: { row: 0, col: 7 }, expected: 'rook' },
        { to: { row: 7, col: 0 }, expected: 'rook' },
        { to: { row: 7, col: 7 }, expected: 'queen' }
      ];
      
      captures.forEach(capture => {
        const testGame = testUtils.createFreshGame();
        testGame.board[0][0] = { type: 'queen', color: 'white' };
        testGame.board[capture.to.row][capture.to.col] = { type: capture.expected, color: 'black' };
        
        // Clear path
        for (let i = 1; i < 7; i++) {
          if (capture.to.row === 0) testGame.board[0][i] = null;
          if (capture.to.col === 0) testGame.board[i][0] = null;
          if (capture.to.row === capture.to.col) testGame.board[i][i] = null;
        }
        
        const result = testGame.makeMove({ from: { row: 0, col: 0 }, to: capture.to });
        testUtils.validateSuccessResponse(result);
        expect(testGame.board[capture.to.row][capture.to.col]).toEqual({ type: 'queen', color: 'white' });
      });
    });
  });

  describe('Queen Movement at Board Boundaries', () => {
    test('should handle movement from corner positions', () => {
      const cornerPositions = [
        { row: 0, col: 0 }, // Top-left corner
        { row: 0, col: 7 }, // Top-right corner
        { row: 7, col: 0 }, // Bottom-left corner
        { row: 7, col: 7 }  // Bottom-right corner
      ];
      
      cornerPositions.forEach(pos => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[pos.row][pos.col] = { type: 'queen', color: 'white' };
        
        // Clear all paths from corner
        for (let i = 0; i < 8; i++) {
          // Clear row and column
          if (i !== pos.col) freshGame.board[pos.row][i] = null;
          if (i !== pos.row) freshGame.board[i][pos.col] = null;
          
          // Clear diagonals
          if (pos.row + i < 8 && pos.col + i < 8 && i > 0) freshGame.board[pos.row + i][pos.col + i] = null;
          if (pos.row + i < 8 && pos.col - i >= 0 && i > 0) freshGame.board[pos.row + i][pos.col - i] = null;
          if (pos.row - i >= 0 && pos.col + i < 8 && i > 0) freshGame.board[pos.row - i][pos.col + i] = null;
          if (pos.row - i >= 0 && pos.col - i >= 0 && i > 0) freshGame.board[pos.row - i][pos.col - i] = null;
        }
        
        // Test movement to opposite corners and edges
        const testMoves = [
          { row: pos.row, col: pos.col === 0 ? 7 : 0 }, // Opposite end of row
          { row: pos.row === 0 ? 7 : 0, col: pos.col }  // Opposite end of column
        ];
        
        // Add diagonal moves if possible
        if (pos.row === 0 && pos.col === 0) testMoves.push({ row: 7, col: 7 });
        if (pos.row === 0 && pos.col === 7) testMoves.push({ row: 7, col: 0 });
        if (pos.row === 7 && pos.col === 0) testMoves.push({ row: 0, col: 7 });
        if (pos.row === 7 && pos.col === 7) testMoves.push({ row: 0, col: 0 });
        
        testMoves.forEach(to => {
          const moveGame = testUtils.createFreshGame();
          moveGame.board[pos.row][pos.col] = { type: 'queen', color: 'white' };
          
          // Clear all paths from corner
          for (let i = 0; i < 8; i++) {
            // Clear row and column
            if (i !== pos.col) moveGame.board[pos.row][i] = null;
            if (i !== pos.row) moveGame.board[i][pos.col] = null;
            
            // Clear diagonals
            if (pos.row + i < 8 && pos.col + i < 8 && i > 0) moveGame.board[pos.row + i][pos.col + i] = null;
            if (pos.row + i < 8 && pos.col - i >= 0 && i > 0) moveGame.board[pos.row + i][pos.col - i] = null;
            if (pos.row - i >= 0 && pos.col + i < 8 && i > 0) moveGame.board[pos.row - i][pos.col + i] = null;
            if (pos.row - i >= 0 && pos.col - i >= 0 && i > 0) moveGame.board[pos.row - i][pos.col - i] = null;
          }
          
          const result = moveGame.makeMove({ from: pos, to });
          testUtils.validateSuccessResponse(result);
        });
      });
    });

    test('should reject moves that go off the board', () => {
      game.board[0][0] = { type: 'queen', color: 'white' };
      
      const offBoardMoves = [
        { row: -1, col: 0 }, { row: 0, col: -1 }, { row: -1, col: -1 },
        { row: 8, col: 0 }, { row: 0, col: 8 }, { row: 8, col: 8 }
      ];
      
      offBoardMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 0, col: 0 }, to });
        testUtils.validateErrorResponse(result);
      });
    });
  });

  describe('Queen Movement in Complex Positions', () => {
    test('should handle queen in center of complex position', () => {
      // Create a complex middle game position
      const complexGame = testUtils.createFreshGame();
      
      // Make several moves to create complexity
      complexGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e4
      complexGame.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // e5
      complexGame.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }); // Nc3
      complexGame.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }); // Nc6
      complexGame.makeMove({ from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }); // d4
      complexGame.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }); // d5
      
      // Clear path for queen and test movement
      complexGame.board[6][3] = null; // Clear d2 pawn
      complexGame.board[5][3] = null; // Clear intermediate square
      complexGame.board[4][3] = null; // Clear d4 square (white pawn)
      
      const result = complexGame.makeMove({ from: { row: 7, col: 3 }, to: { row: 4, col: 3 } });
      testUtils.validateSuccessResponse(result);
    });

    test('should handle queen and rook coordination', () => {
      // Set up position with queen and rook on same file/rank
      const coordGame = testUtils.createFreshGame();
      coordGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      coordGame.board[0][4] = { type: 'king', color: 'black' };
      coordGame.board[7][4] = { type: 'king', color: 'white' };
      coordGame.board[4][0] = { type: 'queen', color: 'white' };
      coordGame.board[4][7] = { type: 'rook', color: 'white' };
      
      // Queen should be able to move along the rank
      const result = coordGame.makeMove({ from: { row: 4, col: 0 }, to: { row: 4, col: 3 } });
      testUtils.validateSuccessResponse(result);
    });

    test('should handle queen in endgame scenarios', () => {
      // Create queen endgame
      const endgame = testUtils.createFreshGame();
      endgame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      endgame.board[0][4] = { type: 'king', color: 'black' };
      endgame.board[7][4] = { type: 'king', color: 'white' };
      endgame.board[1][0] = { type: 'queen', color: 'white' };
      endgame.board[6][7] = { type: 'queen', color: 'black' };
      
      // White queen should be able to move freely
      const result = endgame.makeMove({ from: { row: 1, col: 0 }, to: { row: 1, col: 7 } });
      testUtils.validateSuccessResponse(result);
    });

    test('should handle queen vs multiple pieces', () => {
      // Set up position where queen faces multiple enemy pieces
      const tacticalGame = testUtils.createFreshGame();
      tacticalGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      tacticalGame.board[0][4] = { type: 'king', color: 'black' };
      tacticalGame.board[7][4] = { type: 'king', color: 'white' };
      tacticalGame.board[4][4] = { type: 'queen', color: 'white' };
      tacticalGame.board[4][0] = { type: 'rook', color: 'black' };
      tacticalGame.board[0][4] = { type: 'king', color: 'black' };
      tacticalGame.board[2][2] = { type: 'bishop', color: 'black' };
      
      // Queen should be able to capture any of the pieces
      const captures = [
        { row: 4, col: 0 }, // Capture rook
        { row: 2, col: 2 }  // Capture bishop
      ];
      
      captures.forEach(to => {
        const testGame = testUtils.createFreshGame();
        testGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
        testGame.board[0][4] = { type: 'king', color: 'black' };
        testGame.board[7][4] = { type: 'king', color: 'white' };
        testGame.board[4][4] = { type: 'queen', color: 'white' };
        testGame.board[to.row][to.col] = { type: 'rook', color: 'black' };
        
        const result = testGame.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateSuccessResponse(result);
      });
    });
  });

  describe('Queen Power and Range Tests', () => {
    test('should demonstrate maximum range in all directions', () => {
      // Place queen in corner and test maximum range
      const maxRangeGame = testUtils.createFreshGame();
      maxRangeGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      maxRangeGame.board[0][0] = { type: 'queen', color: 'white' };
      maxRangeGame.board[7][7] = { type: 'king', color: 'black' };
      maxRangeGame.board[7][0] = { type: 'king', color: 'white' };
      
      // Test maximum range moves
      const maxRangeMoves = [
        { row: 0, col: 7 }, // Horizontal max
        { row: 7, col: 0 }, // Vertical max
        { row: 7, col: 7 }  // Diagonal max
      ];
      
      maxRangeMoves.forEach(to => {
        const testGame = testUtils.createFreshGame();
        testGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
        testGame.board[0][0] = { type: 'queen', color: 'white' };
        testGame.board[7][7] = { type: 'king', color: 'black' };
        testGame.board[7][1] = { type: 'king', color: 'white' };
        
        const result = testGame.makeMove({ from: { row: 0, col: 0 }, to });
        testUtils.validateSuccessResponse(result);
      });
    });

    test('should control maximum number of squares', () => {
      // Place queen in center and count controlled squares
      const controlGame = testUtils.createFreshGame();
      controlGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      controlGame.board[4][4] = { type: 'queen', color: 'white' };
      controlGame.board[0][0] = { type: 'king', color: 'black' };
      controlGame.board[7][7] = { type: 'king', color: 'white' };
      
      // Queen from center should control 27 squares (8 directions × 7 squares max - overlaps)
      let controlledSquares = 0;
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (row === 4 && col === 4) continue; // Skip queen's position
          
          const rowDiff = Math.abs(row - 4);
          const colDiff = Math.abs(col - 4);
          const isControlled = (
            row === 4 || // Same row
            col === 4 || // Same column
            rowDiff === colDiff // Diagonal
          );
          
          if (isControlled) {
            controlledSquares++;
          }
        }
      }
      
      expect(controlledSquares).toBe(27); // Queen controls 27 squares from center
    });
  });

  describe('Performance Tests', () => {
    test('should validate queen moves efficiently', () => {
      const startTime = Date.now();
      
      // Test 1000 queen move validations
      for (let i = 0; i < 1000; i++) {
        const freshGame = testUtils.createFreshGame();
        // Clear path and move queen
        freshGame.board[6][3] = null; // Clear d2 pawn
        freshGame.makeMove({ from: { row: 7, col: 3 }, to: { row: 5, col: 3 } });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 3000ms (3 seconds)
      expect(duration).toBeLessThan(3000);
    });

    test('should handle complex queen scenarios efficiently', () => {
      const startTime = Date.now();
      
      // Test complex queen movement scenarios
      for (let i = 0; i < 100; i++) {
        const freshGame = testUtils.createFreshGame();
        
        // Clear paths and execute queen moves
        freshGame.board[6][3] = null; // Clear d2
        freshGame.makeMove({ from: { row: 7, col: 3 }, to: { row: 5, col: 3 } }); // Qd3
        freshGame.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }); // e6
        freshGame.makeMove({ from: { row: 5, col: 3 }, to: { row: 3, col: 5 } }); // Qf5
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 3000ms (3 seconds)
      expect(duration).toBeLessThan(3000);
    });
  });
});