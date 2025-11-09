# Test Utilities Documentation

This directory contains comprehensive test utilities for the WebChess project, providing standardized patterns for testing, mocking, and validation.

## Overview

The test utilities are organized into several modules:

- **testUtils.js** - Main utilities aggregator with common patterns
- **testSetup.js** - Standardized setup and teardown patterns
- **validationUtils.js** - Validation utilities for game states and responses
- **mockingUtils.js** - Comprehensive mocking patterns for WebSocket, HTTP, and dependencies
- **asyncTestUtils.js** - Advanced async testing utilities
- **advancedTestUtils.js** - Specialized utilities for complex testing scenarios
- **ResourceManager.js** - Resource tracking and cleanup management
- **globalSetup.js** / **globalTeardown.js** - Global test environment setup

## Quick Start

### Basic Test Setup

```javascript
const TestUtils = require('./utils/testUtils');

describe('My Test Suite', () => {
  let game;

  // Apply standard test suite setup
  TestUtils.applyStandardSuite({
    suppressErrors: ['Expected error pattern'],
    trackResources: true
  });

  test('should create a game and make a move', () => {
    const game = TestUtils.createStandardGame();
    const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
    
    const response = TestUtils.executeAndValidateMove(game, move, true);
    expect(response.success).toBe(true);
  });
});
```

### Server Testing Setup

```javascript
const { applyTestSuite } = require('./utils/testSetup');
const { mockManager } = require('./utils/mockingUtils');

describe('Server Tests', () => {
  // Apply server-specific setup
  applyTestSuite('server', {
    port: 0, // Use random port
    mockSocketIO: true
  });

  test('should handle WebSocket connections', () => {
    const environment = mockManager.createServerEnvironment();
    
    // Test server functionality
    expect(environment.httpServer).toBeDefined();
    expect(environment.webSocketEnvironment.server).toBeDefined();
  });
});
```

## Core Utilities

### TestUtils (testUtils.js)

The main utilities class that aggregates all testing functionality.

#### Game Creation

```javascript
// Create standard starting position
const game = TestUtils.createStandardGame();

// Create from test position
const game = TestUtils.createFromPosition('CHECKMATE_POSITION');

// Create with move sequence
const moves = [
  { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
  { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }
];
const game = TestUtils.createWithMoveSequence(moves);

// Create custom game
const game = TestUtils.createCustomGame({
  currentTurn: 'black',
  gameStatus: 'check'
});
```

#### Board Manipulation

```javascript
// Create empty board
const board = TestUtils.createEmptyBoard();

// Place pieces
TestUtils.placePiece(board, 0, 4, 'king', 'black');
TestUtils.placePiece(board, 7, 4, 'king', 'white');

// Find pieces
const kings = TestUtils.findPieces(board, 'king', 'white');

// Count pieces
const pawnCount = TestUtils.countPieces(board, 'pawn', 'white');

// Compare boards
const areEqual = TestUtils.boardsEqual(board1, board2);
```

#### Move Testing

```javascript
// Execute and validate move
const response = TestUtils.executeAndValidateMove(
  game, 
  move, 
  true, // expect success
  null  // expected error code if failure
);

// Generate test moves
const validMove = TestUtils.generateValidMove();
const invalidMove = TestUtils.generateInvalidMove();
const malformedMove = TestUtils.generateMalformedMove();
```

#### Async Operations

```javascript
// Wait with proper cleanup
await TestUtils.delay(1000);

// Wait for condition
await TestUtils.waitForCondition(() => game.gameStatus === 'checkmate');

// Execute with timeout
const result = await TestUtils.withTimeout(operation, 5000);

// Parallel execution
const results = await TestUtils.parallel([op1, op2, op3]);
```

### Test Setup Patterns (testSetup.js)

Standardized setup and teardown patterns for different test scenarios.

#### Available Setup Types

- **standard** - Basic game testing setup
- **server** - HTTP server testing setup
- **websocket** - WebSocket testing setup
- **error** - Error handling testing setup
- **performance** - Performance testing setup
- **integration** - Integration testing setup

#### Usage Examples

```javascript
const { createTestSuite, applyTestSuite } = require('./utils/testSetup');

// Manual setup
const suite = createTestSuite('websocket', {
  socketCount: 3,
  suppressErrors: ['Connection error']
});

beforeEach(suite.beforeEach);
afterEach(suite.afterEach);

// Automatic setup
applyTestSuite('server', {
  port: 3001,
  mockSocketIO: true
});
```

#### Custom Setup

```javascript
TestUtils.applyStandardSuite({
  gameFactory: () => TestUtils.createFromPosition('CASTLING_READY'),
  suppressErrors: ['Invalid castling'],
  customSetup: function() {
    this.customData = { test: 'data' };
  },
  customCleanup: async function() {
    // Custom cleanup logic
  }
});
```

