/**
 * Standardized Test Patterns and Utilities
 * Common patterns for consistent test structure across all test files
 */

/**
 * Standard assertion patterns using appropriate Jest matchers
 */
const AssertionPatterns = {
  /**
   * Validate a successful move response using current API structure
   * @param {Object} response - Move response to validate
   */
  validateSuccessfulMove(response) {
    expect(response).toBeDefined();
    expect(response.success).toBe(true);
    expect(response.isValid).toBe(true);
    expect(response.errorCode).toBeNull();
    expect(response.message).toBeDefined();
    expect(typeof response.message).toBe('string');
    expect(response.data).toBeDefined();
    expect(response.metadata).toBeDefined();
  },

  /**
   * Validate a failed move response using current API structure
   * @param {Object} response - Move response to validate
   * @param {string} expectedErrorCode - Expected error code (optional)
   */
  validateFailedMove(response, expectedErrorCode = null) {
    expect(response).toBeDefined();
    expect(response.success).toBe(false);
    expect(response.isValid).toBe(false);
    expect(response.errorCode).toBeDefined();
    expect(response.message).toBeDefined();
    expect(typeof response.message).toBe('string');
    expect(response.message.length).toBeGreaterThan(0);
    expect(response.details).toBeDefined();
    
    if (expectedErrorCode) {
      expect(response.errorCode).toBe(expectedErrorCode);
    }
  },

  /**
   * Validate game state structure using current API property names
   * @param {Object} gameState - Game state to validate
   */
  validateGameState(gameState) {
    expect(gameState).toBeDefined();
    expect(gameState.board).toBeDefined();
    expect(Array.isArray(gameState.board)).toBe(true);
    expect(gameState.board).toHaveLength(8);
    expect(gameState.currentTurn).toBeDefined();
    expect(['white', 'black']).toContain(gameState.currentTurn);
    
    // Current API uses gameStatus (not status)
    expect(gameState.gameStatus).toBeDefined();
    expect(['active', 'check', 'checkmate', 'stalemate', 'draw']).toContain(gameState.gameStatus);
    
    expect(gameState.moveHistory).toBeDefined();
    expect(Array.isArray(gameState.moveHistory)).toBe(true);
    expect(gameState.winner).toBeDefined();
    expect(gameState.castlingRights).toBeDefined();
    expect(gameState.inCheck).toBeDefined();
    expect(typeof gameState.inCheck).toBe('boolean');
    expect(gameState.enPassantTarget).toBeDefined();
    expect(gameState.checkDetails).toBeDefined();
  },

  /**
   * Validate piece structure
   * @param {Object} piece - Piece to validate
   * @param {string} expectedType - Expected piece type
   * @param {string} expectedColor - Expected piece color
   */
  validatePiece(piece, expectedType = null, expectedColor = null) {
    expect(piece).toBeDefined();
    expect(piece.type).toBeDefined();
    expect(piece.color).toBeDefined();
    expect(['pawn', 'rook', 'knight', 'bishop', 'queen', 'king']).toContain(piece.type);
    expect(['white', 'black']).toContain(piece.color);
    
    if (expectedType) {
      expect(piece.type).toBe(expectedType);
    }
    
    if (expectedColor) {
      expect(piece.color).toBe(expectedColor);
    }
  },

  /**
   * Validate board position
   * @param {Array} board - Board to validate
   * @param {number} row - Row coordinate
   * @param {number} col - Column coordinate
   * @param {Object|null} expectedPiece - Expected piece or null
   */
  validateBoardPosition(board, row, col, expectedPiece) {
    expect(board).toBeDefined();
    expect(row).toBeGreaterThanOrEqual(0);
    expect(row).toBeLessThan(8);
    expect(col).toBeGreaterThanOrEqual(0);
    expect(col).toBeLessThan(8);
    
    if (expectedPiece === null) {
      expect(board[row][col]).toBeNull();
    } else {
      this.validatePiece(board[row][col], expectedPiece.type, expectedPiece.color);
    }
  },

  /**
   * Validate move history entry
   * @param {Object} moveEntry - Move history entry to validate
   */
  validateMoveHistoryEntry(moveEntry) {
    expect(moveEntry).toBeDefined();
    expect(moveEntry.from).toBeDefined();
    expect(moveEntry.to).toBeDefined();
    expect(moveEntry.piece).toBeDefined();
    expect(moveEntry.color).toBeDefined();
    expect(typeof moveEntry.from.row).toBe('number');
    expect(typeof moveEntry.from.col).toBe('number');
    expect(typeof moveEntry.to.row).toBe('number');
    expect(typeof moveEntry.to.col).toBe('number');
  },

  /**
   * Validate castling rights structure
   * @param {Object} castlingRights - Castling rights to validate
   */
  validateCastlingRights(castlingRights) {
    expect(castlingRights).toBeDefined();
    expect(castlingRights.white).toBeDefined();
    expect(castlingRights.black).toBeDefined();
    expect(typeof castlingRights.white.kingside).toBe('boolean');
    expect(typeof castlingRights.white.queenside).toBe('boolean');
    expect(typeof castlingRights.black.kingside).toBe('boolean');
    expect(typeof castlingRights.black.queenside).toBe('boolean');
  },

  /**
   * Validate move response data structure
   * @param {Object} moveData - Move data from successful response
   */
  validateMoveData(moveData) {
    expect(moveData).toBeDefined();
    expect(moveData.from).toBeDefined();
    expect(moveData.to).toBeDefined();
    expect(moveData.piece).toBeDefined();
    expect(moveData.gameStatus).toBeDefined();
    expect(moveData.currentTurn).toBeDefined();
    
    // Validate coordinates
    expect(typeof moveData.from.row).toBe('number');
    expect(typeof moveData.from.col).toBe('number');
    expect(typeof moveData.to.row).toBe('number');
    expect(typeof moveData.to.col).toBe('number');
    
    // Validate piece
    this.validatePiece(moveData.piece);
  },

  /**
   * Validate that a response indicates a specific game ending
   * @param {Object} response - Move response
   * @param {string} expectedStatus - Expected game status
   * @param {string} expectedWinner - Expected winner (or null for draws)
   */
  validateGameEnding(response, expectedStatus, expectedWinner = null) {
    this.validateSuccessfulMove(response);
    expect(response.data.gameStatus).toBe(expectedStatus);
    
    if (expectedWinner) {
      expect(response.data.winner || response.data.gameWinner).toBe(expectedWinner);
    } else {
      expect(response.data.winner || response.data.gameWinner).toBeNull();
    }
  },

  /**
   * Validate error response details structure
   * @param {Object} response - Error response
   * @param {string} expectedCode - Expected error code
   * @param {Object} expectedDetails - Expected details properties
   */
  validateErrorDetails(response, expectedCode, expectedDetails = {}) {
    this.validateFailedMove(response, expectedCode);
    
    if (Object.keys(expectedDetails).length > 0) {
      expect(response.details).toBeDefined();
      for (const [key, value] of Object.entries(expectedDetails)) {
        expect(response.details[key]).toBe(value);
      }
    }
  }
};

