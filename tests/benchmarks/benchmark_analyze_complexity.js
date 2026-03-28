
const GameStateManager = require('../../src/shared/gameState');
const ChessGame = require('../../src/shared/chessGame');

function runBenchmark() {
  const stateManager = new GameStateManager();
  const game = new ChessGame();
  const board = game.board;

  const iterations = 100000;

  console.log(`Running benchmark for analyzePositionComplexity with ${iterations} iterations...`);

  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    stateManager.analyzePositionComplexity(board);
  }
  const end = Date.now();

  console.log(`Time taken: ${end - start}ms`);
  console.log(`Average time: ${(end - start) / iterations}ms`);
}

runBenchmark();
