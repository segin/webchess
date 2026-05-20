const GameStateManager = require('../../src/shared/gameState');
const { performance } = require('perf_hooks');

const stateManager = new GameStateManager();
stateManager.currentTurn = 'white';

const iterations = 1000000;

// Warmup
for (let i = 0; i < 1000; i++) {
  stateManager.validateCurrentTurn();
}

const start = performance.now();
for (let i = 0; i < iterations; i++) {
  stateManager.validateCurrentTurn();
}
const end = performance.now();

console.log(`Time taken for ${iterations} iterations: ${end - start} ms`);
