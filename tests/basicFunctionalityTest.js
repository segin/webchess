/**
 * Basic Functionality Test
 * Verifies that existing chess game functionality still works after refactoring
 */

const ChessGame = require('../src/shared/chessGame');

function testBasicFunctionality() {
  console.log('Testing basic chess game functionality...');

  const game = new ChessGame();

  // Test basic move
  const result1 = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
  console.log('Pawn move result:', result1.success ? 'SUCCESS' : 'FAILED');

  if (!result1.success) {
    console.error('Move failed:', result1.message);
    return false;
  }

  // Test turn alternation
  console.log('Current turn after move:', game.currentTurn);
  if (game.currentTurn !== 'black') {
    console.error('Turn alternation failed - expected black, got', game.currentTurn);
    return false;
  }

  // Test game state
  const gameState = game.getGameState();
  console.log('Game state has enhanced metadata:', !!gameState.gameMetadata);
  console.log('Game state has position history:', !!gameState.positionHistory);
  console.log('Game state has consistency check:', !!gameState.stateConsistency);
  console.log('State consistency result:', gameState.stateConsistency.success);

  if (!gameState.gameMetadata) {
    console.error('Missing enhanced metadata');
    return false;
  }

  if (!gameState.positionHistory) {
    console.error('Missing position history');
    return false;
  }

  if (!gameState.stateConsistency) {
    console.error('Missing state consistency check');
    return false;
  }

  if (!gameState.stateConsistency.success) {
    console.error('State consistency check failed:', gameState.stateConsistency.errors);
    return false;
  }

  console.log('✅ All basic functionality working correctly!');
  return true;
}

// Run the test
if (require.main === module) {
  const success = testBasicFunctionality();
  process.exit(success ? 0 : 1);
}

module.exports = { testBasicFunctionality };