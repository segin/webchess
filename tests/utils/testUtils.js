/**
 * Centralized Test Utilities
 * Common setup, teardown, and helper functions for consistent testing
 */

const ChessGame = require('../../src/shared/chessGame');
const ResourceManager = require('./ResourceManager');
const { TestPositions, TestSequences, TestData } = require('../helpers/testData');
const { AssertionPatterns, ExecutionHelpers } = require('../helpers/testPatterns');

/**
 * Game State Factory - Creates standardized game instances
 */
class GameStateFactory {
  /**
   * Create a new game with standard starting position
   * @returns {ChessGame} New game instance
   */
  static createStandardGame() {
    return new ChessGame();
  }

  /**
   * Create a game from a test position
   * @param {string} positionName - Name of test position from TestPositions
   * @returns {ChessGame} Game instance with specified position
   */
  static createFromPosition(positionName) {
    if (!TestPositions[positionName]) {
      throw new Error(`Unknown test position: ${positionName}`);
    }
    return TestPositions[positionName]();
  }

  /**
   * Create a game and execute a move sequence
   * @param {Array} moveSequence - Array of moves to execute
   * @param {boolean} validateMoves - Whether to validate each move
   * @returns {ChessGame} Game instance after moves
   */
  static createWithMoveSequence(moveSequence, validateMoves = true) {
    const game = new ChessGame();
    
    for (const move of moveSequence) {
      const result = game.makeMove(move);
      if (validateMoves && !result.success) {
        throw new Error(`Move failed: ${result.message}`);
      }
    }
    
    return game;
  }

  /**
   * Create a custom game with specific board setup
   * @param {Object} config - Game configuration
   * @param {Array} config.board - Custom board setup
   * @param {string} config.currentTurn - Current turn
   * @param {Object} config.castlingRights - Castling rights
   * @param {Object} config.enPassantTarget - En passant target
   * @returns {ChessGame} Configured game instance
   */
  static createCustomGame(config) {
    const game = new ChessGame();
    
    if (config.board) {
      game.board = config.board;
    }
    if (config.currentTurn) {
      game.currentTurn = config.currentTurn;
    }
    if (config.castlingRights) {
      game.castlingRights = config.castlingRights;
    }
    if (config.enPassantTarget) {
      game.enPassantTarget = config.enPassantTarget;
    }
    if (config.gameStatus) {
      game.gameStatus = config.gameStatus;
    }
    if (config.inCheck !== undefined) {
      game.inCheck = config.inCheck;
    }
    if (config.winner !== undefined) {
      game.winner = config.winner;
    }
    
    return game;
  }
}

/**
 * Board Position Utilities - Helper functions for board manipulation
 */
class BoardUtils {
  /**
   * Create an empty 8x8 board
   * @returns {Array} Empty board array
   */
  static createEmptyBoard() {
    return Array(8).fill(null).map(() => Array(8).fill(null));
  }

  /**
   * Place a piece on the board
   * @param {Array} board - Board array
   * @param {number} row - Row coordinate
   * @param {number} col - Column coordinate
   * @param {string} type - Piece type
   * @param {string} color - Piece color
   */
  static placePiece(board, row, col, type, color) {
    if (row < 0 || row > 7 || col < 0 || col > 7) {
      throw new Error(`Invalid coordinates: ${row}, ${col}`);
    }
    board[row][col] = { type, color };
  }

