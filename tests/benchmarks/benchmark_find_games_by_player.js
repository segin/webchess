
const GameManager = require('../../src/server/gameManager');

// O(N) implementation for comparison
function findGamesByPlayerSlow(gameManager, playerId) {
    const games = [];
    for (const [gameId, game] of gameManager.games) {
        if (game.host === playerId || game.guest === playerId) {
            games.push(gameId);
        }
    }
    return games;
}

const runBenchmark = () => {
    const gameManager = new GameManager();
    const totalGames = 10000;
    const playersPerGame = 2;
    const totalPlayers = totalGames * playersPerGame; // Worst case, unique players everywhere

    // We will reuse a smaller set of players to simulate players having multiple games
    const uniquePlayerCount = 2000;

    console.log(`Populating ${totalGames} games with ~${uniquePlayerCount} unique players...`);

    const playerIds = [];
    for(let i=0; i<uniquePlayerCount; i++) {
        playerIds.push(`player_${i}`);
    }

    // Populate games
    for (let i = 0; i < totalGames; i++) {
        const gameId = gameManager.generateGameId();

        const hostId = playerIds[Math.floor(Math.random() * uniquePlayerCount)];
        let guestId = playerIds[Math.floor(Math.random() * uniquePlayerCount)];
        while(guestId === hostId) {
             guestId = playerIds[Math.floor(Math.random() * uniquePlayerCount)];
        }

        const game = {
            id: gameId,
            host: hostId,
            guest: guestId,
            status: 'active',
            createdAt: Date.now(),
            lastActivity: Date.now(),
            chess: { moveHistory: [] }
        };

        // Bypass createGame to avoid rate limits and setup overhead
        gameManager.games.set(gameId, game);

        // Manually maintain the O(1) index
        gameManager._addGameToPlayer(hostId, gameId);
        gameManager._addGameToPlayer(guestId, gameId);

        // Also populate playerToGame (though not used for findGamesByPlayer)
        gameManager.playerToGame.set(hostId, gameId);
        gameManager.playerToGame.set(guestId, gameId);
    }

    console.log('Starting benchmark for findGamesByPlayer...');

    const iterations = 1000;
    const lookupPlayerIds = [];
    // Select random players to look up
    for(let i=0; i<iterations; i++) {
        lookupPlayerIds.push(playerIds[Math.floor(Math.random() * uniquePlayerCount)]);
    }

    // Benchmark O(N) Slow Implementation
    const startSlow = process.hrtime();
    for (let i = 0; i < iterations; i++) {
        findGamesByPlayerSlow(gameManager, lookupPlayerIds[i]);
    }
    const endSlow = process.hrtime(startSlow);
    const timeSlowMs = (endSlow[0] * 1000 + endSlow[1] / 1e6);
    const avgSlow = timeSlowMs / iterations;

    // Benchmark O(1) Fast Implementation
    const startFast = process.hrtime();
    for (let i = 0; i < iterations; i++) {
        gameManager.findGamesByPlayer(lookupPlayerIds[i]);
    }
    const endFast = process.hrtime(startFast);
    const timeFastMs = (endFast[0] * 1000 + endFast[1] / 1e6);
    const avgFast = timeFastMs / iterations;

    console.log('--- Results ---');
    console.log(`Total Games: ${totalGames}`);
    console.log(`Iterations: ${iterations}`);
    console.log(`O(N) Slow Implementation: Total ${timeSlowMs.toFixed(2)}ms, Avg ${avgSlow.toFixed(4)}ms`);
    console.log(`O(1) Fast Implementation: Total ${timeFastMs.toFixed(2)}ms, Avg ${avgFast.toFixed(4)}ms`);

    const speedup = avgSlow / avgFast;
    console.log(`Speedup: ${speedup.toFixed(2)}x`);

    return { avgSlow, avgFast, speedup };
};

runBenchmark();
