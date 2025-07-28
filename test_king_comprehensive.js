const ChessGame = require('./src/shared/chessGame');

const game = new ChessGame();

// Clear path for castling
game.board[7][5] = null;
game.board[7][6] = null;

// Clear black king and place enemy rook to put white king in check
game.board[0][4] = null; // Remove black king
game.board[5][4] = { type: 'rook', color: 'black' }; // Place rook to attack white king

console.log('Board setup:');
console.log('White king at (7,4):', game.board[7][4]);
console.log('Black rook at (5,4):', game.board[5][4]);
console.log('Is white king in check?', game.isInCheck('white'));

const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
const result = game.makeMove(move);

console.log('\nMove result:', result);