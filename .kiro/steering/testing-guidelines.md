# Testing Guidelines for WebChess

## Testing Philosophy

### Test-Driven Development
- Write tests before implementing features when possible
- Use tests to define expected behavior and edge cases
- Maintain high test coverage (target: 95%+)
- Tests should serve as living documentation

### Testing Pyramid
1. **Unit Tests** (70%): Test individual functions and methods
2. **Integration Tests** (20%): Test component interactions
3. **End-to-End Tests** (10%): Test complete user workflows

## Unit Testing Standards

### Test Structure
```javascript
describe('ComponentName', () => {
  let instance;

  beforeEach(() => {
    instance = new ComponentName();
  });

  describe('methodName', () => {
    test('should handle normal case', () => {
      // Arrange
      const input = validInput;
      
      // Act
      const result = instance.methodName(input);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedOutput);
    });

    test('should handle error case', () => {
      // Test error scenarios
    });
  });
});
```

### Chess Game Testing Requirements

#### Move Validation Tests
- **Valid Moves**: Test all legal moves for each piece type
- **Invalid Moves**: Test illegal moves and boundary conditions
- **Edge Cases**: Board edges, piece interactions, special positions
- **Error Handling**: Malformed input, invalid coordinates, wrong turn

#### Piece-Specific Test Cases

**Pawn Tests:**
- Forward movement (1 and 2 squares from start)
- Diagonal captures
- En passant capture and setup
- Promotion to all piece types
- Blocked movement scenarios

**Knight Tests:**
- All 8 possible L-shaped moves
- Jumping over pieces
- Boundary conditions at board edges
- Invalid non-L-shaped moves

**Rook Tests:**
- Horizontal and vertical movement
- Path obstruction scenarios
- Capture mechanics
- Invalid diagonal moves

**Bishop Tests:**
- Diagonal movement in all 4 directions
- Path obstruction scenarios
- Staying on same color squares
- Invalid non-diagonal moves

**Queen Tests:**
- Combined rook and bishop movement
- Path obstruction in all directions
- Long-range movement validation

**King Tests:**
- Single-square movement in all directions
- Cannot move into check
- Boundary conditions
- Invalid multi-square moves

#### Special Move Tests

**Castling Tests:**
- Valid kingside and queenside castling
- King has moved (invalid)
- Rook has moved (invalid)
- Path blocked (invalid)
- King in check (invalid)
- Moving through check (invalid)
- Ending in check (invalid)

**En Passant Tests:**
- Valid en passant setup and execution
- Target square tracking
- Immediate execution requirement
- Invalid en passant attempts

#### Game State Tests

**Check Detection:**
- Check from all piece types
- Multiple check scenarios
- Check resolution validation

**Checkmate Detection:**
- Basic checkmate patterns
- Complex checkmate scenarios
- False checkmate detection

**Stalemate Detection:**
- King with no legal moves (not in check)
- All pieces pinned scenarios
- False stalemate detection

## Integration Testing

### Game Flow Tests
- Complete game from start to checkmate
- Game state consistency across moves
- Turn alternation validation
- Move history accuracy

### Multiplayer Tests
- Two-player game creation and joining
- Move synchronization between players
- Disconnection and reconnection handling
- Chat functionality integration

### Server-Client Integration
- WebSocket event handling
- Game state synchronization
- Error propagation from server to client
- Session persistence validation

## Test Data Management

### Test Positions
Create reusable test positions for common scenarios:

```javascript
const TestPositions = {
  STARTING_POSITION: /* standard starting board */,
  CHECKMATE_POSITION: /* known checkmate scenario */,
  STALEMATE_POSITION: /* known stalemate scenario */,
  CASTLING_READY: /* position ready for castling */,
  EN_PASSANT_SETUP: /* position for en passant test */
};
```

### Move Sequences
Define common move sequences for testing:

```javascript
const TestSequences = {
  SCHOLARS_MATE: [
    { from: {row: 6, col: 4}, to: {row: 4, col: 4} },
    { from: {row: 1, col: 4}, to: {row: 3, col: 4} },
    // ... complete sequence
  ]
};
```

## Performance Testing

### Move Validation Performance
- Measure time for move validation
- Test with complex board positions
- Ensure consistent performance across game states

### Memory Usage Testing
- Monitor memory usage during long games
- Test for memory leaks in game cleanup
- Validate efficient data structure usage

### Load Testing
- Multiple concurrent games
- High-frequency move validation
- Server resource utilization

## Modular Testing Approach

### Module-Specific Testing
- **ChessGame**: Core game orchestration and move execution
- **GameStateManager**: State tracking, validation, and consistency
- **Move Validators**: Piece-specific movement validation
- **Check Detection**: King safety and check/checkmate logic
- **Special Moves**: Castling, en passant, and pawn promotion

### Integration Testing
- Module interaction testing
- Complete game flow validation
- State consistency across modules
- Error propagation between components

## Test Execution

### Standard Testing Command
- **All testing should be done via `npm test`** - This runs the complete test suite
- Tests are automatically discovered and run by Jest
- Use `npm run test:watch` for development with auto-rerun on file changes
- No manual browser testing needed - all tests run in Node.js environment

### Test Automation

#### Continuous Integration
- Run all tests on every commit
- Fail builds on test failures
- Generate test coverage reports
- Performance regression detection

#### Test Categories
- **Unit Tests**: Individual module and function testing
- **Integration Tests**: Component interaction testing
- **Game Flow Tests**: Complete chess game scenarios
- **State Management Tests**: Game state consistency validation

## Test Documentation

### Test Case Documentation
- Document complex test scenarios
- Explain chess positions used in tests
- Maintain test data explanations
- Update tests when rules change

### Coverage Reports
- Generate HTML coverage reports
- Track coverage trends over time
- Identify untested code paths
- Set minimum coverage thresholds

## Debugging Test Failures

### Test Failure Analysis
- Isolate failing test cases
- Use descriptive assertion messages
- Log intermediate values for debugging
- Reproduce failures locally

### Chess-Specific Debugging
- Visualize board positions in test output
- Log move sequences leading to failures
- Validate game state consistency
- Check rule implementation against FIDE standards

## Mock and Stub Guidelines

### When to Mock
- External dependencies (WebSocket connections)
- Time-dependent functionality
- Random number generation
- File system operations

### Chess Game Mocking
- Mock opponent moves for AI testing
- Stub random game ID generation
- Mock network delays for timing tests
- Simulate disconnection scenarios