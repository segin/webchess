/**
 * Game State Management Validation Tests
 * Simple validation tests for the enhanced game state management system
 */

const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');

// Simple test framework functions
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, but got ${actual}`);
  }
}

function assertNotNull(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value should not be null or undefined');
  }
}

// Test functions
function testGameStateInitialization() {
  const game = new ChessGame();
  const gameState = game.getGameState();
  
  // Test enhanced metadata
  assertNotNull(gameState.gameMetadata, 'Game metadata should be present');
  assertNotNull(gameState.gameMetadata.startTime, 'Start time should be set');
  assertNotNull(gameState.gameMetadata.gameId, 'Game ID should be generated');
  assertEqual(gameState.gameMetadata.totalMoves, 0, 'Initial total moves should be 0');
  assertEqual(gameState.gameMetadata.version, '1.0.0', 'Version should be set');
  
  // Test position history
  assertNotNull(gameState.positionHistory, 'Position history should be present');
  assertEqual(gameState.positionHistory.length, 1, 'Initial position should be recorded');
  
  // Test state consistency
  assertNotNull(gameState.stateConsistency, 'State consistency check should be present');
  assert(gameState.stateConsistency.success, 'Initial state should be consistent');
  assertEqual(gameState.stateConsistency.errors.length, 0, 'No errors in initial state');
  
  console.log('✅ Game state initialization test passed');
}

function testTurnAlternationValidation() {
  const stateManager = new GameStateManager();
  
  // Test valid turn sequence
  const validResult = stateManager.validateTurnSequence('white', 'white', []);
  assert(validResult.success, 'Valid turn sequence should pass');
  assertEqual(validResult.details.currentTurn, 'white', 'Current turn should be white');
  
  // Test invalid turn sequence
  const invalidResult = stateManager.validateTurnSequence('black', 'white', []);
  assert(!invalidResult.success, 'Invalid turn sequence should fail');
  assertEqual(invalidResult.code, 'TURN_SEQUENCE_VIOLATION', 'Should have correct error code');
  
  // Test turn consistency with move history
  const moveHistory = [{ color: 'white', piece: 'pawn' }];
  const historyResult = stateManager.validateTurnSequence('black', 'black', moveHistory);
  assert(historyResult.success, 'Turn should be consistent with move history');
  
  console.log('✅ Turn alternation validation test passed');
}

function testGameStatusManagement() {
  const stateManager = new GameStateManager();
  
  // Test valid status update
  const validUpdate = stateManager.updateGameStatus('active', 'check');
  assert(validUpdate.success, 'Valid status update should succeed');
  assertEqual(validUpdate.details.newStatus, 'check', 'Status should be updated to check');
  
  // Test checkmate requires winner
  const checkmateWithoutWinner = stateManager.updateGameStatus('check', 'checkmate');
  assert(!checkmateWithoutWinner.success, 'Checkmate without winner should fail');
  assertEqual(checkmateWithoutWinner.code, 'MISSING_WINNER', 'Should require winner for checkmate');
  
  // Test checkmate with winner
  const checkmateWithWinner = stateManager.updateGameStatus('check', 'checkmate', 'white');
  assert(checkmateWithWinner.success, 'Checkmate with winner should succeed');
  assertEqual(checkmateWithWinner.details.newWinner, 'white', 'Winner should be set');
  
  // Test invalid status
  const invalidStatus = stateManager.updateGameStatus('active', 'invalid_status');
  assert(!invalidStatus.success, 'Invalid status should fail');
  assertEqual(invalidStatus.code, 'INVALID_STATUS', 'Should have invalid status error');
  
  console.log('✅ Game status management test passed');
}

function testMoveHistoryEnhancement() {
  const stateManager = new GameStateManager();
  const moveHistory = [];
  
  const moveData = {
    from: { row: 6, col: 4 },
    to: { row: 5, col: 4 },
    piece: 'pawn',
    color: 'white'
  };
  
  // Create a simple test board
  const testBoard = Array(8).fill(null).map(() => Array(8).fill(null));
  
  const gameState = {
    inCheck: false,
    checkDetails: null,
    castlingRights: { white: { kingside: true, queenside: true }, black: { kingside: true, queenside: true } },
    enPassantTarget: null,
    halfMoveClock: 0,
    board: testBoard,
    currentTurn: 'white'
  };
  
  const enhancedMove = stateManager.addMoveToHistory(moveHistory, moveData, 1, gameState);
  
  assertNotNull(enhancedMove.moveNumber, 'Move number should be set');
  assertNotNull(enhancedMove.turnNumber, 'Turn number should be set');
  assertNotNull(enhancedMove.timestamp, 'Timestamp should be set');
  assertNotNull(enhancedMove.gameStateSnapshot, 'Game state snapshot should be included');
  assertNotNull(enhancedMove.positionAfterMove, 'Position after move should be recorded');
  assertEqual(moveHistory.length, 1, 'Move should be added to history');
  
  console.log('✅ Move history enhancement test passed');
}

function testGameStateConsistencyValidation() {
  const game = new ChessGame();
  
  // Test consistent state - use the game's built-in validation from getGameState
  const fullGameState = game.getGameState();
  const validation = fullGameState.stateConsistency;
  
  // Debug output
  if (!validation.success) {
    console.log('Validation errors:', validation.errors);
    console.log('Validation warnings:', validation.warnings);
  }
  
  assert(validation.success, 'Initial game state should be consistent');
  assertEqual(validation.errors.length, 0, 'Should have no errors');
  assertEqual(validation.details.kingCount.white, 1, 'Should have one white king');
  assertEqual(validation.details.kingCount.black, 1, 'Should have one black king');
  
  // Test inconsistent state (wrong turn) - create a separate state manager for this test
  const testStateManager = new GameStateManager();
  const inconsistentState = game.getGameStateForSnapshot();
  inconsistentState.currentTurn = 'black'; // Should be white for empty move history
  inconsistentState.moveHistory = [];
  
  const inconsistentValidation = testStateManager.validateGameStateConsistency(inconsistentState);
  assert(!inconsistentValidation.success, 'Inconsistent state should fail validation');
  assert(inconsistentValidation.errors.length > 0, 'Should have errors');
  
  console.log('✅ Game state consistency validation test passed');
}

function testGameStateAfterMoves() {
  const game = new ChessGame();
  const initialState = game.getGameState();
  
  // Make a move
  const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
  assert(result.success, 'Move should be successful');
  
  const newState = game.getGameState();
  
  // Verify state updates
  assertEqual(newState.currentTurn, 'black', 'Turn should switch to black');
  assertEqual(newState.gameMetadata.totalMoves, 1, 'Total moves should increment');
  assert(newState.stateVersion > initialState.stateVersion, 'State version should increment');
  assertEqual(newState.moveHistory.length, 1, 'Move history should have one move');
  
  // Verify state consistency
  assert(newState.stateConsistency.success, 'State should remain consistent after move');
  
  console.log('✅ Game state after moves test passed');
}

function testFENPositionGeneration() {
  const stateManager = new GameStateManager();
  const game = new ChessGame();
  
  // Test starting position FEN
  const startingFEN = stateManager.getFENPosition(
    game.board,
    game.currentTurn,
    game.castlingRights,
    game.enPassantTarget
  );
  
  // Debug output
  console.log('Generated FEN:', startingFEN);
  
  assert(startingFEN.includes('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'), 'Should contain starting board position');
  assert(startingFEN.includes(' w '), 'Should indicate white to move');
  assert(startingFEN.includes('KQkq'), 'Should show all castling rights available');
  
  console.log('✅ FEN position generation test passed');
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Running Game State Management Tests\n');
  
  try {
    testGameStateInitialization();
    testTurnAlternationValidation();
    testGameStatusManagement();
    testMoveHistoryEnhancement();
    testGameStateConsistencyValidation();
    testGameStateAfterMoves();
    testFENPositionGeneration();
    
    console.log('\n✅ All game state management tests passed!');
    console.log('📊 Task 13: Comprehensive game state management - COMPLETED');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Export for potential use by other test runners
module.exports = {
  testGameStateInitialization,
  testTurnAlternationValidation,
  testGameStatusManagement,
  testMoveHistoryEnhancement,
  testGameStateConsistencyValidation,
  testGameStateAfterMoves,
  testFENPositionGeneration,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}