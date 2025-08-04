/**
 * Comprehensive Piece Movement Tests - Part 2
 * Additional piece movement patterns and edge cases
 * Complements the original pieceMovement.test.js
 */

const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Piece Movement Patterns - Part 2', () => {
  let game;

  beforeEach(() => {
    game = testUtils.createFreshGame();
  });

  describe('Advanced Pawn Movement Scenarios', () => {
    test('should handle pawn chains and support structures', () => {
      // Create a pawn chain
      const chainMoves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }, // d5
        { from: { row: 6, col: 2 }, to: { row: 4, col: 2 } }, // c4
        { from: { row: 3, col: 3 }, to: { row: 4, col: 2 } }, // dxc4
        { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }, // d4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }  // e5
      ];
      
      chainMoves.forEach(move => {
        const result = game.makeMove(move);
        testUtils.validateSuccessResponse(result);
      });
      
      // Verify pawn structure
      expect(game.board[4][3]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[4][4]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[3][4]).toEqual({ type: 'pawn', color: 'black' });
    });

    test('should handle isolated pawns correctly', () => {
      // Create isolated pawn structure
      const isolatedGame = testUtils.createFreshGame();
      
      // Clear adjacent pawns to create isolation
      isolatedGame.board[6][3] = null; // Remove d2 pawn
      isolatedGame.board[6][5] = null; // Remove f2 pawn
      
      // e2 pawn is now isolated
      const result = isolatedGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      testUtils.validateSuccessResponse(result);
      
      // Verify pawn moved correctly despite isolation
      expect(isolatedGame.board[5][4]).toEqual({ type: 'pawn', color: 'white' });
    });

    test('should handle passed pawns advancement', () => {
      // Create passed pawn scenario
      const passedPawnGame = testUtils.createFreshGame();
      passedPawnGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      passedPawnGame.board[0][4] = { type: 'king', color: 'black' };
      passedPawnGame.board[7][4] = { type: 'king', color: 'white' };
      passedPawnGame.board[4][0] = { type: 'pawn', color: 'white' }; // Passed pawn
      
      // Advance passed pawn
      const moves = [
        { from: { row: 4, col: 0 }, to: { row: 3, col: 0 } },
        { from: { row: 0, col: 4 }, to: { row: 0, col: 3 } }, // King move
        { from: { row: 3, col: 0 }, to: { row: 2, col: 0 } },
        { from: { row: 0, col: 3 }, to: { row: 0, col: 4 } }, // King move
        { from: { row: 2, col: 0 }, to: { row: 1, col: 0 } }
      ];
      
      moves.forEach(move => {
        const result = passedPawnGame.makeMove(move);
        testUtils.validateSuccessResponse(result);
      });
      
      expect(passedPawnGame.board[1][0]).toEqual({ type: 'pawn', color: 'white' });
    });
  });

  describe('Advanced Knight Movement Scenarios', () => {
    test('should handle knight outposts', () => {
      // Create knight outpost position
      const outpostGame = testUtils.createFreshGame();
      
      // Set up outpost on e5
      const outpostMoves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }, // d5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
        { from: { row: 5, col: 5 }, to: { row: 3, col: 4 } }  // Ne5 (outpost)
      ];
      
      outpostMoves.forEach(move => {
        const result = outpostGame.makeMove(move);
        testUtils.validateSuccessResponse(result);
      });
      
      expect(outpostGame.board[3][4]).toEqual({ type: 'knight', color: 'white' });
    });

    test('should handle knight maneuvers around blocked positions', () => {
      // Create blocked center
      game.board[4][4] = { type: 'pawn', color: 'white' };
      game.board[4][3] = { type: 'pawn', color: 'black' };
      game.board[3][4] = { type: 'pawn', color: 'black' };
      game.board[3][3] = { type: 'pawn', color: 'white' };
      
      // Place knight and test maneuvering
      game.board[5][2] = { type: 'knight', color: 'white' };
      
      // Knight should be able to jump over blocked center
      const result = game.makeMove({ from: { row: 5, col: 2 }, to: { row: 3, col: 1 } });
      testUtils.validateSuccessResponse(result);
      expect(game.board[3][1]).toEqual({ type: 'knight', color: 'white' });
    });

    test('should handle knight forks and tactical motifs', () => {
      // Set up fork opportunity
      const forkGame = testUtils.createFreshGame();
      forkGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      forkGame.board[0][4] = { type: 'king', color: 'black' };
      forkGame.board[7][4] = { type: 'king', color: 'white' };
      forkGame.board[4][4] = { type: 'knight', color: 'white' };
      forkGame.board[2][3] = { type: 'queen', color: 'black' };
      forkGame.board[2][5] = { type: 'rook', color: 'black' };
      
      // Knight can fork king and queen
      const result = forkGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 5 } });
      testUtils.validateSuccessResponse(result);
      
      // Verify knight captured rook and is forking
      expect(forkGame.board[2][5]).toEqual({ type: 'knight', color: 'white' });
    });
  });

  describe('Advanced Rook Movement Scenarios', () => {
    test('should handle rook lifts and file control', () => {
      // Set up rook lift scenario
      const liftGame = testUtils.createFreshGame();
      
      // Clear path for rook lift
      liftGame.board[7][1] = null; // Remove knight
      liftGame.board[7][2] = null; // Remove bishop
      liftGame.board[7][3] = null; // Remove queen
      
      // Lift rook to third rank
      const liftMoves = [
        { from: { row: 7, col: 0 }, to: { row: 7, col: 3 } }, // Ra1-d1
        { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }, // e6
        { from: { row: 7, col: 3 }, to: { row: 4, col: 3 } }  // Rd1-d4 (lift)
      ];
      
      liftMoves.forEach(move => {
        const result = liftGame.makeMove(move);
        testUtils.validateSuccessResponse(result);
      });
      
      expect(liftGame.board[4][3]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should handle rook and queen battery', () => {
      // Set up rook-queen battery
      const batteryGame = testUtils.createFreshGame();
      batteryGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      batteryGame.board[0][4] = { type: 'king', color: 'black' };
      batteryGame.board[7][4] = { type: 'king', color: 'white' };
      batteryGame.board[4][0] = { type: 'rook', color: 'white' };
      batteryGame.board[4][3] = { type: 'queen', color: 'white' };
      
      // Both pieces control the same rank
      const result = batteryGame.makeMove({ from: { row: 4, col: 0 }, to: { row: 4, col: 1 } });
      testUtils.validateSuccessResponse(result);
      expect(batteryGame.board[4][1]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should handle rook endgame techniques', () => {
      // Set up rook endgame
      const rookEndgame = testUtils.createFreshGame();
      rookEndgame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      rookEndgame.board[0][4] = { type: 'king', color: 'black' };
      rookEndgame.board[7][4] = { type: 'king', color: 'white' };
      rookEndgame.board[1][0] = { type: 'rook', color: 'white' };
      
      // Rook should control back rank
      const result = rookEndgame.makeMove({ from: { row: 1, col: 0 }, to: { row: 0, col: 0 } });
      testUtils.validateSuccessResponse(result);
      expect(rookEndgame.board[0][0]).toEqual({ type: 'rook', color: 'white' });
    });
  });

  describe('Advanced Bishop Movement Scenarios', () => {
    test('should handle bishop pair coordination', () => {
      // Set up bishop pair
      const bishopPairGame = testUtils.createFreshGame();
      bishopPairGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      bishopPairGame.board[0][4] = { type: 'king', color: 'black' };
      bishopPairGame.board[7][4] = { type: 'king', color: 'white' };
      bishopPairGame.board[4][2] = { type: 'bishop', color: 'white' }; // Light squares
      bishopPairGame.board[4][5] = { type: 'bishop', color: 'white' }; // Dark squares
      
      // Both bishops should control different colored squares
      const lightResult = bishopPairGame.makeMove({ from: { row: 4, col: 2 }, to: { row: 2, col: 0 } });
      testUtils.validateSuccessResponse(lightResult);
      expect(bishopPairGame.board[2][0]).toEqual({ type: 'bishop', color: 'white' });
    });

    test('should handle fianchetto development', () => {
      // Set up fianchetto
      const fianchettoMoves = [
        { from: { row: 6, col: 6 }, to: { row: 5, col: 6 } }, // g3
        { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }, // e6
        { from: { row: 7, col: 5 }, to: { row: 6, col: 6 } }  // Bg2
      ];
      
      fianchettoMoves.forEach(move => {
        const result = game.makeMove(move);
        testUtils.validateSuccessResponse(result);
      });
      
      expect(game.board[6][6]).toEqual({ type: 'bishop', color: 'white' });
    });

    test('should handle bishop vs knight endgames', () => {
      // Set up bishop vs knight endgame
      const endgame = testUtils.createFreshGame();
      endgame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      endgame.board[0][4] = { type: 'king', color: 'black' };
      endgame.board[7][4] = { type: 'king', color: 'white' };
      endgame.board[3][3] = { type: 'bishop', color: 'white' };
      endgame.board[4][4] = { type: 'knight', color: 'black' };
      
      // Bishop should be able to move freely
      const result = endgame.makeMove({ from: { row: 3, col: 3 }, to: { row: 5, col: 1 } });
      testUtils.validateSuccessResponse(result);
      expect(endgame.board[5][1]).toEqual({ type: 'bishop', color: 'white' });
    });
  });

  describe('Advanced Queen Movement Scenarios', () => {
    test('should handle queen sacrifices and tactical shots', () => {
      // Set up queen sacrifice position
      const sacrificeGame = testUtils.createFreshGame();
      sacrificeGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      sacrificeGame.board[0][4] = { type: 'king', color: 'black' };
      sacrificeGame.board[7][4] = { type: 'king', color: 'white' };
      sacrificeGame.board[4][4] = { type: 'queen', color: 'white' };
      sacrificeGame.board[2][2] = { type: 'rook', color: 'black' };
      sacrificeGame.board[2][6] = { type: 'rook', color: 'black' };
      
      // Queen can capture either rook
      const result = sacrificeGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 2 } });
      testUtils.validateSuccessResponse(result);
      expect(sacrificeGame.board[2][2]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should handle queen and minor piece coordination', () => {
      // Set up queen-bishop battery
      const coordinationGame = testUtils.createFreshGame();
      coordinationGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      coordinationGame.board[0][4] = { type: 'king', color: 'black' };
      coordinationGame.board[7][4] = { type: 'king', color: 'white' };
      coordinationGame.board[4][4] = { type: 'queen', color: 'white' };
      coordinationGame.board[6][2] = { type: 'bishop', color: 'white' };
      
      // Queen and bishop control same diagonal
      const result = coordinationGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 3 } });
      testUtils.validateSuccessResponse(result);
      expect(coordinationGame.board[3][3]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should handle queen in endgame positions', () => {
      // Set up queen endgame
      const queenEndgame = testUtils.createFreshGame();
      queenEndgame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      queenEndgame.board[0][0] = { type: 'king', color: 'black' };
      queenEndgame.board[7][7] = { type: 'king', color: 'white' };
      queenEndgame.board[4][4] = { type: 'queen', color: 'white' };
      
      // Queen should dominate the board
      const result = queenEndgame.makeMove({ from: { row: 4, col: 4 }, to: { row: 0, col: 4 } });
      testUtils.validateSuccessResponse(result);
      expect(queenEndgame.board[0][4]).toEqual({ type: 'queen', color: 'white' });
    });
  });

  describe('Advanced King Movement Scenarios', () => {
    test('should handle king activity in endgame', () => {
      // Set up active king endgame
      const activeKingGame = testUtils.createFreshGame();
      activeKingGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      activeKingGame.board[0][4] = { type: 'king', color: 'black' };
      activeKingGame.board[7][4] = { type: 'king', color: 'white' };
      activeKingGame.board[6][0] = { type: 'pawn', color: 'white' };
      activeKingGame.board[1][7] = { type: 'pawn', color: 'black' };
      
      // King should advance to support pawn
      const result = activeKingGame.makeMove({ from: { row: 7, col: 4 }, to: { row: 6, col: 3 } });
      testUtils.validateSuccessResponse(result);
      expect(activeKingGame.board[6][3]).toEqual({ type: 'king', color: 'white' });
    });

    test('should handle king and pawn vs king endgame', () => {
      // Set up K+P vs K endgame
      const kpvkGame = testUtils.createFreshGame();
      kpvkGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      kpvkGame.board[0][4] = { type: 'king', color: 'black' };
      kpvkGame.board[6][4] = { type: 'king', color: 'white' };
      kpvkGame.board[5][4] = { type: 'pawn', color: 'white' };
      
      // King should support pawn advancement
      const result = kpvkGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 3 } });
      testUtils.validateSuccessResponse(result);
      expect(kpvkGame.board[5][3]).toEqual({ type: 'king', color: 'white' });
    });

    test('should handle opposition and zugzwang', () => {
      // Set up opposition position
      const oppositionGame = testUtils.createFreshGame();
      oppositionGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      oppositionGame.board[2][4] = { type: 'king', color: 'black' };
      oppositionGame.board[4][4] = { type: 'king', color: 'white' };
      
      // White king should not be able to advance directly
      const result = oppositionGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
      testUtils.validateErrorResponse(result);
      
      // But can move sideways
      const sideResult = oppositionGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 3 } });
      testUtils.validateSuccessResponse(sideResult);
    });
  });

  describe('Multi-Piece Coordination Tests', () => {
    test('should handle piece coordination in attacks', () => {
      // Set up coordinated attack
      const attackGame = testUtils.createFreshGame();
      attackGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      attackGame.board[0][4] = { type: 'king', color: 'black' };
      attackGame.board[7][4] = { type: 'king', color: 'white' };
      attackGame.board[4][0] = { type: 'rook', color: 'white' };
      attackGame.board[4][7] = { type: 'rook', color: 'white' };
      attackGame.board[0][0] = { type: 'queen', color: 'white' };
      
      // Multiple pieces attacking same target
      const result = attackGame.makeMove({ from: { row: 4, col: 0 }, to: { row: 0, col: 0 } });
      testUtils.validateSuccessResponse(result);
      expect(attackGame.board[0][0]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should handle defensive piece coordination', () => {
      // Set up defensive position
      const defenseGame = testUtils.createFreshGame();
      defenseGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      defenseGame.board[0][4] = { type: 'king', color: 'black' };
      defenseGame.board[7][4] = { type: 'king', color: 'white' };
      defenseGame.board[1][3] = { type: 'rook', color: 'black' };
      defenseGame.board[1][5] = { type: 'rook', color: 'black' };
      defenseGame.board[2][4] = { type: 'queen', color: 'black' };
      
      // Pieces defending each other
      const result = defenseGame.makeMove({ from: { row: 7, col: 4 }, to: { row: 6, col: 4 } });
      testUtils.validateSuccessResponse(result);
      expect(defenseGame.board[6][4]).toEqual({ type: 'king', color: 'white' });
    });

    test('should handle piece exchanges and recaptures', () => {
      // Set up exchange sequence
      const exchangeGame = testUtils.createFreshGame();
      exchangeGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      exchangeGame.board[0][4] = { type: 'king', color: 'black' };
      exchangeGame.board[7][4] = { type: 'king', color: 'white' };
      exchangeGame.board[4][4] = { type: 'queen', color: 'white' };
      exchangeGame.board[4][3] = { type: 'queen', color: 'black' };
      exchangeGame.board[3][4] = { type: 'rook', color: 'white' };
      
      // Queen takes queen
      const result1 = exchangeGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 3 } });
      testUtils.validateSuccessResponse(result1);
      
      // Rook recaptures
      exchangeGame.currentTurn = 'white'; // Force white turn for test
      const result2 = exchangeGame.makeMove({ from: { row: 3, col: 4 }, to: { row: 4, col: 3 } });
      testUtils.validateSuccessResponse(result2);
      
      expect(exchangeGame.board[4][3]).toEqual({ type: 'rook', color: 'white' });
    });
  });

  describe('Edge Case Movement Tests', () => {
    test('should handle pieces at board boundaries correctly', () => {
      // Test all pieces at various board edges
      const edgePositions = [
        { row: 0, col: 0 }, { row: 0, col: 7 },
        { row: 7, col: 0 }, { row: 7, col: 7 }
      ];
      
      const pieceTypes = ['rook', 'bishop', 'queen', 'king', 'knight'];
      
      edgePositions.forEach(pos => {
        pieceTypes.forEach(pieceType => {
          const edgeGame = testUtils.createFreshGame();
          edgeGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
          edgeGame.board[pos.row][pos.col] = { type: pieceType, color: 'white' };
          edgeGame.board[4][4] = { type: 'king', color: 'black' };
          edgeGame.board[3][3] = { type: 'king', color: 'white' };
          
          // Each piece should have at least some valid moves from corner
          let hasValidMove = false;
          
          for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
              if (row === pos.row && col === pos.col) continue;
              
              const result = edgeGame.makeMove({ from: pos, to: { row, col } });
              if (result.success) {
                hasValidMove = true;
                break;
              }
            }
            if (hasValidMove) break;
          }
          
          // All pieces except king should have valid moves from corners
          if (pieceType !== 'king') {
            expect(hasValidMove).toBe(true);
          }
        });
      });
    });

    test('should handle maximum range movements', () => {
      // Test maximum range for long-range pieces
      const maxRangeGame = testUtils.createFreshGame();
      maxRangeGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      maxRangeGame.board[0][0] = { type: 'queen', color: 'white' };
      maxRangeGame.board[4][4] = { type: 'king', color: 'black' };
      maxRangeGame.board[7][7] = { type: 'king', color: 'white' };
      
      // Queen should be able to move to opposite corner
      const result = maxRangeGame.makeMove({ from: { row: 0, col: 0 }, to: { row: 7, col: 7 } });
      testUtils.validateSuccessResponse(result);
      expect(maxRangeGame.board[7][7]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should handle minimum range movements', () => {
      // Test minimum valid moves (1 square for king, L-shape for knight)
      const minRangeGame = testUtils.createFreshGame();
      minRangeGame.board[4][4] = { type: 'king', color: 'white' };
      minRangeGame.board[7][4] = null; // Remove original king
      
      // King should move exactly one square
      const result = minRangeGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 5 } });
      testUtils.validateSuccessResponse(result);
      expect(minRangeGame.board[4][5]).toEqual({ type: 'king', color: 'white' });
    });
  });

  describe('Performance Tests for Advanced Scenarios', () => {
    test('should handle complex piece interactions efficiently', () => {
      const startTime = Date.now();
      
      // Test 500 complex piece interactions
      for (let i = 0; i < 500; i++) {
        const complexGame = testUtils.createFreshGame();
        
        // Create complex position with multiple piece types
        complexGame.board[4][4] = { type: 'queen', color: 'white' };
        complexGame.board[3][3] = { type: 'knight', color: 'black' };
        complexGame.board[5][5] = { type: 'bishop', color: 'white' };
        complexGame.board[2][2] = { type: 'rook', color: 'black' };
        
        // Test various moves
        complexGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 3 } });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 100ms
      expect(duration).toBeLessThan(100);
    });

    test('should maintain performance with many pieces on board', () => {
      const startTime = Date.now();
      
      // Test performance with full board
      for (let i = 0; i < 200; i++) {
        const fullBoardGame = testUtils.createFreshGame();
        
        // Make standard opening moves
        fullBoardGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
        fullBoardGame.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
        fullBoardGame.makeMove({ from: { row: 7, col: 6 }, to: { row: 5, col: 5 } });
        fullBoardGame.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 150ms
      expect(duration).toBeLessThan(150);
    });
  });
});