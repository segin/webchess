const ChessGame = require('../../src/shared/chessGame');

const runBenchmark = () => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    // Use a fixed seed or sequence for deterministic results
    const game = new ChessGame();

    // Setup a complex board state with some moves
    const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // Bc4
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }, // Nf6
        { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }, // d4
        { from: { row: 3, col: 4 }, to: { row: 4, col: 3 } }, // exd4
        { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } }, // O-O
    ];

    for (const move of moves) {
        game.makeMove(move.from, move.to);
    }

    console.log('Starting benchmark for wouldBeInCheck (and thus _isSquareUnderAttackVirtual)...');
    console.log('Board setup complete. Running iterations...');

    // Silence output during benchmark
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};

    const iterations = 10000;

    // Pick a few valid/invalid pseudo-legal moves to test
    const testMoves = [
        // white moves
        { from: { row: 7, col: 2 }, to: { row: 6, col: 3 }, color: 'white' },
        { from: { row: 5, col: 5 }, to: { row: 3, col: 4 }, color: 'white' },
        { from: { row: 7, col: 3 }, to: { row: 6, col: 3 }, color: 'white' },
        // black moves
        { from: { row: 0, col: 2 }, to: { row: 1, col: 3 }, color: 'black' },
        { from: { row: 2, col: 2 }, to: { row: 4, col: 3 }, color: 'black' }
    ];

    const start = process.hrtime();

    let checkCount = 0;
    for (let i = 0; i < iterations; i++) {
        for (const test of testMoves) {
            game.wouldBeInCheck(test.from, test.to, test.color);
            checkCount++;
        }
    }

    const end = process.hrtime(start);

    // Restore output
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;

    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const timePerCall = timeInMs / checkCount;

    console.log(`Total time for ${iterations} iterations (${checkCount} checks): ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${timePerCall.toFixed(6)}ms`);
    console.log(`Calls per second: ${(1000 / timePerCall).toFixed(2)}`);
};

runBenchmark();
