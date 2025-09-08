/**
 * Comprehensive Piece Movement Tests - Part 2
 * Additional piece movement patterns and edge cases
 * Complements the original pieceMovement.test.js
 */

const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Piece Movement Patterns - Part 2', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
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
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
      });
      
      // Verify pawn structure
      expect(game.board[4][3]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[4][4]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[3][4]).toEqual({ type: 'pawn', color: 'black' });
    });

    test('should handle isolated pawns correctly', () => {
      // Create isolated pawn structure
      const isolatedGame = new ChessGame();
      
      // Clear adjacent pawns to create isolation
      isolatedGame.board[6][3] = null; // Remove d2 pawn
      isolatedGame.board[6][5] = null; // Remove f2 pawn
      
      // e2 pawn is now isolated
      const result = isolatedGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      
      // Verify pawn moved correctly despite isolation
      expect(isolatedGame.board[5][4]).toEqual({ type: 'pawn', color: 'white' });
    });

    test('should handle passed pawns advancement', () => {
      // Create passed pawn scenario
      const passedPawnGame = new ChessGame();
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
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
      });
      
      expect(passedPawnGame.board[1][0]).toEqual({ type: 'pawn', color: 'white' });
    });
  });

  describe('Advanced Knight Movement Scenarios', () => {
    test('should handle knight outposts', () => {
      // Create knight outpost position
      const outpostGame = new ChessGame();
      
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
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
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
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      expect(game.board[3][1]).toEqual({ type: 'knight', color: 'white' });
    });

    test('should handle knight forks and tactical motifs', () => {
      // Set up fork opportunity
      const forkGame = new ChessGame();
      forkGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      forkGame.board[0][4] = { type: 'king', color: 'black' };
      forkGame.board[7][4] = { type: 'king', color: 'white' };
      forkGame.board[4][4] = { type: 'knight', color: 'white' };
      forkGame.board[2][3] = { type: 'queen', color: 'black' };
      forkGame.board[2][5] = { type: 'rook', color: 'black' };
      
      // Knight can fork king and queen
      const result = forkGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 5 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      
      // Verify knight captured rook and is forking
      expect(forkGame.board[2][5]).toEqual({ type: 'knight', color: 'white' });
    });
  });

  describe('Advanced Rook Movement Scenarios', () => {
    test('should handle rook lifts and file control', () => {
      // Set up rook lift scenario
      const liftGame = new ChessGame();
      
      // Clear path for rook lift
      liftGame.board[7][1] = null; // Remove knight
      liftGame.board[7][2] = null; // Remove bishop
      liftGame.board[7][3] = null; // Remove queen
      
      // Also clear the pawn paths
      liftGame.board[6][0] = null; // Remove a2 pawn
      liftGame.board[6][3] = null; // Remove d2 pawn to allow rook lift
      
      // Test rook lift in steps
      // First move: Ra1-d1
      const result1 = liftGame.makeMove({ from: { row: 7, col: 0 }, to: { row: 7, col: 3 } });
      expect(result1.success).toBe(true);
      expect(result1.message).toBeDefined();
      expect(result1.data).toBeDefined();
      
      // Black move: e6
      const result2 = liftGame.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } });
      expect(result2.success).toBe(true);
      
      // White move: Rd1-d4 (lift)
      const result3 = liftGame.makeMove({ from: { row: 7, col: 3 }, to: { row: 4, col: 3 } });
      expect(result3.success).toBe(true);
      expect(result3.message).toBeDefined();
      expect(result3.data).toBeDefined();
      
      expect(liftGame.board[4][3]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should handle rook and queen battery', () => {
      // Set up rook-queen battery
      const batteryGame = new ChessGame();
      batteryGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      batteryGame.board[0][4] = { type: 'king', color: 'black' };
      batteryGame.board[7][4] = { type: 'king', color: 'white' };
      batteryGame.board[4][0] = { type: 'rook', color: 'white' };
      batteryGame.board[4][3] = { type: 'queen', color: 'white' };
      
      // Both pieces control the same rank
      const result = batteryGame.makeMove({ from: { row: 4, col: 0 }, to: { row: 4, col: 1 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      expect(batteryGame.board[4][1]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should handle rook endgame techniques', () => {
      // Set up rook endgame
      const rookEndgame = new ChessGame();
      rookEndgame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      rookEndgame.board[0][4] = { type: 'king', color: 'black' };
      rookEndgame.board[7][4] = { type: 'king', color: 'white' };
      rookEndgame.board[1][0] = { type: 'rook', color: 'white' };
      
      // Rook should control back rank
      const result = rookEndgame.makeMove({ from: { row: 1, col: 0 }, to: { row: 0, col: 0 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      expect(rookEndgame.board[0][0]).toEqual({ type: 'rook', color: 'white' });
    });
  });

  describe('Advanced Bishop Movement Scenarios', () => {
    test('should handle bishop pair coordination', () => {
      // Set up bishop pair
      const bishopPairGame = new ChessGame();
      bishopPairGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      bishopPairGame.board[0][4] = { type: 'king', color: 'black' };
      bishopPairGame.board[7][4] = { type: 'king', color: 'white' };
      bishopPairGame.board[4][2] = { type: 'bishop', color: 'white' }; // Light squares
      bishopPairGame.board[4][5] = { type: 'bishop', color: 'white' }; // Dark squares
      
      // Both bishops should control different colored squares
      const lightResult = bishopPairGame.makeMove({ from: { row: 4, col: 2 }, to: { row: 2, col: 0 } });
      expect(lightResult.success).toBe(true);
      expect(lightResult.message).toBeDefined();
      expect(lightResult.data).toBeDefined();
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
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
      });
      
      expect(game.board[6][6]).toEqual({ type: 'bishop', color: 'white' });
    });

    test('should handle bishop vs knight endgames', () => {
      // Set up bishop vs knight endgame
      const endgame = new ChessGame();
      endgame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      endgame.board[0][4] = { type: 'king', color: 'black' };
      endgame.board[7][4] = { type: 'king', color: 'white' };
      endgame.board[3][3] = { type: 'bishop', color: 'white' };
      endgame.board[4][4] = { type: 'knight', color: 'black' };
      
      // Bishop should be able to move freely
      const result = endgame.makeMove({ from: { row: 3, col: 3 }, to: { row: 5, col: 1 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      expect(endgame.board[5][1]).toEqual({ type: 'bishop', color: 'white' });
    });
  });

  describe('Advanced Queen Movement Scenarios', () => {
    test('should handle queen sacrifices and tactical shots', () => {
      // Set up queen sacrifice position
      const sacrificeGame = new ChessGame();
      sacrificeGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      sacrificeGame.board[0][4] = { type: 'king', color: 'black' };
      sacrificeGame.board[7][4] = { type: 'king', color: 'white' };
      sacrificeGame.board[4][4] = { type: 'queen', color: 'white' };
      sacrificeGame.board[2][2] = { type: 'rook', color: 'black' };
      sacrificeGame.board[2][6] = { type: 'rook', color: 'black' };
      
      // Queen can capture either rook
      const result = sacrificeGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 2 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      expect(sacrificeGame.board[2][2]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should handle queen and minor piece coordination', () => {
      // Set up queen-bishop battery
      const coordinationGame = new ChessGame();
      coordinationGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      coordinationGame.board[0][4] = { type: 'king', color: 'black' };
      coordinationGame.board[7][4] = { type: 'king', color: 'white' };
      coordinationGame.board[4][4] = { type: 'queen', color: 'white' };
      coordinationGame.board[6][2] = { type: 'bishop', color: 'white' };
      
      // Queen and bishop control same diagonal
      const result = coordinationGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 3 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      expect(coordinationGame.board[3][3]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should handle queen in endgame positions', () => {
      // Set up queen endgame
      const queenEndgame = new ChessGame();
      queenEndgame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      queenEndgame.board[0][0] = { type: 'king', color: 'black' };
      queenEndgame.board[7][7] = { type: 'king', color: 'white' };
      queenEndgame.board[4][4] = { type: 'queen', color: 'white' };
      
      // Queen should dominate the board
      const result = queenEndgame.makeMove({ from: { row: 4, col: 4 }, to: { row: 0, col: 4 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      expect(queenEndgame.board[0][4]).toEqual({ type: 'queen', color: 'white' });
    });
  });

  describe('Advanced King Movement Scenarios', () => {
    test('should handle king activity in endgame', () => {
      // Set up active king endgame
      const activeKingGame = new ChessGame();
      activeKingGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      activeKingGame.board[0][4] = { type: 'king', color: 'black' };
      activeKingGame.board[7][4] = { type: 'king', color: 'white' };
      activeKingGame.board[6][0] = { type: 'pawn', color: 'white' };
      activeKingGame.board[1][7] = { type: 'pawn', color: 'black' };
      
      // King should advance to support pawn
      const result = activeKingGame.makeMove({ from: { row: 7, col: 4 }, to: { row: 6, col: 3 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      expect(activeKingGame.board[6][3]).toEqual({ type: 'king', color: 'white' });
    });

    test('should handle king and pawn vs king endgame', () => {
      // Set up K+P vs K endgame
      const kpvkGame = new ChessGame();
      kpvkGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      kpvkGame.board[0][4] = { type: 'king', color: 'black' };
      kpvkGame.board[6][4] = { type: 'king', color: 'white' };
      kpvkGame.board[5][4] = { type: 'pawn', color: 'white' };
      
      // King should support pawn advancement
      const result = kpvkGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 3 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      expect(kpvkGame.board[5][3]).toEqual({ type: 'king', color: 'white' });
    });

    test('should handle opposition and zugzwang', () => {
      // Set up opposition position
      const oppositionGame = new ChessGame();
      oppositionGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      oppositionGame.board[2][4] = { type: 'king', color: 'black' };
      oppositionGame.board[4][4] = { type: 'king', color: 'white' };
      
      // White king should not be able to advance directly
      const result = oppositionGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      
      // But can move sideways
      const sideResult = oppositionGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 3 } });
      expect(sideResult.success).toBe(true);
      expect(sideResult.message).toBeDefined();
      expect(sideResult.data).toBeDefined();
    });
  });

  describe('Multi-Piece Coordination Tests', () => {
    test('should handle piece coordination in attacks', () => {
      // Set up coordinated attack
      const attackGame = new ChessGame();
      attackGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      attackGame.board[0][4] = { type: 'king', color: 'black' };
      attackGame.board[7][4] = { type: 'king', color: 'white' };
      attackGame.board[4][0] = { type: 'rook', color: 'white' };
      attackGame.board[4][7] = { type: 'rook', color: 'white' };
      attackGame.board[0][0] = { type: 'queen', color: 'black' }; // Target to capture
      
      // Multiple pieces attacking same target
      const result = attackGame.makeMove({ from: { row: 4, col: 0 }, to: { row: 0, col: 0 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      expect(attackGame.board[0][0]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should handle defensive piece coordination', () => {
      // Set up defensive position
      const defenseGame = new ChessGame();
      defenseGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      defenseGame.board[0][4] = { type: 'king', color: 'black' };
      defenseGame.board[7][4] = { type: 'king', color: 'white' };
      defenseGame.board[1][3] = { type: 'rook', color: 'black' };
      defenseGame.board[1][5] = { type: 'rook', color: 'black' };
      defenseGame.board[2][4] = { type: 'queen', color: 'black' };
      
      // Pieces defending each other
      const result = defenseGame.makeMove({ from: { row: 7, col: 4 }, to: { row: 6, col: 4 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      expect(defenseGame.board[6][4]).toEqual({ type: 'king', color: 'white' });
    });

    test('should handle piece exchanges and recaptures', () => {
      // Set up exchange sequence
      const exchangeGame = new ChessGame();
      exchangeGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      exchangeGame.board[0][4] = { type: 'king', color: 'black' };
      exchangeGame.board[7][4] = { type: 'king', color: 'white' };
      exchangeGame.board[4][4] = { type: 'queen', color: 'white' };
      exchangeGame.board[4][3] = { type: 'queen', color: 'black' };
      exchangeGame.board[3][4] = { type: 'rook', color: 'white' };
      
      // Queen takes queen
      const result1 = exchangeGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 3 } });
      expect(result1.success).toBe(true);
      expect(result1.message).toBeDefined();
      expect(result1.data).toBeDefined();
      
      // Verify queen captured
      expect(exchangeGame.board[4][3]).toEqual({ type: 'queen', color: 'white' });
      expect(exchangeGame.board[4][4]).toBeNull();
    });
  });

  describe('Edge Case Movement Tests', () => {
    test('should handle pieces at board boundaries correctly', () => {
      // Test specific pieces at board edges with known valid moves
      const edgeGame = new ChessGame();
      edgeGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      edgeGame.board[0][0] = { type: 'rook', color: 'white' };
      edgeGame.board[4][4] = { type: 'king', color: 'black' };
      edgeGame.board[7][7] = { type: 'king', color: 'white' };
      
      // Rook at a8 should be able to move to a7
      const result1 = edgeGame.makeMove({ from: { row: 0, col: 0 }, to: { row: 1, col: 0 } });
      expect(result1.success).toBe(true);
      expect(result1.message).toBeDefined();
      expect(result1.data).toBeDefined();
      
      // Test queen at corner
      const queenGame = new ChessGame();
      queenGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      queenGame.board[0][0] = { type: 'queen', color: 'white' };
      queenGame.board[4][4] = { type: 'king', color: 'black' };
      queenGame.board[7][7] = { type: 'king', color: 'white' };
      
      // Queen at a8 should be able to move to b8
      const result2 = queenGame.makeMove({ from: { row: 0, col: 0 }, to: { row: 0, col: 1 } });
      expect(result2.success).toBe(true);
      expect(result2.message).toBeDefined();
      expect(result2.data).toBeDefined();
    });

    test('should handle maximum range movements', () => {
      // Test maximum range for long-range pieces
      const maxRangeGame = new ChessGame();
      maxRangeGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      maxRangeGame.board[0][0] = { type: 'queen', color: 'white' };
      maxRangeGame.board[0][4] = { type: 'king', color: 'black' }; // Move black king away from diagonal
      maxRangeGame.board[7][4] = { type: 'king', color: 'white' }; // White king at e1
      
      // Queen should be able to move to opposite corner
      const result = maxRangeGame.makeMove({ from: { row: 0, col: 0 }, to: { row: 7, col: 7 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      expect(maxRangeGame.board[7][7]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should handle minimum range movements', () => {
      // Test minimum valid moves (1 square for king, L-shape for knight)
      const minRangeGame = new ChessGame();
      minRangeGame.board[4][4] = { type: 'king', color: 'white' };
      minRangeGame.board[7][4] = null; // Remove original king
      
      // King should move exactly one square
      const result = minRangeGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 5 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      expect(minRangeGame.board[4][5]).toEqual({ type: 'king', color: 'white' });
    });
  });

  describe('Performance Tests for Advanced Scenarios', () => {
    test('should handle complex piece interactions efficiently', () => {
      const startTime = Date.now();
      
      // Test 500 complex piece interactions
      for (let i = 0; i < 500; i++) {
        const complexGame = new ChessGame();
        
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
      
      // Should complete in under 1000ms
      expect(duration).toBeLessThan(1000);
    });

    test('should maintain performance with many pieces on board', () => {
      const startTime = Date.now();
      
      // Test performance with full board
      for (let i = 0; i < 200; i++) {
        const fullBoardGame = new ChessGame();
        
        // Make standard opening moves
        fullBoardGame.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
        fullBoardGame.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
        fullBoardGame.makeMove({ from: { row: 7, col: 6 }, to: { row: 5, col: 5 } });
        fullBoardGame.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 2000ms
      expect(duration).toBeLessThan(2000);
    });
  });
});