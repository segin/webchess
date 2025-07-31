/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Import error suppression utilities
const { testUtils: errorSuppressionUtils } = require('./utils/errorSuppression');

// Import standardized test patterns and data
const { TestPositions, TestSequences, TestData } = require('./helpers/testData');
const { 
  AssertionPatterns, 
  SetupPatterns, 
  NamingPatterns, 
  DataGenerators, 
  ExecutionHelpers 
} = require('./helpers/testPatterns');

// Global test utilities - merge with error suppression utilities and standardized patterns
global.testUtils = {
  // Error suppression utilities
  ...errorSuppressionUtils,
  
  // Standardized test data
  TestPositions,
  TestSequences,
  TestData,
  
  // Standardized assertion patterns
  ...AssertionPatterns,
  
  // Standardized setup patterns
  SetupPatterns,
  
  // Standardized naming patterns
  NamingPatterns,
  
  // Data generators
  DataGenerators,
  
  // Execution helpers
  ExecutionHelpers,
  
  // Legacy compatibility - keep existing methods
  createTestPosition: (positionName) => {
    switch (positionName) {
      case 'empty':
        return TestPositions.KINGS_ONLY();
      case 'kings-only':
        return TestPositions.KINGS_ONLY();
      case 'castling-ready':
        return TestPositions.CASTLING_READY_KINGSIDE();
      default:
        return TestPositions.STARTING_POSITION();
    }
  },
  
  // Helper to execute a sequence of moves
  executeMovesSequence: (game, moves, expectAllSuccess = true) => {
    return ExecutionHelpers.executeMovesSequence(game, moves, expectAllSuccess);
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