### Validation Utilities (validationUtils.js)

Comprehensive validation patterns for game states, moves, and responses.

#### Game State Validation

```javascript
const { GameStateValidator } = require('./utils/validationUtils');

// Validate complete game state
GameStateValidator.validateGameState(gameState, {
  currentTurn: 'white',
  gameStatus: 'active',
  inCheck: false
});

// Validate board structure
GameStateValidator.validateBoard(board);

// Validate piece
GameStateValidator.validatePiece(piece, 'queen', 'white');

// Validate castling rights
GameStateValidator.validateCastlingRights(castlingRights);
```

#### Move Response Validation

```javascript
const { MoveResponseValidator } = require('./utils/validationUtils');

// Validate successful move
MoveResponseValidator.validateSuccessfulMove(response, {
  gameStatus: 'check',
  currentTurn: 'black'
});

// Validate failed move
MoveResponseValidator.validateFailedMove(response, 'INVALID_MOVE', {
  piece: 'pawn',
  from: { row: 6, col: 4 }
});

// Validate game ending
MoveResponseValidator.validateGameEnding(response, 'checkmate', 'white');
```

### Mocking Utilities (mockingUtils.js)

Comprehensive mocking patterns for WebSocket, HTTP, and external dependencies.

#### WebSocket Mocking

```javascript
const { mockManager } = require('./utils/mockingUtils');

// Create WebSocket environment
const wsEnv = mockManager.createWebSocketMocks({
  socketCount: 2,
  serverOptions: { port: 3000 }
});

// Use mocks
const { server, sockets } = wsEnv;
sockets[0].emit('join-game', { gameId: 'TEST01' });

// Simulate events
wsEnv.server._getSocketsInRoom('game-TEST01');
```

#### HTTP Server Mocking

```javascript
const httpServer = mockManager.createHTTPMocks({
  port: 3001,
  host: 'localhost'
});

// Test server lifecycle
httpServer.listen(3001, () => {
  console.log('Mock server listening');
});

// Simulate requests
const req = mockManager.httpMocker.createMockRequest({
  method: 'GET',
  url: '/health'
});

const res = mockManager.httpMocker.createMockResponse();
```

#### External Dependencies

```javascript
const { ExternalDependencyMocker } = require('./utils/mockingUtils');

const mocker = new ExternalDependencyMocker();

// Mock file system
const mockFS = mocker.mockFileSystem({
  files: {
    '/test/file.txt': 'test content'
  }
});

// Mock environment
const restoreEnv = mocker.mockEnvironment({
  NODE_ENV: 'test',
  PORT: '3000'
});

// Mock timers
const timers = mocker.mockTimers({
  advanceTimersAutomatically: true
});
```

### Async Testing (asyncTestUtils.js)

Advanced utilities for testing asynchronous operations.

#### Promise Testing

```javascript
const { PromiseTester } = require('./utils/asyncTestUtils');

// Test promise resolution
await PromiseTester.expectToResolve(promise, expectedValue, 5000);

// Test promise rejection
await PromiseTester.expectToReject(promise, /Expected error/, 5000);

// Test timing
const { result, duration } = await PromiseTester.expectTiming(
  promise, 
  100, // min time
  1000 // max time
);

// Test parallel promises
const results = await PromiseTester.testParallel([p1, p2, p3], {
  expectAllToResolve: true,
  collectTiming: true
});
```

#### Event Testing

```javascript
const { EventTester } = require('./utils/asyncTestUtils');

const eventTester = new EventTester();

// Wait for specific event
const eventData = await eventTester.waitForEvent(
  emitter, 
  'game-ended', 
  5000,
  (data) => data.winner === 'white' // validator
);

// Wait for event sequence
const events = await eventTester.waitForEventSequence(
  emitter,
  ['game-started', 'move-made', 'game-ended'],
  10000
);

// Track all events
const trackedEvents = await eventTester.trackEvents(
  emitter,
  ['move-made', 'player-joined'],
  2000 // track for 2 seconds
);
```

#### Timing and Delays

```javascript
const { TimingTester } = require('./utils/asyncTestUtils');

// Measured delay
await TimingTester.delay(1000);

// Wait for condition
await TimingTester.waitForCondition(
  () => game.gameStatus === 'checkmate',
  { timeout: 5000, interval: 100 }
);

// Measure execution time
const { result, duration } = await TimingTester.measureExecutionTime(
  () => game.makeMove(move)
);

// Test execution time bounds
await TimingTester.expectExecutionTime(
  operation,
  100, // min time
  500, // max time
  ...args
);
```

### Advanced Testing (advancedTestUtils.js)