/**
 * Standard test setup patterns
 */
const SetupPatterns = {
  /**
   * Standard beforeEach setup for chess game tests
   * @param {Function} gameFactory - Function that returns a new game instance
   * @returns {Function} beforeEach function
   */
  standardGameSetup(gameFactory = null) {
    return () => {
      if (gameFactory) {
        return gameFactory();
      } else {
        const ChessGame = require('../../src/shared/chessGame');
        return new ChessGame();
      }
    };
  },

  /**
   * Setup with error suppression for error handling tests
   * @param {Array} errorPatterns - Error patterns to suppress
   * @returns {Function} beforeEach function
   */
  errorHandlingSetup(errorPatterns = []) {
    return () => {
      if (typeof testUtils !== 'undefined' && testUtils.suppressErrorLogs) {
        testUtils.suppressErrorLogs(errorPatterns);
      }
    };
  },

  /**
   * Standard afterEach cleanup
   * @returns {Function} afterEach function
   */
  standardCleanup() {
    return () => {
      if (typeof testUtils !== 'undefined' && testUtils.restoreErrorLogs) {
        testUtils.restoreErrorLogs();
      }
    };
  }
};

/**
 * Standard test naming patterns
 */
const NamingPatterns = {
  /**
   * Generate descriptive test name for move validation
   * @param {string} pieceType - Type of piece
   * @param {string} scenario - Test scenario
   * @returns {string} Descriptive test name
   */
  moveValidationTest(pieceType, scenario) {
    return `should ${scenario} for ${pieceType} movement`;
  },

  /**
   * Generate descriptive test name for game state
   * @param {string} aspect - Aspect being tested
   * @param {string} scenario - Test scenario
   * @returns {string} Descriptive test name
   */
  gameStateTest(aspect, scenario) {
    return `should ${scenario} ${aspect} correctly`;
  },

  /**
   * Generate descriptive test name for error handling
   * @param {string} errorType - Type of error
   * @param {string} scenario - Test scenario
   * @returns {string} Descriptive test name
   */
  errorHandlingTest(errorType, scenario) {
    return `should handle ${errorType} error when ${scenario}`;
  },

  /**
   * Generate descriptive describe block name
   * @param {string} component - Component being tested
   * @param {string} aspect - Aspect being tested
   * @returns {string} Descriptive describe name
   */
  describeBlock(component, aspect) {
    return `${component} - ${aspect}`;
  }
};

