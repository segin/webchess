# Test Troubleshooting Guide for WebChess

## Quick Reference for Common Issues

### 🚨 Emergency Commands

```bash
# Kill hanging test processes
pkill -f "npm test" || pkill -f "jest"

# Run tests with timeout to prevent infinite hangs
timeout 60s npm test

# Run single test file to isolate issues
npm test -- --testPathPattern="specificFile.test.js" --runInBand
```

## Issue Categories and Solutions

### 1. Infinite Loops and Hanging Tests

#### Symptoms
- Tests run for hours without completing
- High CPU usage with no progress
- Process must be manually killed

#### Common Causes
- **Incorrect API Usage**: Using wrong parameter format for methods
- **While Loop Issues**: Loops without proper exit conditions
- **Recursive Functions**: Missing base cases

#### Diagnostic Steps
```bash
# Identify which test is hanging
timeout 30s npm test -- --verbose --runInBand

# Check for problematic while loops
grep -r "while.*(" src/

# Look for infinite recursion patterns
grep -r "function.*{.*this\." src/
```

#### Solutions
1. **Fix API Calls**:
   ```javascript
   // Correct
   game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
   
   // Incorrect (causes issues)
   game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
   ```

2. **Add Loop Safety**:
   ```javascript
   let stepCount = 0;
   const maxSteps = 8;
   while (condition && stepCount < maxSteps) {
     // loop body
     stepCount++;
   }
   ```

### 2. Console Error Spam

#### Symptoms
- Hundreds of console.error messages during test runs
- Test output cluttered with expected error messages
- Difficult to identify genuine issues

#### Common Causes
- Error recovery tests generating expected console errors
- Missing error suppression in test setup

#### Solutions
```javascript
const { testUtils } = require('./utils/errorSuppression');

describe('Error Recovery Tests', () => {
  beforeEach(() => {
    testUtils.suppressErrorLogs([
      /WRONG_TURN/,
      /PATH_BLOCKED/,
      /INVALID_MOVEMENT/,
      /CAPTURE_OWN_PIECE/,
      /INVALID_CASTLING/
    ]);
  });

  afterEach(() => {
    testUtils.restoreErrorLogs();
  });
});
```

### 3. API Response Inconsistencies

#### Symptoms
- Tests expect different response format than implementation provides
- Assertion failures on response structure
- Inconsistent success/error handling

#### Common Patterns
```javascript
// Expected format
{
  success: boolean,
  data?: any,
  message?: string,
  errorCode?: string
}

// Fix inconsistent responses
function gameMethod() {
  try {
    const result = performOperation();
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      errorCode: 'ERROR_CODE'
    };
  }
}
```

### 4. Performance Test Failures

#### Symptoms
- Performance tests fail on different hardware
- Timing assertions fail in CI/CD environments
- Inconsistent performance measurements

#### Solutions
```javascript
// Use relative measurements with reasonable variance
const startTime = Date.now();
performOperation();
const duration = Date.now() - startTime;

// Allow 100% variance for different environments
const expectedTime = 1000; // 1 second baseline
expect(duration).toBeLessThan(expectedTime * 2);

// Or use statistical approaches
const measurements = [];
for (let i = 0; i < 5; i++) {
  const start = Date.now();
  performOperation();
  measurements.push(Date.now() - start);
}
const averageTime = measurements.reduce((a, b) => a + b) / measurements.length;
expect(averageTime).toBeLessThan(expectedTime);
```

### 5. Coverage Threshold Failures

#### Symptoms
- Tests pass but coverage requirements not met
- New code added without corresponding tests
- Coverage drops below required thresholds

#### Diagnostic Commands
```bash
# Generate detailed coverage report
npm test -- --coverage --coverageReporters=html

# Check specific file coverage
npm test -- --coverage --collectCoverageFrom="src/specific/file.js"

# View coverage summary
npm test -- --coverage --coverageReporters=text-summary
```

#### Solutions
1. **Identify Uncovered Code**: Use HTML coverage report to find gaps
2. **Add Missing Tests**: Create tests for uncovered functions/branches
3. **Adjust Thresholds**: If appropriate, modify coverage requirements in `jest.config.js`

### 6. Memory Leaks and Resource Issues

#### Symptoms
- Tests slow down over time
- Memory usage continuously increases
- "Out of memory" errors in long test runs

#### Diagnostic Steps
```bash
# Run tests with memory monitoring
npm test -- --detectOpenHandles --forceExit

# Check for resource leaks
npm test -- --verbose --runInBand
```

#### Solutions
```javascript
// Proper cleanup in tests
afterEach(() => {
  // Clean up resources
  testUtils.restoreErrorLogs();
  game = null;
  // Close connections, clear timers, etc.
});

// Avoid creating large objects in loops
// Use object pooling for frequently created objects
```

### 7. Test Isolation Issues

#### Symptoms
- Tests pass individually but fail when run together
- Order-dependent test failures
- Shared state causing interference

