
const GameManager = require('../../src/server/gameManager');
const { performance } = require('perf_hooks');

const gameManager = new GameManager();

// Configuration
const TOTAL_GAMES = 10000;
const TOTAL_PLAYERS = 1000;
const MAIN_PLAYER_ID = 'main_player';
const MAIN_PLAYER_GAMES = 500; // The main player participates in this many games

console.log(`Setting up benchmark with ${TOTAL_GAMES} games and ${TOTAL_PLAYERS} players...`);

// Setup
const players = [];
for (let i = 0; i < TOTAL_PLAYERS; i++) {
    players.push(`player_${i}`);
}

// create games for main player
for (let i = 0; i < MAIN_PLAYER_GAMES; i++) {
    const gameId = gameManager.createGame(MAIN_PLAYER_ID);
    // Randomly assign a guest or leave waiting
    if (Math.random() > 0.5) {
        const opponent = players[Math.floor(Math.random() * players.length)];
        // Ensure opponent is not main player
        if (opponent !== MAIN_PLAYER_ID) {
             gameManager.joinGame(gameId, opponent);

             // Randomly finish some games
             if (Math.random() > 0.3) {
                 gameManager.endGame(gameId, 'checkmate', Math.random() > 0.5 ? MAIN_PLAYER_ID : opponent);
             }
        }
    }
}

// Create noise games (games not involving the main player)
const noiseGames = TOTAL_GAMES - MAIN_PLAYER_GAMES;
for (let i = 0; i < noiseGames; i++) {
    const host = players[Math.floor(Math.random() * players.length)];
    const gameId = gameManager.createGame(host);

    if (Math.random() > 0.5) {
        let guest = players[Math.floor(Math.random() * players.length)];
        while(guest === host) {
             guest = players[Math.floor(Math.random() * players.length)];
        }
        gameManager.joinGame(gameId, guest);

        if (Math.random() > 0.3) {
             gameManager.endGame(gameId, 'checkmate', Math.random() > 0.5 ? host : guest);
        }
    }
}

console.log('Setup complete. Running benchmark...');

// Benchmark getPlayerStatistics
const iterations = 1000;
const start = performance.now();

for (let i = 0; i < iterations; i++) {
    gameManager.getPlayerStatistics(MAIN_PLAYER_ID);
}

const end = performance.now();
const totalTime = end - start;
const avgTime = totalTime / iterations;

console.log(`\nResults for getPlayerStatistics(${MAIN_PLAYER_ID}):`);
console.log(`Total time for ${iterations} iterations: ${totalTime.toFixed(2)} ms`);
console.log(`Average time per iteration: ${avgTime.toFixed(4)} ms`);

// Cleanup
gameManager.cleanup();
