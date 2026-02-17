const ChessGame = require('../../src/shared/chessGame');
const ChessAI = require('../../src/shared/chessAI');

// Setup
const game = new ChessGame();
const ai = new ChessAI('medium');

// Make some moves to get to a non-trivial position
const moves = [
  { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
  { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
  { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
  { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
  { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // Bc4
  { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }, // Nf6
  { from: { row: 6, col: 3 }, to: { row: 5, col: 3 } }  // d3
];

for (const move of moves) {
  const result = game.makeMove(move);
  if (!result.success) {
      console.error('Invalid setup move:', move, result.message);
      process.exit(1);
  }
}

// Warmup
for (let i = 0; i < 1000; i++) {
  ai.evaluatePosition(game);
}

// Benchmark
const iterations = 100000; // 100k
const start = process.hrtime.bigint();

for (let i = 0; i < iterations; i++) {
  ai.evaluatePosition(game);
}

const end = process.hrtime.bigint();
const duration = Number(end - start) / 1e6; // ms

console.log(`Evaluated ${iterations} positions in ${duration.toFixed(2)}ms`);
console.log(`Average time per evaluation: ${(duration / iterations).toFixed(5)}ms`);
console.log(`Evaluations per second: ${(iterations / duration * 1000).toFixed(0)}`);
