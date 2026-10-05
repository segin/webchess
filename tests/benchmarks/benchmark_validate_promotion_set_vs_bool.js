const { performance } = require('perf_hooks');

const VALID_PROMOTION_SET = new Set(['queen', 'rook', 'bishop', 'knight']);

function validateMoveFormat_original(move) {
    if (move.promotion && !['queen', 'rook', 'bishop', 'knight'].includes(move.promotion)) {
        return false;
    }
    return true;
}

function validateMoveFormat_set(move) {
    if (move.promotion && !VALID_PROMOTION_SET.has(move.promotion)) {
        return false;
    }
    return true;
}

function validateMoveFormat_bool(move) {
    const p = move.promotion;
    if (p && p !== 'queen' && p !== 'rook' && p !== 'bishop' && p !== 'knight') {
        return false;
    }
    return true;
}

const moves = [
  { promotion: 'queen' },
  { promotion: 'knight' },
  { promotion: 'rook' },
  { promotion: 'bishop' },
  {},
  { promotion: 'king' },
  { promotion: 'pawn' },
];

function benchmark(name, fn) {
  let validCount = 0;
  for (let i = 0; i < 100000; i++) fn(moves[i % moves.length]);

  const start = performance.now();
  for (let i = 0; i < 10000000; i++) {
    if (fn(moves[i % moves.length])) validCount++;
  }
  const end = performance.now();
  console.log(`${name}: ${end - start} ms, count: ${validCount}`);
}

benchmark('Bool', validateMoveFormat_bool);
benchmark('Set', validateMoveFormat_set);
benchmark('Original', validateMoveFormat_original);
benchmark('Bool', validateMoveFormat_bool);
benchmark('Set', validateMoveFormat_set);
benchmark('Original', validateMoveFormat_original);
