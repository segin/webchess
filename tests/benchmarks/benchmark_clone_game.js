
const ChessGame = require('../../src/shared/chessGame');
const ChessAI = require('../../src/shared/chessAI');

const runBenchmark = () => {
    const game = new ChessGame();
    const ai = new ChessAI('medium');

    // Ensure pieceLocations are built in the source game (should be done in constructor)
    // But explicitly checking/building ensures fair test if constructor behavior changes
    if (!game.pieceLocations) {
        game._rebuildPieceLocations();
    }

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
    console.log(`Average time per clone: ${avgTime.toFixed(4)}ms`);

    // Validation check to ensure clone actually works (sanity check)
    const cloned = ai.cloneGame(game);
    if (!cloned.pieceLocations || !cloned.pieceLocations.white || cloned.pieceLocations.white.length === 0) {
        console.error('WARNING: Cloned game has empty piece locations!');
    }

    return avgTime;
};

runBenchmark();
