/**
 * Advanced Test Utilities
 * Specialized utilities for complex testing scenarios
 */

const TestUtils = require('./testUtils');
const { TestPositions, TestSequences, TestData } = require('../helpers/testData');

/**
 * Game State Comparison Utilities
 */
class GameStateComparator {
  /**
   * Compare two game states for differences
   * @param {Object} state1 - First game state
   * @param {Object} state2 - Second game state
   * @returns {Object} Comparison result with differences
   */
  static compareGameStates(state1, state2) {
    const differences = {
      board: [],
      properties: [],
      identical: true
    };

    // Compare board positions
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece1 = state1.board[row][col];
        const piece2 = state2.board[row][col];
        
        if (!this.piecesEqual(piece1, piece2)) {
          differences.board.push({
            position: { row, col },
            state1: piece1,
            state2: piece2
          });
          differences.identical = false;
        }
      }
    }

    // Compare key properties
    const propertiesToCompare = [
      'currentTurn', 'gameStatus', 'winner', 'inCheck',
      'enPassantTarget', 'castlingRights'
    ];

    for (const prop of propertiesToCompare) {
      if (!this.deepEqual(state1[prop], state2[prop])) {
        differences.properties.push({
          property: prop,
          state1: state1[prop],
          state2: state2[prop]
        });
        differences.identical = false;
      }
    }

    return differences;
  }

  /**
   * Check if two pieces are equal
   * @param {Object|null} piece1 - First piece
   * @param {Object|null} piece2 - Second piece
   * @returns {boolean} True if pieces are equal
   */
  static piecesEqual(piece1, piece2) {
    if (piece1 === null && piece2 === null) return true;
    if (piece1 === null || piece2 === null) return false;
    return piece1.type === piece2.type && piece1.color === piece2.color;
  }

  /**
   * Deep equality check for objects
   * @param {any} obj1 - First object
   * @param {any} obj2 - Second object
   * @returns {boolean} True if objects are deeply equal
   */
  static deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (obj1 === null || obj2 === null) return false;
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) return false;
      
      for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!this.deepEqual(obj1[key], obj2[key])) return false;
      }
      
      return true;
    }
    
    return obj1 === obj2;
  }
}

/**
 * Move Sequence Testing Utilities
 */
class MoveSequenceTester {
  /**
   * Test a complete move sequence with validation at each step
   * @param {ChessGame} game - Game instance
   * @param {Array} sequence - Array of move objects with expected outcomes
   * @returns {Object} Test results
   */
  static testMoveSequence(game, sequence) {
    const results = {
      moves: [],
      success: true,
      failedAt: null,
      gameStates: []
    };

    // Capture initial state
    results.gameStates.push(this.captureGameState(game));

    for (let i = 0; i < sequence.length; i++) {
      const moveTest = sequence[i];
      const { 
        move, 
        shouldSucceed = true, 
        expectedErrorCode = null,
        expectedGameState = {},
        description = `Move ${i + 1}`
      } = moveTest;

      try {
        const response = game.makeMove(move);
        const moveResult = {
          index: i,
          description,
          move,
          response,
          success: shouldSucceed ? response.success : !response.success,
          expectedErrorCode,
          actualErrorCode: response.errorCode
        };

        // Validate response structure
        if (shouldSucceed) {
          TestUtils.AssertionPatterns.validateSuccessfulMove(response);
        } else {
          TestUtils.AssertionPatterns.validateFailedMove(response, expectedErrorCode);
        }

        // Validate expected game state properties
        if (shouldSucceed && Object.keys(expectedGameState).length > 0) {
          const currentState = game.getGameState();
          for (const [key, expectedValue] of Object.entries(expectedGameState)) {
            if (currentState[key] !== expectedValue) {
              moveResult.success = false;
              moveResult.stateValidationError = {
                property: key,
                expected: expectedValue,
                actual: currentState[key]
              };
            }
          }
        }

        results.moves.push(moveResult);
        
        if (!moveResult.success) {
          results.success = false;
          results.failedAt = i;
          break;
        }

        // Capture state after successful move
        if (shouldSucceed && response.success) {
          results.gameStates.push(this.captureGameState(game));
        }

      } catch (error) {
        results.moves.push({
          index: i,
          description,
          move,
          success: false,
          error: error.message
        });
        results.success = false;
        results.failedAt = i;
        break;
      }
    }

    return results;
  }

