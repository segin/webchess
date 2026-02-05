const GameManager = require('../../src/server/gameManager');

function runBenchmark() {
    const gameManager = new GameManager();
    const TARGET_PLAYER = 'target_player';
    const TOTAL_GAMES = 10000;

    console.log(`Setting up ${TOTAL_GAMES} games...`);

    const setupStart = Date.now();

    // Create many games
    for (let i = 0; i < TOTAL_GAMES; i++) {
        const gameId = `game_${i}`;
        // Every 100th game involves our target player
        const isTarget = i % 100 === 0;
        const host = isTarget ? TARGET_PLAYER : `host_${i}`;
        const guest = isTarget ? `guest_${i}` : `guest_other_${i}`;

        const status = (i % 2 === 0) ? 'finished' : 'active';
        const winner = (status === 'finished' && i % 4 === 0) ? host : null;

        const game = {
            id: gameId,
            host: host,
            guest: guest,
            status: status,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            chess: { moveHistory: [] },
            winner: winner
        };

        // Manual injection to bypass limits and ensure consistent state for benchmarks
        gameManager.games.set(gameId, game);

        // Ensure indices are populated for O(1) lookups
        gameManager._addGameToPlayer(host, gameId);
        gameManager._addGameToPlayer(guest, gameId);
        gameManager._addToStatusIndex(status, gameId);
    }

    console.log(`Setup complete in ${Date.now() - setupStart}ms. Running benchmark...`);

    const iterations = 500;
    const start = process.hrtime();

    for (let i = 0; i < iterations; i++) {
        gameManager.getServerStatistics();
    }

    const end = process.hrtime(start);
    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTime = timeInMs / iterations;

    console.log(`Total time for ${iterations} calls to getServerStatistics: ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${avgTime.toFixed(4)}ms`);

    // Validate results
    const stats = gameManager.getServerStatistics();
    console.log('Stats validation:', JSON.stringify(stats, null, 2));
}

runBenchmark();
