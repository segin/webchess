const ChessGame = require('../../src/shared/chessGame');

const benchmarkGetMoveNotation = () => {
  const game = new ChessGame();
  const from = { row: 6, col: 4 };
  const to = { row: 4, col: 4 };
  const piece = { type: 'pawn', color: 'white' };

  const iterations = 1000000;
  console.log(`Starting benchmark for getMoveNotation with ${iterations} iterations...`);

  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    game.getMoveNotation(from, to, piece);
  }
  const end = process.hrtime.bigint();

  const durationNs = Number(end - start);
  const durationMs = durationNs / 1000000;
  const avgNs = durationNs / iterations;

  console.log(`Duration: ${durationMs.toFixed(2)}ms`);
  console.log(`Average: ${avgNs.toFixed(2)}ns per call`);

  // Verify result
  console.log(`Result: ${game.getMoveNotation(from, to, piece)}`);
};

benchmarkGetMoveNotation();
