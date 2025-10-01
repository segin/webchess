/**
 * Basic Functionality Tests
 * Verifies that core chess game functionality works correctly
 * Serves as smoke tests for fundamental game operations
 */

const ChessGame = require('../src/shared/chessGame');

describe('Basic Chess Game Functionality', () => {
  let game;

  beforeEach(() => {
    game = testUtils.createFreshGame();
  });

  describe('Core Game Operations', () => {
    test(testUtils.NamingPatterns.moveValidationTest('pawn', 'execute basic pawn move successfully'), () => {
      const basicMove = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = testUtils.ExecutionHelpers.testMove(game, basicMove, true);
      
      // Validate move was executed using current API response structure
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      
      // Validate board state changes
      testUtils.validateBoardPosition(game.board, 5, 4, { type: 'pawn', color: 'white' });
      testUtils.validateBoardPosition(game.board, 6, 4, null);
    });

    test(testUtils.NamingPatterns.gameStateTest('turn alternation', 'alternate turns after valid moves'), () => {
      expect(game.currentTurn).toBe('white');
      
      // Execute white move
      const result = testUtils.ExecutionHelpers.testMove(game, { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } }, true);
      
      // Validate response structure
      expect(result.success).toBe(true);
      expect(result.data.currentTurn).toBe('black');
      expect(game.currentTurn).toBe('black');
    });

    test(testUtils.NamingPatterns.gameStateTest('game state structure', 'provide complete game state information'), () => {
      // Use current API to get game state
      const gameState = game.getGameState();
      
      // Validate basic game state structure using current property names
      testUtils.validateGameState(gameState);
      
      // Validate specific current API properties
      expect(gameState.gameStatus).toBe('active');
      expect(gameState.status).toBe('active'); // Backward compatibility
      expect(gameState.currentTurn).toBe('white');
      expect(gameState.winner).toBeNull();
      expect(Array.isArray(gameState.moveHistory)).toBe(true);
      expect(gameState.moveHistory).toHaveLength(0);
      expect(gameState.inCheck).toBe(false);
      
      // Check for enhanced metadata
      expect(gameState.gameMetadata).toBeDefined();
      expect(gameState.gameMetadata.startTime).toBeDefined();
      
      // Check for position history
      expect(Array.isArray(gameState.positionHistory)).toBe(true);
      
      // Check for state consistency validation
      expect(gameState.stateConsistency).toBeDefined();
      expect(gameState.stateConsistency.success).toBeDefined();
    });

    test('should handle invalid moves with current error response structure', () => {
      const invalidMove = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } }; // Invalid pawn move
      const result = game.makeMove(invalidMove);
      
      // Validate current error response structure
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errorCode).toBeDefined();
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
      
      // Ensure game state unchanged after invalid move
      expect(game.currentTurn).toBe('white');
      expect(game.gameStatus).toBe('active');
    });

    test('should validate basic piece capture mechanics', () => {
      // Set up a capture scenario
      const whiteMove = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }; // e2-e4
      const blackMove = { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }; // d7-d5
      const captureMove = { from: { row: 4, col: 4 }, to: { row: 3, col: 3 } }; // exd5
      
      // Execute setup moves
      let result = game.makeMove(whiteMove);
      expect(result.success).toBe(true);
      
      result = game.makeMove(blackMove);
      expect(result.success).toBe(true);
      
      // Execute capture
      result = game.makeMove(captureMove);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      // Validate capture result
      testUtils.validateBoardPosition(game.board, 3, 3, { type: 'pawn', color: 'white' });
      testUtils.validateBoardPosition(game.board, 4, 4, null);
    });

    test('should maintain move history with current API structure', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.moveHistory).toHaveLength(1);
      
      const moveRecord = game.moveHistory[0];
      expect(moveRecord.from).toEqual({ row: 6, col: 4 });
      expect(moveRecord.to).toEqual({ row: 5, col: 4 });
      expect(moveRecord.piece).toBe('pawn');
      expect(moveRecord.color).toBe('white');
    });
  });
});