  /**
   * Remove a piece from the board
   * @param {Array} board - Board array
   * @param {number} row - Row coordinate
   * @param {number} col - Column coordinate
   */
  static removePiece(board, row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) {
      throw new Error(`Invalid coordinates: ${row}, ${col}`);
    }
    board[row][col] = null;
  }

  /**
   * Get piece at position
   * @param {Array} board - Board array
   * @param {number} row - Row coordinate
   * @param {number} col - Column coordinate
   * @returns {Object|null} Piece at position or null
   */
  static getPiece(board, row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) {
      return null;
    }
    return board[row][col];
  }

  /**
   * Count pieces of a specific type and color
   * @param {Array} board - Board array
   * @param {string} type - Piece type (optional)
   * @param {string} color - Piece color (optional)
   * @returns {number} Count of matching pieces
   */
  static countPieces(board, type = null, color = null) {
    let count = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          if ((!type || piece.type === type) && (!color || piece.color === color)) {
            count++;
          }
        }
      }
    }
    return count;
  }

  /**
   * Find all pieces of a specific type and color
   * @param {Array} board - Board array
   * @param {string} type - Piece type
   * @param {string} color - Piece color
   * @returns {Array} Array of positions with matching pieces
   */
  static findPieces(board, type, color) {
    const positions = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === type && piece.color === color) {
          positions.push({ row, col, piece });
        }
      }
    }
    return positions;
  }

  /**
   * Create a deep copy of a board
   * @param {Array} board - Board to copy
   * @returns {Array} Deep copy of board
   */
  static copyBoard(board) {
    return board.map(row => row.map(piece => piece ? { ...piece } : null));
  }

  /**
   * Compare two boards for equality
   * @param {Array} board1 - First board
   * @param {Array} board2 - Second board
   * @returns {boolean} True if boards are identical
   */
  static boardsEqual(board1, board2) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece1 = board1[row][col];
        const piece2 = board2[row][col];
        
        if (piece1 === null && piece2 === null) continue;
        if (piece1 === null || piece2 === null) return false;
        if (piece1.type !== piece2.type || piece1.color !== piece2.color) return false;
      }
    }
    return true;
  }
}

/**
 * Test Data Generators - Generate consistent test data
 */
class TestDataGenerator {
  /**
   * Generate valid move coordinates
   * @returns {Object} Valid move object
   */
  static generateValidMove() {
    return {
      from: { row: 6, col: 4 }, // e2 pawn
      to: { row: 5, col: 4 }    // e3
    };
  }

  /**
   * Generate invalid move coordinates
   * @returns {Object} Invalid move object
   */
  static generateInvalidMove() {
    const invalidMoves = [
      { from: { row: -1, col: 0 }, to: { row: 0, col: 0 } },
      { from: { row: 0, col: 0 }, to: { row: 8, col: 0 } },
      { from: { row: 0, col: 0 }, to: { row: 0, col: -1 } },
      { from: { row: 0, col: 0 }, to: { row: 0, col: 8 } }
    ];
    return invalidMoves[Math.floor(Math.random() * invalidMoves.length)];
  }

  /**
   * Generate malformed move data
   * @returns {any} Malformed move data
   */
  static generateMalformedMove() {
    const malformedMoves = [
      null,
      undefined,
      {},
      { from: { row: 6, col: 4 } }, // missing 'to'
      { to: { row: 5, col: 4 } },   // missing 'from'
      { from: null, to: { row: 5, col: 4 } },
      { from: { row: 6, col: 4 }, to: null },
      { from: { row: 'invalid', col: 4 }, to: { row: 5, col: 4 } },
      { from: { row: 6, col: 4 }, to: { row: 5, col: 'invalid' } }
    ];
    return malformedMoves[Math.floor(Math.random() * malformedMoves.length)];
  }

  /**
   * Generate test game ID
   * @returns {string} Test game ID
   */
  static generateGameId() {
    return 'TEST' + Math.random().toString(36).substr(2, 2).toUpperCase();
  }

  /**
   * Generate test player data
   * @param {string} color - Player color
   * @returns {Object} Test player object
   */
  static generatePlayer(color = 'white') {
    return {
      id: `test-player-${color}-${Date.now()}`,
      color: color,
      name: `Test Player ${color}`,
      connected: true
    };
  }
}

/**
 * Async Test Utilities - Helpers for async operations
 */
class AsyncTestUtils {
  /**
   * Wait for a specified amount of time
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Promise that resolves after delay
   */
  static async delay(ms) {
    return new Promise(resolve => {
      const timerId = setTimeout(resolve, ms);
      ResourceManager.trackTimer(timerId);
    });
  }

