
const ChessGame = require('../../src/shared/chessGame');

const runBenchmark = () => {
    const game = new ChessGame();
    // Use default starting position which has full set of pieces

    console.log('Starting benchmark for getAllLegalMoves...');

    const iterations = 2000;
    const start = process.hrtime();

    for (let i = 0; i < iterations; i++) {
        game.getAllLegalMoves('white');
        game.getAllLegalMoves('black');
    }

    const end = process.hrtime(start);
    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTime = timeInMs / (iterations * 2); // 2 calls per iteration

    console.log(`Total time for ${iterations} iterations (both colors): ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${avgTime.toFixed(4)}ms`);

    return avgTime;
};

runBenchmark();
