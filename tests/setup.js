/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Import error suppression utilities
const { testUtils: errorSuppressionUtils } = require('./utils/errorSuppression');

// Global test utilities - merge with error suppression utilities
global.testUtils = {
  // Error suppression utilities
  ...errorSuppressionUtils,
  
  // Additional test utilities (createFreshGame is already in errorSuppressionUtils)
  
  // Helper to create standard test positions
  createTestPosition: (positionName) => {
    const ChessGame = require('../src/shared/chessGame');
    const game = new ChessGame();
    
    switch (positionName) {
      case 'empty':
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        break;
      case 'kings-only':
        game.board = Array(8).fill(null).map(() => Array(8).fill(null));
        game.board[0][4] = { type: 'king', color: 'black' };
        game.board[7][4] = { type: 'king', color: 'white' };
        break;
      case 'castling-ready':
        // Clear path for castling
        game.board[7][1] = null;
        game.board[7][2] = null;
        game.board[7][3] = null;
        game.board[7][5] = null;
        game.board[7][6] = null;
        break;
      default:
        // Return standard starting position
        break;
    }
    
    return game;
  },
  
  // Helper to execute a sequence of moves
  executeMovesSequence: (game, moves) => {
    const results = [];
    for (const move of moves) {
      const result = game.makeMove(move);
      results.push(result);
      if (!result.success) {
        break;
      }
    }
    return results;
  },
  
  // validateErrorResponse and validateSuccessResponse are already in errorSuppressionUtils
};

// Setup and teardown for each test
beforeEach(() => {
  // Clear any previous error suppression
  global.testUtils.clearSuppressedHistory();
});

afterEach(() => {
  // Restore console functions after each test
  global.testUtils.restoreErrorLogs();
});

// Global teardown
afterAll(() => {
  // Ensure console functions are restored
  global.testUtils.restoreErrorLogs();
});