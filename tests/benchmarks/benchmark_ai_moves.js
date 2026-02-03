
const ChessGame = require('../../src/shared/chessGame');
const ChessAI = require('../../src/shared/chessAI');

const runBenchmark = () => {
    // Suppress console.log
    const originalLog = console.log;
    console.log = () => {};

    try {
        // Setup game and AI
        const game = new ChessGame();
        const ai = new ChessAI();

        // Ensure pieceLocations are populated (though constructor does it)
        if (!game.pieceLocations) {
            originalLog('WARN: pieceLocations not found on game instance!');
        }

        originalLog('Starting benchmark for ChessAI.getAllValidMoves...');
        originalLog('Board state: Initial Position');

        const iterations = 50000;
        const start = process.hrtime();

        for (let i = 0; i < iterations; i++) {
            // Run for both colors to cover full board
            ai.getAllValidMoves(game, 'white');
            ai.getAllValidMoves(game, 'black');
        }

        const end = process.hrtime(start);
        const timeInMs = (end[0] * 1000 + end[1] / 1e6);
        const totalCalls = iterations * 2;
        const avgTime = timeInMs / totalCalls;

        originalLog(`Total iterations: ${iterations} (x2 calls)`);
        originalLog(`Total time: ${timeInMs.toFixed(2)}ms`);
        originalLog(`Average time per call: ${avgTime.toFixed(4)}ms`);
        originalLog(`Calls per second: ${(1000/avgTime).toFixed(0)}`);

        return avgTime;
    } finally {
        console.log = originalLog;
    }
};

runBenchmark();
