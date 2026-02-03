const GameManager = require('../../src/server/gameManager');

function runBenchmark() {
    const gameManager = new GameManager();
    const TARGET_PLAYER = 'target_player';
    const OTHER_PLAYER = 'other_player';
    const TOTAL_GAMES = 10000;

    console.log(`Setting up ${TOTAL_GAMES} games...`);

    const setupStart = Date.now();

    // Create many games
    for (let i = 0; i < TOTAL_GAMES; i++) {
        // Every 100th game involves our target player
        const isTarget = i % 100 === 0;
        const host = isTarget ? TARGET_PLAYER : `host_${i}`;
        const guest = isTarget ? `guest_${i}` : `guest_other_${i}`;

        const gameId = gameManager.createGame(host);
        gameManager.joinGame(gameId, guest);

        // Mark some as finished so stats have something to count
        if (i % 2 === 0) {
            const winner = i % 4 === 0 ? host : guest;
            gameManager.endGame(gameId, 'checkmate', winner);
        }
    }

    console.log(`Setup complete in ${Date.now() - setupStart}ms. Running benchmark...`);

    const iterations = 500;
    const start = process.hrtime();

    for (let i = 0; i < iterations; i++) {
        gameManager.getPlayerStatistics(TARGET_PLAYER);
    }

    const end = process.hrtime(start);
    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTime = timeInMs / iterations;

    console.log(`Total time for ${iterations} calls to getPlayerStatistics: ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${avgTime.toFixed(4)}ms`);
}

runBenchmark();
