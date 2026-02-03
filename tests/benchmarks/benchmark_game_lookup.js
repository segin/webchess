const GameManager = require('../../src/server/gameManager');
const { performance } = require('perf_hooks');

// Helper to format numbers
const fmt = (n) => new Intl.NumberFormat().format(n);

function runBenchmark() {
    console.log('⚡ Benchmark: GameManager.getGamesByStatus (O(N) vs O(1) Lookup)');
    console.log('===============================================================');

    const gameManager = new GameManager();
    const TARGET_GAMES = 1000000;

    // Status distribution
    const statuses = ['waiting', 'active', 'finished', 'paused'];
    const distribution = {
        'waiting': 0.2,   // 20%
        'active': 0.6,    // 60%
        'finished': 0.15, // 15%
        'paused': 0.05    // 5%
    };

    console.log(`Phase 1: Populating ${fmt(TARGET_GAMES)} games...`);

    const startTime = performance.now();

    // Manually populate to avoid ChessGame overhead and strictly test the lookup logic
    for (let i = 0; i < TARGET_GAMES; i++) {
        const id = `game_${i}`;
        const rand = Math.random();
        let status = 'active';

        let sum = 0;
        for (const [s, p] of Object.entries(distribution)) {
            sum += p;
            if (rand < sum) {
                status = s;
                break;
            }
        }

        // Mimic the game object structure relevant to getGamesByStatus
        gameManager.games.set(id, {
            id,
            status,
            createdAt: Date.now()
        });

        // We also need to populate the index if we were running the optimized version,
        // but since we are monkey-patching 'games', the optimized version
        // will need to be populated correctly.
        // For the *unoptimized* version, this is sufficient.
        // For the *optimized* version, we'll need to make sure we use a method that updates the index,
        // or manually update the index in this loop if we detect it exists.

        if (gameManager.gamesByStatus) {
             if (!gameManager.gamesByStatus.has(status)) {
                gameManager.gamesByStatus.set(status, new Set());
             }
             gameManager.gamesByStatus.get(status).add(id);
        }
    }

    const populateTime = performance.now() - startTime;
    console.log(`Population took ${fmt(Math.round(populateTime))}ms`);
    console.log(`Total games managed: ${fmt(gameManager.games.size)}`);
    if (gameManager.gamesByStatus) {
        console.log(`(Optimized Index Detected)`);
    } else {
        console.log(`(Standard Implementation Detected)`);
    }
    console.log('---------------------------------------------------------------');

    // Run Measurements
    const iterations = 100;
    const lookupStatus = 'active'; // Most common status

    console.log(`Phase 2: Measuring lookups for status="${lookupStatus}" (${iterations} iterations)...`);

    const lookupStart = performance.now();
    let totalFound = 0;

    for (let i = 0; i < iterations; i++) {
        const results = gameManager.getGamesByStatus(lookupStatus);
        totalFound += results.length;
    }

    const lookupEnd = performance.now();
    const totalTime = lookupEnd - lookupStart;
    const avgTime = totalTime / iterations;

    console.log('\nResults:');
    console.log(`Average Lookup Time: ${avgTime.toFixed(4)} ms`);
    console.log(`Total Time:          ${totalTime.toFixed(2)} ms`);
    console.log(`Items Found (avg):   ${Math.round(totalFound / iterations)}`);
    console.log(`Lookups per sec:     ${fmt(Math.round(1000 / avgTime))}`);

    return { avgTime, totalTime };
}

runBenchmark();
