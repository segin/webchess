/**
 * Comprehensive Rook Movement Tests
 * Covers horizontal and vertical movement, path validation, and complex board positions
 */

const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Rook Movement', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
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
        const freshGame = new ChessGame();
        freshGame.board[4][4] = { type: 'rook', color: 'white' };
        // Clear horizontal path
        for (let col = 0; col < 8; col++) {
          if (col !== 4) freshGame.board[4][col] = null;
        }
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
        expect(freshGame.board[to.row][to.col]).toEqual({ type: 'rook', color: 'white' });
        expect(freshGame.board[4][4]).toBeNull();
      });
    });

    test('should allow vertical movement in both directions', () => {
      // Test movement to vertical positions (avoiding king positions)
      const verticalMoves = [
        { row: 1, col: 4 }, { row: 2, col: 4 }, { row: 3, col: 4 },
        { row: 5, col: 4 }, { row: 6, col: 4 }
      ];
      
      verticalMoves.forEach(to => {
        const freshGame = new ChessGame();
        freshGame.board[4][4] = { type: 'rook', color: 'white' };
        // Clear vertical path
        for (let row = 1; row < 7; row++) {
          if (row !== 4) {
            freshGame.board[row][4] = null;
          }
        }
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
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
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
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
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        expect(result.errorCode).toBe('INVALID_MOVEMENT');
      });
    });

    test('should reject staying in same position', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 4 } });
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('INVALID_COORDINATES');
    });
  });

  describe('Rook Movement from Starting Positions', () => {
    test('should handle initial rook positions correctly', () => {
      // Test white rooks from starting positions (need to clear path first)
      const whiteRookTests = [
        {
          from: { row: 7, col: 0 }, // a1 rook
          to: { row: 7, col: 3 },   // Move to d1
          clearSquares: [{ row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 }] // Clear b1, c1, d1
        },
        {
          from: { row: 7, col: 7 }, // h1 rook
          to: { row: 7, col: 5 },   // Move to f1
          clearSquares: [{ row: 7, col: 6 }, { row: 7, col: 5 }] // Clear g1, f1
        }
      ];
      
      whiteRookTests.forEach(test => {
        const freshGame = new ChessGame();
        
        // Clear the path
        test.clearSquares.forEach(square => {
          freshGame.board[square.row][square.col] = null;
        });
        
        const result = freshGame.makeMove({ from: test.from, to: test.to });
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
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
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
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
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        expect(result.errorCode).toBe('CAPTURE_OWN_PIECE');
      });
    });
  });

  describe('Path Obstruction and Blocking', () => {
    test('should be blocked by own pieces in horizontal path', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'white' }; // Blocking piece
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 0 } });
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('PATH_BLOCKED');
    });

    test('should be blocked by enemy pieces in horizontal path', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'black' }; // Blocking piece
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 0 } });
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('PATH_BLOCKED');
    });

    test('should be blocked by own pieces in vertical path', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[2][4] = { type: 'pawn', color: 'white' }; // Blocking piece
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 0, col: 4 } });
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('PATH_BLOCKED');
    });

    test('should be blocked by enemy pieces in vertical path', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[2][4] = { type: 'pawn', color: 'black' }; // Blocking piece
      
      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 0, col: 4 } });
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('PATH_BLOCKED');
    });

    test('should allow movement up to blocking piece but not beyond', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'black' }; // Blocking piece
      
      // Should be able to move to the square just before the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 3 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
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
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        expect(result.errorCode).toBe('PATH_BLOCKED');
      });
      
      // But should be able to move to squares just before blocks
      const allowedMoves = [
        { row: 4, col: 3 }, // Just before pawn
        { row: 4, col: 5 }, // Just before knight
        { row: 3, col: 4 }, // Just before bishop
        { row: 5, col: 4 }  // Just before queen
      ];
      
      allowedMoves.forEach(to => {
        const freshGame = new ChessGame();
        freshGame.board[4][4] = { type: 'rook', color: 'white' };
        freshGame.board[4][2] = { type: 'pawn', color: 'black' };
        freshGame.board[4][6] = { type: 'knight', color: 'white' };
        freshGame.board[2][4] = { type: 'bishop', color: 'black' };
        freshGame.board[6][4] = { type: 'queen', color: 'white' };
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
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
        const freshGame = new ChessGame();
        freshGame.board[4][4] = { type: 'rook', color: 'white' };
        
        const capturePos = capturePositions[index];
        freshGame.board[capturePos.row][capturePos.col] = { type: pieceType, color: 'black' };
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to: capturePos });
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
        expect(freshGame.board[capturePos.row][capturePos.col]).toEqual({ type: 'rook', color: 'white' });
      });
    });

    test('should capture enemy pieces vertically', () => {
      const enemyPieces = ['pawn', 'knight', 'bishop', 'queen', 'rook'];
      const capturePositions = [
        { row: 2, col: 4 }, { row: 5, col: 4 }, { row: 3, col: 4 }, 
        { row: 1, col: 4 }, { row: 0, col: 4 }
      ];
      
      enemyPieces.forEach((pieceType, index) => {
        const freshGame = new ChessGame();
        // Clear the board and set up clean test
        freshGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
        freshGame.board[7][4] = { type: 'king', color: 'white' };
        freshGame.board[0][3] = { type: 'king', color: 'black' }; // Move black king away from e-file
        freshGame.board[4][4] = { type: 'rook', color: 'white' };
        
        const capturePos = capturePositions[index];
        freshGame.board[capturePos.row][capturePos.col] = { type: pieceType, color: 'black' };
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to: capturePos });
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
        expect(freshGame.board[capturePos.row][capturePos.col]).toEqual({ type: 'rook', color: 'white' });
      });
    });

    test('should not capture own pieces', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'white' };
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 2 } });
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBe('CAPTURE_OWN_PIECE');
    });

    test('should capture and stop at enemy piece', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'black' }; // Enemy piece to capture
      
      // Should be able to capture the enemy piece
      const captureResult = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 2 } });
      expect(captureResult.success).toBe(true);
      expect(captureResult.message).toBeDefined();
      expect(captureResult.data).toBeDefined();
      expect(game.board[4][2]).toEqual({ type: 'rook', color: 'white' });
      
      // But should not be able to move past it in a single move
      const freshGame = new ChessGame();
      freshGame.board[4][4] = { type: 'rook', color: 'white' };
      freshGame.board[4][2] = { type: 'pawn', color: 'black' };
      
      const pastResult = freshGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 0 } });
      expect(pastResult.success).toBe(false);
      expect(pastResult.message).toBeDefined();
      expect(pastResult.errorCode).toBe('PATH_BLOCKED');
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
        // Test movement along row and column, avoiding king positions
        const testMoves = [];
        
        // Add horizontal moves (avoiding king columns 4)
        if (pos.row === 0 || pos.row === 7) {
          // For rows with kings, test moves that don't conflict with king positions
          if (pos.col === 0) {
            testMoves.push({ row: pos.row, col: 3 }); // Move to column 3
          } else if (pos.col === 7) {
            testMoves.push({ row: pos.row, col: 5 }); // Move to column 5
          }
        }
        
        // Add vertical moves (avoiding king rows 0 and 7)
        if (pos.col === 0 || pos.col === 7) {
          testMoves.push({ row: pos.row === 0 ? 3 : 4, col: pos.col }); // Move to middle rows
        }
        
        testMoves.forEach(to => {
          const moveGame = new ChessGame();
          
          // Clear the original piece at corner position
          moveGame.board[pos.row][pos.col] = null;
          
          // Place rook at corner position
          moveGame.board[pos.row][pos.col] = { type: 'rook', color: 'white' };
          
          // Clear the destination square
          moveGame.board[to.row][to.col] = null;
          
          // Clear path between source and destination
          if (pos.row === to.row) {
            // Horizontal movement - clear row
            const startCol = Math.min(pos.col, to.col);
            const endCol = Math.max(pos.col, to.col);
            for (let col = startCol + 1; col < endCol; col++) {
              moveGame.board[pos.row][col] = null;
            }
          } else {
            // Vertical movement - clear column
            const startRow = Math.min(pos.row, to.row);
            const endRow = Math.max(pos.row, to.row);
            for (let row = startRow + 1; row < endRow; row++) {
              moveGame.board[row][pos.col] = null;
            }
          }
          
          const result = moveGame.makeMove({ from: pos, to });
          expect(result.success).toBe(true);
          expect(result.message).toBeDefined();
          expect(result.data).toBeDefined();
          expect(moveGame.board[to.row][to.col]).toEqual({ type: 'rook', color: 'white' });
        });
      });
    });

    test('should handle movement from edge positions', () => {
      // Test only positions that don't conflict with king positions
      const edgePositions = [
        { row: 3, col: 0 }, // Left edge
        { row: 3, col: 7 }, // Right edge
      ];
      
      edgePositions.forEach(pos => {
        // For left/right edges, move vertically to safe rows
        const testMoves = [{ row: pos.row === 3 ? 5 : 2, col: pos.col }];
        
        testMoves.forEach(to => {
          const moveGame = new ChessGame();
          
          // Clear the original piece at edge position (if any)
          moveGame.board[pos.row][pos.col] = null;
          
          // Place rook at edge position
          moveGame.board[pos.row][pos.col] = { type: 'rook', color: 'white' };
          
          // Clear the destination square (if any)
          moveGame.board[to.row][to.col] = null;
          
          // Clear path between source and destination
          const startRow = Math.min(pos.row, to.row);
          const endRow = Math.max(pos.row, to.row);
          for (let row = startRow + 1; row < endRow; row++) {
            moveGame.board[row][pos.col] = null;
          }
          
          const result = moveGame.makeMove({ from: pos, to });
          expect(result.success).toBe(true);
          expect(result.message).toBeDefined();
          expect(result.data).toBeDefined();
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
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        expect(result.errorCode).toBe('INVALID_COORDINATES');
      });
    });
  });

  describe('Rook Movement in Complex Positions', () => {
    test('should handle movement in crowded board positions', () => {
      // Create a complex middle game position
      const complexGame = new ChessGame();
      
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
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
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
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
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
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should validate rook moves efficiently', () => {
      const startTime = Date.now();
      
      // Test 1000 rook move validations
      for (let i = 0; i < 1000; i++) {
        const freshGame = new ChessGame();
        // Clear path and move rook
        freshGame.board[7][1] = null;
        freshGame.board[7][2] = null;
        freshGame.board[7][3] = null;
        freshGame.makeMove({ from: { row: 7, col: 0 }, to: { row: 7, col: 3 } });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 10000ms (10 seconds)
      expect(duration).toBeLessThan(10000);
    });

    test('should handle complex rook scenarios efficiently', () => {
      const startTime = Date.now();
      
      // Test complex rook movement scenarios
      for (let i = 0; i < 100; i++) {
        const freshGame = new ChessGame();
        
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
      
      // Should complete in under 3000ms (3 seconds)
      expect(duration).toBeLessThan(3000);
    });
  });
});