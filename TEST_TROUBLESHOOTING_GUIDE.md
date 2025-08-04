# Test Troubleshooting Guide for WebChess

## Quick Reference for Common Test Issues

This guide provides immediate solutions for the most common test problems encountered in the WebChess project.

## Issue Categories

### 1. API Response Structure Issues

#### Problem: Test expects different response format
```
Expected: { success: true, data: {...} }
Received: { result: true, gameState: {...} }
```

**Solution:**
```javascript
// Check actual response structure first
const result = game.makeMove(from, to);
console.log('Actual response:', JSON.stringify(result, null, 2));

// Update test expectations to match standardized format
expect(result).toHaveProperty('success');
expect(result).toHaveProperty('data');
```

#### Problem: Property name mismatches
```
TypeError: Cannot read property 'status' of undefined
```

**Solution:**
```javascript
// Check for property name inconsistencies
expect(result.data.gameState.status).toBe('active'); // Not 'gameStatus'
expect(result.data.move.piece).toBe('pawn'); // Not 'pieceType'
```

### 2. Console Error Spam

#### Problem: Expected errors polluting test output
```
console.error: Invalid move: piece cannot move to that square
console.error: Game state validation failed
```

**Solution:**
```javascript
const { TestErrorSuppression } = require('./utils/errorSuppression');

describe('Error Recovery Tests', () => {
  let errorSuppression;

  beforeEach(() => {
    errorSuppression = new TestErrorSuppression();
  });

  afterEach(() => {
    errorSuppression.restoreConsoleError();
  });

  test('should handle invalid moves gracefully', () => {
    // Suppress expected errors
    errorSuppression.suppressExpectedErrors([
      /Invalid move/,
      /Game state validation failed/
    ]);

    const result = game.makeMove(invalidFrom, invalidTo);
    expect(result.success).toBe(false);
  });
});
```

### 3. Performance Test Failures

#### Problem: Tests failing due to unrealistic timing expectations
```
Expected: < 50ms
Received: 127ms
```

**Solution:**
```javascript
// Use environment-appropriate thresholds
const PERFORMANCE_THRESHOLD = {
  development: 100,
  ci: 200,
  production: 50
};

const threshold = PERFORMANCE_THRESHOLD[process.env.NODE_ENV] || 
                 PERFORMANCE_THRESHOLD.development;

test('should validate moves within reasonable time', () => {
  const startTime = performance.now();
  game.makeMove(from, to);
  const duration = performance.now() - startTime;
  
  expect(duration).toBeLessThan(threshold);
});
```

### 4. Syntax and Parsing Errors

#### Problem: Jest cannot parse test files
```
SyntaxError: Unexpected token 'export'
```

**Solution:**
```javascript
// Use consistent module syntax (CommonJS for Node.js)
const { ChessGame } = require('../src/shared/chessGame');

// Not: import { ChessGame } from '../src/shared/chessGame';

// Ensure proper Jest configuration in jest.config.js
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};
```

#### Problem: Missing semicolons or brackets
```
SyntaxError: Unexpected token '}'
```

**Solution:**
```javascript
// Check for missing semicolons
const game = new ChessGame(); // Add semicolon

// Check for unmatched brackets
describe('Test Suite', () => {
  test('should work', () => {
    expect(true).toBe(true);
  }); // Ensure all brackets are closed
});
```

### 5. Test Isolation Issues

#### Problem: Tests pass individually but fail together
```
Test suite failed to run: Cannot read property 'board' of null
```

**Solution:**
```javascript
describe('Chess Game Tests', () => {
  let game;

  beforeEach(() => {
    // Create fresh instance for each test
    game = new ChessGame();
  });

  afterEach(() => {
    // Clean up any global state
    if (game && game.cleanup) {
      game.cleanup();
    }
    // Reset any global variables
    global.testGameState = null;
  });
});
```

### 6. Coverage Issues

#### Problem: Coverage below required threshold
```
Coverage threshold for statements (95%) not met: 87.3%
```

