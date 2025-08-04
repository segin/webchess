/**
 * Comprehensive Rook Movement Tests
 * Covers horizontal and vertical movement, path validation, and complex board positions
 */

const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Rook Movement', () => {
  let game;

  beforeEach(() => {
    game = testUtils.createFreshGame();
  });

  describe('Basic Rook Movement Patterns', () => {
    test('should allow horizontal movement in both directions', () => {
      // Place rook in center and clear horizontal path
      game.board[4][4] = { type: 'rook', color: 'white' };
      for (let col = 0; col < 8; col++) {
        if (col !== 4) game.board[4][col] = null;
      }
      
      // Test movement to all horizontal positions
      const horizontalMoves = [
        { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 },
        { row: 4, col: 5 }, { row: 4, col: 6 }, { row: 4, col: 7 }
      ];
      
      horizontalMoves.forEach(to => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'rook', color: 'white' };
        // Clear horizontal path
        for (let col = 0; col < 8; col++) {
          if (col !== 4) freshGame.board[4][col] = null;
        }
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[to.row][to.col]).toEqual({ type: 'rook', color: 'white' });
        expect(freshGame.board[4][4]).toBeNull();
      });
    });

    test('should allow vertical movement in both directions', () => {
      // Place rook in center and clear vertical path
      game.board[4][4] = { type: 'rook', color: 'white' };
      for (let row = 0; row < 8; row++) {
        if (row !== 4) game.board[row][4] = null;
      }
      
      // Test movement to all vertical positions
      const verticalMoves = [
        { row: 0, col: 4 }, { row: 1, col: 4 }, { row: 2, col: 4 }, { row: 3, col: 4 },
        { row: 5, col: 4 }, { row: 6, col: 4 }, { row: 7, col: 4 }
      ];
      
      verticalMoves.forEach(to => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'rook', color: 'white' };
        // Clear vertical path
        for (let row = 0; row < 8; row++) {
          if (row !== 4) freshGame.board[row][4] = null;
        }
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[to.row][to.col]).toEqual({ type: 'rook', color: 'white' });
        expect(freshGame.board[4][4]).toBeNull();
      });
    });

    test('should reject diagonal movement', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      
      const diagonalMoves = [
        { row: 3, col: 3 }, { row: 3, col: 5 }, { row: 5, col: 3 }, { row: 5, col: 5 },
        { row: 2, col: 2 }, { row: 2, col: 6 }, { row: 6, col: 2 }, { row: 6, col: 6 },
        { row: 1, col: 1 }, { row: 1, col: 7 }, { row: 7, col: 1 }, { row: 7, col: 7 }
      ];
      
      diagonalMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });

    test('should reject knight-like moves', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      
      const knightMoves = [
        { row: 2, col: 3 }, { row: 2, col: 5 }, { row: 3, col: 2 }, { row: 3, col: 6 },
        { row: 5, col: 2 }, { row: 5, col: 6 }, { row: 6, col: 3 }, { row: 6, col: 5 }
      ];
      
      knightMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });

    test('should reject staying in same position', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 4 } });
      testUtils.validateErrorResponse(result);
    });
  });

  describe('Rook Movement from Starting Positions', () => {
    test('should handle initial rook positions correctly', () => {
      // Test white rooks from starting positions (need to clear path first)
      const whiteRookTests = [
        {
          from: { row: 7, col: 0 }, // a1 rook
          to: { row: 7, col: 3 },   // Move to d1
          clearSquares: [{ row: 7, col: 1 }, { row: 7, col: 2 }] // Clear b1, c1
        },
        {
          from: { row: 7, col: 7 }, // h1 rook
          to: { row: 7, col: 5 },   // Move to f1
          clearSquares: [{ row: 7, col: 6 }] // Clear g1
        }
      ];
      
      whiteRookTests.forEach(test => {
        const freshGame = testUtils.createFreshGame();
        
        // Clear the path
        test.clearSquares.forEach(square => {
          freshGame.board[square.row][square.col] = null;
        });
        
        const result = freshGame.makeMove({ from: test.from, to: test.to });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[test.to.row][test.to.col]).toEqual({ type: 'rook', color: 'white' });
      });
    });

    test('should handle black rook movement', () => {
      // Move white piece first to switch turns
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      
      // Clear path for black rook and test movement
      game.board[0][1] = null; // Clear knight
      game.board[0][2] = null; // Clear bishop
      game.board[0][3] = null; // Clear queen
      
      const result = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 0, col: 3 } });
      testUtils.validateSuccessResponse(result);
      expect(game.board[0][3]).toEqual({ type: 'rook', color: 'black' });
    });

    test('should be blocked by pieces in starting position', () => {
      // Rooks should not be able to move initially due to blocking pieces
      const blockedMoves = [
        { from: { row: 7, col: 0 }, to: { row: 7, col: 1 } }, // Blocked by knight
        { from: { row: 7, col: 7 }, to: { row: 7, col: 6 } }, // Blocked by knight
        { from: { row: 7, col: 0 }, to: { row: 6, col: 0 } }, // Blocked by pawn
        { from: { row: 7, col: 7 }, to: { row: 6, col: 7 } }  // Blocked by pawn
      ];
      
      blockedMoves.forEach(move => {
        const result = game.makeMove(move);
        testUtils.validateErrorResponse(result);
      });
    });
  });

  describe('Path Obstruction and Blocking', () => {
    test('should be blocked by own pieces in horizontal path', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'white' }; // Blocking piece
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 0 } });
      testUtils.validateErrorResponse(result);
    });

    test('should be blocked by enemy pieces in horizontal path', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'black' }; // Blocking piece
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 0 } });
      testUtils.validateErrorResponse(result);
    });

    test('should be blocked by own pieces in vertical path', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[2][4] = { type: 'pawn', color: 'white' }; // Blocking piece
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 0, col: 4 } });
      testUtils.validateErrorResponse(result);
    });

    test('should be blocked by enemy pieces in vertical path', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[2][4] = { type: 'pawn', color: 'black' }; // Blocking piece
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 0, col: 4 } });
      testUtils.validateErrorResponse(result);
    });

    test('should allow movement up to blocking piece but not beyond', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'black' }; // Blocking piece
      
      // Should be able to move to the square just before the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 3 } });
      testUtils.validateSuccessResponse(result);
    });

    test('should handle multiple blocking pieces', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'black' };   // First block
      game.board[4][6] = { type: 'knight', color: 'white' }; // Second block
      game.board[2][4] = { type: 'bishop', color: 'black' }; // Third block
      game.board[6][4] = { type: 'queen', color: 'white' };  // Fourth block
      
      // Test movement in all directions with blocks
      const blockedMoves = [
        { row: 4, col: 0 }, // Blocked by pawn at [4][2]
        { row: 4, col: 7 }, // Blocked by knight at [4][6]
        { row: 0, col: 4 }, // Blocked by bishop at [2][4]
        { row: 7, col: 4 }  // Blocked by queen at [6][4]
      ];
      
      blockedMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
      
      // But should be able to move to squares just before blocks
      const allowedMoves = [
        { row: 4, col: 3 }, // Just before pawn
        { row: 4, col: 5 }, // Just before knight
        { row: 3, col: 4 }, // Just before bishop
        { row: 5, col: 4 }  // Just before queen
      ];
      
      allowedMoves.forEach(to => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'rook', color: 'white' };
        freshGame.board[4][2] = { type: 'pawn', color: 'black' };
        freshGame.board[4][6] = { type: 'knight', color: 'white' };
        freshGame.board[2][4] = { type: 'bishop', color: 'black' };
        freshGame.board[6][4] = { type: 'queen', color: 'white' };
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateSuccessResponse(result);
      });
    });
  });

  describe('Rook Captures', () => {
    test('should capture enemy pieces horizontally', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      
      const enemyPieces = ['pawn', 'knight', 'bishop', 'queen', 'rook'];
      const capturePositions = [
        { row: 4, col: 2 }, { row: 4, col: 6 }, { row: 4, col: 1 }, 
        { row: 4, col: 7 }, { row: 4, col: 0 }
      ];
      
      enemyPieces.forEach((pieceType, index) => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'rook', color: 'white' };
        
        const capturePos = capturePositions[index];
        freshGame.board[capturePos.row][capturePos.col] = { type: pieceType, color: 'black' };
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to: capturePos });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[capturePos.row][capturePos.col]).toEqual({ type: 'rook', color: 'white' });
      });
    });

    test('should capture enemy pieces vertically', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      
      const enemyPieces = ['pawn', 'knight', 'bishop', 'queen', 'rook'];
      const capturePositions = [
        { row: 2, col: 4 }, { row: 6, col: 4 }, { row: 1, col: 4 }, 
        { row: 7, col: 4 }, { row: 0, col: 4 }
      ];
      
      enemyPieces.forEach((pieceType, index) => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'rook', color: 'white' };
        
        const capturePos = capturePositions[index];
        freshGame.board[capturePos.row][capturePos.col] = { type: pieceType, color: 'black' };
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to: capturePos });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[capturePos.row][capturePos.col]).toEqual({ type: 'rook', color: 'white' });
      });
    });

    test('should not capture own pieces', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'white' };
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 2 } });
      testUtils.validateErrorResponse(result);
    });

    test('should capture and stop at enemy piece', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'black' }; // Enemy piece to capture
      
      // Should be able to capture the enemy piece
      const captureResult = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 2 } });
      testUtils.validateSuccessResponse(captureResult);
      expect(game.board[4][2]).toEqual({ type: 'rook', color: 'white' });
      
      // But should not be able to move past it in a single move
      const freshGame = testUtils.createFreshGame();
      freshGame.board[4][4] = { type: 'rook', color: 'white' };
      freshGame.board[4][2] = { type: 'pawn', color: 'black' };
      
      const pastResult = freshGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 0 } });
      testUtils.validateErrorResponse(pastResult);
    });
  });

  describe('Rook Movement at Board Boundaries', () => {
    test('should handle movement from corner positions', () => {
      const cornerPositions = [
        { row: 0, col: 0 }, // Top-left corner
        { row: 0, col: 7 }, // Top-right corner
        { row: 7, col: 0 }, // Bottom-left corner
        { row: 7, col: 7 }  // Bottom-right corner
      ];
      
      cornerPositions.forEach(pos => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[pos.row][pos.col] = { type: 'rook', color: 'white' };
        
        // Clear paths for testing
        for (let i = 0; i < 8; i++) {
          if (i !== pos.col) freshGame.board[pos.row][i] = null; // Clear row
          if (i !== pos.row) freshGame.board[i][pos.col] = null; // Clear column
        }
        
        // Test movement along row and column
        const testMoves = [
          { row: pos.row, col: pos.col === 0 ? 7 : 0 }, // Opposite end of row
          { row: pos.row === 0 ? 7 : 0, col: pos.col }  // Opposite end of column
        ];
        
        testMoves.forEach(to => {
          const result = freshGame.makeMove({ from: pos, to });
          testUtils.validateSuccessResponse(result);
          expect(freshGame.board[to.row][to.col]).toEqual({ type: 'rook', color: 'white' });
        });
      });
    });

    test('should handle movement from edge positions', () => {
      const edgePositions = [
        { row: 0, col: 3 }, // Top edge
        { row: 3, col: 0 }, // Left edge
        { row: 3, col: 7 }, // Right edge
        { row: 7, col: 3 }  // Bottom edge
      ];
      
      edgePositions.forEach(pos => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[pos.row][pos.col] = { type: 'rook', color: 'white' };
        
        // Clear paths
        for (let i = 0; i < 8; i++) {
          if (i !== pos.col) freshGame.board[pos.row][i] = null;
          if (i !== pos.row) freshGame.board[i][pos.col] = null;
        }
        
        // Test movement to opposite edges
        const testMoves = [
          { row: pos.row, col: pos.col === 0 ? 7 : (pos.col === 7 ? 0 : (pos.col < 4 ? 7 : 0)) },
          { row: pos.row === 0 ? 7 : (pos.row === 7 ? 0 : (pos.row < 4 ? 7 : 0)), col: pos.col }
        ];
        
        testMoves.forEach(to => {
          const result = freshGame.makeMove({ from: pos, to });
          testUtils.validateSuccessResponse(result);
        });
      });
    });

    test('should reject moves that go off the board', () => {
      game.board[0][0] = { type: 'rook', color: 'white' };
      
      const offBoardMoves = [
        { row: -1, col: 0 }, { row: 0, col: -1 },
        { row: 8, col: 0 }, { row: 0, col: 8 }
      ];
      
      offBoardMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 0, col: 0 }, to });
        testUtils.validateErrorResponse(result);
      });
    });
  });

  describe('Rook Movement in Complex Positions', () => {
    test('should handle movement in crowded board positions', () => {
      // Create a complex middle game position
      const complexGame = testUtils.createFreshGame();
      
      // Make several moves to create complexity
      complexGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e4
      complexGame.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // e5
      complexGame.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }); // Nc3
      complexGame.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }); // Nc6
      complexGame.makeMove({ from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }); // Bc4
      complexGame.makeMove({ from: { row: 0, col: 5 }, to: { row: 3, col: 2 } }); // Bc5
      
      // Clear path for rook and test movement
      complexGame.board[7][1] = null; // Remove knight
      complexGame.board[7][2] = null; // Remove bishop
      complexGame.board[7][3] = null; // Remove queen
      
      const result = complexGame.makeMove({ from: { row: 7, col: 0 }, to: { row: 7, col: 3 } });
      testUtils.validateSuccessResponse(result);
    });

    test('should handle rook and queen coordination', () => {
      // Set up position with rook and queen on same file/rank
      const coordGame = testUtils.createFreshGame();
      coordGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      coordGame.board[0][4] = { type: 'king', color: 'black' };
      coordGame.board[7][4] = { type: 'king', color: 'white' };
      coordGame.board[4][0] = { type: 'rook', color: 'white' };
      coordGame.board[4][7] = { type: 'queen', color: 'white' };
      
      // Rook should be able to move along the rank
      const result = coordGame.makeMove({ from: { row: 4, col: 0 }, to: { row: 4, col: 3 } });
      testUtils.validateSuccessResponse(result);
    });

    test('should handle rook in endgame scenarios', () => {
      // Create rook endgame
      const endgame = testUtils.createFreshGame();
      endgame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      endgame.board[0][4] = { type: 'king', color: 'black' };
      endgame.board[7][4] = { type: 'king', color: 'white' };
      endgame.board[1][0] = { type: 'rook', color: 'white' };
      endgame.board[6][7] = { type: 'rook', color: 'black' };
      
      // White rook should be able to move freely
      const result = endgame.makeMove({ from: { row: 1, col: 0 }, to: { row: 1, col: 7 } });
      testUtils.validateSuccessResponse(result);
    });
  });

  describe('Performance Tests', () => {
    test('should validate rook moves efficiently', () => {
      const startTime = Date.now();
      
      // Test 1000 rook move validations
      for (let i = 0; i < 1000; i++) {
        const freshGame = testUtils.createFreshGame();
        // Clear path and move rook
        freshGame.board[7][1] = null;
        freshGame.board[7][2] = null;
        freshGame.board[7][3] = null;
        freshGame.makeMove({ from: { row: 7, col: 0 }, to: { row: 7, col: 3 } });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 50ms
      expect(duration).toBeLessThan(50);
    });

    test('should handle complex rook scenarios efficiently', () => {
      const startTime = Date.now();
      
      // Test complex rook movement scenarios
      for (let i = 0; i < 100; i++) {
        const freshGame = testUtils.createFreshGame();
        
        // Clear paths and execute rook moves
        freshGame.board[7][1] = null;
        freshGame.board[7][2] = null;
        freshGame.board[7][3] = null;
        freshGame.makeMove({ from: { row: 7, col: 0 }, to: { row: 7, col: 3 } }); // Rd1
        freshGame.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }); // e6
        freshGame.makeMove({ from: { row: 7, col: 3 }, to: { row: 3, col: 3 } }); // Rd4
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});