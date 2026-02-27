const MoveGenerator = require('../../src/shared/moveGenerator');

// Mock game object since MoveGenerator constructor expects it
const mockGame = {
  board: Array(8).fill(null).map(() => Array(8).fill(null))
};

const moveGenerator = new MoveGenerator(mockGame);

// Function to generate random valid sliding attack scenarios
function generateScenario() {
  // Pick attacker position
  const attacker = {
    row: Math.floor(Math.random() * 8),
    col: Math.floor(Math.random() * 8)
  };

  // Pick direction (orthogonal or diagonal)
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];
  const dir = directions[Math.floor(Math.random() * directions.length)];

  // Pick king position along direction (ensure valid board bounds)
  let dist = Math.floor(Math.random() * 6) + 1; // at least 1 square away
  let king = {
    row: attacker.row + dir[0] * dist,
    col: attacker.col + dir[1] * dist
  };

  // Adjust king to be on board
  while (king.row < 0 || king.row > 7 || king.col < 0 || king.col > 7) {
    dist--;
    if (dist <= 0) {
      // If we can't place king, retry
      return generateScenario();
    }
    king = {
      row: attacker.row + dir[0] * dist,
      col: attacker.col + dir[1] * dist
    };
  }

  // Pick potential blocking square
  // It can be anywhere on the board
  const block = {
    row: Math.floor(Math.random() * 8),
    col: Math.floor(Math.random() * 8)
  };

  // Or force it to be on the path sometimes for more hits
  if (Math.random() > 0.5 && dist > 1) {
    const blockDist = Math.floor(Math.random() * (dist - 1)) + 1;
    block.row = attacker.row + dir[0] * blockDist;
    block.col = attacker.col + dir[1] * blockDist;
  }

  return { attacker, king, block };
}

// Pre-generate scenarios
const SCENARIO_COUNT = 10000;
const scenarios = [];
for (let i = 0; i < SCENARIO_COUNT; i++) {
  scenarios.push(generateScenario());
}

// Benchmark
console.log(`Benchmarking isBlockingSquare with ${SCENARIO_COUNT} scenarios x 100 iterations...`);

const start = process.hrtime();
let hits = 0;
const ITERATIONS = 100; // Run scenarios multiple times

for (let i = 0; i < ITERATIONS; i++) {
  for (const scenario of scenarios) {
    if (moveGenerator.isBlockingSquare(scenario.block, scenario.attacker, scenario.king)) {
      hits++;
    }
  }
}

const end = process.hrtime(start);
const timeInMs = (end[0] * 1000 + end[1] / 1e6);
console.log(`Total time: ${timeInMs.toFixed(2)}ms`);
console.log(`Average time per call: ${(timeInMs / (SCENARIO_COUNT * ITERATIONS)).toFixed(6)}ms`);
console.log(`Hits: ${hits}`);
