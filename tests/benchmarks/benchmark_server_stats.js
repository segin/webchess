
const GameManager = require('../../src/server/gameManager');
const { performance } = require('perf_hooks');

const gameManager = new GameManager();
const NUM_GAMES = 100000;

console.log(`Setting up ${NUM_GAMES} games for benchmarking...`);

const statuses = ['active', 'waiting', 'finished', 'resigned', 'abandoned', 'paused'];

for (let i = 0; i < NUM_GAMES; i++) {
  const gameId = `GAME_${i}`;
  const status = statuses[i % statuses.length];
  const hostId = `HOST_${i % 1000}`;
  const guestId = `GUEST_${i % 1000}`;

  const game = {
    id: gameId,
    host: hostId,
    guest: guestId,
    chess: {},
    status: status,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    chatMessages: []
  };

  gameManager.games.set(gameId, game);
}

// Add some disconnected players
for (let i = 0; i < 500; i++) {
  gameManager.disconnectedPlayers.set(`PLAYER_${i}`, {
    gameId: `GAME_${i}`,
    disconnectedAt: Date.now()
  });
}

console.log('Setup complete. Running benchmark...');

const ITERATIONS = 500; // Increased iterations
let totalTime = 0;

// Warmup
for (let i = 0; i < 50; i++) {
    gameManager.getServerStatistics();
}

const start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  gameManager.getServerStatistics();
}
const end = performance.now();

totalTime = end - start;
const avgTime = totalTime / ITERATIONS;

console.log(`Total time for ${ITERATIONS} iterations: ${totalTime.toFixed(2)} ms`);
console.log(`Average time per call: ${avgTime.toFixed(4)} ms`);
console.log(`Ops/sec: ${(1000 / avgTime).toFixed(2)}`);

const stats = gameManager.getServerStatistics();
console.log('Stats verification:', JSON.stringify(stats, null, 2));
