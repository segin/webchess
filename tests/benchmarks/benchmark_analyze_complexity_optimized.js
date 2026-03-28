
const GameStateManager = require('../../src/shared/gameState');
const ChessGame = require('../../src/shared/chessGame');

function runBenchmark() {
  const stateManager = new GameStateManager();
  const game = new ChessGame();
  const board = game.board;
  const pieceCount = game.pieceLocations.white.length + game.pieceLocations.black.length;

  const iterations = 100000;

  console.log(`Running benchmark for analyzePositionComplexity (UNOPTIMIZED) with ${iterations} iterations...`);
  const start1 = Date.now();
  for (let i = 0; i < iterations; i++) {
    stateManager.analyzePositionComplexity(board);
  }
  const end1 = Date.now();
  const time1 = end1 - start1;
  console.log(`Time taken: ${time1}ms`);
  console.log(`Average time: ${time1 / iterations}ms`);

  console.log(`\nRunning benchmark for analyzePositionComplexity (OPTIMIZED with pieceCount) with ${iterations} iterations...`);
  const start2 = Date.now();
  for (let i = 0; i < iterations; i++) {
    stateManager.analyzePositionComplexity(board, pieceCount);
  }
  const end2 = Date.now();
  const time2 = end2 - start2;
  console.log(`Time taken: ${time2}ms`);
  console.log(`Average time: ${time2 / iterations}ms`);

  const speedup = (time1 / time2).toFixed(2);
  console.log(`\nMeasured Speedup: ${speedup}x`);
}

runBenchmark();
