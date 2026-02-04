
const ChessGame = require('../../src/shared/chessGame');

const runBenchmark = () => {
    const game = new ChessGame();
    // Use default starting position which has full set of pieces

    console.log('Starting benchmark for getAllValidMoves...');

    const iterations = 5000;
    const start = process.hrtime();

    for (let i = 0; i < iterations; i++) {
        game.getAllValidMoves('white');
        game.getAllValidMoves('black');
    }

    const end = process.hrtime(start);
    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTime = timeInMs / (iterations * 2); // 2 calls per iteration

    console.log(`Total time for ${iterations} iterations (both colors): ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${avgTime.toFixed(4)}ms`);

    return avgTime;
};

if (require.main === module) {
    runBenchmark();
}

module.exports = runBenchmark;