**Solution:**
```javascript
// Identify uncovered code paths
npm test -- --coverage --verbose

// Add tests for missing coverage
test('should handle edge case not previously tested', () => {
  // Test the uncovered code path
  const result = game.handleEdgeCase();
  expect(result).toBeDefined();
});

// Exclude non-testable files from coverage
// In jest.config.js:
collectCoverageFrom: [
  'src/**/*.js',
  '!src/**/*.test.js',
  '!src/config/*.js' // Exclude configuration files
]
```

## Debugging Strategies

### 1. Isolate the Problem

```bash
# Run single test file
npm test -- tests/chessGame.test.js

# Run specific test
npm test -- --testNamePattern="should handle pawn movement"

# Run with maximum verbosity
npm test -- --verbose --no-cache
```

### 2. Add Debug Information

```javascript
test('should debug complex scenario', () => {
  console.log('=== DEBUG START ===');
  console.log('Initial board:', game.getBoardState());
  
  const result = game.makeMove(from, to);
  
  console.log('Move result:', result);
  console.log('Final board:', game.getBoardState());
  console.log('=== DEBUG END ===');
  
  expect(result.success).toBe(true);
});
```

### 3. Use Jest Debug Features

```javascript
// Focus on single test
test.only('should focus on this test only', () => {
  // Only this test will run
});

// Skip problematic tests temporarily
test.skip('should skip this test for now', () => {
  // This test will be skipped
});

// Add timeout for slow tests
test('should handle slow operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

## Environment-Specific Issues

### CI/CD Environment Problems

#### Problem: Tests pass locally but fail in CI
```
Timeout: Test exceeded 5000ms
```

**Solution:**
```javascript
// Increase timeouts for CI environment
const timeout = process.env.CI ? 30000 : 5000;

test('should handle operation within timeout', async () => {
  // Test code
}, timeout);

// Use different thresholds for CI
const expectedDuration = process.env.CI ? 500 : 100;
expect(actualDuration).toBeLessThan(expectedDuration);
```

### Memory Issues

#### Problem: Tests failing due to memory constraints
```
JavaScript heap out of memory
```

**Solution:**
```javascript
// Clean up large objects in afterEach
afterEach(() => {
  if (largeGameState) {
    largeGameState = null;
  }
  if (global.gc) {
    global.gc(); // Force garbage collection if available
  }
});

// Limit concurrent test execution
// In jest.config.js:
maxWorkers: process.env.CI ? 2 : '50%'
```

## Quick Fixes Checklist

When a test fails, check these items in order:

1. **[ ] Response Structure**: Does the test expect the correct API response format?
2. **[ ] Property Names**: Are property names consistent between test and implementation?
3. **[ ] Error Suppression**: Are expected errors properly suppressed?
4. **[ ] Performance Thresholds**: Are timing expectations realistic for the environment?
5. **[ ] Test Isolation**: Does the test properly set up and clean up its state?
6. **[ ] Syntax**: Are there any JavaScript syntax errors in the test file?
7. **[ ] Dependencies**: Are all required modules properly imported?
8. **[ ] Test Data**: Is the test using valid, realistic test data?
9. **[ ] Async Handling**: Are promises and async operations properly handled?
10. **[ ] Environment**: Are environment-specific configurations accounted for?

## Getting Help

### Internal Resources
1. Check existing test files for similar patterns
2. Review `TEST_MAINTENANCE_GUIDE.md` for detailed patterns
3. Examine `tests/helpers/testPatterns.js` for reusable utilities
4. Look at `tests/utils/errorSuppression.js` for error handling

### External Resources
1. [Jest Documentation](https://jestjs.io/docs/getting-started)
2. [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
3. [Chess Programming Wiki](https://www.chessprogramming.org/)

### When to Ask for Help
- Multiple tests are failing with similar patterns
- Performance issues persist after optimization attempts
- Coverage requirements cannot be met despite adding tests
- CI/CD pipeline consistently fails while local tests pass

Remember: Most test issues fall into predictable categories. Use this guide to quickly identify and resolve common problems, keeping the test suite reliable and maintainable.