/**
 * Validation Utilities
 * Consistent validation helpers for test assertions and data verification
 */

const { TestData } = require('../helpers/testData');

/**
 * Game State Validation Utilities
 */
class GameStateValidator {
  /**
   * Validate complete game state structure
   * @param {Object} gameState - Game state to validate
   * @param {Object} expected - Expected values (optional)
   */
  static validateGameState(gameState, expected = {}) {
    expect(gameState).toBeDefined();
    expect(gameState).not.toBeNull();
    
    // Validate board
    this.validateBoard(gameState.board);
    
    // Validate current turn
    expect(gameState.currentTurn).toBeDefined();
    expect(['white', 'black']).toContain(gameState.currentTurn);
    
    // Validate game status
    expect(gameState.gameStatus).toBeDefined();
    expect(['active', 'check', 'checkmate', 'stalemate', 'draw']).toContain(gameState.gameStatus);
    
    // Validate move history
    expect(gameState.moveHistory).toBeDefined();
    expect(Array.isArray(gameState.moveHistory)).toBe(true);
    
    // Validate castling rights
    this.validateCastlingRights(gameState.castlingRights);
    
    // Validate check status
    expect(typeof gameState.inCheck).toBe('boolean');
    
    // Validate en passant target
    if (gameState.enPassantTarget !== null) {
      this.validateCoordinates(gameState.enPassantTarget);
    }
    
    // Validate winner
    expect(gameState.winner).toBeDefined();
    if (gameState.winner !== null) {
      expect(['white', 'black']).toContain(gameState.winner);
    }
    
    // Check expected values
    if (expected.currentTurn) {
      expect(gameState.currentTurn).toBe(expected.currentTurn);
    }
    if (expected.gameStatus) {
      expect(gameState.gameStatus).toBe(expected.gameStatus);
    }
    if (expected.inCheck !== undefined) {
      expect(gameState.inCheck).toBe(expected.inCheck);
    }
    if (expected.winner !== undefined) {
      expect(gameState.winner).toBe(expected.winner);
    }
  }

  /**
   * Validate board structure
   * @param {Array} board - Board to validate
   */
  static validateBoard(board) {
    expect(board).toBeDefined();
    expect(Array.isArray(board)).toBe(true);
    expect(board).toHaveLength(8);
    
    for (let row = 0; row < 8; row++) {
      expect(Array.isArray(board[row])).toBe(true);
      expect(board[row]).toHaveLength(8);
      
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece !== null) {
          this.validatePiece(piece);
        }
      }
    }
  }

  /**
   * Validate piece structure
   * @param {Object} piece - Piece to validate
   * @param {string} expectedType - Expected piece type (optional)
   * @param {string} expectedColor - Expected piece color (optional)
   */
  static validatePiece(piece, expectedType = null, expectedColor = null) {
    expect(piece).toBeDefined();
    expect(piece).not.toBeNull();
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
  }

  /**
   * Validate castling rights structure
   * @param {Object} castlingRights - Castling rights to validate
   */
  static validateCastlingRights(castlingRights) {
    expect(castlingRights).toBeDefined();
    expect(castlingRights.white).toBeDefined();
    expect(castlingRights.black).toBeDefined();
    
    expect(typeof castlingRights.white.kingside).toBe('boolean');
    expect(typeof castlingRights.white.queenside).toBe('boolean');
    expect(typeof castlingRights.black.kingside).toBe('boolean');
    expect(typeof castlingRights.black.queenside).toBe('boolean');
  }

  /**
   * Validate coordinates structure
   * @param {Object} coords - Coordinates to validate
   */
  static validateCoordinates(coords) {
    expect(coords).toBeDefined();
    expect(coords).not.toBeNull();
    expect(typeof coords.row).toBe('number');
    expect(typeof coords.col).toBe('number');
    expect(coords.row).toBeGreaterThanOrEqual(0);
    expect(coords.row).toBeLessThan(8);
    expect(coords.col).toBeGreaterThanOrEqual(0);
    expect(coords.col).toBeLessThan(8);
  }

  /**
   * Validate move history entry
   * @param {Object} moveEntry - Move history entry to validate
   */
  static validateMoveHistoryEntry(moveEntry) {
    expect(moveEntry).toBeDefined();
    expect(moveEntry.from).toBeDefined();
    expect(moveEntry.to).toBeDefined();
    expect(moveEntry.piece).toBeDefined();
    expect(moveEntry.color).toBeDefined();
    
    this.validateCoordinates(moveEntry.from);
    this.validateCoordinates(moveEntry.to);
    
    expect(['pawn', 'rook', 'knight', 'bishop', 'queen', 'king']).toContain(moveEntry.piece);
    expect(['white', 'black']).toContain(moveEntry.color);
  }
}

