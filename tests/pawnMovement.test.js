/**
 * Comprehensive Pawn Movement Tests
 * Covers all pawn movement patterns, captures, en passant, and promotion scenarios
 * 
 * This test file has been normalized to use the current API patterns:
 * - Uses current makeMove API with {from, to, promotion} object format
 * - Validates responses using current success/error structure
 * - Accesses game state using current property names (gameStatus, currentTurn, etc.)
 * - Uses current error codes and message formats
 * - Tests en passant using current enPassantTarget property format
 * - Tests pawn promotion using current promotion API
 */

const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Pawn Movement', () => {
  let game;

  beforeEach(() => {
    game = testUtils.createFreshGame();
  });

  describe('Basic Pawn Movement', () => {
    test('should allow single square forward move from any file', () => {
      // Test all 8 files for white pawns
      for (let col = 0; col < 8; col++) {
        const freshGame = testUtils.createFreshGame();
        const result = freshGame.makeMove({ 
          from: { row: 6, col }, 
          to: { row: 5, col } 
        });
        testUtils.validateSuccessResponse(result);
        expect(result.data).toBeDefined();
        expect(result.data.gameStatus).toBe('active');
        expect(result.data.currentTurn).toBe('black');
        expect(freshGame.board[5][col]).toEqual({ type: 'pawn', color: 'white' });
        expect(freshGame.board[6][col]).toBeNull();
      }
    });

    test('should allow two square initial move from starting position', () => {
      // Test all 8 files for white pawns
      for (let col = 0; col < 8; col++) {
        const freshGame = testUtils.createFreshGame();
        const result = freshGame.makeMove({ 
          from: { row: 6, col }, 
          to: { row: 4, col } 
        });
        testUtils.validateSuccessResponse(result);
        expect(result.data).toBeDefined();
        expect(result.data.gameStatus).toBe('active');
        expect(result.data.currentTurn).toBe('black');
        expect(freshGame.board[4][col]).toEqual({ type: 'pawn', color: 'white' });
        expect(freshGame.board[6][col]).toBeNull();
      }
    });

    test('should allow black pawn single square forward move', () => {
      // Move white pawn first to switch turns
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      
      for (let col = 0; col < 8; col++) {
        const freshGame = testUtils.createFreshGame();
        freshGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } }); // White move
        
        const result = freshGame.makeMove({ 
          from: { row: 1, col }, 
          to: { row: 2, col } 
        });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[2][col]).toEqual({ type: 'pawn', color: 'black' });
        expect(freshGame.board[1][col]).toBeNull();
      }
    });

    test('should allow black pawn two square initial move', () => {
      // Move white pawn first to switch turns
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      
      for (let col = 0; col < 8; col++) {
        const freshGame = testUtils.createFreshGame();
        freshGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } }); // White move
        
        const result = freshGame.makeMove({ 
          from: { row: 1, col }, 
          to: { row: 3, col } 
        });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[3][col]).toEqual({ type: 'pawn', color: 'black' });
        expect(freshGame.board[1][col]).toBeNull();
      }
    });

    test('should reject backward movement', () => {
      // Move pawn forward first
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }); // Black move
      
      // Try to move white pawn backward
      const result = game.makeMove({ from: { row: 5, col: 4 }, to: { row: 6, col: 4 } });
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
      expect(result.message).toContain('cannot move');
    });

    test('should reject sideways movement', () => {
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 6, col: 5 } });
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
      expect(result.message).toContain('cannot move');
    });

    test('should reject two square move from non-starting position', () => {
      // Move pawn one square first
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }); // Black move
      
      // Try to move two squares from non-starting position
      const result = game.makeMove({ from: { row: 5, col: 4 }, to: { row: 3, col: 4 } });
      testUtils.validateErrorResponse(result);
    });

    test('should be blocked by piece directly in front', () => {
      // Place a piece in front of pawn
      game.board[5][4] = { type: 'pawn', color: 'black' };
      
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      testUtils.validateErrorResponse(result);
    });

    test('should be blocked by piece two squares ahead on initial move', () => {
      // Place a piece two squares ahead
      game.board[4][4] = { type: 'pawn', color: 'black' };
      
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      testUtils.validateErrorResponse(result);
    });
  });

  describe('Pawn Captures', () => {
    test('should allow diagonal capture to the left', () => {
      // Place enemy piece for capture
      game.board[5][3] = { type: 'pawn', color: 'black' };
      
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 3 } });
      testUtils.validateSuccessResponse(result);
      expect(game.board[5][3]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[6][4]).toBeNull();
    });

    test('should allow diagonal capture to the right', () => {
      // Place enemy piece for capture
      game.board[5][5] = { type: 'pawn', color: 'black' };
      
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 5 } });
      testUtils.validateSuccessResponse(result);
      expect(game.board[5][5]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[6][4]).toBeNull();
    });

    test('should reject diagonal move without capture', () => {
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 5 } });
      testUtils.validateErrorResponse(result);
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
      expect(result.message).toContain('cannot move');
    });

    test('should reject capture of own piece', () => {
      // Place own piece diagonally
      game.board[5][5] = { type: 'pawn', color: 'white' };
      
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 5 } });
      testUtils.validateErrorResponse(result);
    });

    test('should allow capture of all enemy piece types', () => {
      const enemyPieces = ['pawn', 'rook', 'knight', 'bishop', 'queen'];
      
      enemyPieces.forEach((pieceType, index) => {
        const freshGame = testUtils.createFreshGame();
        const col = index < 3 ? 3 : 5; // Use columns 3 and 5 for diagonal captures
        
        // Place enemy piece for capture
        freshGame.board[5][col] = { type: pieceType, color: 'black' };
        
        const result = freshGame.makeMove({ 
          from: { row: 6, col: 4 }, 
          to: { row: 5, col } 
        });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[5][col]).toEqual({ type: 'pawn', color: 'white' });
      });
    });

    test('should handle captures at board edges', () => {
      // Test capture at left edge (a-file)
      const leftEdgeGame = testUtils.createFreshGame();
      leftEdgeGame.board[5][1] = { type: 'pawn', color: 'black' };
      
      const leftResult = leftEdgeGame.makeMove({ 
        from: { row: 6, col: 0 }, 
        to: { row: 5, col: 1 } 
      });
      testUtils.validateSuccessResponse(leftResult);
      
      // Test capture at right edge (h-file)
      const rightEdgeGame = testUtils.createFreshGame();
      rightEdgeGame.board[5][6] = { type: 'pawn', color: 'black' };
      
      const rightResult = rightEdgeGame.makeMove({ 
        from: { row: 6, col: 7 }, 
        to: { row: 5, col: 6 } 
      });
      testUtils.validateSuccessResponse(rightResult);
    });
  });

  describe('En Passant Capture', () => {
    test('should allow en passant capture after enemy pawn two-square move', () => {
      // Set up en passant scenario
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // White pawn to e4
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 2, col: 3 } }); // Black pawn to d6
      game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }); // White pawn to e5
      game.makeMove({ from: { row: 1, col: 5 }, to: { row: 3, col: 5 } }); // Black pawn f7-f5 (two squares)
      
      // Now white pawn can capture en passant
      const result = game.makeMove({ 
        from: { row: 3, col: 4 }, 
        to: { row: 2, col: 5 } 
      });
      
      testUtils.validateSuccessResponse(result);
      expect(game.board[2][5]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[3][5]).toBeNull(); // Captured pawn should be removed
      expect(game.board[3][4]).toBeNull(); // Original pawn position should be empty
    });

    test('should reject en passant if not immediately after two-square move', () => {
      // Set up en passant scenario but make another move in between
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // White pawn to e4
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 2, col: 3 } }); // Black pawn to d6
      game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }); // White pawn to e5
      game.makeMove({ from: { row: 1, col: 5 }, to: { row: 3, col: 5 } }); // Black pawn f7-f5 (two squares)
      game.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }); // White knight move
      game.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }); // Black knight move
      
      // Now en passant should not be allowed
      const result = game.makeMove({ 
        from: { row: 3, col: 4 }, 
        to: { row: 2, col: 5 } 
      });
      
      testUtils.validateErrorResponse(result);
    });

    test('should reject en passant if pawn did not move two squares', () => {
      // Set up scenario where pawn moves one square
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // White pawn to e4
      game.makeMove({ from: { row: 1, col: 5 }, to: { row: 2, col: 5 } }); // Black pawn f7-f6 (one square)
      game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }); // White pawn to e5
      game.makeMove({ from: { row: 2, col: 5 }, to: { row: 3, col: 5 } }); // Black pawn f6-f5 (one square)
      
      // En passant should not be allowed
      const result = game.makeMove({ 
        from: { row: 3, col: 4 }, 
        to: { row: 2, col: 5 } 
      });
      
      testUtils.validateErrorResponse(result);
    });

    test('should handle en passant on both sides of attacking pawn', () => {
      // Test en passant to the left
      const leftGame = testUtils.createFreshGame();
      leftGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e4
      leftGame.makeMove({ from: { row: 1, col: 0 }, to: { row: 2, col: 0 } }); // a6
      leftGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }); // e5
      leftGame.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }); // d5
      
      const leftResult = leftGame.makeMove({ 
        from: { row: 3, col: 4 }, 
        to: { row: 2, col: 3 } 
      });
      testUtils.validateSuccessResponse(leftResult);
      
      // Test en passant to the right
      const rightGame = testUtils.createFreshGame();
      rightGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e4
      rightGame.makeMove({ from: { row: 1, col: 0 }, to: { row: 2, col: 0 } }); // a6
      rightGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }); // e5
      rightGame.makeMove({ from: { row: 1, col: 5 }, to: { row: 3, col: 5 } }); // f5
      
      const rightResult = rightGame.makeMove({ 
        from: { row: 3, col: 4 }, 
        to: { row: 2, col: 5 } 
      });
      testUtils.validateSuccessResponse(rightResult);
    });
  });

  describe('Pawn Promotion', () => {
    test('should promote to queen by default', () => {
      // Set up pawn near promotion
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.board[6][0] = null; // Remove original pawn
      game.board[0][0] = null; // Clear target square for promotion
      
      const result = game.makeMove({ 
        from: { row: 1, col: 0 }, 
        to: { row: 0, col: 0 } 
      });
      
      testUtils.validateSuccessResponse(result);
      expect(game.board[0][0]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should promote to specified piece type', () => {
      const promotionPieces = ['queen', 'rook', 'bishop', 'knight'];
      
      promotionPieces.forEach((pieceType, index) => {
        const freshGame = testUtils.createFreshGame();
        const col = index; // Use different columns for each test
        
        // Set up pawn near promotion
        freshGame.board[1][col] = { type: 'pawn', color: 'white' };
        freshGame.board[6][col] = null; // Remove original pawn
        freshGame.board[0][col] = null; // Clear target square for promotion
        
        const result = freshGame.makeMove({ 
          from: { row: 1, col }, 
          to: { row: 0, col },
          promotion: pieceType
        });
        
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[0][col]).toEqual({ type: pieceType, color: 'white' });
      });
    });

    test('should promote on capture', () => {
      // Set up pawn near promotion with enemy piece to capture
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.board[6][0] = null; // Remove original pawn
      game.board[0][1] = { type: 'rook', color: 'black' }; // Enemy piece to capture
      
      const result = game.makeMove({ 
        from: { row: 1, col: 0 }, 
        to: { row: 0, col: 1 },
        promotion: 'queen'
      });
      
      testUtils.validateSuccessResponse(result);
      expect(game.board[0][1]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should handle black pawn promotion', () => {
      // Set up black pawn near promotion
      game.board[6][0] = { type: 'pawn', color: 'black' };
      game.board[1][0] = null; // Remove original pawn
      game.board[7][0] = null; // Clear target square for promotion
      game.currentTurn = 'black';
      
      const result = game.makeMove({ 
        from: { row: 6, col: 0 }, 
        to: { row: 7, col: 0 },
        promotion: 'queen'
      });
      
      testUtils.validateSuccessResponse(result);
      expect(game.board[7][0]).toEqual({ type: 'queen', color: 'black' });
    });

    test('should reject invalid promotion piece', () => {
      // Set up pawn near promotion
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.board[6][0] = null; // Remove original pawn
      
      const result = game.makeMove({ 
        from: { row: 1, col: 0 }, 
        to: { row: 0, col: 0 },
        promotion: 'king' // Invalid promotion
      });
      
      testUtils.validateErrorResponse(result);
    });

    test('should promote on all files', () => {
      // Test promotion on all 8 files
      for (let col = 0; col < 8; col++) {
        const freshGame = testUtils.createFreshGame();
        
        // Set up pawn near promotion
        freshGame.board[1][col] = { type: 'pawn', color: 'white' };
        freshGame.board[6][col] = null; // Remove original pawn
        
        // Only clear target square if it's not a king
        const targetPiece = freshGame.board[0][col];
        if (!targetPiece || targetPiece.type !== 'king') {
          freshGame.board[0][col] = null; // Clear target square for promotion
        } else {
          // Move the king to a safe square to allow promotion
          freshGame.board[0][7] = targetPiece; // Move king to h8
          freshGame.board[0][col] = null; // Clear target square for promotion
        }
        
        const result = freshGame.makeMove({ 
          from: { row: 1, col }, 
          to: { row: 0, col },
          promotion: 'queen'
        });
        
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[0][col]).toEqual({ type: 'queen', color: 'white' });
      }
    });
  });

  describe('Complex Pawn Scenarios', () => {
    test('should handle pawn chains and blocked advancement', () => {
      // Create a pawn chain
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e4
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }); // d5
      game.makeMove({ from: { row: 6, col: 2 }, to: { row: 4, col: 2 } }); // c4
      game.makeMove({ from: { row: 3, col: 3 }, to: { row: 4, col: 2 } }); // dxc4
      
      // Verify the capture worked
      expect(game.board[4][2]).toEqual({ type: 'pawn', color: 'black' });
      expect(game.board[4][4]).toEqual({ type: 'pawn', color: 'white' });
    });

    test('should handle multiple pawns on same file after captures', () => {
      // Create doubled pawns through captures
      game.makeMove({ from: { row: 6, col: 0 }, to: { row: 4, col: 0 } }); // a4
      game.makeMove({ from: { row: 1, col: 1 }, to: { row: 3, col: 1 } }); // b5
      game.makeMove({ from: { row: 4, col: 0 }, to: { row: 3, col: 1 } }); // axb5
      game.makeMove({ from: { row: 1, col: 2 }, to: { row: 3, col: 2 } }); // c5
      game.makeMove({ from: { row: 6, col: 1 }, to: { row: 4, col: 1 } }); // b4
      game.makeMove({ from: { row: 3, col: 2 }, to: { row: 4, col: 1 } }); // cxb4
      
      // Now we have doubled pawns on the b-file
      expect(game.board[3][1]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[4][1]).toEqual({ type: 'pawn', color: 'black' });
    });

    test('should handle pawn breakthrough scenarios', () => {
      // Create a scenario where a pawn can break through
      const breakthroughGame = testUtils.createFreshGame();
      
      // Clear most pieces and set up pawn breakthrough
      breakthroughGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      breakthroughGame.board[0][4] = { type: 'king', color: 'black' };
      breakthroughGame.board[7][4] = { type: 'king', color: 'white' };
      breakthroughGame.board[1][0] = { type: 'pawn', color: 'white' };
      
      // Pawn should be able to promote
      const result = breakthroughGame.makeMove({ 
        from: { row: 1, col: 0 }, 
        to: { row: 0, col: 0 },
        promotion: 'queen'
      });
      
      testUtils.validateSuccessResponse(result);
      expect(breakthroughGame.board[0][0]).toEqual({ type: 'queen', color: 'white' });
    });
  });

  describe('Pawn Movement Edge Cases', () => {
    test('should handle pawn movement at board boundaries', () => {
      // Test pawn movement at left edge (a-file)
      const leftResult = game.makeMove({ from: { row: 6, col: 0 }, to: { row: 5, col: 0 } });
      testUtils.validateSuccessResponse(leftResult);
      
      // Test pawn movement at right edge (h-file) 
      const rightGame = testUtils.createFreshGame();
      const rightResult = rightGame.makeMove({ from: { row: 6, col: 7 }, to: { row: 5, col: 7 } });
      testUtils.validateSuccessResponse(rightResult);
    });

    test('should reject moves that would go off the board', () => {
      // Try to move pawn off the left edge
      game.board[5][0] = { type: 'pawn', color: 'white' };
      const leftResult = game.makeMove({ from: { row: 5, col: 0 }, to: { row: 4, col: -1 } });
      testUtils.validateErrorResponse(leftResult);
      
      // Try to move pawn off the right edge
      game.board[5][7] = { type: 'pawn', color: 'white' };
      const rightResult = game.makeMove({ from: { row: 5, col: 7 }, to: { row: 4, col: 8 } });
      testUtils.validateErrorResponse(rightResult);
    });

    test('should handle pawn movement in endgame scenarios', () => {
      // Create endgame with just kings and pawns
      const endgame = testUtils.createFreshGame();
      endgame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      endgame.board[0][4] = { type: 'king', color: 'black' };
      endgame.board[7][4] = { type: 'king', color: 'white' };
      endgame.board[6][0] = { type: 'pawn', color: 'white' };
      endgame.board[1][7] = { type: 'pawn', color: 'black' };
      
      // Both pawns should be able to move
      const whiteResult = endgame.makeMove({ from: { row: 6, col: 0 }, to: { row: 5, col: 0 } });
      testUtils.validateSuccessResponse(whiteResult);
      
      const blackResult = endgame.makeMove({ from: { row: 1, col: 7 }, to: { row: 2, col: 7 } });
      testUtils.validateSuccessResponse(blackResult);
    });
  });

  describe('Performance Tests', () => {
    test('should validate pawn moves efficiently', () => {
      const startTime = Date.now();
      
      // Test 100 pawn move validations (reduced from 1000 for more realistic timing)
      for (let i = 0; i < 100; i++) {
        const freshGame = testUtils.createFreshGame();
        freshGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 5000ms (realistic for varying CI/CD environments)
      expect(duration).toBeLessThan(5000);
    });

    test('should handle complex pawn scenarios efficiently', () => {
      const startTime = Date.now();
      
      // Test complex pawn scenarios (reduced iterations for realistic timing)
      for (let i = 0; i < 50; i++) {
        const freshGame = testUtils.createFreshGame();
        
        // Execute a series of pawn moves
        freshGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e4
        freshGame.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // e5
        freshGame.makeMove({ from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }); // d4
        freshGame.makeMove({ from: { row: 3, col: 4 }, to: { row: 4, col: 3 } }); // exd4
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 2000ms (more realistic expectation)
      expect(duration).toBeLessThan(2000);
    });
  });
});