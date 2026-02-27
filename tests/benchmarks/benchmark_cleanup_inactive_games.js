
const GameManager = require('../../src/server/gameManager');
const { performance } = require('perf_hooks');

// Mock ChessGame to avoid overhead
class MockChessGame {
  constructor() {
    this.currentTurn = 'white';
    this.moveHistory = [];
  }
}

// Override ChessGame in the module cache to use MockChessGame
try {
    const originalChessGame = require('../../src/shared/chessGame');
    require.cache[require.resolve('../../src/shared/chessGame')].exports = MockChessGame;
} catch (e) {
    console.warn("Could not mock ChessGame:", e);
}

async function runBenchmark() {
  const gameManager = new GameManager();
  const GAME_COUNT = 100000;
  const INACTIVE_COUNT = 0; // Test purely active scan (should be O(1) with optimization)
  const MAX_AGE = 10000; // 10 seconds

  console.log(`Setting up ${GAME_COUNT} games (all active)...`);

  const now = Date.now();

  // Manually populate games
  for (let i = 0; i < GAME_COUNT; i++) {
    const gameId = `game_${i}`;
    const isInactive = i < INACTIVE_COUNT;
    const lastActivity = isInactive ? (now - MAX_AGE * 2) : now;

    const game = {
      id: gameId,
      host: `player_${i}`,
      guest: null,
      chess: new MockChessGame(),
      status: 'waiting',
      createdAt: lastActivity,
      lastActivity: lastActivity,
      chatMessages: []
    };

    gameManager.games.set(gameId, game);

    // Populate activityList
    gameManager.activityList.add(gameId);

    gameManager._addToStatusIndex('waiting', gameId);
    if (!gameManager.playerToGame) gameManager.playerToGame = new Map();
    gameManager.playerToGame.set(`player_${i}`, gameId);
    if (!gameManager.playerGames) gameManager.playerGames = new Map();
    if (!gameManager.playerGames.has(`player_${i}`)) {
        gameManager.playerGames.set(`player_${i}`, new Set());
    }
    gameManager.playerGames.get(`player_${i}`).add(gameId);
    if (!gameManager.playerGameCounts) gameManager.playerGameCounts = new Map();
    gameManager.playerGameCounts.set(`player_${i}`, 1);
  }

  console.log(`Benchmark starting: Baseline vs Optimized cleanup...`);

  // Baseline (O(N) simulation)
  const startBaseline = performance.now();
  let cleanedBaseline = 0;
  for (const [gameId, game] of gameManager.games) {
    if (now - game.lastActivity > MAX_AGE) {
      cleanedBaseline++;
    }
  }
  const endBaseline = performance.now();
  console.log(`Baseline (simulated): ${endBaseline - startBaseline}ms`);

  // Optimized
  const startOptimized = performance.now();
  const cleaned = gameManager.cleanupInactiveGames(MAX_AGE);
  const endOptimized = performance.now();

  console.log(`Optimized: ${endOptimized - startOptimized}ms`);

  if (cleaned !== INACTIVE_COUNT) {
    console.error(`ERROR: Expected to clean ${INACTIVE_COUNT} games, but cleaned ${cleaned}`);
  }
}

runBenchmark().catch(console.error);
