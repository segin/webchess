# Guidelines for Writing New WebChess Tests

## Overview

This document provides comprehensive guidelines for writing new tests in the WebChess project. All guidelines are based on the normalized patterns established across 60+ existing test files and ensure consistency, reliability, and maintainability.

## Table of Contents

1. [Quick Start Checklist](#quick-start-checklist)
2. [Test File Structure](#test-file-structure)
3. [API Usage Guidelines](#api-usage-guidelines)
4. [Common Patterns](#common-patterns)
5. [Testing Different Components](#testing-different-components)
6. [Best Practices](#best-practices)
7. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
8. [Code Review Checklist](#code-review-checklist)

## Quick Start Checklist

Before writing any new test, ensure you:

- [ ] Use `new ChessGame()` constructor directly (no testUtils needed)
- [ ] Validate `result.success` as primary success indicator
- [ ] Access game state using `game.gameStatus` (not `game.status`)
- [ ] Use current error codes from the standardized list
- [ ] Follow the established file naming convention
- [ ] Include proper test documentation header
- [ ] Use descriptive test names that explain the scenario

## Test File Structure

### Standard File Template

```javascript
/**
 * [Component] [Aspect] Tests
 * [Brief description of what this test file covers]
 * 
 * This test file follows normalized API patterns:
 * - Uses current makeMove API with {from, to, promotion} object format
 * - Validates responses using current success/error structure
 * - Accesses game state using current property names (gameStatus, currentTurn, etc.)
 * - Uses current error codes and message formats
 * - [Any component-specific notes]
 */

const ChessGame = require('../src/shared/chessGame');

describe('[Component] - [Aspect]', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame(); // Always use direct constructor
  });

  describe('[Sub-component or specific functionality]', () => {
    test('should [expected behavior] when [condition]', () => {
      // Arrange
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      
      // Act
      const result = game.makeMove(move);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data.gameStatus).toBe('active');
      expect(game.currentTurn).toBe('black');
    });

    test('should [expected error behavior] when [error condition]', () => {
      // Arrange
      const invalidMove = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } };
      
      // Act
      const result = game.makeMove(invalidMove);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_MOVEMENT');
      expect(result.message).toContain('cannot move');
    });
  });
});
```

### File Naming Convention

```
[component][Aspect].test.js
```

Examples:
- `pawnMovement.test.js`
- `castlingValidation.test.js`
- `errorHandlingComprehensive.test.js`
- `gameStateManagement.test.js`

### Documentation Header Requirements

Every test file must include:

1. **Title**: Clear component and aspect being tested
2. **Description**: Brief explanation of test coverage
3. **Normalization Note**: Standard comment about API patterns
4. **Specific Notes**: Any component-specific testing considerations

## API Usage Guidelines

### ✅ Correct API Usage

#### Game Creation
```javascript
// ✅ CORRECT
const game = new ChessGame();

// ❌ WRONG - Don't use testUtils for basic game creation
const game = testUtils.createFreshGame();
```

#### Move Execution
```javascript
// ✅ CORRECT - Current move format
const move = { 
  from: { row: 6, col: 4 }, 
  to: { row: 5, col: 4 },
  promotion: 'queen' // Optional
};
const result = game.makeMove(move);

// ❌ WRONG - Old parameter format
const result = game.makeMove({ row: 6, col: 4 }, { row: 5, col: 4 });
```

#### Response Validation
```javascript
// ✅ CORRECT - Validate both success indicators
expect(result.success).toBe(true);
expect(result.isValid).toBe(true);
expect(result.errorCode).toBeNull();
expect(result.message).toBeDefined();

// ❌ WRONG - Only validate isValid
expect(result.isValid).toBe(true);
```

#### Game State Access
```javascript
// ✅ CORRECT - Current property names
expect(game.gameStatus).toBe('active');
expect(game.currentTurn).toBe('white');
expect(game.inCheck).toBe(false);

// ❌ WRONG - Old property names
expect(game.status).toBe('active');
expect(game.turn).toBe('white');
```

#### Error Handling
```javascript
// ✅ CORRECT - Specific error codes
expect(result.success).toBe(false);
expect(result.errorCode).toBe('INVALID_MOVEMENT');
expect(result.message).toContain('cannot move');

// ❌ WRONG - Generic error checking
expect(result.success).toBe(false);
expect(result.error).toBeDefined();
```

### Current Error Codes Reference

Use these standardized error codes:

```javascript
// Format errors
'MALFORMED_MOVE'           // Move object format incorrect
'INVALID_FORMAT'           // Move format incorrect
'MISSING_REQUIRED_FIELD'   // Required move information missing

// Coordinate errors
'INVALID_COORDINATES'      // Invalid board coordinates
'OUT_OF_BOUNDS'           // Move goes outside board
'SAME_SQUARE'             // Source and destination same

// Piece errors
'NO_PIECE'                // No piece at source square
'INVALID_PIECE'           // Invalid piece data
'WRONG_TURN'              // Not player's turn

// Movement errors
'INVALID_MOVEMENT'        // Invalid piece movement pattern
'PATH_BLOCKED'            // Path blocked by other pieces
'CAPTURE_OWN_PIECE'       // Cannot capture own piece

// Special move errors
'INVALID_CASTLING'        // Castling not allowed
'INVALID_PROMOTION'       // Invalid promotion piece
'INVALID_EN_PASSANT'      // En passant not valid

// Check/checkmate errors
'KING_IN_CHECK'           // Move would put king in check
'CHECK_NOT_RESOLVED'      // Move doesn't resolve check

// Game state errors
'GAME_NOT_ACTIVE'         // Game is not active
'SYSTEM_ERROR'            // System error occurred
```

## Common Patterns

### Basic Move Test Pattern

```javascript
test('should allow valid [piece] [movement type]', () => {
  // Arrange
  const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
  
  // Act
  const result = game.makeMove(move);
  
  // Assert - Response validation
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
  expect(result.data.gameStatus).toBe('active');
  
  // Assert - Game state validation
  expect(game.currentTurn).toBe('black');
  expect(game.board[5][4]).toEqual({ type: 'pawn', color: 'white' });
  expect(game.board[6][4]).toBeNull();
});
```

### Error Test Pattern

```javascript
test('should reject [invalid action] with [specific error]', () => {
  // Arrange
  const invalidMove = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } };
  
  // Act
  const result = game.makeMove(invalidMove);
  
  // Assert - Error response validation
  expect(result.success).toBe(false);
  expect(result.errorCode).toBe('INVALID_MOVEMENT');
  expect(result.message).toContain('cannot move');
  
  // Assert - Game state unchanged
  expect(game.currentTurn).toBe('white');
  expect(game.gameStatus).toBe('active');
  expect(game.moveHistory).toHaveLength(0);
});
```

### Game State Validation Pattern

```javascript
test('should maintain correct game state after [action]', () => {
  // Arrange & Act
  const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
  
  // Assert - Complete state validation
  expect(result.success).toBe(true);
  
  const gameState = game.getGameState();
  expect(gameState.currentTurn).toBe('black');
  expect(gameState.gameStatus).toBe('active');
  expect(gameState.moveHistory).toHaveLength(1);
  expect(gameState.inCheck).toBe(false);
  
  // Validate move history entry
  const lastMove = gameState.moveHistory[0];
  expect(lastMove.from).toEqual({ row: 6, col: 4 });
  expect(lastMove.to).toEqual({ row: 5, col: 4 });
  expect(lastMove.piece).toBe('pawn');
  expect(lastMove.color).toBe('white');
});
```

### Special Move Pattern

```javascript
test('should handle [special move type] correctly', () => {
  // Arrange - Set up special move conditions
  // ... setup code ...
  
  // Act
  const result = game.makeMove(specialMove);
  
  // Assert - Special move validation
  expect(result.success).toBe(true);
  expect(result.data.specialMove).toBeDefined();
  expect(result.data.specialMove.type).toBe('castling'); // or 'enPassant', 'promotion'
  
  // Assert - Specific special move effects
  // ... validate special move results ...
});
```

## Testing Different Components

### Piece Movement Tests

```javascript
describe('Piece Movement - [Piece Type]', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Valid Movements', () => {
    test('should allow [specific movement pattern]', () => {
      // Test valid movements for this piece type
    });
  });

  describe('Invalid Movements', () => {
    test('should reject [specific invalid pattern]', () => {
      // Test invalid movements for this piece type
    });
  });

  describe('Boundary Conditions', () => {
    test('should handle [edge case scenario]', () => {
      // Test edge cases and boundary conditions
    });
  });
});
```

### Game State Tests

```javascript
describe('Game State - [Aspect]', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should initialize [state aspect] correctly', () => {
    const gameState = game.getGameState();
    // Validate initial state
  });

  test('should update [state aspect] after [action]', () => {
    // Perform action
    // Validate state changes
  });

  test('should maintain [state aspect] consistency', () => {
    // Test state consistency across multiple operations
  });
});
```

### Error Handling Tests

```javascript
describe('Error Handling - [Error Category]', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should handle [specific error type]', () => {
    const result = game.makeMove(invalidMove);
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('SPECIFIC_ERROR_CODE');
    expect(result.message).toContain('expected error text');
    expect(result.details).toBeDefined();
  });

  test('should maintain game state after [error type]', () => {
    const initialState = game.getGameState();
    
    game.makeMove(invalidMove); // Should fail
    
    const currentState = game.getGameState();
    expect(currentState.currentTurn).toBe(initialState.currentTurn);
    expect(currentState.gameStatus).toBe(initialState.gameStatus);
    expect(currentState.moveHistory).toHaveLength(0);
  });
});
```

### Integration Tests

```javascript
describe('Integration - [Component Interaction]', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should handle [complex scenario] end-to-end', () => {
    // Execute sequence of operations
    // Validate final state and all intermediate states
  });

  test('should maintain consistency across [multiple operations]', () => {
    // Test consistency across complex interactions
  });
});
```

## Best Practices

### 1. Test Organization

```javascript
// ✅ GOOD - Clear hierarchy and grouping
describe('Pawn Movement - Basic Moves', () => {
  describe('Single Square Movement', () => {
    test('should allow forward move from any file', () => {});
    test('should reject backward movement', () => {});
  });
  
  describe('Two Square Initial Movement', () => {
    test('should allow from starting position', () => {});
    test('should reject from non-starting position', () => {});
  });
});

// ❌ BAD - Flat structure without clear grouping
describe('Pawn Tests', () => {
  test('pawn move 1', () => {});
  test('pawn move 2', () => {});
  test('pawn error 1', () => {});
});
```

### 2. Test Naming

```javascript
// ✅ GOOD - Descriptive names explaining scenario
test('should allow single square forward move from starting position', () => {});
test('should reject three square move as invalid pawn movement', () => {});
test('should set en passant target after two square pawn move', () => {});

// ❌ BAD - Vague or unclear names
test('pawn move works', () => {});
test('invalid move', () => {});
test('test 1', () => {});
```

### 3. Assertion Organization

```javascript
// ✅ GOOD - Grouped and commented assertions
test('should handle successful move completely', () => {
  const result = game.makeMove(move);
  
  // Response validation
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
  
  // Game state validation
  expect(game.currentTurn).toBe('black');
  expect(game.gameStatus).toBe('active');
  
  // Board state validation
  expect(game.board[5][4]).toEqual({ type: 'pawn', color: 'white' });
  expect(game.board[6][4]).toBeNull();
});

// ❌ BAD - Unorganized assertions
test('move test', () => {
  const result = game.makeMove(move);
  expect(result.success).toBe(true);
  expect(game.board[6][4]).toBeNull();
  expect(result.data).toBeDefined();
  expect(game.currentTurn).toBe('black');
});
```

### 4. Test Data Management

```javascript
// ✅ GOOD - Clear, reusable test data
const validPawnMoves = [
  { from: { row: 6, col: 0 }, to: { row: 5, col: 0 } },
  { from: { row: 6, col: 1 }, to: { row: 5, col: 1 } },
  { from: { row: 6, col: 2 }, to: { row: 5, col: 2 } }
];

validPawnMoves.forEach((move, index) => {
  test(`should allow single square move from file ${index}`, () => {
    const result = game.makeMove(move);
    expect(result.success).toBe(true);
  });
});

// ❌ BAD - Hardcoded, repeated test data
test('move from a file', () => {
  const result = game.makeMove({ from: { row: 6, col: 0 }, to: { row: 5, col: 0 } });
  expect(result.success).toBe(true);
});
test('move from b file', () => {
  const result = game.makeMove({ from: { row: 6, col: 1 }, to: { row: 5, col: 1 } });
  expect(result.success).toBe(true);
});
```

### 5. Error Testing

```javascript
// ✅ GOOD - Comprehensive error validation
test('should reject invalid coordinates with specific error', () => {
  const move = { from: { row: -1, col: 4 }, to: { row: 5, col: 4 } };
  const result = game.makeMove(move);
  
  expect(result.success).toBe(false);
  expect(result.errorCode).toBe('INVALID_COORDINATES');
  expect(result.message).toContain('Invalid coordinates');
  expect(result.details).toBeDefined();
  expect(result.details.from).toEqual({ row: -1, col: 4 });
});

// ❌ BAD - Minimal error validation
test('invalid coordinates fail', () => {
  const result = game.makeMove({ from: { row: -1, col: 4 }, to: { row: 5, col: 4 } });
  expect(result.success).toBe(false);
});
```

## Common Mistakes to Avoid

### 1. Using Old API Patterns

```javascript
// ❌ WRONG - Old property names
expect(game.status).toBe('active');
expect(game.turn).toBe('white');
expect(result.isValid).toBe(true); // Without success validation

// ✅ CORRECT - Current property names
expect(game.gameStatus).toBe('active');
expect(game.currentTurn).toBe('white');
expect(result.success).toBe(true);
expect(result.isValid).toBe(true);
```

### 2. Incomplete Response Validation

```javascript
// ❌ WRONG - Minimal validation
expect(result.success).toBe(true);

// ✅ CORRECT - Complete validation
expect(result.success).toBe(true);
expect(result.isValid).toBe(true);
expect(result.errorCode).toBeNull();
expect(result.message).toBeDefined();
expect(result.data).toBeDefined();
```

### 3. Generic Error Expectations

```javascript
// ❌ WRONG - Generic error checking
expect(result.success).toBe(false);
expect(result.error).toBeDefined();

// ✅ CORRECT - Specific error validation
expect(result.success).toBe(false);
expect(result.errorCode).toBe('INVALID_MOVEMENT');
expect(result.message).toContain('cannot move');
```

### 4. Missing Game State Validation

```javascript
// ❌ WRONG - Only validate response
const result = game.makeMove(move);
expect(result.success).toBe(true);

// ✅ CORRECT - Validate response and game state
const result = game.makeMove(move);
expect(result.success).toBe(true);
expect(game.currentTurn).toBe('black');
expect(game.gameStatus).toBe('active');
expect(game.board[5][4]).toEqual({ type: 'pawn', color: 'white' });
```

### 5. Inconsistent Test Structure

```javascript
// ❌ WRONG - Inconsistent structure
describe('Tests', () => {
  test('some test', () => {
    // No clear arrange/act/assert
    const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
    expect(result.success).toBe(true);
  });
});

// ✅ CORRECT - Clear structure
describe('Pawn Movement - Basic Moves', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should allow single square forward move', () => {
    // Arrange
    const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
    
    // Act
    const result = game.makeMove(move);
    
    // Assert
    expect(result.success).toBe(true);
  });
});
```

## Code Review Checklist

When reviewing new tests, check for:

### API Usage
- [ ] Uses `new ChessGame()` constructor directly
- [ ] Validates `result.success` as primary indicator
- [ ] Uses current property names (`gameStatus`, `currentTurn`, etc.)
- [ ] Uses specific error codes from standardized list
- [ ] Follows current move object format `{from, to, promotion?}`

### Test Structure
- [ ] Includes proper documentation header
- [ ] Uses descriptive test and describe block names
- [ ] Follows arrange/act/assert pattern
- [ ] Groups related tests logically

### Validation Completeness
- [ ] Validates both response structure and game state
- [ ] Uses specific error codes and messages
- [ ] Checks game state consistency after operations
- [ ] Validates board state changes appropriately

### Code Quality
- [ ] No hardcoded magic numbers or unclear constants
- [ ] Reusable test data where appropriate
- [ ] Clear variable names and comments
- [ ] Consistent formatting and style

### Coverage
- [ ] Tests both success and failure scenarios
- [ ] Includes edge cases and boundary conditions
- [ ] Validates error recovery and state consistency
- [ ] Tests component integration where relevant

## Example Review Comments

### Good Examples
```
✅ "Great use of current API patterns and comprehensive validation"
✅ "Clear test structure with good arrange/act/assert separation"
✅ "Excellent error handling with specific error codes"
```

### Issues to Address
```
❌ "Please use game.gameStatus instead of game.status"
❌ "Missing validation of result.success - add alongside result.isValid"
❌ "Error test should check for specific error code, not just success: false"
❌ "Test name should be more descriptive - explain the scenario being tested"
```

Following these guidelines ensures that all new tests maintain the high quality and consistency established across the WebChess test suite.