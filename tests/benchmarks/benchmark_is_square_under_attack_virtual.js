const ChessGame = require('../../src/shared/chessGame');
const { performance } = require('perf_hooks');

const game = new ChessGame();
// Force some moves to get a realistic board state
game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
game.makeMove({ from: { row: 7, col: 3 }, to: { row: 3, col: 7 } });
game.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } });
game.makeMove({ from: { row: 7, col: 6 }, to: { row: 5, col: 5 } });
game.makeMove({ from: { row: 1, col: 3 }, to: { row: 2, col: 3 } });
game.makeMove({ from: { row: 6, col: 2 }, to: { row: 4, col: 2 } });
game.makeMove({ from: { row: 0, col: 2 }, to: { row: 4, col: 6 } });

const ITERATIONS = 100000;

function runBenchmark() {
  // Setup args
  const from = { row: 7, col: 4 }; // King
  const to = { row: 7, col: 5 }; // Move right
  const piece = { type: 'king', color: 'white' };

  // Warmup
  for (let i = 0; i < 1000; i++) {
    game._isSquareUnderAttackVirtual(7, 5, 'white', from, to, piece, null, null, null);
    game._isSquareUnderAttackVirtual(7, 4, 'black', {row:0,col:4}, {row:0,col:5}, {type:'king', color:'black'}, null, null, null);
  }

  const start = performance.now();

  for (let i = 0; i < ITERATIONS; i++) {
    game._isSquareUnderAttackVirtual(7, 5, 'white', from, to, piece, null, null, null);
    game._isSquareUnderAttackVirtual(7, 4, 'black', {row:0,col:4}, {row:0,col:5}, {type:'king', color:'black'}, null, null, null);
    game._isSquareUnderAttackVirtual(3, 3, 'white', from, to, piece, null, null, null);
    game._isSquareUnderAttackVirtual(4, 4, 'black', {row:0,col:4}, {row:0,col:5}, {type:'king', color:'black'}, null, null, null);
  }

  const end = performance.now();
  const totalTime = end - start;
  const timePerIteration = totalTime / ITERATIONS;

  console.log(`[Benchmark] _isSquareUnderAttackVirtual`);
  console.log(`Iterations: ${ITERATIONS}`);
  console.log(`Total Time: ${totalTime.toFixed(2)} ms`);
  console.log(`Time per call (4 calls per iter): ${(timePerIteration / 4).toFixed(6)} ms`);
}

runBenchmark();
