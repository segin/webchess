const GameStateManager = require('../../src/shared/gameState');
const { performance } = require('perf_hooks');

const stateManager = new GameStateManager();

// Populate with mock data to simulate a long game
for (let i = 0; i < 100; i++) {
    stateManager.positionHistory.push(
        `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 ${i}`
    );
}

for (let i = 0; i < 50; i++) {
    stateManager.gameMetadata[`key_${i}`] = `value_${i}_${Math.random()}`;
}

const ITERATIONS = 10000;

console.log('Benchmarking getMemoryUsage...');
console.log(`Iterations: ${ITERATIONS}`);

const start = performance.now();

for (let i = 0; i < ITERATIONS; i++) {
    stateManager.getMemoryUsage();
}

const end = performance.now();
const duration = end - start;
const opsPerSec = (ITERATIONS / duration) * 1000;

console.log(`Total time: ${duration.toFixed(2)} ms`);
console.log(`Ops/sec: ${opsPerSec.toFixed(2)}`);
