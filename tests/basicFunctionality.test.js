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
      
      // Validate move was executed
      testUtils.validateBoardPosition(game.board, 5, 4, { type: 'pawn', color: 'white' });
      testUtils.validateBoardPosition(game.board, 6, 4, null);
    });

    test(testUtils.NamingPatterns.gameStateTest('turn alternation', 'alternate turns after valid moves'), () => {
      expect(game.currentTurn).toBe('white');
      
      // Execute white move
      testUtils.ExecutionHelpers.testMove(game, { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } }, true);
      expect(game.currentTurn).toBe('black');
    });

    test(testUtils.NamingPatterns.gameStateTest('game state structure', 'provide complete game state information'), () => {
      const gameState = game.getGameState();
      
      // Validate basic game state structure
      testUtils.validateGameState(gameState);
      
      // Check for enhanced metadata if available
      if (gameState.gameMetadata) {
        expect(gameState.gameMetadata).toBeDefined();
        expect(gameState.gameMetadata.startTime).toBeDefined();
      }
      
      // Check for position history if available
      if (gameState.positionHistory) {
        expect(Array.isArray(gameState.positionHistory)).toBe(true);
      }
      
      // Check for state consistency if available
      if (gameState.stateConsistency) {
        expect(gameState.stateConsistency.success).toBeDefined();
      }
    });
  });
});