/**
 * Common test data generators
 */
const DataGenerators = {
  /**
   * Generate valid coordinates
   * @returns {Object} Valid coordinate object
   */
  validCoordinates() {
    return {
      row: Math.floor(Math.random() * 8),
      col: Math.floor(Math.random() * 8)
    };
  },

  /**
   * Generate invalid coordinates
   * @returns {Object} Invalid coordinate object
   */
  invalidCoordinates() {
    const options = [
      { row: -1, col: 4 },
      { row: 8, col: 4 },
      { row: 4, col: -1 },
      { row: 4, col: 8 },
      { row: null, col: 4 },
      { row: 4, col: null },
      { row: 'invalid', col: 4 },
      { row: 4, col: 'invalid' }
    ];
    return options[Math.floor(Math.random() * options.length)];
  },

  /**
   * Generate move object
   * @param {Object} from - From coordinates
   * @param {Object} to - To coordinates
   * @returns {Object} Move object
   */
  moveObject(from, to) {
    return { from, to };
  }
};

/**
 * Test execution helpers
 */
const ExecutionHelpers = {
  /**
   * Execute a sequence of moves and validate each one
   * @param {Object} game - Game instance
   * @param {Array} moves - Array of moves to execute
   * @param {boolean} expectAllSuccess - Whether all moves should succeed
   * @returns {Array} Array of move results
   */
  executeMovesSequence(game, moves, expectAllSuccess = true) {
    const results = [];
    
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const result = game.makeMove(move);
      results.push(result);
      
      if (expectAllSuccess) {
        AssertionPatterns.validateSuccessfulMove(result);
      }
    }
    
    return results;
  },

  /**
   * Test a move and validate the expected outcome
   * @param {Object} game - Game instance
   * @param {Object} move - Move to test
   * @param {boolean} shouldSucceed - Whether move should succeed
   * @param {string} expectedErrorCode - Expected error code if move fails
   * @returns {Object} Move result
   */
  testMove(game, move, shouldSucceed = true, expectedErrorCode = null) {
    const result = game.makeMove(move);
    
    if (shouldSucceed) {
      AssertionPatterns.validateSuccessfulMove(result);
    } else {
      AssertionPatterns.validateFailedMove(result, expectedErrorCode);
    }
    
    return result;
  },

  /**
   * Execute a move and validate the game state afterwards
   * @param {Object} game - Game instance
   * @param {Object} move - Move to execute
   * @param {Object} expectedState - Expected game state properties
   * @returns {Object} Move result
   */
  testMoveWithStateValidation(game, move, expectedState = {}) {
    const result = this.testMove(game, move, true);
    
    // Validate expected state properties
    if (expectedState.currentTurn) {
      expect(game.currentTurn).toBe(expectedState.currentTurn);
    }
    if (expectedState.gameStatus) {
      expect(game.gameStatus).toBe(expectedState.gameStatus);
    }
    if (expectedState.inCheck !== undefined) {
      expect(game.inCheck).toBe(expectedState.inCheck);
    }
    if (expectedState.winner !== undefined) {
      expect(game.winner).toBe(expectedState.winner);
    }
    
    return result;
  },

  /**
   * Test multiple moves in sequence with validation
   * @param {Object} game - Game instance
   * @param {Array} moveSequence - Array of move objects with expected outcomes
   * @returns {Array} Array of move results
   */
  testMoveSequence(game, moveSequence) {
    const results = [];
    
    for (const moveTest of moveSequence) {
      const { move, shouldSucceed = true, expectedErrorCode = null } = moveTest;
      const result = this.testMove(game, move, shouldSucceed, expectedErrorCode);
      results.push(result);
    }
    
    return results;
  }
};

module.exports = {
  AssertionPatterns,
  SetupPatterns,
  NamingPatterns,
  DataGenerators,
  ExecutionHelpers
};