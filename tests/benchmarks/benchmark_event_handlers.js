const GameManager = require('../../src/server/gameManager');
const { performance } = require('perf_hooks');

function runBenchmark(iterations, handlerCount) {
  const gm = new GameManager();
  const EVENT_NAME = 'benchmarkEvent';

  const handlers = Array.from({ length: handlerCount }, () => () => {});

  let totalAdd = 0;
  let totalRemove = 0;
  let totalEmit = 0;

  for (let i = 0; i < iterations; i++) {
    // Add
    const t0 = performance.now();
    for (let j = 0; j < handlerCount; j++) {
      gm.addEventHandler(EVENT_NAME, handlers[j]);
    }
    totalAdd += performance.now() - t0;

    // Emit
    const t1 = performance.now();
    gm.emitEvent(EVENT_NAME, { test: 123 });
    totalEmit += performance.now() - t1;

    // Remove
    const t2 = performance.now();
    for (let j = 0; j < handlerCount; j++) {
      gm.removeEventHandler(EVENT_NAME, handlers[j]);
    }
    totalRemove += performance.now() - t2;
  }

  return { totalAdd, totalEmit, totalRemove };
}

console.log('--- Benchmarking Array vs Set in GameManager.eventHandlers ---');

// Warmup
runBenchmark(5, 1000);

// Actual benchmark
const ITERATIONS = 100;
const HANDLERS = 5000;

console.log(`Running ${ITERATIONS} iterations with ${HANDLERS} handlers each...`);
const results = runBenchmark(ITERATIONS, HANDLERS);

console.log('Results:');
console.log(`  Add:    ${results.totalAdd.toFixed(2)}ms`);
console.log(`  Emit:   ${results.totalEmit.toFixed(2)}ms`);
console.log(`  Remove: ${results.totalRemove.toFixed(2)}ms`);
console.log(`  Total:  ${(results.totalAdd + results.totalEmit + results.totalRemove).toFixed(2)}ms`);
