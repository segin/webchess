
const ChessGame = require('../../src/shared/chessGame');
const { performance } = require('perf_hooks');

// Setup a game state with some history and complexity
const game = new ChessGame();
// Make a few moves to populate history and complex state
game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e4
game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // e5
game.makeMove({ from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }); // Nf3
game.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }); // Nc6
game.makeMove({ from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }); // Bc4
game.makeMove({ from: { row: 0, col: 5 }, to: { row: 3, col: 2 } }); // Bc5

const ITERATIONS = 10000;

console.log('Benchmarking getGameState()...');
console.log(`Iterations: ${ITERATIONS}`);

// Warmup
for (let i = 0; i < 100; i++) {
    game.getGameState();
}

const start = performance.now();

for (let i = 0; i < ITERATIONS; i++) {
  game.getGameState();
}

const end = performance.now();
const duration = end - start;
const opsPerSec = (ITERATIONS / duration) * 1000;

console.log(`Total time: ${duration.toFixed(2)} ms`);
console.log(`Ops/sec: ${opsPerSec.toFixed(2)}`);
