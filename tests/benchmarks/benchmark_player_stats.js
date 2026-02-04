
const GameManager = require('../../src/server/gameManager');

const runBenchmark = () => {
    const gameManager = new GameManager();
    // Bypass rate limiting for benchmark
    gameManager.MAX_GAMES_PER_PLAYER = 100000;

    // Setup parameters
    const TOTAL_GAMES = 10000;
    const TARGET_PLAYER = 'target_player';
    const GAMES_FOR_TARGET = 5000;

    console.log(`Setting up benchmark with ${TOTAL_GAMES} games...`);

    // Create games
    for (let i = 0; i < TOTAL_GAMES; i++) {
        const hostId = i < GAMES_FOR_TARGET ? TARGET_PLAYER : `host_${i}`;
        const gameId = gameManager.createGame(hostId);

        // Add guests to some games
        if (i % 2 === 0) {
            const guestId = `guest_${i}`;
            gameManager.joinGame(gameId, guestId);

            // Mark some games as finished
            if (i % 3 === 0) {
                gameManager.endGame(gameId, 'checkmate', i % 6 === 0 ? hostId : guestId);
            }
        }
    }

    console.log(`Setup complete. Active games: ${gameManager.getActiveGameCount()}`);
    console.log(`Starting benchmark for getPlayerStatistics for player with ~${GAMES_FOR_TARGET} games...`);

    const iterations = 1000;
    const start = process.hrtime();

    for (let i = 0; i < iterations; i++) {
        gameManager.getPlayerStatistics(TARGET_PLAYER);
    }

    const end = process.hrtime(start);
    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTime = timeInMs / iterations;

    console.log(`Total time for ${iterations} iterations: ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${avgTime.toFixed(4)}ms`);

    // Cleanup
    gameManager.cleanup();

    return avgTime;
};

runBenchmark();
