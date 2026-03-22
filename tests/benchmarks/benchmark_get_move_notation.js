const ChessGame = require('../../src/shared/chessGame');
const { performance } = require('perf_hooks');

function runBenchmark() {
  console.log('--- Benchmarking getMoveNotation ---');

  const game = new ChessGame();

  const moves = [
    { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, piece: { type: 'pawn', color: 'white' } },
    { from: { row: 7, col: 1 }, to: { row: 5, col: 2 }, piece: { type: 'knight', color: 'white' } },
    { from: { row: 0, col: 3 }, to: { row: 4, col: 7 }, piece: { type: 'queen', color: 'black' } },
    { from: { row: 7, col: 4 }, to: { row: 7, col: 6 }, piece: { type: 'king', color: 'white' } },
    { from: { row: 0, col: 0 }, to: { row: 0, col: 3 }, piece: { type: 'rook', color: 'black' } },
    { from: { row: 7, col: 2 }, to: { row: 3, col: 6 }, piece: { type: 'bishop', color: 'white' } }
  ];

  const iterations = 1000000;

  // Warmup
  for (let i = 0; i < 10000; i++) {
    const move = moves[i % moves.length];
    game.getMoveNotation(move.from, move.to, move.piece);
  }

  // Benchmark
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const move = moves[i % moves.length];
    game.getMoveNotation(move.from, move.to, move.piece);
  }
  const end = performance.now();

  const totalTime = end - start;
  const avgTime = (totalTime * 1e6) / iterations; // in nanoseconds

  console.log(`Total Time for ${iterations} calls: ${totalTime.toFixed(2)} ms`);
  console.log(`Average Time per call: ${avgTime.toFixed(2)} ns`);
}

runBenchmark();