/**
 * Move Response Validation Utilities
 */
class MoveResponseValidator {
  /**
   * Validate successful move response
   * @param {Object} response - Move response to validate
   * @param {Object} expected - Expected values (optional)
   */
  static validateSuccessfulMove(response, expected = {}) {
    expect(response).toBeDefined();
    expect(response.success).toBe(true);
    expect(response.isValid).toBe(true);
    expect(response.errorCode).toBeNull();
    expect(response.message).toBeDefined();
    expect(typeof response.message).toBe('string');
    expect(response.data).toBeDefined();
    expect(response.metadata).toBeDefined();
    
    // Validate move data
    this.validateMoveData(response.data);
    
    // Check expected values
    if (expected.gameStatus) {
      expect(response.data.gameStatus).toBe(expected.gameStatus);
    }
    if (expected.currentTurn) {
      expect(response.data.currentTurn).toBe(expected.currentTurn);
    }
    if (expected.winner !== undefined) {
      expect(response.data.winner || response.data.gameWinner).toBe(expected.winner);
    }
  }

  /**
   * Validate failed move response
   * @param {Object} response - Move response to validate
   * @param {string} expectedErrorCode - Expected error code (optional)
   * @param {Object} expectedDetails - Expected error details (optional)
   */
  static validateFailedMove(response, expectedErrorCode = null, expectedDetails = {}) {
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
    
    // Validate expected error details
    if (Object.keys(expectedDetails).length > 0) {
      for (const [key, value] of Object.entries(expectedDetails)) {
        expect(response.details[key]).toBe(value);
      }
    }
  }

  /**
   * Validate move data structure
   * @param {Object} moveData - Move data to validate
   */
  static validateMoveData(moveData) {
    expect(moveData).toBeDefined();
    expect(moveData.from).toBeDefined();
    expect(moveData.to).toBeDefined();
    expect(moveData.piece).toBeDefined();
    expect(moveData.gameStatus).toBeDefined();
    expect(moveData.currentTurn).toBeDefined();
    
    GameStateValidator.validateCoordinates(moveData.from);
    GameStateValidator.validateCoordinates(moveData.to);
    GameStateValidator.validatePiece(moveData.piece);
  }

  /**
   * Validate game ending response
   * @param {Object} response - Move response
   * @param {string} expectedStatus - Expected game status
   * @param {string} expectedWinner - Expected winner (or null for draws)
   */
  static validateGameEnding(response, expectedStatus, expectedWinner = null) {
    this.validateSuccessfulMove(response);
    expect(response.data.gameStatus).toBe(expectedStatus);
    
    if (expectedWinner) {
      expect(response.data.winner || response.data.gameWinner).toBe(expectedWinner);
    } else {
      expect(response.data.winner || response.data.gameWinner).toBeNull();
    }
  }
}

/**
 * Input Validation Utilities
 */
class InputValidator {
  /**
   * Validate move input structure
   * @param {Object} move - Move to validate
   * @param {boolean} shouldBeValid - Whether move should be valid
   */
  static validateMoveInput(move, shouldBeValid = true) {
    if (shouldBeValid) {
      expect(move).toBeDefined();
      expect(move).not.toBeNull();
      expect(typeof move).toBe('object');
      expect(move.from).toBeDefined();
      expect(move.to).toBeDefined();
      
      GameStateValidator.validateCoordinates(move.from);
      GameStateValidator.validateCoordinates(move.to);
    } else {
      // For invalid moves, we just check they're not valid
      const isValid = move && 
                     typeof move === 'object' && 
                     move.from && 
                     move.to &&
                     this.isValidCoordinates(move.from) &&
                     this.isValidCoordinates(move.to);
      expect(isValid).toBe(false);
    }
  }

