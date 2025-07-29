const ChessGame = require('./src/shared/chessGame');

console.log('=== Debugging Castling Rights ===');

const game = new ChessGame();

console.log('Initial castling rights:', JSON.stringify(game.castlingRights, null, 2));

// Test 1: Move white kingside rook
console.log('\n--- Test 1: Moving white kingside rook ---');
game.board[7][6] = null; // Clear knight
console.log('Before rook move:', JSON.stringify(game.castlingRights, null, 2));

const result1 = game.makeMove({ from: { row: 7, col: 7 }, to: { row: 7, col: 6 } });
console.log('Move result:', result1);
console.log('After rook move:', JSON.stringify(game.castlingRights, null, 2));

// Test 2: Move black queenside rook
console.log('\n--- Test 2: Moving black queenside rook ---');
game.board[0][1] = null; // Clear knight
console.log('Before black rook move:', JSON.stringify(game.castlingRights, null, 2));

const result2 = game.makeMove({ from: { row: 0, col: 0 }, to: { row: 0, col: 1 } });
console.log('Move result:', result2);
console.log('After black rook move:', JSON.stringify(game.castlingRights, null, 2));

// Test 3: Move white king
console.log('\n--- Test 3: Moving white king ---');
game.board[7][5] = null; // Clear bishop
console.log('Before king move:', JSON.stringify(game.castlingRights, null, 2));

const result3 = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 5 } });
console.log('Move result:', result3);
console.log('After king move:', JSON.stringify(game.castlingRights, null, 2));