#### Solutions
```javascript
// Ensure proper test isolation
beforeEach(() => {
  // Create fresh instances for each test
  game = new ChessGame();
  gameState = new GameStateManager();
});

afterEach(() => {
  // Clean up any shared state
  game = null;
  gameState = null;
});

// Avoid global variables or shared mutable state
```

## Debugging Strategies

### 1. Isolate the Problem

```bash
# Run single test file
npm test -- --testPathPattern="problematic.test.js"

# Run specific test case
npm test -- --testNamePattern="specific test name"

# Run with minimal output
npm test -- --silent --testPathPattern="target.test.js"
```

### 2. Add Debugging Information

```javascript
// Temporary debugging in tests
test('should handle complex scenario', () => {
  console.log('Test state before:', game.getState());
  const result = game.performAction();
  console.log('Result:', result);
  console.log('Test state after:', game.getState());
  
  expect(result.success).toBe(true);
});
```

### 3. Use Jest Debugging Features

```bash
# Run with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand --testPathPattern="target.test.js"

# Run with verbose output
npm test -- --verbose --testPathPattern="target.test.js"
```

## Environment-Specific Issues

### CI/CD Environment Problems

#### Common Issues
- Different timing characteristics
- Limited resources
- Different Node.js versions

#### Solutions
```javascript
// Detect CI environment
const isCI = process.env.CI === 'true';

// Adjust timeouts for CI
const timeout = isCI ? 30000 : 10000;
jest.setTimeout(timeout);

// Skip resource-intensive tests in CI if needed
const skipInCI = isCI ? test.skip : test;
skipInCI('resource intensive test', () => {
  // test implementation
});
```

### Local Development Issues

#### Common Issues
- Port conflicts
- File system permissions
- Local configuration differences

#### Solutions
```bash
# Check for port conflicts
lsof -i :8080

# Ensure proper permissions
chmod +x scripts/test-*.js

# Clear Jest cache
npm test -- --clearCache
```

## Performance Optimization

### Test Execution Speed

```javascript
// Use beforeAll for expensive setup when possible
describe('Expensive Setup Tests', () => {
  let expensiveResource;
  
  beforeAll(async () => {
    expensiveResource = await createExpensiveResource();
  });
  
  afterAll(async () => {
    await cleanupExpensiveResource(expensiveResource);
  });
});

// Avoid unnecessary async operations
test('synchronous test', () => {
  // Don't use async/await if not needed
  const result = synchronousOperation();
  expect(result).toBe(expected);
});
```

### Memory Usage Optimization

```javascript
// Clear large objects after use
afterEach(() => {
  largeTestData = null;
  complexGameState = null;
});

// Use object pooling for frequently created objects
const objectPool = [];
function getTestObject() {
  return objectPool.pop() || createNewTestObject();
}
function returnTestObject(obj) {
  resetObject(obj);
  objectPool.push(obj);
}
```

## Monitoring and Alerting

### Test Health Metrics

```bash
# Monitor test execution time
npm test -- --verbose | grep "Time:"

# Track test count changes
npm test -- --passWithNoTests --verbose | grep "Tests:"

# Monitor coverage trends
npm test -- --coverage --coverageReporters=json-summary
```

### Automated Checks

```javascript
// Add test health checks
describe('Test Infrastructure Health', () => {
  test('should have reasonable test execution time', () => {
    const startTime = Date.now();
    // Run representative test operations
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // 5 second max
  });
  
  test('should not have memory leaks', () => {
    const initialMemory = process.memoryUsage().heapUsed;
    // Perform test operations
    global.gc && global.gc(); // Force garbage collection if available
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB max increase
  });
});
```

## Emergency Procedures

### When Tests Are Completely Broken

1. **Identify Last Working State**:
   ```bash
   git log --oneline --grep="test"
   git checkout <last-working-commit>
   npm test
   ```

2. **Isolate the Problem**:
   ```bash
   # Test each category separately
   npm test -- --testPathPattern="unit"
   npm test -- --testPathPattern="integration"
   npm test -- --testPathPattern="comprehensive"
   ```

3. **Restore Functionality**:
   ```bash
   # Reset test configuration
   git checkout HEAD -- jest.config.js
   git checkout HEAD -- tests/setup.js
   
   # Clear all caches
   npm test -- --clearCache
   rm -rf node_modules/.cache
   ```

### When CI/CD Pipeline Fails

1. **Check Environment Differences**:
   ```bash
   # Compare Node.js versions
   node --version
   npm --version
   
   # Check available memory
   free -h
   
   # Verify test timeouts
   grep -r "timeout" jest.config.js
   ```

2. **Adjust for CI Environment**:
   ```javascript
   // In jest.config.js
   module.exports = {
     testTimeout: process.env.CI ? 60000 : 30000,
     maxWorkers: process.env.CI ? 2 : '50%',
     // ... other config
   };
   ```

This troubleshooting guide should help quickly identify and resolve common test issues. Keep it updated as new problems and solutions are discovered.