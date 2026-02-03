
const GameManager = require('../../src/server/gameManager');

const runBenchmark = () => {
    const gameManager = new GameManager();
    const totalGames = 10000;
    const statuses = ['waiting', 'active', 'finished', 'resigned', 'abandoned', 'paused'];

    // Populate games
    console.log(`Populating ${totalGames} games...`);
    for (let i = 0; i < totalGames; i++) {
        const gameId = gameManager.generateGameId();
        // Manually inject games to avoid overhead of full creation flow and to set arbitrary statuses
        const status = statuses[i % statuses.length];
        const game = {
            id: gameId,
            host: `host_${i}`,
            guest: `guest_${i}`,
            status: status,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            chess: { moveHistory: [] } // Mock chess object
        };
        gameManager.games.set(gameId, game);

        // Manually populate the index to ensure valid state for optimized GameManager
        if (gameManager.gamesByStatus) {
            if (!gameManager.gamesByStatus.has(status)) {
                gameManager.gamesByStatus.set(status, new Set());
            }
            gameManager.gamesByStatus.get(status).add(gameId);
        }
    }

    console.log('Starting benchmark for getGamesByStatus...');

    const iterations = 1000;
    const start = process.hrtime();

    for (let i = 0; i < iterations; i++) {
        for (const status of statuses) {
            gameManager.getGamesByStatus(status);
        }
    }

    const end = process.hrtime(start);
    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTime = timeInMs / (iterations * statuses.length);

    console.log(`Total time for ${iterations} iterations x ${statuses.length} statuses: ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${avgTime.toFixed(4)}ms`);

    // Verify counts to be sure
    for (const status of statuses) {
        const count = gameManager.getGamesByStatus(status).length;
        // console.log(`Count for ${status}: ${count}`);
    }

    return avgTime;
};

runBenchmark();
