const GameManager = require('../../src/server/gameManager');

function manualGetServerStatistics(gameManager) {
    const totalGames = gameManager.games.size;
    let activeGames = 0;
    let waitingGames = 0;
    let finishedGames = 0;

    const uniquePlayers = new Set();

    for (const game of gameManager.games.values()) {
        if (game.status === 'active') activeGames++;
        else if (game.status === 'waiting') waitingGames++;
        else if (game.status === 'finished') finishedGames++;

        if (game.host) uniquePlayers.add(game.host);
        if (game.guest) uniquePlayers.add(game.guest);
    }

    return {
        totalGames,
        activeGames,
        waitingGames,
        finishedGames,
        totalPlayers: uniquePlayers.size,
        disconnectedPlayers: gameManager.disconnectedPlayers.size
    };
}

function runBenchmark() {
    const gameManager = new GameManager();
    // Disable rate limiting for benchmark
    gameManager.MAX_GAMES_PER_PLAYER = 1000000;

    const TOTAL_GAMES = 10000;
    console.log(`Setting up ${TOTAL_GAMES} games...`);
    const setupStart = Date.now();

    for (let i = 0; i < TOTAL_GAMES; i++) {
        const hostId = `host_${i}`;
        const gameId = gameManager.createGame(hostId);

        if (!gameId) {
            console.error(`Failed to create game at index ${i}`);
            continue;
        }

        const r = Math.random();
        if (r < 0.33) {
            // Leave as waiting
        } else if (r < 0.66) {
            // Make active
            const guestId = `guest_${i}`;
            gameManager.joinGame(gameId, guestId);
        } else {
            // Make finished
            const guestId = `guest_${i}`;
            gameManager.joinGame(gameId, guestId);
            gameManager.endGame(gameId, 'checkmate', hostId);
        }
    }

    console.log(`Setup complete in ${Date.now() - setupStart}ms.`);

    // Warmup
    for(let i=0; i<100; i++) {
        gameManager.getServerStatistics();
    }

    // Benchmark
    const iterations = 1000;
    console.log(`Running ${iterations} iterations of getServerStatistics...`);

    const start = process.hrtime();
    for (let i = 0; i < iterations; i++) {
        gameManager.getServerStatistics();
    }
    const end = process.hrtime(start);

    const timeInMs = (end[0] * 1000 + end[1] / 1e6);
    const avgTime = timeInMs / iterations;

    console.log(`Total time: ${timeInMs.toFixed(2)}ms`);
    console.log(`Average time per call: ${avgTime.toFixed(4)}ms`);

    // Verification
    console.log('Verifying correctness...');
    const stats = gameManager.getServerStatistics();
    const manualStats = manualGetServerStatistics(gameManager);

    let correct = true;
    for (const key in manualStats) {
        if (stats[key] !== manualStats[key]) {
            console.error(`Mismatch for ${key}: Got ${stats[key]}, Expected ${manualStats[key]}`);
            correct = false;
        }
    }

    if (correct) {
        console.log('Verification PASSED: Statistics match manual calculation.');
    } else {
        console.log('Verification FAILED.');
        process.exit(1);
    }
}

runBenchmark();
