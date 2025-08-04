/**
 * Comprehensive King Movement Tests
 * Covers single-square movement, castling rules, and all FIDE edge cases
 */

const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive King Movement', () => {
  let game;

  beforeEach(() => {
    game = testUtils.createFreshGame();
  });

  describe('Basic King Movement Patterns', () => {
    test('should allow single square movement in all 8 directions', () => {
      // Place king in center for testing
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
      
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
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[to.row][to.col]).toEqual({ type: 'king', color: 'white' });
        expect(freshGame.board[4][4]).toBeNull();
      });
    });

    test('should reject multi-square movement', () => {
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
      
      const invalidMoves = [
        { row: 2, col: 4 }, { row: 6, col: 4 }, // Vertical 2 squares
        { row: 4, col: 2 }, { row: 4, col: 6 }, // Horizontal 2 squares
        { row: 2, col: 2 }, { row: 6, col: 6 }, // Diagonal 2 squares
        { row: 1, col: 4 }, { row: 7, col: 4 }, // Vertical 3 squares
        { row: 4, col: 1 }, { row: 4, col: 7 }  // Horizontal 3 squares
      ];
      
      invalidMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });

    test('should reject knight-like moves', () => {
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
      
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
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 4 } });
      testUtils.validateErrorResponse(result);
    });
  });

  describe('King Movement from Starting Position', () => {
    test('should not be able to move initially due to blocking pieces', () => {
      const blockedMoves = [
        { from: { row: 7, col: 4 }, to: { row: 7, col: 3 } }, // Blocked by queen
        { from: { row: 7, col: 4 }, to: { row: 7, col: 5 } }, // Blocked by bishop
        { from: { row: 7, col: 4 }, to: { row: 6, col: 3 } }, // Blocked by pawn
        { from: { row: 7, col: 4 }, to: { row: 6, col: 4 } }, // Blocked by pawn
        { from: { row: 7, col: 4 }, to: { row: 6, col: 5 } }  // Blocked by pawn
      ];
      
      blockedMoves.forEach(move => {
        const result = game.makeMove(move);
        testUtils.validateErrorResponse(result);
      });
    });

    test('should allow king movement after clearing path', () => {
      // Clear path for white king
      game.board[6][4] = null; // Clear e2 pawn
      
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 6, col: 4 } });
      testUtils.validateSuccessResponse(result);
      expect(game.board[6][4]).toEqual({ type: 'king', color: 'white' });
    });

    test('should handle black king movement', () => {
      // Move white piece first to switch turns
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      
      // Clear path for black king and test movement
      game.board[1][4] = null; // Clear e7 pawn
      
      const result = game.makeMove({ from: { row: 0, col: 4 }, to: { row: 1, col: 4 } });
      testUtils.validateSuccessResponse(result);
      expect(game.board[1][4]).toEqual({ type: 'king', color: 'black' });
    });
  });

  describe('King Safety and Check Prevention', () => {
    test('should not move into check from enemy rook', () => {
      // Set up position where king would move into rook's attack
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
      game.board[3][0] = { type: 'rook', color: 'black' };
      
      // King should not be able to move to row 3 (rook's attack line)
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
      testUtils.validateErrorResponse(result);
    });

    test('should not move into check from enemy bishop', () => {
      // Set up position where king would move into bishop's attack
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
      game.board[1][1] = { type: 'bishop', color: 'black' };
      
      // King should not be able to move to diagonal squares attacked by bishop
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 3 } });
      testUtils.validateErrorResponse(result);
    });

    test('should not move into check from enemy queen', () => {
      // Set up position where king would move into queen's attack
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
      game.board[0][4] = { type: 'queen', color: 'black' };
      
      // King should not be able to move to squares attacked by queen
      const blockedMoves = [
        { row: 3, col: 4 }, // Vertical attack
        { row: 5, col: 4 }, // Vertical attack
        { row: 4, col: 3 }, // Horizontal attack
        { row: 4, col: 5 }  // Horizontal attack
      ];
      
      blockedMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });

    test('should not move into check from enemy knight', () => {
      // Set up position where king would move into knight's attack
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
      game.board[2][3] = { type: 'knight', color: 'black' };
      
      // King should not be able to move to squares attacked by knight
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 5 } });
      testUtils.validateErrorResponse(result);
    });

    test('should not move into check from enemy pawn', () => {
      // Set up position where king would move into pawn's attack
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
      game.board[2][3] = { type: 'pawn', color: 'black' };
      
      // King should not be able to move to squares attacked by pawn
      const blockedMoves = [
        { row: 3, col: 4 }, // Pawn attacks diagonally
        { row: 3, col: 2 }  // Pawn attacks diagonally
      ];
      
      blockedMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });

    test('should not move adjacent to enemy king', () => {
      // Set up position with both kings
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original white king
      game.board[2][4] = { type: 'king', color: 'black' };
      game.board[0][4] = null; // Remove original black king
      
      // White king should not be able to move adjacent to black king
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
      testUtils.validateErrorResponse(result);
    });

    test('should be able to move to safe squares', () => {
      // Set up position where king has safe moves
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
      game.board[0][0] = { type: 'rook', color: 'black' }; // Enemy rook far away
      
      // King should be able to move to safe squares
      const safeMoves = [
        { row: 3, col: 3 }, { row: 3, col: 5 },
        { row: 5, col: 3 }, { row: 5, col: 5 }
      ];
      
      safeMoves.forEach(to => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'king', color: 'white' };
        freshGame.board[7][4] = null;
        freshGame.board[0][0] = { type: 'rook', color: 'black' };
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateSuccessResponse(result);
      });
    });
  });

  describe('King Captures', () => {
    test('should capture enemy pieces safely', () => {
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
      
      const enemyPieces = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
      const capturePositions = [
        { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
        { row: 4, col: 3 }, { row: 4, col: 5 }
      ];
      
      enemyPieces.forEach((pieceType, index) => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'king', color: 'white' };
        freshGame.board[7][4] = null;
        
        const capturePos = capturePositions[index];
        freshGame.board[capturePos.row][capturePos.col] = { type: pieceType, color: 'black' };
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to: capturePos });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[capturePos.row][capturePos.col]).toEqual({ type: 'king', color: 'white' });
      });
    });

    test('should not capture own pieces', () => {
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
      game.board[3][3] = { type: 'pawn', color: 'white' };
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 3 } });
      testUtils.validateErrorResponse(result);
    });

    test('should not capture if it would result in check', () => {
      // Set up position where capturing would put king in check
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
      game.board[3][3] = { type: 'pawn', color: 'black' }; // Enemy pawn to capture
      game.board[0][3] = { type: 'rook', color: 'black' }; // Enemy rook that would attack
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 3 } });
      testUtils.validateErrorResponse(result);
    });
  });

  describe('Castling Rules and Validation', () => {
    test('should allow kingside castling when conditions are met', () => {
      // Clear path for kingside castling
      game.board[7][5] = null; // Remove bishop
      game.board[7][6] = null; // Remove knight
      
      const result = game.makeMove({ 
        from: { row: 7, col: 4 }, 
        to: { row: 7, col: 6 },
        castling: 'kingside'
      });
      
      testUtils.validateSuccessResponse(result);
      expect(game.board[7][6]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][5]).toEqual({ type: 'rook', color: 'white' });
      expect(game.board[7][4]).toBeNull();
      expect(game.board[7][7]).toBeNull();
    });

    test('should allow queenside castling when conditions are met', () => {
      // Clear path for queenside castling
      game.board[7][1] = null; // Remove knight
      game.board[7][2] = null; // Remove bishop
      game.board[7][3] = null; // Remove queen
      
      const result = game.makeMove({ 
        from: { row: 7, col: 4 }, 
        to: { row: 7, col: 2 },
        castling: 'queenside'
      });
      
      testUtils.validateSuccessResponse(result);
      expect(game.board[7][2]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][3]).toEqual({ type: 'rook', color: 'white' });
      expect(game.board[7][4]).toBeNull();
      expect(game.board[7][0]).toBeNull();
    });

    test('should allow black castling', () => {
      // Move white piece first to switch turns
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      
      // Clear path for black kingside castling
      game.board[0][5] = null; // Remove bishop
      game.board[0][6] = null; // Remove knight
      
      const result = game.makeMove({ 
        from: { row: 0, col: 4 }, 
        to: { row: 0, col: 6 },
        castling: 'kingside'
      });
      
      testUtils.validateSuccessResponse(result);
      expect(game.board[0][6]).toEqual({ type: 'king', color: 'black' });
      expect(game.board[0][5]).toEqual({ type: 'rook', color: 'black' });
    });

    test('should reject castling if king has moved', () => {
      // Move king first, then try to castle
      game.board[7][5] = null; // Clear path
      game.board[7][6] = null;
      game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 5 } }); // Move king
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }); // Black move
      game.makeMove({ from: { row: 7, col: 5 }, to: { row: 7, col: 4 } }); // Move king back
      game.makeMove({ from: { row: 2, col: 4 }, to: { row: 3, col: 4 } }); // Black move
      
      const result = game.makeMove({ 
        from: { row: 7, col: 4 }, 
        to: { row: 7, col: 6 },
        castling: 'kingside'
      });
      
      testUtils.validateErrorResponse(result);
    });

    test('should reject castling if rook has moved', () => {
      // Move rook first, then try to castle
      game.board[7][5] = null; // Clear path
      game.board[7][6] = null;
      game.makeMove({ from: { row: 7, col: 7 }, to: { row: 7, col: 6 } }); // Move rook
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }); // Black move
      game.makeMove({ from: { row: 7, col: 6 }, to: { row: 7, col: 7 } }); // Move rook back
      game.makeMove({ from: { row: 2, col: 4 }, to: { row: 3, col: 4 } }); // Black move
      
      const result = game.makeMove({ 
        from: { row: 7, col: 4 }, 
        to: { row: 7, col: 6 },
        castling: 'kingside'
      });
      
      testUtils.validateErrorResponse(result);
    });

    test('should reject castling if path is blocked', () => {
      // Leave bishop in place (blocking castling)
      const result = game.makeMove({ 
        from: { row: 7, col: 4 }, 
        to: { row: 7, col: 6 },
        castling: 'kingside'
      });
      
      testUtils.validateErrorResponse(result);
    });

    test('should reject castling if king is in check', () => {
      // Set up check position
      game.board[7][5] = null; // Clear path
      game.board[7][6] = null;
      game.board[0][4] = { type: 'rook', color: 'black' }; // Put king in check
      
      const result = game.makeMove({ 
        from: { row: 7, col: 4 }, 
        to: { row: 7, col: 6 },
        castling: 'kingside'
      });
      
      testUtils.validateErrorResponse(result);
    });

    test('should reject castling if king passes through check', () => {
      // Set up position where king would pass through check
      game.board[7][5] = null; // Clear path
      game.board[7][6] = null;
      game.board[0][5] = { type: 'rook', color: 'black' }; // Attack f1 square
      
      const result = game.makeMove({ 
        from: { row: 7, col: 4 }, 
        to: { row: 7, col: 6 },
        castling: 'kingside'
      });
      
      testUtils.validateErrorResponse(result);
    });

    test('should reject castling if king ends in check', () => {
      // Set up position where king would end in check
      game.board[7][5] = null; // Clear path
      game.board[7][6] = null;
      game.board[0][6] = { type: 'rook', color: 'black' }; // Attack g1 square
      
      const result = game.makeMove({ 
        from: { row: 7, col: 4 }, 
        to: { row: 7, col: 6 },
        castling: 'kingside'
      });
      
      testUtils.validateErrorResponse(result);
    });

    test('should handle castling rights tracking correctly', () => {
      // Test that castling rights are properly tracked
      const castlingGame = testUtils.createFreshGame();
      
      // Initially both sides should have castling rights
      expect(castlingGame.castlingRights.white.kingside).toBe(true);
      expect(castlingGame.castlingRights.white.queenside).toBe(true);
      expect(castlingGame.castlingRights.black.kingside).toBe(true);
      expect(castlingGame.castlingRights.black.queenside).toBe(true);
      
      // Move king and check rights are lost
      castlingGame.board[6][4] = null; // Clear path
      castlingGame.makeMove({ from: { row: 7, col: 4 }, to: { row: 6, col: 4 } });
      
      expect(castlingGame.castlingRights.white.kingside).toBe(false);
      expect(castlingGame.castlingRights.white.queenside).toBe(false);
    });
  });

  describe('King Movement at Board Boundaries', () => {
    test('should handle movement from corner positions', () => {
      const cornerPositions = [
        { row: 0, col: 0 }, // Top-left corner
        { row: 0, col: 7 }, // Top-right corner
        { row: 7, col: 0 }, // Bottom-left corner
        { row: 7, col: 7 }  // Bottom-right corner
      ];
      
      cornerPositions.forEach(pos => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[pos.row][pos.col] = { type: 'king', color: 'white' };
        freshGame.board[7][4] = null; // Remove original king
        
        // Calculate valid moves from corner
        const possibleMoves = [];
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
          for (let colOffset = -1; colOffset <= 1; colOffset++) {
            if (rowOffset === 0 && colOffset === 0) continue; // Skip same position
            
            const newRow = pos.row + rowOffset;
            const newCol = pos.col + colOffset;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
              possibleMoves.push({ row: newRow, col: newCol });
            }
          }
        }
        
        possibleMoves.forEach(to => {
          const result = freshGame.makeMove({ from: pos, to });
          testUtils.validateSuccessResponse(result);
        });
      });
    });

    test('should reject moves that go off the board', () => {
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[7][4] = null; // Remove original king
      
      const offBoardMoves = [
        { row: -1, col: 0 }, { row: 0, col: -1 }, { row: -1, col: -1 }
      ];
      
      offBoardMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 0, col: 0 }, to });
        testUtils.validateErrorResponse(result);
      });
    });
  });

  describe('King Movement in Complex Positions', () => {
    test('should handle king in endgame scenarios', () => {
      // Create king and pawn endgame
      const endgame = testUtils.createFreshGame();
      endgame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      endgame.board[0][4] = { type: 'king', color: 'black' };
      endgame.board[7][4] = { type: 'king', color: 'white' };
      endgame.board[6][0] = { type: 'pawn', color: 'white' };
      endgame.board[1][7] = { type: 'pawn', color: 'black' };
      
      // Kings should be able to move freely (not adjacent)
      const result = endgame.makeMove({ from: { row: 7, col: 4 }, to: { row: 6, col: 4 } });
      testUtils.validateSuccessResponse(result);
    });

    test('should handle king opposition in endgame', () => {
      // Set up king opposition scenario
      const oppositionGame = testUtils.createFreshGame();
      oppositionGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      oppositionGame.board[4][4] = { type: 'king', color: 'black' };
      oppositionGame.board[6][4] = { type: 'king', color: 'white' };
      
      // White king should not be able to move closer (would be adjacent)
      const result = oppositionGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      testUtils.validateErrorResponse(result);
      
      // But should be able to move sideways
      const sideResult = oppositionGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 6, col: 3 } });
      testUtils.validateSuccessResponse(sideResult);
    });

    test('should handle king safety in tactical positions', () => {
      // Set up tactical position with multiple threats
      const tacticalGame = testUtils.createFreshGame();
      tacticalGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      tacticalGame.board[4][4] = { type: 'king', color: 'white' };
      tacticalGame.board[0][4] = { type: 'queen', color: 'black' };
      tacticalGame.board[4][0] = { type: 'rook', color: 'black' };
      tacticalGame.board[1][1] = { type: 'bishop', color: 'black' };
      tacticalGame.board[0][0] = { type: 'king', color: 'black' };
      
      // King should have very limited safe moves
      const safeMoves = [
        { row: 5, col: 5 }, // Only safe square
      ];
      
      safeMoves.forEach(to => {
        const result = tacticalGame.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateSuccessResponse(result);
      });
      
      // All other moves should be unsafe
      const unsafeMoves = [
        { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
        { row: 4, col: 3 }, { row: 4, col: 5 },
        { row: 5, col: 3 }, { row: 5, col: 4 }
      ];
      
      unsafeMoves.forEach(to => {
        const testGame = testUtils.createFreshGame();
        testGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
        testGame.board[4][4] = { type: 'king', color: 'white' };
        testGame.board[0][4] = { type: 'queen', color: 'black' };
        testGame.board[4][0] = { type: 'rook', color: 'black' };
        testGame.board[1][1] = { type: 'bishop', color: 'black' };
        testGame.board[0][0] = { type: 'king', color: 'black' };
        
        const result = testGame.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });
  });

  describe('Performance Tests', () => {
    test('should validate king moves efficiently', () => {
      const startTime = Date.now();
      
      // Test 1000 king move validations
      for (let i = 0; i < 1000; i++) {
        const freshGame = testUtils.createFreshGame();
        // Clear path and move king
        freshGame.board[6][4] = null; // Clear e2 pawn
        freshGame.makeMove({ from: { row: 7, col: 4 }, to: { row: 6, col: 4 } });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 50ms
      expect(duration).toBeLessThan(50);
    });

    test('should handle complex king scenarios efficiently', () => {
      const startTime = Date.now();
      
      // Test complex king movement scenarios including castling
      for (let i = 0; i < 100; i++) {
        const freshGame = testUtils.createFreshGame();
        
        // Clear paths and execute king moves
        freshGame.board[7][5] = null; // Clear f1
        freshGame.board[7][6] = null; // Clear g1
        freshGame.makeMove({ 
          from: { row: 7, col: 4 }, 
          to: { row: 7, col: 6 },
          castling: 'kingside'
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});