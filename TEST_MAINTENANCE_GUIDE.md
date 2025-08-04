# Test Maintenance Guide for WebChess

## Overview

This guide provides comprehensive documentation for maintaining and extending the WebChess test infrastructure. It covers standardized test patterns, troubleshooting procedures, file organization strategies, and guidelines for adding new tests.

## Standardized Test Patterns

### Basic Test Structure

All tests should follow this standardized pattern:

```javascript
describe('ComponentName', () => {
  let instance;
  let errorSuppression;

  beforeEach(() => {
    instance = new ComponentName();
    errorSuppression = new TestErrorSuppression();
  });

  afterEach(() => {
    if (errorSuppression) {
      errorSuppression.restoreConsoleError();
    }
  });

  describe('methodName', () => {
    test('should handle valid input correctly', () => {
      // Arrange
      const input = createValidInput();
      
      // Act
      const result = instance.methodName(input);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should handle invalid input gracefully', () => {
      // Arrange
      const input = createInvalidInput();
      errorSuppression.suppressExpectedErrors([/expected error pattern/]);
      
      // Act
      const result = instance.methodName(input);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.errorCode).toBeDefined();
    });
  });
});
```

### Chess-Specific Test Patterns

#### Move Validation Tests
```javascript
describe('Move Validation', () => {
  test('should validate legal pawn move', () => {
    // Arrange
    const game = new ChessGame();
    const from = { row: 6, col: 4 };
    const to = { row: 5, col: 4 };
    
    // Act
    const result = game.makeMove(from, to);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.data.move.piece).toBe('pawn');
    expect(result.data.gameState.currentTurn).toBe('black');
  });
});
```

#### Error Recovery Tests
```javascript
describe('Error Recovery', () => {
  test('should handle malformed game state gracefully', () => {
    // Arrange
    const errorSuppression = new TestErrorSuppression();
    errorSuppression.suppressExpectedErrors([
      /Invalid game state/,
      /Malformed board data/
    ]);
    
    const game = new ChessGame();
    const malformedState = { board: null, turn: 'invalid' };
    
    // Act
    const result = game.loadGameState(malformedState);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_GAME_STATE');
    
    // Cleanup
    errorSuppression.restoreConsoleError();
  });
});
```

### Performance Test Patterns

```javascript
describe('Performance Tests', () => {
  test('should validate moves within performance threshold', () => {
    // Arrange
    const game = new ChessGame();
    const moves = generateComplexMoveSequence();
    
    // Act
    const startTime = performance.now();
    moves.forEach(move => game.makeMove(move.from, move.to));
    const endTime = performance.now();
    
    // Assert
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(100); // 100ms threshold
  });
});
```

## Test File Organization Strategy

### Directory Structure

```
tests/
├── unit/                    # Individual component tests
│   ├── chessGame.test.js   # Core game logic
│   ├── gameState.test.js   # State management
│   └── errorHandler.test.js # Error handling
├── integration/             # Component interaction tests
│   ├── gameFlow.test.js    # Complete game scenarios
│   └── multiplayer.test.js # Multi-player functionality
├── performance/             # Performance and load tests
│   ├── moveValidation.test.js
│   └── concurrentGames.test.js
├── browser/                 # Browser-specific tests
│   ├── browserCompatible.test.js
│   └── mobileCompatibility.test.js
├── helpers/                 # Test utilities
│   ├── testData.js         # Common test positions
│   ├── testPatterns.js     # Reusable test patterns
│   └── errorSuppression.js # Error management utilities
└── utils/                   # Test infrastructure utilities
    └── errorSuppression.js  # Error suppression utilities
```

### When to Create "Part 2" Files

Create additional test files (e.g., `pieceMovement.part2.test.js`) when:

1. **File Size**: Original file exceeds 1000 lines
2. **Test Count**: More than 100 test cases in a single file
3. **Logical Separation**: Distinct test categories within the same component
4. **Performance**: Jest execution time for a single file exceeds 30 seconds
5. **Maintainability**: File becomes difficult to navigate or understand

