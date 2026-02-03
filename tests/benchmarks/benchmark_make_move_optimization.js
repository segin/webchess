const ChessGame = require('../../src/shared/chessGame');

const runBenchmark = () => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log('Starting benchmark for makeMove...');

    // Sequence of moves (opening sequence)
    const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 3 }, to: { row: 3, col: 7 } }, // Qh5
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // Bc4
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }, // Nf6
    ];

    const iterations = 5000;

    // Silence output during benchmark
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};

    const start = process.hrtime();

    for (let i = 0; i < iterations; i++) {
        const game = new ChessGame();
        for (const move of moves) {
            game.makeMove(move.from, move.to);
        }
    }

    const end = process.hrtime(start);

    // Restore output
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;

    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTime = timeInMs / (iterations * moves.length);

    console.log(`Total time for ${iterations} games (${iterations * moves.length} moves): ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per move: ${avgTime.toFixed(4)}ms`);
    console.log(`Moves per second: ${(1000 / avgTime).toFixed(2)}`);
};

runBenchmark();
