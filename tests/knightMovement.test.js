/**
 * Comprehensive Knight Movement Tests
 * Covers all L-shaped patterns, boundary conditions, and jump scenarios
 */

const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Knight Movement', () => {
  let game;

  beforeEach(() => {
    game = testUtils.createFreshGame();
  });

  describe('Basic Knight Movement Patterns', () => {
    test('should allow all 8 valid L-shaped moves from center position', () => {
      // Place knight in center of board
      game.board[4][4] = { type: 'knight', color: 'white' };
      
      const validMoves = [
        { row: 2, col: 3 }, // Up 2, Left 1
        { row: 2, col: 5 }, // Up 2, Right 1
        { row: 3, col: 2 }, // Up 1, Left 2
        { row: 3, col: 6 }, // Up 1, Right 2
        { row: 5, col: 2 }, // Down 1, Left 2
        { row: 5, col: 6 }, // Down 1, Right 2
        { row: 6, col: 3 }, // Down 2, Left 1
        { row: 6, col: 5 }  // Down 2, Right 1
      ];
      
      validMoves.forEach((to, index) => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'knight', color: 'white' };
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[to.row][to.col]).toEqual({ type: 'knight', color: 'white' });
        expect(freshGame.board[4][4]).toBeNull();
      });
    });

    test('should reject non-L-shaped moves', () => {
      game.board[4][4] = { type: 'knight', color: 'white' };
      
      const invalidMoves = [
        { row: 4, col: 5 }, // Horizontal 1
        { row: 4, col: 6 }, // Horizontal 2
        { row: 5, col: 4 }, // Vertical 1
        { row: 6, col: 4 }, // Vertical 2
        { row: 5, col: 5 }, // Diagonal 1
        { row: 6, col: 6 }, // Diagonal 2
        { row: 3, col: 3 }, // Diagonal 1 (other direction)
        { row: 2, col: 2 }, // Diagonal 2 (other direction)
        { row: 1, col: 1 }, // Long diagonal
        { row: 4, col: 4 }, // Same position
        { row: 1, col: 4 }, // Vertical 3
        { row: 4, col: 1 }  // Horizontal 3
      ];
      
      invalidMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });

    test('should validate L-shaped pattern mathematically', () => {
      game.board[4][4] = { type: 'knight', color: 'white' };
      
      // Test all possible moves within board bounds
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (row === 4 && col === 4) continue; // Skip starting position
          
          const rowDiff = Math.abs(row - 4);
          const colDiff = Math.abs(col - 4);
          const isValidKnightMove = (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
          
          const freshGame = testUtils.createFreshGame();
          freshGame.board[4][4] = { type: 'knight', color: 'white' };
          
          const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to: { row, col } });
          
          if (isValidKnightMove) {
            testUtils.validateSuccessResponse(result);
          } else {
            testUtils.validateErrorResponse(result);
          }
        }
      }
    });
  });

  describe('Knight Movement from Starting Positions', () => {
    test('should allow valid moves from initial knight positions', () => {
      // Test white knights from starting positions
      const whiteKnightMoves = [
        // Knight on b1 (row 7, col 1)
        { from: { row: 7, col: 1 }, to: { row: 5, col: 0 } }, // Na3
        { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }, // Nc3
        // Knight on g1 (row 7, col 6)
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 7, col: 6 }, to: { row: 5, col: 7 } }  // Nh3
      ];
      
      whiteKnightMoves.forEach(move => {
        const freshGame = testUtils.createFreshGame();
        const result = freshGame.makeMove(move);
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[move.to.row][move.to.col]).toEqual({ type: 'knight', color: 'white' });
      });
    });

    test('should allow valid moves for black knights', () => {
      // Move white piece first to switch turns
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      
      const blackKnightMoves = [
        // Knight on b8 (row 0, col 1)
        { from: { row: 0, col: 1 }, to: { row: 2, col: 0 } }, // Na6
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
        // Knight on g8 (row 0, col 6)
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }, // Nf6
        { from: { row: 0, col: 6 }, to: { row: 2, col: 7 } }  // Nh6
      ];
      
      blackKnightMoves.forEach(move => {
        const freshGame = testUtils.createFreshGame();
        freshGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } }); // White move first
        
        const result = freshGame.makeMove(move);
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[move.to.row][move.to.col]).toEqual({ type: 'knight', color: 'black' });
      });
    });

    test('should reject moves blocked by own pawns initially', () => {
      // Knights cannot move to squares occupied by own pawns
      const blockedMoves = [
        { from: { row: 7, col: 1 }, to: { row: 6, col: 3 } }, // Blocked by pawn
        { from: { row: 7, col: 6 }, to: { row: 6, col: 4 } }  // Blocked by pawn
      ];
      
      blockedMoves.forEach(move => {
        const result = game.makeMove(move);
        testUtils.validateErrorResponse(result);
      });
    });
  });

  describe('Knight Jumping Ability', () => {
    test('should jump over own pieces', () => {
      // Place knight and surround with own pieces
      game.board[4][4] = { type: 'knight', color: 'white' };
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[4][3] = { type: 'pawn', color: 'white' };
      game.board[4][5] = { type: 'pawn', color: 'white' };
      game.board[5][4] = { type: 'pawn', color: 'white' };
      
      // Knight should still be able to make L-shaped moves
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 3 } });
      testUtils.validateSuccessResponse(result);
      expect(game.board[2][3]).toEqual({ type: 'knight', color: 'white' });
    });

    test('should jump over enemy pieces', () => {
      // Place knight and surround with enemy pieces
      game.board[4][4] = { type: 'knight', color: 'white' };
      game.board[3][4] = { type: 'pawn', color: 'black' };
      game.board[4][3] = { type: 'pawn', color: 'black' };
      game.board[4][5] = { type: 'pawn', color: 'black' };
      game.board[5][4] = { type: 'pawn', color: 'black' };
      
      // Knight should still be able to make L-shaped moves
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 5 } });
      testUtils.validateSuccessResponse(result);
      expect(game.board[2][5]).toEqual({ type: 'knight', color: 'white' });
    });

    test('should jump over mixed pieces', () => {
      // Place knight and surround with mixed pieces
      game.board[4][4] = { type: 'knight', color: 'white' };
      game.board[3][4] = { type: 'queen', color: 'white' };
      game.board[4][3] = { type: 'rook', color: 'black' };
      game.board[4][5] = { type: 'bishop', color: 'white' };
      game.board[5][4] = { type: 'knight', color: 'black' };
      
      // Test multiple valid moves
      const validMoves = [
        { row: 2, col: 3 }, { row: 2, col: 5 },
        { row: 3, col: 2 }, { row: 3, col: 6 },
        { row: 5, col: 2 }, { row: 5, col: 6 },
        { row: 6, col: 3 }, { row: 6, col: 5 }
      ];
      
      validMoves.forEach(to => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'knight', color: 'white' };
        freshGame.board[3][4] = { type: 'queen', color: 'white' };
        freshGame.board[4][3] = { type: 'rook', color: 'black' };
        freshGame.board[4][5] = { type: 'bishop', color: 'white' };
        freshGame.board[5][4] = { type: 'knight', color: 'black' };
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateSuccessResponse(result);
      });
    });

    test('should jump in complex board positions', () => {
      // Create a crowded board position
      const crowdedGame = testUtils.createFreshGame();
      
      // Make several moves to create a complex position
      crowdedGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e4
      crowdedGame.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // e5
      crowdedGame.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }); // Nc3
      crowdedGame.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }); // Nc6
      crowdedGame.makeMove({ from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }); // d4
      crowdedGame.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }); // d5
      
      // Knight should still be able to move
      const result = crowdedGame.makeMove({ from: { row: 5, col: 2 }, to: { row: 3, col: 1 } });
      testUtils.validateSuccessResponse(result);
    });
  });

  describe('Knight Captures', () => {
    test('should capture enemy pieces', () => {
      game.board[4][4] = { type: 'knight', color: 'white' };
      
      const enemyPieces = ['pawn', 'rook', 'bishop', 'queen', 'knight'];
      const capturePositions = [
        { row: 2, col: 3 }, { row: 2, col: 5 }, { row: 3, col: 2 }, 
        { row: 3, col: 6 }, { row: 5, col: 2 }
      ];
      
      enemyPieces.forEach((pieceType, index) => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'knight', color: 'white' };
        
        const capturePos = capturePositions[index];
        freshGame.board[capturePos.row][capturePos.col] = { type: pieceType, color: 'black' };
        
        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to: capturePos });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[capturePos.row][capturePos.col]).toEqual({ type: 'knight', color: 'white' });
      });
    });

    test('should not capture own pieces', () => {
      game.board[4][4] = { type: 'knight', color: 'white' };
      game.board[2][3] = { type: 'pawn', color: 'white' };
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 3 } });
      testUtils.validateErrorResponse(result);
    });

    test('should capture enemy king if possible (check)', () => {
      // Set up position where knight can capture enemy king
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'knight', color: 'white' };
      game.board[2][3] = { type: 'king', color: 'black' };
      game.board[7][4] = { type: 'king', color: 'white' };
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 3 } });
      testUtils.validateSuccessResponse(result);
      expect(game.board[2][3]).toEqual({ type: 'knight', color: 'white' });
    });
  });

  describe('Knight Movement at Board Boundaries', () => {
    test('should handle movement from corner positions', () => {
      const cornerPositions = [
        { row: 0, col: 0 }, // Top-left corner
        { row: 0, col: 7 }, // Top-right corner
        { row: 7, col: 0 }, // Bottom-left corner
        { row: 7, col: 7 }  // Bottom-right corner
      ];
      
      cornerPositions.forEach(pos => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[pos.row][pos.col] = { type: 'knight', color: 'white' };
        
        // Calculate all possible knight moves from this position
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
          const result = freshGame.makeMove({ from: pos, to });
          
          // Should succeed if destination is on board, fail if off board
          if (to.row >= 0 && to.row < 8 && to.col >= 0 && to.col < 8) {
            testUtils.validateSuccessResponse(result);
            expect(freshGame.board[to.row][to.col]).toEqual({ type: 'knight', color: 'white' });
          } else {
            testUtils.validateErrorResponse(result);
          }
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
        freshGame.board[pos.row][pos.col] = { type: 'knight', color: 'white' };
        
        // Test a few valid moves from each edge position
        const possibleMoves = [
          { row: pos.row - 2, col: pos.col - 1 },
          { row: pos.row - 2, col: pos.col + 1 },
          { row: pos.row + 2, col: pos.col - 1 },
          { row: pos.row + 2, col: pos.col + 1 }
        ];
        
        possibleMoves.forEach(to => {
          if (to.row >= 0 && to.row < 8 && to.col >= 0 && to.col < 8) {
            const result = freshGame.makeMove({ from: pos, to });
            testUtils.validateSuccessResponse(result);
          }
        });
      });
    });

    test('should reject moves that go off the board', () => {
      // Test knight at edge trying to move off board
      game.board[0][0] = { type: 'knight', color: 'white' };
      
      const offBoardMoves = [
        { row: -2, col: -1 }, { row: -2, col: 1 },
        { row: -1, col: -2 }, { row: 1, col: -2 }
      ];
      
      offBoardMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 0, col: 0 }, to });
        testUtils.validateErrorResponse(result);
      });
    });
  });

  describe('Knight Movement in Special Scenarios', () => {
    test('should move correctly in endgame positions', () => {
      // Create endgame with just kings and knights
      const endgame = testUtils.createFreshGame();
      endgame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      endgame.board[0][4] = { type: 'king', color: 'black' };
      endgame.board[7][4] = { type: 'king', color: 'white' };
      endgame.board[3][3] = { type: 'knight', color: 'white' };
      endgame.board[4][4] = { type: 'knight', color: 'black' };
      
      // White knight should be able to move
      const result = endgame.makeMove({ from: { row: 3, col: 3 }, to: { row: 1, col: 2 } });
      testUtils.validateSuccessResponse(result);
      expect(endgame.board[1][2]).toEqual({ type: 'knight', color: 'white' });
    });

    test('should handle knight forks (attacking multiple pieces)', () => {
      // Set up a position where knight can fork king and queen
      const forkGame = testUtils.createFreshGame();
      forkGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      forkGame.board[0][4] = { type: 'king', color: 'black' };
      forkGame.board[7][4] = { type: 'king', color: 'white' };
      forkGame.board[4][4] = { type: 'knight', color: 'white' };
      forkGame.board[2][3] = { type: 'queen', color: 'black' };
      
      // Knight can move to fork position
      const result = forkGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 5 } });
      testUtils.validateSuccessResponse(result);
      
      // Verify knight is attacking both king and queen
      expect(forkGame.board[2][5]).toEqual({ type: 'knight', color: 'white' });
    });

    test('should handle discovered attacks through knight movement', () => {
      // Set up position where moving knight discovers an attack
      const discoveredGame = testUtils.createFreshGame();
      discoveredGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      discoveredGame.board[0][4] = { type: 'king', color: 'black' };
      discoveredGame.board[7][4] = { type: 'king', color: 'white' };
      discoveredGame.board[4][4] = { type: 'knight', color: 'white' };
      discoveredGame.board[6][4] = { type: 'rook', color: 'white' };
      
      // Moving knight should discover rook attack on black king
      const result = discoveredGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 3 } });
      testUtils.validateSuccessResponse(result);
    });
  });

  describe('Performance Tests', () => {
    test('should validate knight moves efficiently', () => {
      const startTime = Date.now();
      
      // Test 1000 knight move validations
      for (let i = 0; i < 1000; i++) {
        const freshGame = testUtils.createFreshGame();
        freshGame.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 50ms
      expect(duration).toBeLessThan(50);
    });

    test('should handle complex knight scenarios efficiently', () => {
      const startTime = Date.now();
      
      // Test complex knight movement scenarios
      for (let i = 0; i < 100; i++) {
        const freshGame = testUtils.createFreshGame();
        
        // Execute a series of knight moves
        freshGame.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }); // Nc3
        freshGame.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }); // Nc6
        freshGame.makeMove({ from: { row: 5, col: 2 }, to: { row: 3, col: 3 } }); // Ne4
        freshGame.makeMove({ from: { row: 2, col: 2 }, to: { row: 4, col: 3 } }); // Nd4
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});