  /**
   * Capture current game state for comparison
   * @param {ChessGame} game - Game instance
   * @returns {Object} Captured game state
   */
  static captureGameState(game) {
    const state = game.getGameState();
    return {
      timestamp: Date.now(),
      currentTurn: state.currentTurn,
      gameStatus: state.gameStatus,
      winner: state.winner,
      inCheck: state.inCheck,
      moveCount: state.moveHistory.length,
      board: TestUtils.BoardUtils.copyBoard(state.board),
      castlingRights: JSON.parse(JSON.stringify(state.castlingRights)),
      enPassantTarget: state.enPassantTarget ? { ...state.enPassantTarget } : null
    };
  }

  /**
   * Test multiple move sequences in parallel
   * @param {Array} sequenceTests - Array of sequence test configurations
   * @returns {Promise<Array>} Array of test results
   */
  static async testMultipleSequences(sequenceTests) {
    const promises = sequenceTests.map(async (sequenceTest) => {
      const { gameFactory, sequence, description } = sequenceTest;
      const game = gameFactory ? gameFactory() : TestUtils.createStandardGame();
      
      return {
        description,
        result: this.testMoveSequence(game, sequence)
      };
    });

    return Promise.all(promises);
  }
}

/**
 * Performance Testing Utilities
 */
class PerformanceTester {
  /**
   * Measure operation performance
   * @param {Function} operation - Operation to measure
   * @param {Object} options - Performance test options
   * @returns {Object} Performance metrics
   */
  static async measurePerformance(operation, options = {}) {
    const {
      iterations = 1,
      warmupIterations = 0,
      timeout = 10000,
      collectMemoryStats = true
    } = options;

    const metrics = {
      iterations,
      executionTimes: [],
      memoryUsage: [],
      averageTime: 0,
      minTime: Infinity,
      maxTime: 0,
      totalTime: 0,
      averageMemory: 0,
      maxMemory: 0,
      success: true,
      errors: []
    };

    // Warmup iterations
    for (let i = 0; i < warmupIterations; i++) {
      try {
        await TestUtils.AsyncTestUtils.withTimeout(operation, timeout);
      } catch (error) {
        // Ignore warmup errors
      }
    }

    // Actual performance measurement
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const startMemory = collectMemoryStats ? process.memoryUsage().heapUsed : 0;

      try {
        await TestUtils.AsyncTestUtils.withTimeout(operation, timeout);
        
        const endTime = Date.now();
        const endMemory = collectMemoryStats ? process.memoryUsage().heapUsed : 0;
        
        const executionTime = endTime - startTime;
        const memoryUsed = endMemory - startMemory;

        metrics.executionTimes.push(executionTime);
        if (collectMemoryStats) {
          metrics.memoryUsage.push(memoryUsed);
        }

        metrics.totalTime += executionTime;
        metrics.minTime = Math.min(metrics.minTime, executionTime);
        metrics.maxTime = Math.max(metrics.maxTime, executionTime);
        
        if (collectMemoryStats) {
          metrics.maxMemory = Math.max(metrics.maxMemory, memoryUsed);
        }

      } catch (error) {
        metrics.errors.push({
          iteration: i,
          error: error.message
        });
        metrics.success = false;
      }
    }

    // Calculate averages
    if (metrics.executionTimes.length > 0) {
      metrics.averageTime = metrics.totalTime / metrics.executionTimes.length;
    }
    
    if (collectMemoryStats && metrics.memoryUsage.length > 0) {
      metrics.averageMemory = metrics.memoryUsage.reduce((a, b) => a + b, 0) / metrics.memoryUsage.length;
    }

