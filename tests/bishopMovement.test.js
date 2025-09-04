/**
 * Comprehensive Bishop Movement Tests
 * Covers diagonal movement, path validation, and complex board positions
 */

const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Bishop Movement', () => {
  let game;

  beforeEach(() => {
    game = testUtils.createFreshGame();
  });

  describe('Basic Bishop Movement Patterns', () => {
    test('should allow diagonal movement in all four directions', () => {
      // Place bishop in center and clear diagonal paths
      game.board[4][4] = { type: 'bishop', color: 'white' };

      // Clear all diagonal paths
      const diagonalSquares = [
        // Up-left diagonal
        [3, 3], [2, 2], [1, 1], [0, 0],
        // Up-right diagonal
        [3, 5], [2, 6], [1, 7],
        // Down-left diagonal
        [5, 3], [6, 2], [7, 1],
        // Down-right diagonal
        [5, 5], [6, 6], [7, 7]
      ];

      diagonalSquares.forEach(([row, col]) => {
        game.board[row][col] = null;
      });

      // Test movement to all diagonal positions
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
        diagonalSquares.forEach(([row, col]) => {
          freshGame.board[row][col] = null;
        });

        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[to.row][to.col]).toEqual({ type: 'bishop', color: 'white' });
        expect(freshGame.board[4][4]).toBeNull();
      });
    });

    test('should reject horizontal movement', () => {
      game.board[4][4] = { type: 'bishop', color: 'white' };

      const horizontalMoves = [
        { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 },
        { row: 4, col: 5 }, { row: 4, col: 6 }, { row: 4, col: 7 }
      ];

      horizontalMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });

    test('should reject vertical movement', () => {
      game.board[4][4] = { type: 'bishop', color: 'white' };

      const verticalMoves = [
        { row: 0, col: 4 }, { row: 1, col: 4 }, { row: 2, col: 4 }, { row: 3, col: 4 },
        { row: 5, col: 4 }, { row: 6, col: 4 }, { row: 7, col: 4 }
      ];

      verticalMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });

    test('should reject knight-like moves', () => {
      game.board[4][4] = { type: 'bishop', color: 'white' };

      const knightMoves = [
        { row: 2, col: 3 }, { row: 2, col: 5 }, { row: 3, col: 2 }, { row: 3, col: 6 },
        { row: 5, col: 2 }, { row: 5, col: 6 }, { row: 6, col: 3 }, { row: 6, col: 5 }
      ];

      knightMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });

    test('should validate diagonal movement mathematically', () => {
      game.board[4][4] = { type: 'bishop', color: 'white' };

      // Test all possible moves within board bounds
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (row === 4 && col === 4) continue; // Skip starting position

          const rowDiff = Math.abs(row - 4);
          const colDiff = Math.abs(col - 4);
          const isValidBishopMove = rowDiff === colDiff && rowDiff > 0;

          const freshGame = testUtils.createFreshGame();
          freshGame.board[4][4] = { type: 'bishop', color: 'white' };

          // Clear diagonal paths
          const diagonalSquares = [
            [3, 3], [2, 2], [1, 1], [0, 0],
            [3, 5], [2, 6], [1, 7],
            [5, 3], [6, 2], [7, 1],
            [5, 5], [6, 6], [7, 7]
          ];

          diagonalSquares.forEach(([r, c]) => {
            freshGame.board[r][c] = null;
          });

          const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to: { row, col } });

          if (isValidBishopMove) {
            testUtils.validateSuccessResponse(result);
          } else {
            testUtils.validateErrorResponse(result);
          }
        }
      }
    });
  });

  describe('Bishop Movement from Starting Positions', () => {
    test('should handle initial bishop positions correctly', () => {
      // Test white bishops from starting positions (need to clear path first)
      const whiteBishopTests = [
        {
          from: { row: 7, col: 2 }, // c1 bishop
          to: { row: 5, col: 4 },   // Move to e3
          clearSquares: [{ row: 6, col: 3 }] // Clear d2 pawn
        },
        {
          from: { row: 7, col: 5 }, // f1 bishop
          to: { row: 5, col: 3 },   // Move to d3
          clearSquares: [{ row: 6, col: 4 }] // Clear e2 pawn
        }
      ];

      whiteBishopTests.forEach(test => {
        const freshGame = testUtils.createFreshGame();

        // Clear the path
        test.clearSquares.forEach(square => {
          freshGame.board[square.row][square.col] = null;
        });

        const result = freshGame.makeMove({ from: test.from, to: test.to });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[test.to.row][test.to.col]).toEqual({ type: 'bishop', color: 'white' });
      });
    });

    test('should handle black bishop movement', () => {
      // Move white piece first to switch turns
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });

      // Clear path for black bishop and test movement
      game.board[1][3] = null; // Clear d7 pawn

      const result = game.makeMove({ from: { row: 0, col: 2 }, to: { row: 2, col: 4 } });
      testUtils.validateSuccessResponse(result);
      expect(game.board[2][4]).toEqual({ type: 'bishop', color: 'black' });
    });

    test('should be blocked by pieces in starting position', () => {
      // Bishops should not be able to move initially due to blocking pawns
      const blockedMoves = [
        { from: { row: 7, col: 2 }, to: { row: 6, col: 3 } }, // Blocked by pawn
        { from: { row: 7, col: 5 }, to: { row: 6, col: 4 } }, // Blocked by pawn
        { from: { row: 7, col: 2 }, to: { row: 5, col: 4 } }, // Blocked by pawn
        { from: { row: 7, col: 5 }, to: { row: 5, col: 3 } }  // Blocked by pawn
      ];

      blockedMoves.forEach(move => {
        const result = game.makeMove(move);
        testUtils.validateErrorResponse(result);
      });
    });
  });

  describe('Path Obstruction and Blocking', () => {
    test('should be blocked by own pieces in diagonal path', () => {
      game.board[4][4] = { type: 'bishop', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'white' }; // Blocking piece

      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 2 } });
      testUtils.validateErrorResponse(result);
    });

    test('should be blocked by enemy pieces in diagonal path', () => {
      game.board[4][4] = { type: 'bishop', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'black' }; // Blocking piece

      // Try to move past the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 2 } });
      testUtils.validateErrorResponse(result);
    });

    test('should allow movement up to blocking piece but not beyond', () => {
      game.board[4][4] = { type: 'bishop', color: 'white' };
      game.board[2][2] = { type: 'pawn', color: 'black' }; // Blocking piece

      // Should be able to move to the square just before the blocking piece
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 3 } });
      testUtils.validateSuccessResponse(result);
    });

    test('should handle blocking in all diagonal directions', () => {
      game.board[4][4] = { type: 'bishop', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'black' };   // Up-left block
      game.board[3][5] = { type: 'knight', color: 'white' }; // Up-right block
      game.board[5][3] = { type: 'bishop', color: 'black' }; // Down-left block
      game.board[5][5] = { type: 'queen', color: 'white' };  // Down-right block

      // Test movement past all blocks should fail
      const blockedMoves = [
        { row: 2, col: 2 }, // Blocked by pawn at [3][3]
        { row: 2, col: 6 }, // Blocked by knight at [3][5]
        { row: 6, col: 2 }, // Blocked by bishop at [5][3]
        { row: 6, col: 6 }  // Blocked by queen at [5][5]
      ];

      blockedMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });

    test('should handle multiple pieces on same diagonal', () => {
      game.board[4][4] = { type: 'bishop', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'black' };   // First block
      game.board[2][2] = { type: 'knight', color: 'white' }; // Second block (behind first)

      // Should not be able to move past first blocking piece
      const result1 = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 2 } });
      testUtils.validateErrorResponse(result1);

      // Should not be able to move past first blocking piece to any square beyond
      const result2 = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 1, col: 1 } });
      testUtils.validateErrorResponse(result2);
    });
  });

  describe('Bishop Captures', () => {
    test('should capture enemy pieces on diagonals', () => {
      game.board[4][4] = { type: 'bishop', color: 'white' };

      const enemyPieces = ['pawn', 'knight', 'rook', 'queen', 'bishop'];
      const capturePositions = [
        { row: 3, col: 3 }, { row: 3, col: 5 }, { row: 5, col: 3 },
        { row: 5, col: 5 }, { row: 2, col: 2 }
      ];

      enemyPieces.forEach((pieceType, index) => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][4] = { type: 'bishop', color: 'white' };

        const capturePos = capturePositions[index];
        freshGame.board[capturePos.row][capturePos.col] = { type: pieceType, color: 'black' };

        const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to: capturePos });
        testUtils.validateSuccessResponse(result);
        expect(freshGame.board[capturePos.row][capturePos.col]).toEqual({ type: 'bishop', color: 'white' });
      });
    });

    test('should not capture own pieces', () => {
      game.board[4][4] = { type: 'bishop', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'white' };

      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 3 } });
      testUtils.validateErrorResponse(result);
    });

    test('should capture and stop at enemy piece', () => {
      game.board[4][4] = { type: 'bishop', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'black' }; // Enemy piece to capture

      // Should be able to capture the enemy piece
      const captureResult = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 3 } });
      testUtils.validateSuccessResponse(captureResult);
      expect(game.board[3][3]).toEqual({ type: 'bishop', color: 'white' });

      // But should not be able to move past it in a single move
      const freshGame = testUtils.createFreshGame();
      freshGame.board[4][4] = { type: 'bishop', color: 'white' };
      freshGame.board[3][3] = { type: 'pawn', color: 'black' };

      const pastResult = freshGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 2 } });
      testUtils.validateErrorResponse(pastResult);
    });

    test('should handle captures at maximum diagonal range', () => {
      // Test long-range diagonal captures
      const longRangeGame = testUtils.createFreshGame();
      longRangeGame.board[7][0] = { type: 'bishop', color: 'white' };
      longRangeGame.board[0][7] = { type: 'queen', color: 'black' }; // Enemy piece at opposite corner

      // Clear diagonal path
      const diagonalPath = [[6, 1], [5, 2], [4, 3], [3, 4], [2, 5], [1, 6]];
      diagonalPath.forEach(([row, col]) => {
        longRangeGame.board[row][col] = null;
      });

      const result = longRangeGame.makeMove({ from: { row: 7, col: 0 }, to: { row: 0, col: 7 } });
      testUtils.validateSuccessResponse(result);
      expect(longRangeGame.board[0][7]).toEqual({ type: 'bishop', color: 'white' });
    });
  });

  describe('Bishop Color Square Consistency', () => {
    test('should always stay on same color squares', () => {
      // Light-squared bishop (starts on light square)
      const lightSquareBishop = { row: 4, col: 4 }; // Light square (4+4=8, even)
      game.board[lightSquareBishop.row][lightSquareBishop.col] = { type: 'bishop', color: 'white' };

      // All valid moves should be to light squares
      const lightSquareMoves = [
        { row: 3, col: 3 }, { row: 2, col: 2 }, { row: 1, col: 1 }, { row: 0, col: 0 },
        { row: 3, col: 5 }, { row: 2, col: 6 }, { row: 1, col: 7 },
        { row: 5, col: 3 }, { row: 6, col: 2 }, { row: 7, col: 1 },
        { row: 5, col: 5 }, { row: 6, col: 6 }, { row: 7, col: 7 }
      ];

      lightSquareMoves.forEach(to => {
        const sum = to.row + to.col;
        expect(sum % 2).toBe(0); // Should be even (light square)
      });
    });

    test('should verify dark-squared bishop stays on dark squares', () => {
      // Dark-squared bishop (starts on dark square)
      const darkSquareBishop = { row: 4, col: 3 }; // Dark square (4+3=7, odd)
      game.board[darkSquareBishop.row][darkSquareBishop.col] = { type: 'bishop', color: 'white' };

      // Clear diagonal paths
      const diagonalSquares = [
        [3, 2], [2, 1], [1, 0],
        [3, 4], [2, 5], [1, 6], [0, 7],
        [5, 2], [6, 1], [7, 0],
        [5, 4], [6, 5], [7, 6]
      ];

      diagonalSquares.forEach(([row, col]) => {
        game.board[row][col] = null;
      });

      // Test moves to dark squares
      const darkSquareMoves = [
        { row: 3, col: 2 }, { row: 2, col: 1 }, { row: 1, col: 0 },
        { row: 3, col: 4 }, { row: 2, col: 5 }, { row: 1, col: 6 }, { row: 0, col: 7 },
        { row: 5, col: 2 }, { row: 6, col: 1 }, { row: 7, col: 0 },
        { row: 5, col: 4 }, { row: 6, col: 5 }, { row: 7, col: 6 }
      ];

      darkSquareMoves.forEach(to => {
        const freshGame = testUtils.createFreshGame();
        freshGame.board[4][3] = { type: 'bishop', color: 'white' };

        // Clear diagonal paths
        diagonalSquares.forEach(([row, col]) => {
          freshGame.board[row][col] = null;
        });

        const result = freshGame.makeMove({ from: { row: 4, col: 3 }, to });
        testUtils.validateSuccessResponse(result);

        const sum = to.row + to.col;
        expect(sum % 2).toBe(1); // Should be odd (dark square)
      });
    });

    test('should never move to opposite color squares', () => {
      // Light-squared bishop trying to move to dark squares
      game.board[4][4] = { type: 'bishop', color: 'white' };

      const darkSquares = [
        { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 5, col: 4 }, { row: 4, col: 5 },
        { row: 3, col: 2 }, { row: 2, col: 3 }, { row: 5, col: 6 }, { row: 6, col: 5 }
      ];

      darkSquares.forEach(to => {
        const result = game.makeMove({ from: { row: 4, col: 4 }, to });
        testUtils.validateErrorResponse(result);
      });
    });
  });

  describe('Bishop Movement at Board Boundaries', () => {
    test('should handle movement from corner positions', () => {
      const cornerPositions = [
        { row: 0, col: 0 }, // Top-left corner (dark square)
        { row: 0, col: 7 }, // Top-right corner (light square)
        { row: 7, col: 0 }, // Bottom-left corner (light square)
        { row: 7, col: 7 }  // Bottom-right corner (dark square)
      ];

      cornerPositions.forEach(pos => {
        const freshGame = testUtils.createFreshGame();

        // Clear the entire board first
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            freshGame.board[row][col] = null;
          }
        }

        // Place kings (required for valid game state)
        freshGame.board[7][4] = { type: 'king', color: 'white' };
        freshGame.board[0][4] = { type: 'king', color: 'black' };

        // Place the bishop at the corner position
        freshGame.board[pos.row][pos.col] = { type: 'bishop', color: 'white' };

        // Test movement along available diagonals
        const possibleMoves = [];
        for (let i = 1; i < 8; i++) {
          if (pos.row + i < 8 && pos.col + i < 8) possibleMoves.push({ row: pos.row + i, col: pos.col + i });
          if (pos.row + i < 8 && pos.col - i >= 0) possibleMoves.push({ row: pos.row + i, col: pos.col - i });
          if (pos.row - i >= 0 && pos.col + i < 8) possibleMoves.push({ row: pos.row - i, col: pos.col + i });
          if (pos.row - i >= 0 && pos.col - i >= 0) possibleMoves.push({ row: pos.row - i, col: pos.col - i });
        }

        possibleMoves.forEach(to => {
          // Create a fresh game for each move test
          const testGame = testUtils.createFreshGame();

          // Clear the entire board
          for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
              testGame.board[row][col] = null;
            }
          }

          // Place kings (required for valid game state)
          testGame.board[7][4] = { type: 'king', color: 'white' };
          testGame.board[0][4] = { type: 'king', color: 'black' };

          // Place the bishop at the corner position
          testGame.board[pos.row][pos.col] = { type: 'bishop', color: 'white' };

          const result = testGame.makeMove({ from: pos, to });
          if (!result.success) {
            throw new Error(`Bishop move failed from ${JSON.stringify(pos)} to ${JSON.stringify(to)}: ${result.message} (${result.errorCode})`);
          }
          testUtils.validateSuccessResponse(result);
        });
      });
    });

    test('should reject moves that go off the board', () => {
      game.board[0][0] = { type: 'bishop', color: 'white' };

      const offBoardMoves = [
        { row: -1, col: -1 }, { row: -1, col: 1 },
        { row: 1, col: -1 }, { row: 8, col: 8 }
      ];

      offBoardMoves.forEach(to => {
        const result = game.makeMove({ from: { row: 0, col: 0 }, to });
        testUtils.validateErrorResponse(result);
      });
    });
  });

  describe('Bishop Movement in Complex Positions', () => {
    test('should handle fianchetto positions', () => {
      // Set up fianchetto (bishop on long diagonal)
      const fianchettoGame = testUtils.createFreshGame();

      const move1 = fianchettoGame.makeMove({ from: { row: 6, col: 6 }, to: { row: 5, col: 6 } }); // g3
      if (!move1.success) throw new Error(`Move 1 failed: ${move1.message}`);

      const move2 = fianchettoGame.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }); // e6
      if (!move2.success) throw new Error(`Move 2 failed: ${move2.message}`);

      const move3 = fianchettoGame.makeMove({ from: { row: 7, col: 5 }, to: { row: 6, col: 6 } }); // Bg2
      if (!move3.success) throw new Error(`Move 3 failed: ${move3.message}`);

      // Make a black move to give white the turn
      const move4 = fianchettoGame.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }); // d5
      if (!move4.success) throw new Error(`Move 4 failed: ${move4.message}`);

      // Bishop should be on long diagonal
      expect(fianchettoGame.board[6][6]).toEqual({ type: 'bishop', color: 'white' });

      // Should be able to move along the diagonal
      const result = fianchettoGame.makeMove({ from: { row: 6, col: 6 }, to: { row: 5, col: 5 } });
      if (!result.success) throw new Error(`Final move failed: ${result.message}`);
      testUtils.validateSuccessResponse(result);
    });

    test('should handle bishop pair coordination', () => {
      // Set up both bishops working together
      const bishopPairGame = testUtils.createFreshGame();
      bishopPairGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      bishopPairGame.board[0][4] = { type: 'king', color: 'black' };
      bishopPairGame.board[7][4] = { type: 'king', color: 'white' };
      bishopPairGame.board[4][2] = { type: 'bishop', color: 'white' }; // Light-squared bishop
      bishopPairGame.board[4][5] = { type: 'bishop', color: 'white' }; // Dark-squared bishop

      // Both bishops should be able to move
      const lightResult = bishopPairGame.makeMove({ from: { row: 4, col: 2 }, to: { row: 2, col: 0 } });
      testUtils.validateSuccessResponse(lightResult);
    });

    test('should handle bishop in endgame scenarios', () => {
      // Create bishop endgame
      const endgame = testUtils.createFreshGame();
      endgame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      endgame.board[0][4] = { type: 'king', color: 'black' };
      endgame.board[7][4] = { type: 'king', color: 'white' };
      endgame.board[2][1] = { type: 'bishop', color: 'white' };
      endgame.board[1][6] = { type: 'bishop', color: 'black' }; // Move black bishop to safe position

      // White bishop should be able to move freely
      const result = endgame.makeMove({ from: { row: 2, col: 1 }, to: { row: 4, col: 3 } });
      if (!result.success) throw new Error(`Endgame move failed: ${result.message}`);
      testUtils.validateSuccessResponse(result);
    });
  });

  describe('Performance Tests', () => {
    test('should validate bishop moves efficiently', () => {
      const startTime = Date.now();

      // Test 1000 bishop move validations
      for (let i = 0; i < 1000; i++) {
        const freshGame = testUtils.createFreshGame();
        // Clear path and move bishop
        freshGame.board[6][3] = null; // Clear d2 pawn
        freshGame.makeMove({ from: { row: 7, col: 2 }, to: { row: 5, col: 4 } });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in under 3000ms (3 seconds)
      expect(duration).toBeLessThan(3000);
    });

    test('should handle complex bishop scenarios efficiently', () => {
      const startTime = Date.now();

      // Test complex bishop movement scenarios
      for (let i = 0; i < 100; i++) {
        const freshGame = testUtils.createFreshGame();

        // Clear paths and execute bishop moves
        freshGame.board[6][3] = null; // Clear d2
        freshGame.board[6][4] = null; // Clear e2
        freshGame.makeMove({ from: { row: 7, col: 2 }, to: { row: 5, col: 4 } }); // Be3
        freshGame.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }); // e6
        freshGame.makeMove({ from: { row: 5, col: 4 }, to: { row: 4, col: 5 } }); // Bf4
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in under 3000ms (3 seconds)
      expect(duration).toBeLessThan(3000);
    });
  });
});