#### Naming Convention for Split Files
- `componentName.test.js` - Primary test file
- `componentName.part2.test.js` - Additional tests (continuation)
- `componentName.integration.test.js` - Integration-specific tests
- `componentName.performance.test.js` - Performance-specific tests

### Test Categories and Organization

#### Unit Tests
- Focus on individual methods and functions
- Mock external dependencies
- Test both success and failure scenarios
- Include edge cases and boundary conditions

#### Integration Tests
- Test component interactions
- Use real dependencies where possible
- Validate complete workflows
- Test error propagation between components

#### Performance Tests
- Measure execution time and memory usage
- Use realistic performance thresholds
- Account for system variability
- Provide actionable optimization guidance

#### Browser Tests
- Test browser-specific functionality
- Validate mobile compatibility
- Test DOM interactions
- Ensure cross-browser compatibility

## Adding New Tests

### Step-by-Step Process

1. **Identify Test Category**
   - Determine if it's unit, integration, performance, or browser test
   - Choose appropriate directory and file

2. **Follow Naming Conventions**
   - Use descriptive test names that explain the scenario
   - Group related tests with `describe` blocks
   - Use consistent naming patterns

3. **Implement Test Structure**
   - Use standardized test patterns
   - Include proper setup and cleanup
   - Add error suppression for expected errors

4. **Validate Test Quality**
   - Ensure test is deterministic and repeatable
   - Verify test fails when it should
   - Check that test provides clear failure messages

### Example: Adding a New Chess Rule Test

```javascript
// 1. Choose appropriate file (e.g., tests/specialMovesComprehensive.test.js)
// 2. Add to existing describe block or create new one
// 3. Follow standard pattern

describe('En Passant Validation', () => {
  test('should allow en passant capture immediately after pawn double move', () => {
    // Arrange
    const game = new ChessGame();
    // Set up en passant scenario
    game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // White pawn e2-e4
    game.makeMove({ row: 1, col: 3 }, { row: 3, col: 3 }); // Black pawn d7-d5
    game.makeMove({ row: 4, col: 4 }, { row: 3, col: 4 }); // White pawn e4-e5
    game.makeMove({ row: 1, col: 5 }, { row: 3, col: 5 }); // Black pawn f7-f5 (creates en passant opportunity)
    
    // Act
    const result = game.makeMove({ row: 3, col: 4 }, { row: 2, col: 5 }); // En passant capture
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.data.move.enPassant).toBe(true);
    expect(game.getPieceAt({ row: 3, col: 5 })).toBeNull(); // Captured pawn removed
  });
});
```

## Troubleshooting Guide

### Common Test Issues and Resolutions

#### 1. Test Failures Due to API Inconsistencies

**Symptoms:**
- Tests expect different response structure than implementation provides
- Property name mismatches (e.g., `status` vs `gameStatus`)
- Missing or incorrect error codes

**Resolution:**
```javascript
// Check API response structure
const result = game.makeMove(from, to);
console.log('Actual response:', JSON.stringify(result, null, 2));

// Ensure consistent response format
expect(result).toHaveProperty('success');
expect(result).toHaveProperty('data');
if (!result.success) {
  expect(result).toHaveProperty('errorCode');
  expect(result).toHaveProperty('message');
}
```

#### 2. Console Error Spam

**Symptoms:**
- Excessive console.error output during test execution
- Expected errors polluting test output
- Difficulty identifying real test failures

**Resolution:**
```javascript
// Use TestErrorSuppression utility
const errorSuppression = new TestErrorSuppression();
errorSuppression.suppressExpectedErrors([
  /Expected error pattern/,
  /Another expected error/
]);

// Your test code here

errorSuppression.restoreConsoleError();
```

#### 3. Performance Test Failures

**Symptoms:**
- Tests failing due to unrealistic performance expectations
- Inconsistent performance across different environments
- Timeouts in CI/CD environments