Specialized utilities for complex testing scenarios.

#### Game State Comparison

```javascript
const { GameStateComparator } = require('./utils/advancedTestUtils');

const differences = GameStateComparator.compareGameStates(state1, state2);

if (!differences.identical) {
  console.log('Board differences:', differences.board);
  console.log('Property differences:', differences.properties);
}
```

#### Move Sequence Testing

```javascript
const { MoveSequenceTester } = require('./utils/advancedTestUtils');

const sequence = [
  {
    move: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
    shouldSucceed: true,
    expectedGameState: { currentTurn: 'black' },
    description: 'White pawn advance'
  },
  {
    move: { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
    shouldSucceed: true,
    expectedGameState: { currentTurn: 'white' },
    description: 'Black pawn advance'
  }
];

const results = MoveSequenceTester.testMoveSequence(game, sequence);
expect(results.success).toBe(true);
```

#### Performance Testing

```javascript
const { PerformanceTester } = require('./utils/advancedTestUtils');

// Measure operation performance
const metrics = await PerformanceTester.measurePerformance(
  () => game.makeMove(move),
  {
    iterations: 100,
    warmupIterations: 10,
    collectMemoryStats: true
  }
);

console.log(`Average time: ${metrics.averageTime}ms`);
console.log(`Max memory: ${metrics.maxMemory} bytes`);

// Benchmark scenarios
const scenarios = [
  {
    name: 'Standard Game',
    gameFactory: () => TestUtils.createStandardGame(),
    operation: (game) => game.makeMove(validMove)
  },
  {
    name: 'Complex Position',
    gameFactory: () => TestUtils.createFromPosition('COMPLEX_POSITION'),
    operation: (game) => game.makeMove(complexMove)
  }
];

const benchmarks = await PerformanceTester.benchmarkScenarios(scenarios);
```

## Best Practices

### Test Structure

1. **Use descriptive test names** that explain the scenario being tested
2. **Group related tests** using `describe` blocks
3. **Apply appropriate setup patterns** based on test type
4. **Clean up resources** properly using the provided utilities

### Error Handling

1. **Suppress expected errors** using error suppression utilities
2. **Test error conditions** explicitly with proper validation
3. **Use error injection** for testing error recovery

### Performance

1. **Track resources** to prevent leaks
2. **Use timeouts** for async operations
3. **Measure performance** for critical operations
4. **Clean up properly** in teardown

### Mocking

1. **Use consistent mocking patterns** from the utilities
2. **Mock external dependencies** to ensure test isolation
3. **Validate mock interactions** where appropriate
4. **Clean up mocks** after tests

## Common Patterns

### Testing Move Validation

```javascript
describe('Pawn Movement', () => {
  TestUtils.applyStandardSuite();

  test('should allow valid pawn moves', () => {
    const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
    const response = TestUtils.executeAndValidateMove(this.game, move, true);
    
    expect(response.data.currentTurn).toBe('black');
    expect(response.data.gameStatus).toBe('active');
  });

  test('should reject invalid pawn moves', () => {
    const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 5 } }; // diagonal without capture
    const response = TestUtils.executeAndValidateMove(
      this.game, 
      move, 
      false, 
      'INVALID_MOVEMENT'
    );
  });
});
```

### Testing Server Endpoints

```javascript
describe('Server Endpoints', () => {
  applyTestSuite('server');

  test('should respond to health check', async () => {
    const req = this.mockHTTP.createMockRequest({ url: '/health' });
    const res = this.mockHTTP.createMockResponse();
    
    await handleHealthCheck(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toContain('OK');
  });
});
```

### Testing WebSocket Events

```javascript
describe('WebSocket Game Events', () => {
  applyTestSuite('websocket');

  test('should handle game join events', async () => {
    const { EventTester } = require('./utils/asyncTestUtils');
    const eventTester = new EventTester();
    
    // Simulate join event
    this.mockSocket._triggerEvent('join-game', { gameId: 'TEST01' });
    
    // Wait for response
    const response = await eventTester.waitForEvent(
      this.mockSocket,
      'game-joined',
      1000
    );
    
    expect(response.gameId).toBe('TEST01');
  });
});
```

## Troubleshooting

### Common Issues

1. **Resource Leaks**: Ensure you're using the provided setup/teardown utilities
2. **Timing Issues**: Use proper async utilities and timeouts
3. **Mock Cleanup**: Use the MockManager for consistent cleanup
4. **Error Suppression**: Suppress expected errors to avoid noise in test output

### Debugging

1. **Enable verbose logging** in test utilities
2. **Use performance metrics** to identify slow tests
3. **Track resource usage** to identify leaks
4. **Validate test data** using the validation utilities

For more specific examples, see the individual test files in the `tests/` directory.