    return metrics;
  }

  /**
   * Test move validation performance
   * @param {ChessGame} game - Game instance
   * @param {Array} moves - Array of moves to test
   * @param {Object} options - Performance test options
   * @returns {Object} Performance test results
   */
  static async testMoveValidationPerformance(game, moves, options = {}) {
    const operation = () => {
      for (const move of moves) {
        game.makeMove(move);
      }
    };

    return this.measurePerformance(operation, options);
  }

  /**
   * Benchmark different game scenarios
   * @param {Array} scenarios - Array of scenario configurations
   * @param {Object} options - Benchmark options
   * @returns {Object} Benchmark results
   */
  static async benchmarkScenarios(scenarios, options = {}) {
    const results = {};

    for (const scenario of scenarios) {
      const { name, gameFactory, operation } = scenario;
      const game = gameFactory();
      
      results[name] = await this.measurePerformance(
        () => operation(game),
        options
      );
    }

    return results;
  }
}

/**
 * Error Injection Testing Utilities
 */
class ErrorInjectionTester {
  /**
   * Test error handling by injecting various error conditions
   * @param {ChessGame} game - Game instance
   * @param {Array} errorScenarios - Array of error scenarios to test
   * @returns {Object} Error injection test results
   */
  static testErrorScenarios(game, errorScenarios) {
    const results = {
      scenarios: [],
      totalTests: errorScenarios.length,
      passed: 0,
      failed: 0
    };

    for (const scenario of errorScenarios) {
      const {
        name,
        setup,
        operation,
        expectedError,
        expectedErrorCode,
        cleanup
      } = scenario;

      const scenarioResult = {
        name,
        success: false,
        error: null,
        actualError: null,
        actualErrorCode: null
      };

      try {
        // Setup error condition
        if (setup) {
          setup(game);
        }

        // Execute operation that should fail
        const response = operation(game);
        
        // Validate error response
        if (response.success === false) {
          scenarioResult.actualError = response.message;
          scenarioResult.actualErrorCode = response.errorCode;
          
          // Check if error matches expectations
          if (expectedErrorCode && response.errorCode === expectedErrorCode) {
            scenarioResult.success = true;
          } else if (expectedError && response.message.includes(expectedError)) {
            scenarioResult.success = true;
          }
        }

        // Cleanup
        if (cleanup) {
          cleanup(game);
        }

      } catch (error) {
        scenarioResult.error = error.message;
      }

      results.scenarios.push(scenarioResult);
      
      if (scenarioResult.success) {
        results.passed++;
      } else {
        results.failed++;
      }
    }

    return results;
  }
}

/**
 * Test Data Validation Utilities
 */
class TestDataValidator {
  /**
   * Validate test data consistency
   * @param {Object} testData - Test data to validate
   * @returns {Object} Validation results
   */
  static validateTestData(testData) {
    const results = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Validate TestPositions
    if (testData.TestPositions) {
      for (const [name, positionFactory] of Object.entries(testData.TestPositions)) {
        try {
          const game = positionFactory();
          const state = game.getGameState();
          TestUtils.AssertionPatterns.validateGameState(state);
        } catch (error) {
          results.errors.push(`Invalid test position '${name}': ${error.message}`);
          results.valid = false;
        }
      }
    }

    // Validate TestSequences
    if (testData.TestSequences) {
      for (const [name, sequence] of Object.entries(testData.TestSequences)) {
        if (!Array.isArray(sequence)) {
          results.errors.push(`Test sequence '${name}' is not an array`);
          results.valid = false;
          continue;
        }

        for (let i = 0; i < sequence.length; i++) {
          const move = sequence[i];
          if (!move.from || !move.to) {
            results.errors.push(`Invalid move at index ${i} in sequence '${name}'`);
            results.valid = false;
          }
        }
      }
    }

    // Validate TestData structure
    if (testData.TestData) {
      const requiredSections = ['VALID_MOVES', 'INVALID_MOVES', 'ERROR_CODES'];
      for (const section of requiredSections) {
        if (!testData.TestData[section]) {
          results.warnings.push(`Missing test data section: ${section}`);
        }
      }
    }

    return results;
  }
}

module.exports = {
  GameStateComparator,
  MoveSequenceTester,
  PerformanceTester,
  ErrorInjectionTester,
  TestDataValidator
};