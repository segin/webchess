
const ChessGame = require('../../src/shared/chessGame');
const { performance } = require('perf_hooks');

const game = new ChessGame();
// Populate some history and state
game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
game.makeMove({ from: { row: 7, col: 6 }, to: { row: 5, col: 5 } });
game.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } });

const ITERATIONS = 100000;

function benchmark() {
  console.log(`Benchmarking getBoardState() with ${ITERATIONS} iterations...`);

  // Warmup
  for (let i = 0; i < 1000; i++) {
    game.getBoardState();
  }

  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    game.getBoardState();
  }
  const end = performance.now();

  const duration = end - start;
  const avg = duration / ITERATIONS;
  const opsPerSec = (ITERATIONS / duration) * 1000;

  console.log(`Total time: ${duration.toFixed(2)} ms`);
  console.log(`Average time: ${avg.toFixed(4)} ms`);
  console.log(`Ops/sec: ${opsPerSec.toFixed(2)}`);

  return duration;
}

benchmark();
