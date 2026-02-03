/**
 * Benchmark for findGamesByPlayer performance.
 * Measures the time taken to lookup games for a player involved in multiple games
 * within a large dataset of games.
 */
const GameManager = require('../../src/server/gameManager');

const runBenchmark = () => {
    const gameManager = new GameManager();
    const TARGET_PLAYER = 'target_player';
    const TOTAL_GAMES = 10000;
    const GAMES_FOR_TARGET = 100;

    console.log(`Setting up benchmark with ${TOTAL_GAMES} games...`);

    // Create games
    const otherGameIds = [];
    for (let i = 0; i < TOTAL_GAMES; i++) {
        const isTargetHost = i < GAMES_FOR_TARGET;
        const hostId = isTargetHost ? TARGET_PLAYER : `host_${i}`;
        const gameId = gameManager.createGame(hostId);

        if (!isTargetHost) {
            otherGameIds.push(gameId);
        }
    }

    // Join as guest
    const GAMES_AS_GUEST = 100;
    for (let i = 0; i < GAMES_AS_GUEST; i++) {
        if (i < otherGameIds.length) {
            gameManager.joinGame(otherGameIds[i], TARGET_PLAYER);
        }
    }

    console.log(`Setup complete. Running benchmark for findGamesByPlayer...`);

    const iterations = 1000;
    const start = process.hrtime();

    for (let i = 0; i < iterations; i++) {
        const games = gameManager.findGamesByPlayer(TARGET_PLAYER);
        if (games.length === 0) throw new Error("Benchmark failed: No games found");
    }

    const end = process.hrtime(start);
    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTime = timeInMs / iterations;

    console.log(`Total time for ${iterations} iterations: ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${avgTime.toFixed(4)}ms`);

    // Cleanup
    gameManager.cleanup();
};

runBenchmark();
