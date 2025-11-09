# Test Utilities Best Practices Guide

This guide outlines best practices for using the WebChess test utilities effectively and maintaining high-quality, reliable tests.

## General Testing Principles

### 1. Test Structure and Organization

**DO:**
```javascript
describe('ChessGame - Pawn Movement', () => {
  TestUtils.applyStandardSuite();

  describe('Valid Moves', () => {
    test('should allow single square forward move', () => {
      // Test implementation
    });

    test('should allow double square move from starting position', () => {
      // Test implementation
    });
  });

  describe('Invalid Moves', () => {
    test('should reject backward movement', () => {
      // Test implementation
    });
  });
});
```

**DON'T:**
```javascript
describe('Tests', () => {
  test('pawn moves and other stuff', () => {
    // Testing multiple unrelated things
  });
});
```

### 2. Test Naming

**DO:**
- Use descriptive names that explain the scenario
- Follow the pattern: "should [expected behavior] when [condition]"
- Be specific about the test case

**DON'T:**
- Use vague names like "test1" or "basic test"
- Mix multiple scenarios in one test name

### 3. Setup and Teardown

**DO:**
```javascript
describe('My Test Suite', () => {
  // Use appropriate setup pattern
  TestUtils.applyStandardSuite({
    suppressErrors: ['Expected error pattern'],
    trackResources: true
  });

  test('my test', () => {
    // Test uses this.game automatically
    const response = this.game.makeMove(validMove);
    expect(response.success).toBe(true);
  });
});
```

**DON'T:**
```javascript
describe('My Test Suite', () => {
  let game;
  
  beforeEach(() => {
    game = new ChessGame(); // Manual setup without cleanup
  });
  
  // No afterEach cleanup - potential resource leaks
});
```

## Specific Utility Usage

### 1. Game State Testing

**DO:**
```javascript
test('should update game state correctly', () => {
  const game = TestUtils.createStandardGame();
  const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
  
  const response = TestUtils.executeAndValidateMove(game, move, true);
  
  // Use validation utilities
  TestUtils.AssertionPatterns.validateSuccessfulMove(response);
  
  const gameState = game.getGameState();
  TestUtils.AssertionPatterns.validateGameState(gameState);
  
  expect(gameState.currentTurn).toBe('black');
});
```

**DON'T:**
```javascript
test('should update game state correctly', () => {
  const game = new ChessGame();
  const response = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
  
  // Manual validation without utilities
  expect(response).toBeDefined();
  expect(response.success).toBe(true);
  // ... lots of manual validation
});
```

### 2. Error Testing

**DO:**
```javascript
describe('Error Handling', () => {
  TestUtils.applyStandardSuite({
    suppressErrors: ['Invalid move', 'Wrong turn', 'No piece found']
  });

  test('should handle invalid moves gracefully', () => {
    const invalidMove = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } };
    
    const response = TestUtils.executeAndValidateMove(
      this.game, 
      invalidMove, 
      false, 
      'INVALID_MOVEMENT'
    );
    
    expect(response.details.piece).toBe('pawn');
    expect(response.details.reason).toContain('invalid');
  });
});
```

**DON'T:**
```javascript
test('should handle errors', () => {
  const game = new ChessGame();
  
  // No error suppression - console noise
  const response = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 3, col: 4 } });
  
  // Minimal validation
  expect(response.success).toBe(false);
});
```

### 3. Async Testing

**DO:**
```javascript
test('should handle async operations correctly', async () => {
  const asyncOperation = () => {
    return new Promise(resolve => {
      setTimeout(() => {
        const game = TestUtils.createStandardGame();
        resolve(game.getGameState());
      }, 100);
    });
  };

  const result = await PromiseTester.expectToResolve(
    asyncOperation(),
    undefined,
    1000
  );
  
  expect(result.gameStatus).toBe('active');
});
```

**DON'T:**
```javascript
test('should handle async operations', async () => {
  const result = await new Promise(resolve => {
    setTimeout(() => {
      const game = new ChessGame();
      resolve(game.getGameState());
    }, 100);
  });
  
  // No timeout handling, no proper async utilities
  expect(result.gameStatus).toBe('active');
});
```

### 4. Mocking

**DO:**
```javascript
describe('Server Tests', () => {
  applyTestSuite('server');

  test('should handle WebSocket connections', () => {
    const wsEnv = mockManager.createWebSocketMocks({
      socketCount: 2
    });
    
    const { server, sockets } = wsEnv;
    
    // Use mock utilities
    sockets[0].join('test-room');
    server.to('test-room').emit('test-event', { data: 'test' });
    
    expect(sockets[0].emit).toHaveBeenCalledWith('test-event', { data: 'test' });
  });
});
```

**DON'T:**
```javascript
test('should handle WebSocket connections', () => {
  // Manual mock creation without utilities
  const mockSocket = {
    emit: jest.fn(),
    on: jest.fn(),
    join: jest.fn()
  };
  
  // No cleanup, inconsistent patterns
});
```

## Performance Best Practices

### 1. Resource Management

**DO:**
```javascript
describe('Performance Tests', () => {
  TestUtils.applyStandardSuite({ trackResources: true });

  test('should complete operations within time limit', async () => {
    const operation = () => {
      const game = TestUtils.createStandardGame();
      return game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
    };

    const { result, duration } = await TimingTester.expectExecutionTime(
      operation,
      0,    // min time
      100   // max time
    );

    expect(result.success).toBe(true);
  });
});
```

**DON'T:**
```javascript
test('should be fast', async () => {
  const start = Date.now();
  
  const game = new ChessGame();
  game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
  
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(100);
  
  // No resource cleanup, manual timing
});
```

### 2. Memory Usage

