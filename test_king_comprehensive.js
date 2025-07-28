const ChessGame = require('./src/shared/chessGame');

console.log('🧪 Comprehensive King Movement Validation Test\n');
console.log('Testing all requirements from Task 7:\n');

const game = new ChessGame();

// Task requirement: Code king movement validation for single-square moves in all eight directions
console.log('✅ Requirement 1: Single-square moves in all eight directions');

game.board = Array(8).fill(null).map(() => Array(8).fill(null));
game.board[4][4] = { type: 'king', color: 'white' };
game.currentTurn = 'white';

const allDirections = [
  { name: 'North', to: { row: 3, col: 4 } },
  { name: 'South', to: { row: 5, col: 4 } },
  { name: 'East', to: { row: 4, col: 5 } },
  { name: 'West', to: { row: 4, col: 3 } },
  { name: 'Northeast', to: { row: 3, col: 5 } },
  { name: 'Northwest', to: { row: 3, col: 3 } },
  { name: 'Southeast', to: { row: 5, col: 5 } },
  { name: 'Southwest', to: { row: 5, col: 3 } }
];

let passedDirections = 0;
allDirections.forEach(dir => {
  const move = { from: { row: 4, col: 4 }, to: dir.to };
  const result = game.validateMove(move);
  if (result.isValid) {
    passedDirections++;
    console.log(`  ✅ ${dir.name}: Valid`);
  } else {
    console.log(`  ❌ ${dir.name}: ${result.message}`);
  }
});

console.log(`  Result: ${passedDirections}/8 directions working correctly\n`);

// Task requirement: Implement king safety validation to prevent moves into check
console.log('✅ Requirement 2: King safety validation preventing moves into check');

const attackingPieces = [
  { name: 'Rook', piece: { type: 'rook', color: 'black' }, pos: { row: 3, col: 6 }, attackedSquare: { row: 3, col: 4 } },
  { name: 'Bishop', piece: { type: 'bishop', color: 'black' }, pos: { row: 1, col: 1 }, attackedSquare: { row: 3, col: 3 } },
  { name: 'Queen', piece: { type: 'queen', color: 'black' }, pos: { row: 2, col: 4 }, attackedSquare: { row: 3, col: 4 } },
  { name: 'Knight', piece: { type: 'knight', color: 'black' }, pos: { row: 1, col: 3 }, attackedSquare: { row: 3, col: 4 } },
  { name: 'Pawn', piece: { type: 'pawn', color: 'black' }, pos: { row: 2, col: 3 }, attackedSquare: { row: 3, col: 4 } }
];

let safetyTestsPassed = 0;
attackingPieces.forEach(test => {
  // Reset board
  game.board = Array(8).fill(null).map(() => Array(8).fill(null));
  game.board[4][4] = { type: 'king', color: 'white' };
  game.board[test.pos.row][test.pos.col] = test.piece;
  game.currentTurn = 'white';
  
  const move = { from: { row: 4, col: 4 }, to: test.attackedSquare };
  const result = game.validateMove(move);
  
  if (!result.isValid && result.errorCode === 'KING_IN_CHECK') {
    safetyTestsPassed++;
    console.log(`  ✅ ${test.name} attack prevention: Correctly blocked`);
  } else {
    console.log(`  ❌ ${test.name} attack prevention: Failed to block`);
  }
});

console.log(`  Result: ${safetyTestsPassed}/5 attack types correctly prevented\n`);

// Task requirement: Add boundary validation for king moves to prevent out-of-bounds destinations
console.log('✅ Requirement 3: Boundary validation preventing out-of-bounds moves');

const boundaryTests = [
  { name: 'Top edge', kingPos: { row: 0, col: 4 }, move: { row: -1, col: 4 } },
  { name: 'Bottom edge', kingPos: { row: 7, col: 4 }, move: { row: 8, col: 4 } },
  { name: 'Left edge', kingPos: { row: 4, col: 0 }, move: { row: 4, col: -1 } },
  { name: 'Right edge', kingPos: { row: 4, col: 7 }, move: { row: 4, col: 8 } }
];

