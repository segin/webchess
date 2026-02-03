const GameManager = require('../../src/server/gameManager');

const runBenchmark = () => {
    const gameManager = new GameManager();
    const NUM_GAMES = 10000;

    console.log(`Setting up ${NUM_GAMES} games...`);

    // Setup games
    for (let i = 0; i < NUM_GAMES; i++) {
        const hostId = `player_host_${i}`;
        const gameId = gameManager.createGame(hostId);

        // Distribute statuses
        const rand = Math.random();
        if (rand < 0.4) {
            // Active game
            const guestId = `player_guest_${i}`;
            gameManager.joinGame(gameId, guestId);
        } else if (rand < 0.7) {
            // Finished game
            const guestId = `player_guest_${i}`;
            gameManager.joinGame(gameId, guestId);
            gameManager.endGame(gameId, 'checkmate', hostId);
        } else {
            // Waiting game (default)
        }
    }

    console.log('Starting benchmark for getServerStatistics...');

    const iterations = 1000;
    const start = process.hrtime();

    for (let i = 0; i < iterations; i++) {
        gameManager.getServerStatistics();
    }

    const end = process.hrtime(start);
    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTime = timeInMs / iterations;

    console.log(`Total time for ${iterations} iterations: ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${avgTime.toFixed(4)}ms`);

    return avgTime;
};

runBenchmark();
