const GameManager = require('../../src/server/gameManager');

function runBenchmark() {
    const gameManager = new GameManager();
    const TOTAL_GAMES = 10000;
    const INACTIVE_COUNT = 50;
    const MAX_AGE = 2 * 60 * 60 * 1000;

    console.log(`Setting up ${TOTAL_GAMES} games (${INACTIVE_COUNT} inactive)...`);

    const now = Date.now();

    // Create inactive games first (older timestamps)
    for (let i = 0; i < INACTIVE_COUNT; i++) {
        const gameId = `inactive_${i}`;
        const game = {
            id: gameId,
            host: `host_${i}`,
            guest: `guest_${i}`,
            status: 'active',
            createdAt: now - MAX_AGE - 1000, // Older than maxAge
            lastActivity: now - MAX_AGE - 1000,
            chess: { moveHistory: [] }
        };
        gameManager.games.set(gameId, game);
        if (gameManager.activityList) {
            gameManager.activityList.add(gameId);
        }
    }

    // Create active games (newer timestamps)
    for (let i = 0; i < TOTAL_GAMES - INACTIVE_COUNT; i++) {
        const gameId = `active_${i}`;
        const game = {
            id: gameId,
            host: `host_active_${i}`,
            guest: `guest_active_${i}`,
            status: 'active',
            createdAt: now,
            lastActivity: now,
            chess: { moveHistory: [] }
        };
        gameManager.games.set(gameId, game);
        if (gameManager.activityList) {
            gameManager.activityList.add(gameId);
        }
    }

    console.log('Setup complete. Running cleanup benchmark...');

    const start = process.hrtime();
    const cleanedCount = gameManager.cleanupInactiveGames(MAX_AGE);
    const end = process.hrtime(start);

    const timeInMs = (end[0] * 1000 + end[1] / 1e6);

    console.log(`Cleanup took: ${timeInMs.toFixed(4)}ms`);
    console.log(`Cleaned games: ${cleanedCount}`);

    // Verify
    if (cleanedCount !== INACTIVE_COUNT) {
        console.error(`ERROR: Expected to clean ${INACTIVE_COUNT} games, but cleaned ${cleanedCount}`);
    }
}

runBenchmark();
