
const ChessGame = require('../../src/shared/chessGame');

const runBenchmark = () => {
    const game = new ChessGame();
    // Default board has kings at (0,4) and (7,4)

    console.log('Starting benchmark for King Lookup optimization...');

    const iterations = 100000;

    // Benchmark 1: Direct findKing calls
    const startFind = process.hrtime();
    for (let i = 0; i < iterations; i++) {
        game.findKing('white');
        game.findKing('black');
    }
    const endFind = process.hrtime(startFind);
    const timeFind = (endFind[0] * 1000 + endFind[1] / 1e6);

    console.log(`findKing: ${iterations * 2} calls took ${timeFind.toFixed(2)}ms`);
    console.log(`Average per call: ${(timeFind / (iterations * 2)).toFixed(5)}ms`);

    // Benchmark 2: isInCheck calls (heavily relies on findKing)
    const startCheck = process.hrtime();
    for (let i = 0; i < iterations; i++) {
        game.isInCheck('white');
        game.isInCheck('black');
    }
    const endCheck = process.hrtime(startCheck);
    const timeCheck = (endCheck[0] * 1000 + endCheck[1] / 1e6);

    console.log(`isInCheck: ${iterations * 2} calls took ${timeCheck.toFixed(2)}ms`);
    console.log(`Average per call: ${(timeCheck / (iterations * 2)).toFixed(5)}ms`);

    return { findKing: timeFind, isInCheck: timeCheck };
};

if (require.main === module) {
    runBenchmark();
}

module.exports = runBenchmark;