**DO:**
```javascript
test('should not leak memory', async () => {
  const operation = () => {
    const games = [];
    for (let i = 0; i < 100; i++) {
      games.push(TestUtils.createStandardGame());
    }
    return games.length;
  };

  const metrics = await PerformanceTester.measurePerformance(operation, {
    iterations: 5,
    collectMemoryStats: true
  });

  expect(metrics.maxMemory).toBeLessThan(10 * 1024 * 1024); // 10MB limit
});
```

**DON'T:**
```javascript
test('should create many games', () => {
  const games = [];
  for (let i = 0; i < 1000; i++) {
    games.push(new ChessGame());
  }
  
  // No memory monitoring, potential leak
  expect(games.length).toBe(1000);
});
```

## Error Handling Best Practices

### 1. Error Suppression

**DO:**
```javascript
describe('Error Scenarios', () => {
  TestUtils.applyStandardSuite({
    suppressErrors: [
      'Invalid move',
      'Wrong turn',
      'Game not active',
      /CRITICAL ERROR/,  // Regex patterns supported
      'System error'
    ]
  });

  test('should handle system errors', () => {
    // Test error conditions without console noise
  });
});
```

**DON'T:**
```javascript
describe('Error Scenarios', () => {
  test('should handle errors', () => {
    // No error suppression - lots of console noise
    const response = game.makeMove(invalidMove);
    expect(response.success).toBe(false);
  });
});
```

### 2. Error Validation

**DO:**
```javascript
test('should provide detailed error information', () => {
  const response = TestUtils.executeAndValidateMove(
    this.game,
    invalidMove,
    false,
    'INVALID_MOVEMENT'
  );

  // Validate error structure
  expect(response.details).toBeDefined();
  expect(response.details.piece).toBeDefined();
  expect(response.details.from).toBeDefined();
  expect(response.details.to).toBeDefined();
  expect(response.details.reason).toBeDefined();
});
```

**DON'T:**
```javascript
test('should fail for invalid move', () => {
  const response = game.makeMove(invalidMove);
  expect(response.success).toBe(false);
  // No validation of error details
});
```

## Testing Patterns

### 1. Move Sequence Testing

**DO:**
```javascript
test('should execute Scholar\'s Mate correctly', () => {
  const sequence = [
    {
      move: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
      shouldSucceed: true,
      expectedGameState: { currentTurn: 'black' },
      description: 'e4'
    },
    // ... more moves
  ];

  const results = MoveSequenceTester.testMoveSequence(this.game, sequence);
  expect(results.success).toBe(true);
});
```

**DON'T:**
```javascript
test('should play Scholar\'s Mate', () => {
  game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
  game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
  // ... manual sequence without validation
});
```

### 2. State Comparison

**DO:**
```javascript
test('should maintain state consistency', () => {
  const initialState = this.game.getGameState();
  const stateCopy = TestUtils.BoardUtils.copyBoard(initialState.board);
  
  // Make invalid move
  const response = this.game.makeMove(invalidMove);
  expect(response.success).toBe(false);
  
  // Verify state unchanged
  const currentState = this.game.getGameState();
  expect(TestUtils.BoardUtils.boardsEqual(currentState.board, stateCopy)).toBe(true);
});
```

**DON'T:**
```javascript
test('should not change state on invalid move', () => {
  const response = game.makeMove(invalidMove);
  expect(response.success).toBe(false);
  // No actual state verification
});
```

## Common Pitfalls to Avoid

### 1. Resource Leaks

**AVOID:**
- Creating timers without tracking them
- Opening connections without closing them
- Creating mocks without cleanup
- Not using the provided setup/teardown utilities

### 2. Flaky Tests

**AVOID:**
- Hard-coded timeouts without proper async utilities
- Race conditions in async tests
- Depending on external state
- Not cleaning up between tests

### 3. Poor Error Handling

**AVOID:**
- Not suppressing expected errors
- Not validating error responses properly
- Ignoring error details
- Not testing error recovery

### 4. Performance Issues

**AVOID:**
- Creating unnecessary objects in loops
- Not monitoring memory usage
- Running expensive operations without timeouts
- Not using performance utilities for measurement

## Code Review Checklist

When reviewing tests, check for:

- [ ] Appropriate test setup pattern used
- [ ] Error suppression configured for expected errors
- [ ] Proper use of validation utilities
- [ ] Resource cleanup handled automatically
- [ ] Descriptive test names and structure
- [ ] Async operations handled with proper utilities
- [ ] Mocks created using standard patterns
- [ ] Performance considerations addressed
- [ ] Error cases tested with proper validation
- [ ] State consistency verified where appropriate

## Migration Guide

### From Manual Setup to Utilities

**Before:**
```javascript
describe('My Tests', () => {
  let game;
  
  beforeEach(() => {
    game = new ChessGame();
  });
  
  afterEach(() => {
    // Manual cleanup
  });
});
```

**After:**
```javascript
describe('My Tests', () => {
  TestUtils.applyStandardSuite();
  
  test('my test', () => {
    // Use this.game automatically
  });
});
```

### From Manual Validation to Utilities

**Before:**
```javascript
const response = game.makeMove(move);
expect(response).toBeDefined();
expect(response.success).toBe(true);
expect(response.data).toBeDefined();
// ... lots of manual validation
```

**After:**
```javascript
const response = TestUtils.executeAndValidateMove(game, move, true);
// Validation handled automatically
```

### From Manual Mocking to Utilities

**Before:**
```javascript
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  join: jest.fn()
};
```

**After:**
```javascript
const wsEnv = mockManager.createWebSocketMocks();
const socket = wsEnv.sockets[0];
```

Following these best practices will result in more reliable, maintainable, and efficient tests that properly utilize the comprehensive test utilities provided.