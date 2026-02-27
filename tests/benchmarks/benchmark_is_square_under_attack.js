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

    console.log('Starting benchmark for isSquareUnderAttack...');
    console.log('Board setup complete. Running iterations...');

    // Silence output during benchmark
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};

    const iterations = 10000;
    const squares = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            squares.push({ row: r, col: c });
        }
    }

    const start = process.hrtime();

    let checkCount = 0;
    for (let i = 0; i < iterations; i++) {
        // Check every square for both colors
        for (const sq of squares) {
            game.isSquareUnderAttack(sq.row, sq.col, 'white');
            game.isSquareUnderAttack(sq.row, sq.col, 'black');
            checkCount += 2;
        }
    }

    const end = process.hrtime(start);

    // Restore output
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;

    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const timePerCall = timeInMs / checkCount;

    console.log(`Total time for ${iterations} full board scans (${checkCount} checks): ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${timePerCall.toFixed(6)}ms`);
    console.log(`Calls per second: ${(1000 / timePerCall).toFixed(2)}`);
};

runBenchmark();
