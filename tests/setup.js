/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Import error suppression utilities
const { testUtils: errorSuppressionUtils } = require('./utils/errorSuppression');
const { consoleUtils } = require('./utils/consoleQuiet');

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
  
  // Console quiet utilities
  ...consoleUtils,
  
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
  
  // Create a fresh game instance
  createFreshGame: () => {
    return TestPositions.STARTING_POSITION();
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
  consoleUtils.clearHistory();
  
  // Enable quiet console mode to reduce noise
  consoleUtils.enableQuiet([
    // Allow test results and important Jest output
    /PASS|FAIL|Tests:|Test Suites:/,
    /✓|✕|●/,
    /expect\(/,
    /toBe\(/,
    /toEqual\(/,
    /Coverage/,
    /All files/,
    // Allow actual test failures (not suppressed errors)
    /TypeError:|ReferenceError:|SyntaxError:/,
    // Allow important warnings that aren't chess game errors
    /deprecated|warning/i
  ]);
  
  // Automatically suppress common error patterns for all tests
  global.testUtils.suppressErrorLogs([
    // Critical and high severity errors
    /CRITICAL ERROR/,
    /HIGH SEVERITY ERROR/,
    /Recovery failed/,
    /Error in error creation/,
    /Simulated system error/,
    /Network error/,
    
    // Chess game specific errors
    /Invalid piece/,
    /Malformed move/,
    /Invalid coordinates/,
    /Wrong turn/,
    /Game not active/,
    /No piece found/,
    /Path blocked/,
    /King in check/,
    /Invalid movement/,
    /System error/,
    
    // All error codes
    /MALFORMED_MOVE/,
    /INVALID_COORDINATES/,
    /NO_PIECE/,
    /WRONG_TURN/,
    /INVALID_PIECE/,
    /STATE_CORRUPTION/,
    /PATH_BLOCKED/,
    /CAPTURE_OWN_PIECE/,
    /INVALID_CASTLING/,
    /INVALID_MOVEMENT/,
    /INVALID_FORMAT/,
    /CHECK_NOT_RESOLVED/,
    /PINNED_PIECE_INVALID_MOVE/,
    /MUST_RESOLVE_CHECK/,
    /GAME_NOT_ACTIVE/,
    /SYSTEM_ERROR/,
    /TEST_ERROR/,
    /VALIDATION_ERROR/,
    /EMPTY_SQUARE/,
    
    // Error messages with "Error:" prefix - catch all
    /Error: .*/,
    
    // Descriptive error messages
    /Path is blocked/,
    /Cannot capture own piece/,
    /Not your turn/,
    /Invalid .* movement/,
    /Invalid .* castling/,
    /Move must be an object/,
    /Move format is incorrect/,
    /No piece at source square/,
    /Invalid board coordinates/,
    /Game is not active/,
    /Test message/,
    /Test success/,
    
    // Unknown error code warnings
    /Unknown error code/,
    
    // Stack trace and file path noise
    /at ChessErrorHandler/,
    /at ChessGame/,
    /at Object\./,
    /at Array\.forEach/,
    /src\/shared\/errorHandler\.js/,
    /src\/shared\/chessGame\.js/,
    /tests\//,
    
    // Catch-all for numbered error messages
    /Error \d+/
  ]);
});

afterEach(() => {
  // Restore console functions after each test
  global.testUtils.restoreErrorLogs();
  consoleUtils.disableQuiet();
});

// Global teardown
afterAll(() => {
  // Ensure console functions are restored
  global.testUtils.restoreErrorLogs();
  consoleUtils.disableQuiet();
  
  // Show suppression statistics
  const suppressedStats = global.testUtils.getSuppressedInfo();
  const consoleStats = consoleUtils.getStats();
  
  if (suppressedStats.counts.total > 0 || consoleStats.total > 0) {
    console.log('\n📊 Test Noise Suppression Summary:');
    console.log(`   Suppressed Errors: ${suppressedStats.counts.errors}`);
    console.log(`   Suppressed Warnings: ${suppressedStats.counts.warnings}`);
    console.log(`   Suppressed Console Messages: ${consoleStats.total}`);
    console.log(`   Total Suppressed: ${suppressedStats.counts.total + consoleStats.total}`);
  }
});