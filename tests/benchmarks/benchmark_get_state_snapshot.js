
const GameStateManager = require('../../src/shared/gameState');
const ChessGame = require('../../src/shared/chessGame');

const runBenchmark = () => {
    const game = new ChessGame();
    // Make some moves to populate history and state
    // e2e4
    game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
    // e7e5
    game.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 });
    // Nf3
    game.makeMove({ row: 7, col: 6 }, { row: 5, col: 5 });
    // Nc6
    game.makeMove({ row: 0, col: 1 }, { row: 2, col: 2 });

    // Get the state object that would be passed to getStateSnapshot
    // We simulate what might be passed. Often it's the result of getGameState() or similar snapshot data.
    // Based on usage, we'll pass the full game state derived from game.getGameState()
    // but simplified to what is likely stored.
    // Let's just use game.getGameState() as the input "gameState".
    const inputState = game.getGameState();

    const stateManager = game.stateManager;

    console.log('Starting benchmark for getStateSnapshot...');

    const iterations = 50000;
    const start = process.hrtime();

    for (let i = 0; i < iterations; i++) {
        stateManager.getStateSnapshot(inputState);
    }

    const end = process.hrtime(start);
    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTime = timeInMs / iterations;

    console.log(`Total time for ${iterations} iterations: ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${avgTime.toFixed(4)}ms`);
};

runBenchmark();