**Resolution:**
```javascript
// Use realistic thresholds with buffer for system variability
const PERFORMANCE_THRESHOLD = process.env.CI ? 200 : 100; // Higher threshold in CI

test('should complete operation within threshold', () => {
  const startTime = performance.now();
  performOperation();
  const duration = performance.now() - startTime;
  
  expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD);
});
```

#### 4. Syntax and Parsing Errors

**Symptoms:**
- Jest fails to parse test files
- "Unexpected token" errors
- Module import/export issues

**Resolution:**
```javascript
// Ensure proper ES6+ syntax
const { ChessGame } = require('../src/shared/chessGame');

// Use consistent import patterns
// Avoid mixing require() and import statements
// Check for missing semicolons and brackets
```

#### 5. Test Isolation Issues

**Symptoms:**
- Tests pass individually but fail when run together
- State leaking between tests
- Inconsistent test results

**Resolution:**
```javascript
describe('Component Tests', () => {
  let instance;

  beforeEach(() => {
    // Create fresh instance for each test
    instance = new Component();
  });

  afterEach(() => {
    // Clean up any global state
    if (instance && instance.cleanup) {
      instance.cleanup();
    }
  });
});
```

### Debugging Test Failures

#### 1. Isolate the Problem
```bash
# Run specific test file
npm test -- tests/specificFile.test.js

# Run specific test case
npm test -- --testNamePattern="specific test name"

# Run with verbose output
npm test -- --verbose
```

#### 2. Add Debug Information
```javascript
test('should handle complex scenario', () => {
  // Add debug logging
  console.log('Initial state:', game.getGameState());
  
  const result = game.makeMove(from, to);
  
  console.log('Move result:', result);
  console.log('Final state:', game.getGameState());
  
  expect(result.success).toBe(true);
});
```

#### 3. Use Jest Debug Features
```javascript
// Use .only to run single test
test.only('should debug this specific test', () => {
  // Test code
});

// Use .skip to temporarily disable tests
test.skip('should skip this test for now', () => {
  // Test code
});
```

## Test Infrastructure Validation

### Continuous Integration Support

The test infrastructure supports reliable CI/CD workflows through:

1. **Deterministic Tests**: All tests produce consistent results across environments
2. **Performance Thresholds**: Realistic expectations that account for CI environment limitations
3. **Error Suppression**: Clean test output without console spam
4. **Coverage Validation**: Automated coverage reporting and threshold enforcement
5. **Parallel Execution**: Tests can run in parallel without conflicts

### Test Execution Commands

```bash
# Run all tests (recommended for CI/CD)
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run with coverage reporting
npm test -- --coverage

# Run specific test categories
npm test -- tests/unit/
npm test -- tests/integration/
npm test -- tests/performance/
```

### Coverage Requirements

- **Minimum Coverage**: 95% for statements, functions, and lines
- **Branch Coverage**: 90% minimum
- **Exclusions**: Test files, configuration files, and node_modules
- **Enforcement**: Build fails if coverage thresholds are not met

## Best Practices for Test Maintenance

### 1. Regular Test Review
- Review test failures promptly
- Update tests when requirements change
- Remove obsolete or redundant tests
- Refactor tests to improve maintainability

### 2. Test Documentation
- Use descriptive test names
- Add comments for complex test scenarios
- Document chess positions and game states
- Maintain test data explanations

### 3. Performance Monitoring
- Monitor test execution time
- Identify and optimize slow tests
- Set realistic performance expectations
- Use performance budgets for critical paths

### 4. Error Handling
- Test both success and failure scenarios
- Use appropriate error suppression
- Validate error messages and codes
- Ensure graceful degradation

### 5. Test Data Management
- Use consistent test data patterns
- Create reusable test utilities
- Maintain realistic chess positions
- Version control test data changes

## Conclusion

This guide provides the foundation for maintaining and extending the WebChess test infrastructure. By following these patterns and procedures, developers can ensure reliable, maintainable, and comprehensive test coverage that supports continuous integration and development workflows.

For additional support or questions about testing patterns, refer to the existing test files as examples or consult the project's development team.