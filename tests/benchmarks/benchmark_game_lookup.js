const GameManager = require('../../src/server/gameManager');

const GAME_COUNT = 10000;
const LOOKUP_ITERATIONS = 1000;
const STATUSES = ['waiting', 'active', 'finished', 'resigned', 'abandoned', 'paused'];

async function runBenchmark() {
  console.log(`Setting up benchmark with ${GAME_COUNT} games...`);
  const gameManager = new GameManager();

  // Populate games
  const setupStart = Date.now();

  for (let i = 0; i < GAME_COUNT; i++) {
     const gameId = gameManager.createGame(`player${i}`);

     const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

     // Use internal method if available to ensure index is updated
     if (gameManager._updateGameStatus) {
        gameManager._updateGameStatus(gameId, status);
     } else {
        // Fallback for baseline code (if we were running this on old code, but we are not)
        // For old code, direct assignment was enough.
        // For new code, we need _updateGameStatus.
        // But wait, if I want this script to run on BOTH, I need to detect.
        const game = gameManager.games.get(gameId);
        game.status = status;

        // If we are on new code but _updateGameStatus is not accessible (it is),
        // we might have issue. But it is accessible.
        // If we are on OLD code, game.status = status is enough.
     }
  }

  console.log(`Setup complete in ${Date.now() - setupStart}ms`);
  console.log(`Starting benchmark: ${LOOKUP_ITERATIONS} lookups per status`);

  const results = {};

  for (const status of STATUSES) {
    const start = process.hrtime();

    for (let i = 0; i < LOOKUP_ITERATIONS; i++) {
      gameManager.getGamesByStatus(status);
    }

    const [seconds, nanoseconds] = process.hrtime(start);
    const durationMs = seconds * 1000 + nanoseconds / 1e6;
    results[status] = durationMs;

    const count = gameManager.getGamesByStatus(status).length;
    console.log(`Status '${status}': ${durationMs.toFixed(2)}ms for ${LOOKUP_ITERATIONS} lookups (Found ${count} games)`);
  }

  const totalTime = Object.values(results).reduce((a, b) => a + b, 0);
  console.log(`Total benchmark time: ${totalTime.toFixed(2)}ms`);

  console.log('Benchmark complete.');
}

runBenchmark().catch(console.error);