  /**
   * Check if coordinates are valid without throwing
   * @param {Object} coords - Coordinates to check
   * @returns {boolean} True if coordinates are valid
   */
  static isValidCoordinates(coords) {
    return coords &&
           typeof coords.row === 'number' &&
           typeof coords.col === 'number' &&
           coords.row >= 0 && coords.row < 8 &&
           coords.col >= 0 && coords.col < 8;
  }

  /**
   * Validate error code against known error codes
   * @param {string} errorCode - Error code to validate
   */
  static validateErrorCode(errorCode) {
    expect(errorCode).toBeDefined();
    expect(typeof errorCode).toBe('string');
    expect(Object.values(TestData.ERROR_CODES)).toContain(errorCode);
  }

  /**
   * Validate game configuration
   * @param {Object} config - Game configuration to validate
   */
  static validateGameConfig(config) {
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
    
    if (config.board) {
      GameStateValidator.validateBoard(config.board);
    }
    if (config.currentTurn) {
      expect(['white', 'black']).toContain(config.currentTurn);
    }
    if (config.castlingRights) {
      GameStateValidator.validateCastlingRights(config.castlingRights);
    }
    if (config.enPassantTarget) {
      GameStateValidator.validateCoordinates(config.enPassantTarget);
    }
  }
}

/**
 * Test Data Validation Utilities
 */
class TestDataValidator {
  /**
   * Validate test position data
   * @param {Object} position - Test position to validate
   */
  static validateTestPosition(position) {
    expect(position).toBeDefined();
    expect(typeof position.board).toBeDefined();
    GameStateValidator.validateBoard(position.board);
    
    if (position.currentTurn) {
      expect(['white', 'black']).toContain(position.currentTurn);
    }
    if (position.gameStatus) {
      expect(['active', 'check', 'checkmate', 'stalemate', 'draw']).toContain(position.gameStatus);
    }
  }

  /**
   * Validate test sequence data
   * @param {Array} sequence - Test sequence to validate
   */
  static validateTestSequence(sequence) {
    expect(sequence).toBeDefined();
    expect(Array.isArray(sequence)).toBe(true);
    
    for (const move of sequence) {
      InputValidator.validateMoveInput(move, true);
    }
  }

  /**
   * Validate test data structure
   * @param {Object} testData - Test data to validate
   */
  static validateTestData(testData) {
    expect(testData).toBeDefined();
    expect(typeof testData).toBe('object');
    
    if (testData.VALID_MOVES) {
      for (const [pieceType, moves] of Object.entries(testData.VALID_MOVES)) {
        expect(Array.isArray(moves)).toBe(true);
        for (const move of moves) {
          InputValidator.validateMoveInput(move, true);
        }
      }
    }
    
    if (testData.INVALID_MOVES) {
      for (const [category, moves] of Object.entries(testData.INVALID_MOVES)) {
        expect(Array.isArray(moves)).toBe(true);
        // Note: We don't validate invalid moves as valid since they're intentionally invalid
      }
    }
    
    if (testData.ERROR_CODES) {
      for (const [category, code] of Object.entries(testData.ERROR_CODES)) {
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
      }
    }
  }
}

/**
 * Performance Validation Utilities
 */
class PerformanceValidator {
  /**
   * Validate operation performance
   * @param {Function} operation - Operation to test
   * @param {number} maxTime - Maximum allowed time in ms
   * @returns {Promise} Promise that resolves with execution time
   */
  static async validatePerformance(operation, maxTime = 1000) {
    const startTime = Date.now();
    await operation();
    const executionTime = Date.now() - startTime;
    
    expect(executionTime).toBeLessThan(maxTime);
    return executionTime;
  }

  /**
   * Validate memory usage doesn't exceed threshold
   * @param {Function} operation - Operation to test
   * @param {number} maxMemoryMB - Maximum memory usage in MB
   * @returns {Promise} Promise that resolves with memory usage
   */
  static async validateMemoryUsage(operation, maxMemoryMB = 100) {
    const initialMemory = process.memoryUsage().heapUsed;
    await operation();
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryUsedMB = (finalMemory - initialMemory) / 1024 / 1024;
    
    expect(memoryUsedMB).toBeLessThan(maxMemoryMB);
    return memoryUsedMB;
  }
}

module.exports = {
  GameStateValidator,
  MoveResponseValidator,
  InputValidator,
  TestDataValidator,
  PerformanceValidator
};