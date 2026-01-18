const ChessGame = require('../../src/shared/chessGame');

const game = new ChessGame();
// Mocking board state required if updateCastlingRights accesses it.
// Looking at the code:
// const capturedPiece = this.board[to.row][to.col];
// So we need to ensure the board is initialized (it is in constructor) and accessing [to.row][to.col] is safe.
// It accesses this.board[to.row][to.col].
// The default board has pieces. Let's pick an empty square to avoid side effects like capture logic complicating the benchmark,
// although the optimization target is the JSON copy at the top of the function.

const from = { row: 4, col: 4 };
const to = { row: 5, col: 4 }; // Empty square in middle
const piece = { type: 'pawn', color: 'white' };

const iterations = 100000;

console.log('Starting benchmark...');
const start = process.hrtime.bigint();

for (let i = 0; i < iterations; i++) {
    game.updateCastlingRights(from, to, piece);
}

const end = process.hrtime.bigint();
const duration = Number(end - start) / 1000000; // ms

console.log(`Execution time for ${iterations} iterations: ${duration.toFixed(2)}ms`);
console.log(`Average time per iteration: ${(duration / iterations).toFixed(4)}ms`);