let boundaryTestsPassed = 0;
boundaryTests.forEach(test => {
  game.board = Array(8).fill(null).map(() => Array(8).fill(null));
  game.board[test.kingPos.row][test.kingPos.col] = { type: 'king', color: 'white' };
  game.currentTurn = 'white';
  
  const move = { from: test.kingPos, to: test.move };
  const result = game.validateMove(move);
  
  if (!result.isValid && result.errorCode === 'INVALID_COORDINATES') {
    boundaryTestsPassed++;
    console.log(`  ✅ ${test.name}: Correctly prevented out-of-bounds move`);
  } else {
    console.log(`  ❌ ${test.name}: Failed to prevent out-of-bounds move`);
  }
});

console.log(`  Result: ${boundaryTestsPassed}/4 boundary conditions correctly handled\n`);

// Task requirement: Write unit tests for invalid king moves including multi-square moves and out-of-bounds attempts
console.log('✅ Requirement 4: Invalid move rejection (multi-square and invalid patterns)');

game.board = Array(8).fill(null).map(() => Array(8).fill(null));
game.board[4][4] = { type: 'king', color: 'white' };
game.currentTurn = 'white';
game.castlingRights.white.kingside = false;
game.castlingRights.white.queenside = false;

const invalidMoves = [
  { name: '2 squares horizontal', to: { row: 4, col: 6 } },
  { name: '2 squares vertical', to: { row: 2, col: 4 } },
  { name: '2 squares diagonal', to: { row: 2, col: 2 } },
  { name: '3 squares horizontal', to: { row: 4, col: 7 } },
  { name: 'Knight L-shape', to: { row: 2, col: 5 } },
  { name: 'Same square', to: { row: 4, col: 4 } }
];

let invalidMoveTestsPassed = 0;
invalidMoves.forEach(test => {
  const move = { from: { row: 4, col: 4 }, to: test.to };
  const result = game.validateMove(move);
  
  if (!result.isValid) {
    invalidMoveTestsPassed++;
    console.log(`  ✅ ${test.name}: Correctly rejected (${result.errorCode})`);
  } else {
    console.log(`  ❌ ${test.name}: Should have been rejected but was accepted`);
  }
});

console.log(`  Result: ${invalidMoveTestsPassed}/6 invalid moves correctly rejected\n`);

// Summary
console.log('📊 TASK 7 COMPLETION SUMMARY:');
console.log('=====================================');
console.log(`✅ Single-square movement: ${passedDirections}/8 directions (${passedDirections === 8 ? 'PASS' : 'FAIL'})`);
console.log(`✅ King safety validation: ${safetyTestsPassed}/5 attack types (${safetyTestsPassed === 5 ? 'PASS' : 'FAIL'})`);
console.log(`✅ Boundary validation: ${boundaryTestsPassed}/4 boundaries (${boundaryTestsPassed === 4 ? 'PASS' : 'FAIL'})`);
console.log(`✅ Invalid move rejection: ${invalidMoveTestsPassed}/6 invalid moves (${invalidMoveTestsPassed === 6 ? 'PASS' : 'FAIL'})`);

const totalTests = passedDirections + safetyTestsPassed + boundaryTestsPassed + invalidMoveTestsPassed;
const maxTests = 8 + 5 + 4 + 6;
const successRate = (totalTests / maxTests * 100).toFixed(1);

console.log(`\n🎯 Overall Success Rate: ${totalTests}/${maxTests} tests passed (${successRate}%)`);

if (totalTests === maxTests) {
  console.log('\n🎉 TASK 7 COMPLETED SUCCESSFULLY! 🎉');
  console.log('All king movement validation requirements have been implemented and tested.');
} else {
  console.log('\n⚠️ Some tests failed. Please review the implementation.');
}