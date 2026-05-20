const GameManager = require('../../src/server/gameManager');

function runBenchmark() {
    const gameManager = new GameManager();
    const TOTAL_WAITING_GAMES = 10000;

    console.log(`Setting up ${TOTAL_WAITING_GAMES} waiting games...`);

    for (let i = 0; i < TOTAL_WAITING_GAMES; i++) {
        const playerId = `player_${i}`;
        gameManager.createGame(playerId);
    }

    console.log('Setup complete. Running benchmark...');

    const iterations = 1000;
    const start = process.hrtime();

    for (let i = 0; i < iterations; i++) {
        gameManager.getAvailableGames(10000);
    }

    const end = process.hrtime(start);
    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTime = timeInMs / iterations;

    console.log(`Total time for ${iterations} calls to getAvailableGames(10000): ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${avgTime.toFixed(4)}ms`);

    const available = gameManager.getAvailableGames(10000);
    console.log(`Available games count: ${available.length}`);
}

runBenchmark();
