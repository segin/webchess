# Test Coverage Validation Guide

This document explains how to use the comprehensive test coverage validation system implemented for WebChess.

## Overview

The coverage validation system ensures that all chess game logic maintains a minimum of 95% test coverage across statements, branches, functions, and lines. This helps maintain code quality and prevents regressions.

## Coverage Requirements

### Global Thresholds
- **Statements**: 95%
- **Branches**: 95% 
- **Functions**: 95%
- **Lines**: 95%

### File-Specific Thresholds
- **Core Chess Logic** (`chessGame.js`, `gameState.js`, `errorHandler.js`): 95%
- **AI Logic** (`chessAI.js`): 90%
- **Server Components** (`gameManager.js`): 90%
- **Server Entry** (`index.js`): 80%

## Available Commands

### Basic Coverage Commands
```bash
# Run tests with coverage
npm run test:coverage

# Run tests and validate coverage thresholds
npm run test:coverage:validate

# Generate coverage report with validation
npm run test:coverage:report

# Monitor coverage trends
npm run test:coverage:monitor

# Validate existing coverage (without running tests)
npm run coverage:validate

# Monitor coverage trends (without running tests)
npm run coverage:monitor
```

### Development Workflow
```bash
# During development - watch mode with coverage
npm run test:watch

# Before committing - validate coverage
npm run test:coverage:validate

# Check coverage trends
npm run coverage:monitor
```

## Understanding Coverage Reports

### Coverage Validation Output

When you run `npm run coverage:validate`, you'll see:

1. **Global Coverage Status**: Shows overall coverage percentages
2. **Critical Files Status**: Shows coverage for important chess logic files
3. **Actionable Recommendations**: Specific suggestions for improving coverage
4. **Uncovered Code Details**: Lists specific functions, lines, and branches that need tests

### Coverage Report Files

The system generates several coverage reports:

- `coverage/index.html` - Interactive HTML report (open in browser)
- `coverage/lcov.info` - LCOV format for CI/CD integration
- `coverage/coverage-summary.json` - JSON summary for scripts
- `coverage/coverage-final.json` - Detailed coverage data

## Improving Coverage

### Step-by-Step Process

1. **Run Coverage Analysis**
   ```bash
   npm run test:coverage:validate
   ```

2. **Review Recommendations**
   The output will show specific areas needing coverage:
   - Uncovered functions
   - Uncovered branches (if/else conditions)
   - Uncovered lines
   - Uncovered statements

3. **Open HTML Report**
   ```bash
   # Open coverage/index.html in your browser
   open coverage/index.html  # macOS
   xdg-open coverage/index.html  # Linux
   ```

4. **Focus on Red/Yellow Areas**
   - Red = Not covered
   - Yellow = Partially covered
   - Green = Fully covered

5. **Add Tests**
   Write tests that exercise the uncovered code paths

6. **Validate Improvements**
   ```bash
   npm run test:coverage:validate
   ```

### Common Coverage Scenarios

#### Testing Chess Game Logic
```javascript
// Test all piece movement patterns
test('should validate pawn movement', () => {
  const game = new ChessGame();
  
  // Test valid moves
  const validMove = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
  expect(validMove.success).toBe(true);
  
  // Test invalid moves
  const invalidMove = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 3, col: 4 } });
  expect(invalidMove.success).toBe(false);
});
```

#### Testing Error Conditions
```javascript
// Test all error scenarios
test('should handle invalid coordinates', () => {
  const game = new ChessGame();
  
  const result = game.makeMove({ from: { row: -1, col: 0 }, to: { row: 0, col: 0 } });
  expect(result.success).toBe(false);
  expect(result.errorCode).toBe('INVALID_COORDINATES');
});
```

#### Testing Edge Cases
```javascript
// Test boundary conditions
test('should handle board edge cases', () => {
  const game = new ChessGame();
  
  // Test moves at board boundaries
  game.board[0][0] = { type: 'rook', color: 'white' };
  const moves = game.getAllValidMoves('white');
  expect(moves.length).toBeGreaterThan(0);
});
```

## Coverage Monitoring

### Trend Analysis

The system tracks coverage trends over time:

```bash
npm run coverage:monitor
```

This shows:
- Coverage improvements/regressions
- Historical trends
- Performance impact of changes

### Pre-Commit Validation

Set up pre-commit hooks to ensure coverage standards:

```bash
# Add to your git pre-commit hook
node scripts/pre-commit-coverage.js
```

## Configuration

### Jest Configuration

Coverage settings are in `jest.config.js`:
- Thresholds for each file type
- Exclusion patterns
- Report formats

### Coverage Configuration

Detailed settings in `coverage.config.js`:
- File-specific thresholds
- Validation rules
- Recommendation priorities

## Troubleshooting

### Common Issues

1. **"Coverage reports not found"**
   - Run tests with coverage first: `npm run test:coverage`

2. **"Threshold not met" errors**
   - Add tests for the specific files/metrics mentioned
   - Focus on critical files first (chessGame.js, gameState.js, errorHandler.js)

3. **"Invalid regular expression" errors**
   - Check Jest configuration for malformed patterns
   - Ensure exclude patterns use correct syntax

### Getting Help

1. **View Detailed Coverage**
   ```bash
   npm run test:coverage -- --verbose
   ```

2. **Check Specific Files**
   ```bash
   npx jest tests/specificTest.test.js --coverage
   ```

3. **Debug Coverage Issues**
   ```bash
   npm run test:coverage -- --detectOpenHandles --forceExit
   ```

## Best Practices

### Writing Effective Tests

1. **Test All Code Paths**
   - Include positive and negative test cases
   - Test edge cases and boundary conditions
   - Cover all conditional branches

2. **Use Descriptive Test Names**
   ```javascript
   test('should reject pawn move when path is blocked', () => {
     // Test implementation
   });
   ```

3. **Group Related Tests**
   ```javascript
   describe('Pawn Movement Validation', () => {
     test('should allow single square forward move', () => {});
     test('should allow double square move from starting position', () => {});
     test('should reject backward moves', () => {});
   });
   ```

4. **Test Error Scenarios**
   - Always test both success and failure cases
   - Verify error messages and codes
   - Test error recovery mechanisms

### Maintaining Coverage

1. **Regular Monitoring**
   - Check coverage trends weekly
   - Address regressions immediately
   - Set up automated alerts for coverage drops

2. **New Feature Development**
   - Write tests before implementing features (TDD)
   - Ensure new code meets coverage thresholds
   - Update tests when modifying existing code

3. **Code Review Process**
   - Include coverage validation in code reviews
   - Require coverage reports for pull requests
   - Discuss uncovered code paths with team

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Run Tests with Coverage
  run: npm run test:coverage:validate

- name: Upload Coverage Reports
  uses: codecov/codecov-action@v1
  with:
    file: ./coverage/lcov.info
```

### Coverage Badges

Generate coverage badges:
```bash
npm run coverage:monitor
# Check coverage/badge.json for badge URL
```

This comprehensive coverage validation system ensures that the WebChess project maintains high code quality and reliability through thorough testing.