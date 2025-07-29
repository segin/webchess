const ChessGame = require('./src/shared/chessGame');

console.log('=== Debugging Castling Rights Test Expectations ===');

const game = new ChessGame();

console.log('Initial castling rights:', JSON.stringify(game.castlingRights, null, 2));

// Test: Move white kingside rook
console.log('\n--- Test: Moving white kingside rook ---');
game.board[7][6] = null; // Clear knight
console.log('Before rook move:', JSON.stringify(game.castlingRights, null, 2));

const result1 = game.makeMove({ from: { row: 7, col: 7 }, to: { row: 7, col: 6 } });
console.log('Move result:', result1);
console.log('After rook move:', JSON.stringify(game.castlingRights, null, 2));

console.log('\nExpected: white.kingside = false, white.queenside = true');
console.log('Actual: white.kingside =', game.castlingRights.white.kingside, ', white.queenside =', game.castlingRights.white.queenside);

// Test validation methods
console.log('\n--- Test: Validation methods ---');
const validation = game.validateCastlingRightsForSide('white', 'kingside');
console.log('Validation result:', JSON.stringify(validation, null, 2));

const status = game.getCastlingRightsStatus();
console.log('Status result:', JSON.stringify(status, null, 2));

// Test serialization
console.log('\n--- Test: Serialization ---');
const serialized = game.serializeCastlingRights();
console.log('Serialized:', JSON.stringify(serialized, null, 2));

const gameState = game.getGameStateForSnapshot();
console.log('Game state castling rights:', JSON.stringify(gameState.castlingRights, null, 2));