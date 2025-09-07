const ChessGame = require('./src/shared/chessGame');

// Test the mathematical validation - find which moves are incorrectly succeeding
const game = new ChessGame();
game.board[4][4] = { type: 'queen', color: 'white' };
// Ensure kings are present
game.board[7][4] = { type: 'king', color: 'white' };
game.board[0][4] = { type: 'king', color: 'black' };

console.log('Testing mathematical validation...');

let failureCount = 0;

// Test all possible moves within board bounds
for (let row = 0; row < 8; row++) {
  for (let col = 0; col < 8; col++) {
    if (row === 4 && col === 4) continue; // Skip starting position
    
    const rowDiff = Math.abs(row - 4);
    const colDiff = Math.abs(col - 4);
    const isValidQueenMove = (
      row === 4 || // Same row (horizontal)
      col === 4 || // Same column (vertical)
      rowDiff === colDiff // Diagonal
    );
    
    const freshGame = new ChessGame();
    freshGame.board[4][4] = { type: 'queen', color: 'white' };
    
    // Ensure kings are present
    freshGame.board[7][4] = { type: 'king', color: 'white' };
    freshGame.board[0][4] = { type: 'king', color: 'black' };
    
    // Clear all paths (but keep kings)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (r === 4 || c === 4 || Math.abs(r - 4) === Math.abs(c - 4)) {
          if (!(r === 4 && c === 4) && !(r === 7 && c === 4) && !(r === 0 && c === 4)) {
            freshGame.board[r][c] = null;
          }
        }
      }
    }
    
    const result = freshGame.makeMove({ from: { row: 4, col: 4 }, to: { row, col } });
    
    // Skip king positions - they should fail with CAPTURE_OWN_PIECE
    const isKingPosition = (row === 7 && col === 4) || (row === 0 && col === 4);
    
    const expectedSuccess = isValidQueenMove && !isKingPosition;
    const actualSuccess = result.success;
    
    if (expectedSuccess !== actualSuccess) {
      console.log(`\nMISMATCH at (${row},${col}):`);
      console.log(`  Expected: ${expectedSuccess ? 'SUCCESS' : 'FAIL'}`);
      console.log(`  Actual: ${actualSuccess ? 'SUCCESS' : 'FAIL'}`);
      console.log(`  Valid queen move: ${isValidQueenMove}`);
      console.log(`  King position: ${isKingPosition}`);
      console.log(`  Result: ${result.message}`);
      failureCount++;
      
      if (failureCount >= 5) break; // Limit output
    }
  }
  if (failureCount >= 5) break;
}

console.log(`\nTotal mismatches found: ${failureCount}`);