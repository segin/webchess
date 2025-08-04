const ChessGame = require('./src/shared/chessGame');

// Create a proper checkmate position - smothered mate
const game = new ChessGame();
game.board = Array(8).fill(null).map(() => Array(8).fill(null));

// White king in corner, smothered by own pieces
game.board[0][7] = { type: 'king', color: 'white' }; // h8
game.board[0][6] = { type: 'rook', color: 'white' }; // g8 (own rook blocks escape)
game.board[1][6] = { type: 'pawn', color: 'white' }; // g7 (own pawn blocks escape)
game.board[1][7] = { type: 'pawn', color: 'white' }; // h7 (own pawn blocks escape)

// Black knight delivering checkmate
game.board[2][6] = { type: 'knight', color: 'black' }; // g6 (attacks h8)

// Black king to support
game.board[3][5] = { type: 'king', color: 'black' }; // f5

game.currentTurn = 'white';

console.log('Board setup (smothered mate):');
for (let row = 0; row < 8; row++) {
  let rowStr = '';
  for (let col = 0; col < 8; col++) {
    const piece = game.board[row][col];
    if (piece) {
      const symbol = piece.type[0].toUpperCase();
      rowStr += piece.color === 'white' ? symbol : symbol.toLowerCase();
    } else {
      rowStr += '.';
    }
  }
  console.log(`${8-row}: ${rowStr}`);
}
console.log('   abcdefgh');

console.log('\nChecking game state:');
console.log('Is white in check?', game.isInCheck('white'));

// Debug hasValidMoves thoroughly
console.log('\nDebugging hasValidMoves:');
let foundValidMove = false;
for (let row = 0; row < 8; row++) {
  for (let col = 0; col < 8; col++) {
    const piece = game.board[row][col];
    if (piece && piece.color === 'white') {
      console.log(`Checking piece ${piece.type} at ${row},${col}:`);
      
      // Check all possible moves for this piece
      let pieceMoves = 0;
      for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
          if (row === toRow && col === toCol) continue;
          
          const from = { row, col };
          const to = { row: toRow, col: toCol };
          const isValid = game.isValidMoveSimple(from, to, piece);
          
          if (isValid) {
            console.log(`  Valid move found: ${row},${col} to ${toRow},${toCol}`);
            foundValidMove = true;
            pieceMoves++;
          }
        }
      }
      console.log(`  Total valid moves for this piece: ${pieceMoves}`);
    }
  }
}

console.log('Found any valid moves:', foundValidMove);
console.log('hasValidMoves result:', game.hasValidMoves('white'));
console.log('Is it checkmate?', game.isCheckmate('white'));