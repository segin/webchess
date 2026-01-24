const ChessAI = require('../../src/shared/chessAI');
const ChessGame = require('../../src/shared/chessGame');

const runBenchmark = () => {
    const game = new ChessGame();
    const ai = new ChessAI();

    console.log('Starting benchmark for ChessAI.cloneGame...');

    const iterations = 10000;
    const start = process.hrtime();

    for (let i = 0; i < iterations; i++) {
        ai.cloneGame(game);
    }

    const end = process.hrtime(start);
    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTime = timeInMs / iterations;

    console.log(`Total time for ${iterations} iterations: ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${avgTime.toFixed(4)}ms`);

    return avgTime;
};

runBenchmark();
