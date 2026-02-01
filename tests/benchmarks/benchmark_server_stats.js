const GameManager = require('../../src/server/gameManager');

function runBenchmark() {
    const gameManager = new GameManager();
    const NUM_GAMES = 10000;

    console.log(`Setting up ${NUM_GAMES} games for benchmark...`);

    // Setup games with different statuses
    for (let i = 0; i < NUM_GAMES; i++) {
        const hostId = `player_${i}_host`;
        const gameId = gameManager.createGame(hostId);

        const rand = Math.random();
        if (rand < 0.33) {
            // Waiting (default)
        } else if (rand < 0.66) {
            // Active
            gameManager.joinGame(gameId, `player_${i}_guest`);
        } else {
            // Finished
            gameManager.joinGame(gameId, `player_${i}_guest`);
            gameManager.endGame(gameId, 'checkmate', hostId);
        }
    }

    console.log('Starting benchmark for getServerStatistics...');

    const ITERATIONS = 1000;
    const start = process.hrtime();

    for (let i = 0; i < ITERATIONS; i++) {
        gameManager.getServerStatistics();
    }

    const end = process.hrtime(start);
    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTime = timeInMs / ITERATIONS;

    console.log(`Total time for ${ITERATIONS} iterations: ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${avgTime.toFixed(4)}ms`);
    console.log('Stats result (sample):', gameManager.getServerStatistics());
}

runBenchmark();
