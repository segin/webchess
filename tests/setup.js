/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Suppress console.error during tests to reduce noise from intentional error tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Track if we're in an error handling test
let suppressErrorLogs = false;

// Custom console.error that can be suppressed
console.error = (...args) => {
  if (!suppressErrorLogs) {
    originalConsoleError(...args);
  }
};

console.warn = (...args) => {
  if (!suppressErrorLogs) {
    originalConsoleWarn(...args);
  }
};

// Global test utilities
global.testUtils = {
  suppressErrorLogs: () => {
    suppressErrorLogs = true;
  },
  
  restoreErrorLogs: () => {
    suppressErrorLogs = false;
  },
  
  // Helper to create a fresh chess game
  createFreshGame: () => {
    const ChessGame = require('../src/shared/chessGame');
    return new ChessGame();
  },
  
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
  
  // Helper to validate error response structure
  validateErrorResponse: (response) => {
    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    expect(response.success).toBe(false);
    expect(response.errorCode).toBeDefined();
    expect(response.message).toBeDefined();
    expect(typeof response.message).toBe('string');
    expect(response.message.length).toBeGreaterThan(0);
  },
  
  // Helper to validate success response structure
  validateSuccessResponse: (response) => {
    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    expect(response.success).toBe(true);
  }
};

// Setup and teardown for each test
beforeEach(() => {
  suppressErrorLogs = false;
});

afterEach(() => {
  suppressErrorLogs = false;
});

// Global teardown
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});