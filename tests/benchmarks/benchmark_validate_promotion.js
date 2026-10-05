const ChessGame = require('../../src/shared/chessGame');
const { performance } = require('perf_hooks');

function benchmark() {
  const game = new ChessGame();
  const iterations = 1000000;
  let validCount = 0;

  // Set up moves to test
  const moves = [
    { from: { row: 6, col: 0 }, to: { row: 7, col: 0 }, promotion: 'queen' },
    { from: { row: 6, col: 1 }, to: { row: 7, col: 1 }, promotion: 'knight' },
    { from: { row: 6, col: 2 }, to: { row: 7, col: 2 }, promotion: 'rook' },
    { from: { row: 6, col: 3 }, to: { row: 7, col: 3 }, promotion: 'bishop' },
    { from: { row: 6, col: 4 }, to: { row: 7, col: 4 } }, // No promotion
    { from: { row: 6, col: 5 }, to: { row: 7, col: 5 }, promotion: 'king' }, // Invalid
    { from: { row: 6, col: 6 }, to: { row: 7, col: 6 }, promotion: 'pawn' }, // Invalid
    { from: { row: 6, col: 7 }, to: { row: 7, col: 7 }, promotion: 123 }, // Invalid type
  ];

  // Warmup
  for (let i = 0; i < 10000; i++) {
    const move = moves[i % moves.length];
    game.validateMoveFormat(move);
  }

  // Benchmark
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const move = moves[i % moves.length];
    const result = game.validateMoveFormat(move);
    if (result.success) validCount++;
  }
  const end = performance.now();

  const totalMs = end - start;
  const opsPerSec = Math.floor(iterations / (totalMs / 1000));

  console.log(`--- validateMoveFormat Benchmark ---`);
  console.log(`Iterations: ${iterations}`);
  console.log(`Total Time: ${totalMs.toFixed(2)} ms`);
  console.log(`Ops/sec: ${opsPerSec.toLocaleString()}`);
  console.log(`Time per call: ${(totalMs / iterations * 1000).toFixed(4)} μs`);
  console.log(`Result: ${validCount} valid out of ${iterations}`);
}

benchmark();