  /**
   * Wait for a condition to be true
   * @param {Function} condition - Function that returns boolean
   * @param {number} timeout - Maximum time to wait in ms
   * @param {number} interval - Check interval in ms
   * @returns {Promise} Promise that resolves when condition is true
   */
  static async waitForCondition(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return true;
      }
      await this.delay(interval);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Execute function with timeout
   * @param {Function} fn - Function to execute
   * @param {number} timeout - Timeout in ms
   * @returns {Promise} Promise that resolves with function result or rejects on timeout
   */
  static async withTimeout(fn, timeout = 5000) {
    return Promise.race([
      fn(),
      new Promise((_, reject) => {
        const timerId = setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeout}ms`));
        }, timeout);
        ResourceManager.trackTimer(timerId);
      })
    ]);
  }

  /**
   * Execute multiple async operations in parallel
   * @param {Array} operations - Array of async functions
   * @returns {Promise} Promise that resolves with array of results
   */
  static async parallel(operations) {
    return Promise.all(operations.map(op => op()));
  }

  /**
   * Execute multiple async operations in sequence
   * @param {Array} operations - Array of async functions
   * @returns {Promise} Promise that resolves with array of results
   */
  static async sequence(operations) {
    const results = [];
    for (const operation of operations) {
      results.push(await operation());
    }
    return results;
  }
}

/**
 * Test Cleanup Utilities - Standardized cleanup operations
 */
class CleanupUtils {
  /**
   * Standard test cleanup
   * @returns {Promise} Promise that resolves when cleanup is complete
   */
  static async standardCleanup() {
    // Clear all timers
    ResourceManager.clearAllTimers();
    
    // Clean up all tracked resources
    await ResourceManager.cleanupAll();
    
    // Clear Jest mocks
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    // Reset any global state if needed
    if (global.testState) {
      global.testState = {};
    }
  }

  /**
   * Game-specific cleanup
   * @param {ChessGame} game - Game instance to clean up
   */
  static cleanupGame(game) {
    if (game && typeof game.cleanup === 'function') {
      game.cleanup();
    }
  }

  /**
   * Server-specific cleanup
   * @param {Object} server - Server instance to clean up
   * @returns {Promise} Promise that resolves when server is closed
   */
  static async cleanupServer(server) {
    if (server && typeof server.close === 'function') {
      return new Promise((resolve) => {
        server.close(() => resolve());
      });
    }
  }

  /**
   * Socket-specific cleanup
   * @param {Object} socket - Socket instance to clean up
   */
  static cleanupSocket(socket) {
    if (socket) {
      if (typeof socket.disconnect === 'function') {
        socket.disconnect();
      } else if (typeof socket.close === 'function') {
        socket.close();
      } else if (typeof socket.destroy === 'function') {
        socket.destroy();
      }
    }
  }
}

/**
 * Error Suppression Utilities - For testing error conditions
 */
class ErrorSuppressionUtils {
  constructor() {
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    this.suppressedPatterns = [];
    this.isSuppressing = false;
  }

  /**
   * Suppress console errors matching specific patterns
   * @param {Array} patterns - Array of string patterns to suppress
   */
  suppressErrorLogs(patterns = []) {
    if (this.isSuppressing) return;
    
    this.suppressedPatterns = patterns;
    this.isSuppressing = true;
    
    console.error = (...args) => {
      const message = args.join(' ');
      const shouldSuppress = this.suppressedPatterns.some(pattern => 
        message.includes(pattern)
      );
      
      if (!shouldSuppress) {
        this.originalConsoleError.apply(console, args);
      }
    };
    
    console.warn = (...args) => {
      const message = args.join(' ');
      const shouldSuppress = this.suppressedPatterns.some(pattern => 
        message.includes(pattern)
      );
      
      if (!shouldSuppress) {
        this.originalConsoleWarn.apply(console, args);
      }
    };
  }

  /**
   * Restore original console methods
   */
  restoreErrorLogs() {
    if (!this.isSuppressing) return;
    
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    this.isSuppressing = false;
    this.suppressedPatterns = [];
  }
}

// Create singleton instance for error suppression
const errorSuppression = new ErrorSuppressionUtils();

/**
 * Main TestUtils class - Aggregates all utilities
 */
class TestUtils {
  static GameStateFactory = GameStateFactory;
  static BoardUtils = BoardUtils;
  static TestDataGenerator = TestDataGenerator;
  static AsyncTestUtils = AsyncTestUtils;
  static CleanupUtils = CleanupUtils;
  
  // Direct access to common utilities
  static createStandardGame = GameStateFactory.createStandardGame;
  static createFromPosition = GameStateFactory.createFromPosition;
  static createWithMoveSequence = GameStateFactory.createWithMoveSequence;
  static createCustomGame = GameStateFactory.createCustomGame;
  
  static createEmptyBoard = BoardUtils.createEmptyBoard;
  static placePiece = BoardUtils.placePiece;
  static removePiece = BoardUtils.removePiece;
  static getPiece = BoardUtils.getPiece;
  static countPieces = BoardUtils.countPieces;
  static findPieces = BoardUtils.findPieces;
  static copyBoard = BoardUtils.copyBoard;
  static boardsEqual = BoardUtils.boardsEqual;
  
  static generateValidMove = TestDataGenerator.generateValidMove;
  static generateInvalidMove = TestDataGenerator.generateInvalidMove;
  static generateMalformedMove = TestDataGenerator.generateMalformedMove;
  static generateGameId = TestDataGenerator.generateGameId;
  static generatePlayer = TestDataGenerator.generatePlayer;
  
  static delay = AsyncTestUtils.delay;
  static waitForCondition = AsyncTestUtils.waitForCondition;
  static withTimeout = AsyncTestUtils.withTimeout;
  static parallel = AsyncTestUtils.parallel;
  static sequence = AsyncTestUtils.sequence;
  
  static standardCleanup = CleanupUtils.standardCleanup;
  static cleanupGame = CleanupUtils.cleanupGame;
  static cleanupServer = CleanupUtils.cleanupServer;
  static cleanupSocket = CleanupUtils.cleanupSocket;
  
  static suppressErrorLogs = errorSuppression.suppressErrorLogs.bind(errorSuppression);
  static restoreErrorLogs = errorSuppression.restoreErrorLogs.bind(errorSuppression);
  
  // Access to test data and patterns
  static TestPositions = TestPositions;
  static TestSequences = TestSequences;
  static TestData = TestData;
  static AssertionPatterns = AssertionPatterns;
  static ExecutionHelpers = ExecutionHelpers;
  
  // Additional convenience methods for common test patterns
  
  /**
   * Create a fresh game instance (alias for createStandardGame)
   * @returns {ChessGame} New game instance
   */
  static createFreshGame() {
    return GameStateFactory.createStandardGame();
  }
  
  /**
   * Create a game with specific test scenario
   * @param {string} scenario - Scenario name from TestPositions
   * @returns {ChessGame} Game instance with scenario setup
   */
  static createGameScenario(scenario) {
    const scenarioName = scenario.toUpperCase().replace(/\s+/g, '_');
    return GameStateFactory.createFromPosition(scenarioName);
  }
  
  /**
   * Execute a move and validate the response structure
   * @param {ChessGame} game - Game instance
   * @param {Object} move - Move to execute
   * @param {boolean} expectSuccess - Whether move should succeed
   * @param {string} expectedErrorCode - Expected error code if move fails
   * @returns {Object} Move response
   */
  static executeAndValidateMove(game, move, expectSuccess = true, expectedErrorCode = null) {
    const response = game.makeMove(move);
    
    if (expectSuccess) {
      AssertionPatterns.validateSuccessfulMove(response);
    } else {
      AssertionPatterns.validateFailedMove(response, expectedErrorCode);
    }
    
    return response;
  }
  
  /**
   * Create a test suite with standard setup and cleanup
   * @param {Object} options - Setup options
   * @returns {Object} Object with beforeEach and afterEach functions
   */
  static createTestSuite(options = {}) {
    const { 
      gameFactory = null, 
      suppressErrors = [], 
      trackResources = true,
      customSetup = null,
      customCleanup = null
    } = options;
    
    return {
      beforeEach: function() {
        // Track resources
        if (trackResources) {
          ResourceManager.initialize();
        }
        
        // Suppress error logs
        if (suppressErrors.length > 0) {
          TestUtils.suppressErrorLogs(suppressErrors);
        }
        
        // Create game instance
        if (gameFactory) {
          this.game = gameFactory();
        } else {
          this.game = TestUtils.createStandardGame();
        }
        
        // Initialize test state
        this.testState = {
          startTime: Date.now(),
          resources: [],
          mocks: []
        };
        
        // Custom setup
        if (customSetup) {
          customSetup.call(this);
        }
      },
      
      afterEach: async function() {
        // Custom cleanup first
        if (customCleanup) {
          await customCleanup.call(this);
        }
        
        // Clean up game
        if (this.game) {
          TestUtils.cleanupGame(this.game);
          this.game = null;
        }
        
        // Standard cleanup
        await TestUtils.standardCleanup();
        
        // Clean up test state
        if (this.testState) {
          for (const resource of this.testState.resources) {
            try {
              if (typeof resource.cleanup === 'function') {
                await resource.cleanup();
              }
            } catch (error) {
              // Ignore cleanup errors
            }
          }
          this.testState = null;
        }
      }
    };
  }
  
  /**
   * Apply standard test suite setup to current describe block
   * @param {Object} options - Setup options
   */
  static applyStandardSuite(options = {}) {
    const suite = this.createTestSuite(options);
    beforeEach(suite.beforeEach);
    afterEach(suite.afterEach);
  }
  
  /**
   * Create a mock WebSocket for testing
   * @param {Object} options - Mock options
   * @returns {Object} Mock WebSocket object
   */
  static createMockWebSocket(options = {}) {
    const {
      id = TestDataGenerator.generateGameId(),
      connected = true,
      rooms = new Set()
    } = options;
    
    return {
      id,
      connected,
      rooms,
      emit: jest.fn(),
      on: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
      to: jest.fn().mockReturnThis()
    };
  }
  
  /**
   * Create a mock Socket.IO server for testing
   * @param {Object} options - Mock options
   * @returns {Object} Mock Socket.IO server object
   */
  static createMockSocketIOServer(options = {}) {
    return {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      on: jest.fn(),
      sockets: {
        sockets: new Map()
      },
      close: jest.fn()
    };
  }
  
  /**
   * Create a mock HTTP server for testing
   * @param {Object} options - Mock options
   * @returns {Object} Mock HTTP server object
   */
  static createMockHTTPServer(options = {}) {
    const {
      port = 0,
      host = 'localhost'
    } = options;
    
    return {
      listen: jest.fn((p, h, callback) => {
        if (callback) callback();
      }),
      close: jest.fn((callback) => {
        if (callback) callback();
      }),
      on: jest.fn(),
      address: jest.fn(() => ({ port, host }))
    };
  }
  
  /**
   * Validate that a function throws a specific error
   * @param {Function} fn - Function to test
   * @param {string} expectedError - Expected error message or pattern
   * @param {Object} args - Arguments to pass to function
   */
  static expectToThrow(fn, expectedError, ...args) {
    expect(() => fn(...args)).toThrow(expectedError);
  }
  
  /**
   * Validate that an async function rejects with a specific error
   * @param {Function} fn - Async function to test
   * @param {string} expectedError - Expected error message or pattern
   * @param {Object} args - Arguments to pass to function
   */
  static async expectToReject(fn, expectedError, ...args) {
    await expect(fn(...args)).rejects.toThrow(expectedError);
  }
  
  /**
   * Create a test timer that's properly tracked for cleanup
   * @param {Function} callback - Timer callback
   * @param {number} delay - Timer delay in ms
   * @returns {number} Timer ID
   */
  static createTestTimer(callback, delay) {
    const timerId = setTimeout(callback, delay);
    ResourceManager.trackTimer(timerId);
    return timerId;
  }
  
  /**
   * Create a test interval that's properly tracked for cleanup
   * @param {Function} callback - Interval callback
   * @param {number} interval - Interval in ms
   * @returns {number} Interval ID
   */
  static createTestInterval(callback, interval) {
    const intervalId = setInterval(callback, interval);
    ResourceManager.trackTimer(intervalId);
    return intervalId;
  }
}

module.exports = TestUtils;