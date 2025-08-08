# Test Maintenance Guide for WebChess

## Overview

This guide provides comprehensive documentation for maintaining and extending the WebChess test infrastructure. It covers standardized patterns, troubleshooting procedures, and best practices for reliable test development.

## Test Infrastructure Architecture

### Test Categories

1. **Unit Tests** - Individual component testing
   - `tests/chessGame.test.js` - Core game logic
   - `tests/gameState.test.js` - State management
   - `tests/chessAI.test.js` - AI functionality
   - `tests/gameManager.test.js` - Server game management

2. **Integration Tests** - Component interaction testing
   - `tests/integrationTests.test.js` - Cross-component workflows
   - `tests/serverIntegration.test.js` - Server-client integration

3. **Comprehensive Tests** - Extensive scenario coverage
   - `tests/comprehensive.test.js` - Complete game scenarios
   - `tests/specialMovesComprehensive.test.js` - Chess special moves
   - `tests/errorHandlingComprehensive.test.js` - Error scenarios

4. **Performance Tests** - Load and stress testing
   - `tests/performanceTests.test.js` - Performance benchmarks
   - `tests/stressTestsComprehensive.test.js` - Stress scenarios

5. **Browser Tests** - Client-side compatibility
   - `tests/browserCompatible.test.js` - Browser compatibility
   - `public/test-runner.html` - Browser test runner

## Standardized Test Patterns

### Test File Structure

```javascript
const ChessGame = require('../src/shared/chessGame');
const { testUtils } = require('./utils/errorSuppression');

describe('ComponentName', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
    testUtils.suppressErrorLogs(); // For tests that generate expected errors
  });

  afterEach(() => {
    testUtils.restoreErrorLogs();
  });

  describe('feature group', () => {
    test('should handle specific scenario', () => {
      // Arrange
      const input = validTestData;
      
      // Act
      const result = game.method(input);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedOutput);
    });
  });
});
```

### API Usage Patterns

#### Correct Move API Usage
```javascript
// Correct - Use move object with from/to properties
const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
const result = game.makeMove(move);

// Incorrect - Don't use separate coordinate parameters
// game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // WRONG
```

#### Response Validation Patterns
```javascript
// Success response validation
expect(result.success).toBe(true);
expect(result.data).toBeDefined();
expect(result.errorCode).toBeNull();

// Error response validation
expect(result.success).toBe(false);
expect(result.message).toBeDefined();
expect(result.errorCode).toBeDefined();
```

### Error Suppression for Expected Errors

```javascript
const { testUtils } = require('./utils/errorSuppression');

// Suppress expected console errors in error recovery tests
beforeEach(() => {
  testUtils.suppressErrorLogs([
    /WRONG_TURN/,
    /PATH_BLOCKED/,
    /INVALID_MOVEMENT/
  ]);
});

afterEach(() => {
  testUtils.restoreErrorLogs();
});
```

## Test File Organization Strategy

### When to Create "Part 2" Files

Create additional test files (e.g., `pieceMovement.part2.test.js`) when:

1. **File Size** - Original file exceeds 1000 lines
2. **Test Count** - More than 100 test cases in a single file
3. **Execution Time** - File takes longer than 30 seconds to run
4. **Logical Grouping** - Distinct feature sets warrant separation

### Naming Conventions

- **Test Files**: `featureName.test.js`
- **Part Files**: `featureName.part2.test.js`, `featureName.part3.test.js`
- **Comprehensive**: `featureNameComprehensive.test.js`
- **Integration**: `featureNameIntegration.test.js`

## Common Test Issues and Resolutions

### 1. Infinite Loop Detection

**Symptoms**: Tests hang indefinitely, timeout after hours
**Causes**: 
- Incorrect API usage (wrong parameter format)
- While loops without proper exit conditions
- Recursive function calls without base cases

**Resolution**:
```bash
# Run with timeout to identify hanging tests
timeout 60s npm test -- --testPathPattern="problematicTest" --verbose

# Check for infinite loops in source code
grep -r "while.*(" src/
```

### 2. Console Error Spam

**Symptoms**: Hundreds of console.error messages during test runs
**Causes**: Error recovery tests generating expected errors

**Resolution**:
```javascript
// Use error suppression utilities
const { testUtils } = require('./utils/errorSuppression');

beforeEach(() => {
  testUtils.suppressErrorLogs([
    /Expected error pattern/,
    /Another expected pattern/
  ]);
});
```

### 3. API Inconsistency Failures

**Symptoms**: Tests expect different response format than implementation provides
**Causes**: Mismatched API expectations between tests and source code

**Resolution**:
1. Standardize all responses to use `{ success: boolean, data?: any, message?: string, errorCode?: string }`
2. Update tests to match standardized API
3. Use response validation utilities

