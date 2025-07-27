#!/usr/bin/env node

/**
 * Demonstration of Enhanced Chess Game Validation Infrastructure
 * Shows the comprehensive validation system in action
 */

const ChessGame = require('../src/shared/chessGame');

console.log('🧪 Enhanced Chess Game Validation Infrastructure Demo\n');

const game = new ChessGame();

// Test cases to demonstrate enhanced validation
const testCases = [
  {
    name: 'Valid pawn move',
    move: { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } },
    expectValid: true
  },
  {
    name: 'Null move',
    move: null,
    expectValid: false
  },
  {
    name: 'Invalid coordinates',
    move: { from: { row: -1, col: 0 }, to: { row: 0, col: 0 } },
    expectValid: false
  },
  {
    name: 'Malformed move object',
    move: { from: 'invalid', to: { row: 0, col: 0 } },
    expectValid: false
  },
  {
    name: 'Move from empty square',
    move: { from: { row: 4, col: 4 }, to: { row: 3, col: 4 } },
    expectValid: false
  },
  {
    name: 'Wrong turn (black piece when white to move)',
    move: { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } },
    expectValid: false
  },
  {
    name: 'Invalid pawn movement pattern',
    move: { from: { row: 6, col: 4 }, to: { row: 4, col: 5 } },
    expectValid: false
  },
  {
    name: 'Same source and destination',
    move: { from: { row: 6, col: 4 }, to: { row: 6, col: 4 } },
    expectValid: false
  }
];

console.log('Running validation tests...\n');

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  console.log('   Move:', JSON.stringify(testCase.move));
  
  const result = game.validateMove(testCase.move);
  const passed = result.isValid === testCase.expectValid;
  
  console.log(`   Result: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);
  if (!result.isValid) {
    console.log(`   Error: ${result.message} (${result.errorCode})`);
    if (result.errors.length > 0) {
      console.log(`   Details: ${result.errors[0]}`);
    }
  }
  console.log(`   Test: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
});

// Demonstrate detailed validation information
console.log('📋 Detailed Validation Example');
console.log('================================');

const detailedMove = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
const detailedResult = game.validateMove(detailedMove);

console.log('Move:', JSON.stringify(detailedMove));
console.log('Validation Details:');
Object.entries(detailedResult.details).forEach(([key, value]) => {
  console.log(`  ${key}: ${value ? '✅' : '❌'}`);
});

// Demonstrate makeMove with enhanced error handling
console.log('\n🎮 Enhanced makeMove Error Handling');
console.log('====================================');

const invalidMove = { from: { row: -1, col: 0 }, to: { row: 0, col: 0 } };
const moveResult = game.makeMove(invalidMove);

console.log('Invalid move attempt:', JSON.stringify(invalidMove));
console.log('Response:');
console.log(`  Success: ${moveResult.success}`);
console.log(`  Message: ${moveResult.message}`);
console.log(`  Error Code: ${moveResult.errorCode}`);
console.log(`  Errors: ${JSON.stringify(moveResult.errors)}`);

console.log('\n🎉 Enhanced validation infrastructure demonstration complete!');
console.log('The system now provides comprehensive input validation, detailed error reporting,');
console.log('and granular validation details for debugging and user feedback.');