### 4. Performance Test Failures

**Symptoms**: Performance tests fail on different hardware/CI environments
**Causes**: Unrealistic timing expectations

**Resolution**:
```javascript
// Use relative performance measurements
const startTime = Date.now();
performOperation();
const duration = Date.now() - startTime;

// Allow reasonable variance for different environments
expect(duration).toBeLessThan(baselineTime * 2); // 100% variance allowance
```

### 5. Coverage Threshold Failures

**Symptoms**: Tests pass but coverage requirements not met
**Causes**: New code added without corresponding tests

**Resolution**:
```bash
# Generate coverage report to identify gaps
npm test -- --coverage --coverageReporters=html

# Check specific file coverage
npm test -- --coverage --collectCoverageFrom="src/specific/file.js"
```

## Test Execution Commands

### Standard Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern="chessGame"

# Run with verbose output
npm test -- --verbose

# Run with coverage
npm test -- --coverage
```

### Debugging Tests
```bash
# Run with timeout to catch hanging tests
timeout 60s npm test -- --testTimeout=10000

# Run single test file with detailed output
npm test -- --testPathPattern="specific.test.js" --verbose --runInBand

# Run tests and detect open handles
npm test -- --detectOpenHandles --forceExit
```

### Performance Testing
```bash
# Run only performance tests
npm test -- --testPathPattern="performance"

# Run stress tests with extended timeout
npm test -- --testPathPattern="stress" --testTimeout=60000
```

## Adding New Tests

### 1. Determine Test Category
- **Unit Test**: Testing individual methods/functions
- **Integration Test**: Testing component interactions
- **Comprehensive Test**: Testing complete workflows
- **Performance Test**: Testing speed/load characteristics

### 2. Choose Appropriate File
- Add to existing file if related and file size permits
- Create new file if distinct feature or file too large
- Use "part2" naming if extending existing test suite

### 3. Follow Standardized Patterns
```javascript
describe('New Feature', () => {
  let testInstance;

  beforeEach(() => {
    testInstance = createTestInstance();
  });

  describe('specific functionality', () => {
    test('should handle normal case', () => {
      // Test implementation
    });

    test('should handle edge case', () => {
      // Test implementation
    });

    test('should handle error case', () => {
      // Test implementation with error suppression if needed
    });
  });
});
```

### 4. Validate Test Quality
- **Descriptive Names**: Test names should clearly describe the scenario
- **Proper Setup**: Use beforeEach/afterEach for consistent test state
- **Complete Coverage**: Test success, failure, and edge cases
- **Performance Awareness**: Avoid unnecessarily slow operations

## Continuous Integration Considerations

### Test Reliability
- Tests should pass consistently across different environments
- Avoid timing-dependent assertions that may fail on slower systems
- Use proper cleanup to prevent test interference

### Resource Management
- Clean up created resources (files, connections, etc.)
- Use appropriate timeouts for different test types
- Monitor memory usage in long-running test suites

### Error Reporting
- Provide clear, actionable error messages
- Include relevant context in test failures
- Use structured assertions for better debugging

## Test Data Management

### Test Fixtures
```javascript
// Create reusable test data
const TestFixtures = {
  STARTING_POSITION: createStandardBoard(),
  CHECKMATE_POSITION: createCheckmateScenario(),
  COMPLEX_POSITION: createComplexTestPosition()
};
```

### Mock Data Patterns
```javascript
// Consistent mock structure
const mockGameState = {
  board: TestFixtures.STARTING_POSITION,
  currentTurn: 'white',
  status: 'active',
  moveHistory: [],
  // ... other required properties
};
```

## Troubleshooting Checklist

When tests fail or behave unexpectedly:

1. **Check API Usage**: Ensure correct parameter formats
2. **Verify Error Suppression**: Confirm expected errors are properly suppressed
3. **Review Test Isolation**: Ensure tests don't interfere with each other
4. **Validate Test Data**: Confirm test fixtures are correct
5. **Check Timing Issues**: Look for race conditions or timing dependencies
6. **Examine Coverage**: Ensure new code has corresponding tests
7. **Review Console Output**: Look for unexpected errors or warnings

## Best Practices Summary

1. **Use Standardized Patterns**: Follow established test structure and naming
2. **Maintain Test Isolation**: Each test should be independent
3. **Suppress Expected Errors**: Use error suppression utilities appropriately
4. **Write Descriptive Tests**: Test names should clearly indicate purpose
5. **Keep Tests Fast**: Avoid unnecessary delays or complex operations
6. **Validate Thoroughly**: Test success, failure, and edge cases
7. **Document Complex Tests**: Add comments for non-obvious test logic
8. **Regular Maintenance**: Review and update tests as code evolves

This guide should be updated as the test infrastructure evolves and new patterns emerge.