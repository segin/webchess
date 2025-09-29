# WebChess Normalized Test Patterns Documentation

## Overview

This document provides comprehensive guidelines for writing tests that follow the current WebChess API patterns. All 60+ test files have been normalized to use these standardized patterns, ensuring consistent and reliable test validation across the entire test suite.

## Table of Contents

1. [Current API Structure](#current-api-structure)
2. [Response Validation Patterns](#response-validation-patterns)
3. [Game State Access Patterns](#game-state-access-patterns)
4. [Move Execution Patterns](#move-execution-patterns)
5. [Error Handling Patterns](#error-handling-patterns)
6. [Test Structure Standards](#test-structure-standards)
7. [Common Test Utilities](#common-test-utilities)
8. [Migration Guide](#migration-guide)
9. [Examples and Best Practices](#examples-and-best-practices)

## Current API Structure

### Response Structure

All game operations return responses in this standardized format:

#### Success Response
```javascript
{
  success: true,           // Boolean indicating operation success
  isValid: true,          // Boolean for backward compatibility
  message: "Move successful", // Human-readable success message
  errorCode: null,        // Always null for successful operations
  data: {                 // Operation-specific data
    from: { row: 6, col: 4 },
    to: { row: 5, col: 4 },
    piece: { type: 'pawn', color: 'white' },
    gameStatus: 'active',
    currentTurn: 'black',
    // ... additional move data
  },
  metadata: {             // Optional metadata
    moveNumber: 1,
    timestamp: 1234567890
  }
}
```

#### Error Response
```javascript
{
  success: false,         // Boolean indicating operation failure
  isValid: false,        // Boolean for backward compatibility
  message: "Invalid move", // Human-readable error message
  errorCode: "INVALID_MOVEMENT", // Specific error code
  details: {             // Error-specific details
    from: { row: 6, col: 4 },
    to: { row: 3, col: 4 },
    reason: "Pawns cannot move 3 squares"
  }
}
```

### Game State Properties

The current game state uses these property names:

```javascript
{
  board: Array[8][8],           // 8x8 board with pieces or null
  currentTurn: 'white'|'black', // Current player's turn
  gameStatus: 'active'|'check'|'checkmate'|'stalemate'|'draw', // Game status
  winner: 'white'|'black'|null, // Winner (null for active/draw games)
  moveHistory: Array,           // Complete move history
  castlingRights: {             // Castling availability
    white: { kingside: boolean, queenside: boolean },
    black: { kingside: boolean, queenside: boolean }
  },
  enPassantTarget: {row, col}|null, // En passant target square
  inCheck: boolean,             // Whether current player is in check
  checkDetails: Object|null     // Details about check condition
}
```

## Response Validation Patterns

### Success Response Validation

```javascript
// Standard success validation
function validateSuccessResponse(response) {
  expect(response).toBeDefined();
  expect(response.success).toBe(true);
  expect(response.isValid).toBe(true);
  expect(response.errorCode).toBeNull();
  expect(response.message).toBeDefined();
  expect(typeof response.message).toBe('string');
  expect(response.data).toBeDefined();
}

// Usage in tests
test('should allow valid pawn move', () => {
  const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
  validateSuccessResponse(result);
  expect(result.data.gameStatus).toBe('active');
  expect(result.data.currentTurn).toBe('black');
});
```

### Error Response Validation

```javascript
// Standard error validation
function validateErrorResponse(response, expectedErrorCode = null) {
  expect(response).toBeDefined();
  expect(response.success).toBe(false);
  expect(response.isValid).toBe(false);
  expect(response.errorCode).toBeDefined();
  expect(response.message).toBeDefined();
  expect(typeof response.message).toBe('string');
  expect(response.message.length).toBeGreaterThan(0);
  
  if (expectedErrorCode) {
    expect(response.errorCode).toBe(expectedErrorCode);
  }
}

// Usage in tests
test('should reject invalid pawn move', () => {
  const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 3, col: 4 } });
  validateErrorResponse(result, 'INVALID_MOVEMENT');
  expect(result.message).toContain('cannot move');
});
```

## Game State Access Patterns

### Current Property Names

**✅ CORRECT - Use these property names:**
```javascript
// Game state access
expect(game.gameStatus).toBe('active');        // NOT game.status
expect(game.currentTurn).toBe('white');        // NOT game.turn
expect(game.inCheck).toBe(false);              // Boolean check status
expect(game.winner).toBeNull();                // Winner property
expect(game.moveHistory).toHaveLength(0);      // Move history array
expect(game.castlingRights.white.kingside).toBe(true); // Castling rights
expect(game.enPassantTarget).toBeNull();       // En passant target

// Response data access
expect(result.data.gameStatus).toBe('active'); // NOT result.data.status
expect(result.data.currentTurn).toBe('black'); // Current turn from response
```

**❌ INCORRECT - Avoid these old patterns:**
```javascript
// OLD PATTERNS - DO NOT USE
expect(game.status).toBe('active');            // Wrong property name
expect(result.isValid).toBe(true);             // Use result.success instead
expect(result.error).toBeDefined();            // Use result.message instead
expect(result.errorCode).toBe('ERROR');        // Use specific error codes
```

### Game State Validation

```javascript
// Complete game state validation
function validateGameState(gameState) {
  expect(gameState).toBeDefined();
  expect(gameState.board).toBeDefined();
  expect(Array.isArray(gameState.board)).toBe(true);
  expect(gameState.board).toHaveLength(8);
  
  // Current API property names
  expect(gameState.currentTurn).toBeDefined();
  expect(['white', 'black']).toContain(gameState.currentTurn);
  expect(gameState.gameStatus).toBeDefined();
  expect(['active', 'check', 'checkmate', 'stalemate', 'draw']).toContain(gameState.gameStatus);
  
  expect(gameState.moveHistory).toBeDefined();
  expect(Array.isArray(gameState.moveHistory)).toBe(true);
  expect(gameState.castlingRights).toBeDefined();
  expect(typeof gameState.inCheck).toBe('boolean');
}
```

## Move Execution Patterns

### Standard Move Format

```javascript
// Current move object format
const move = {
  from: { row: 6, col: 4 },    // Source coordinates
  to: { row: 5, col: 4 },      // Destination coordinates
  promotion: 'queen'           // Optional: for pawn promotion
};

// Execute move using current API
const result = game.makeMove(move);
```

### Move Validation Test Pattern

```javascript
describe('Piece Movement', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame(); // Direct constructor call
  });

  test('should allow valid move', () => {
    const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
    const result = game.makeMove(move);
    
    // Validate response structure
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    // Validate game state updates
    expect(game.currentTurn).toBe('black');
    expect(game.gameStatus).toBe('active');
    expect(game.board[5][4]).toEqual({ type: 'pawn', color: 'white' });
    expect(game.board[6][4]).toBeNull();
  });

  test('should reject invalid move', () => {
    const move = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } };
    const result = game.makeMove(move);
    
    // Validate error response
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_MOVEMENT');
    expect(result.message).toContain('cannot move');
    
    // Validate game state unchanged
    expect(game.currentTurn).toBe('white');
    expect(game.gameStatus).toBe('active');
  });
});
```

## Error Handling Patterns

### Current Error Codes

The system uses these standardized error codes:

```javascript
// Format errors
'MALFORMED_MOVE'           // Move object format is incorrect
'INVALID_FORMAT'           // Move format is incorrect
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

### Error Testing Pattern

```javascript
describe('Error Handling', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should handle invalid coordinates', () => {
    const move = { from: { row: -1, col: 4 }, to: { row: 5, col: 4 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_COORDINATES');
    expect(result.message).toContain('Invalid coordinates');
    expect(result.details).toBeDefined();
  });

  test('should handle no piece at source', () => {
    const move = { from: { row: 4, col: 4 }, to: { row: 5, col: 4 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('NO_PIECE');
    expect(result.message).toContain('No piece at source square');
  });
});
```

## Test Structure Standards

### Standard Test File Structure

```javascript
/**
 * [Component] [Aspect] Tests
 * [Brief description of what this test file covers]
 * 
 * This test file has been normalized to use current API patterns:
 * - Uses current makeMove API with {from, to, promotion} object format
 * - Validates responses using current success/error structure
 * - Accesses game state using current property names
 * - Uses current error codes and message formats
 */

const ChessGame = require('../src/shared/chessGame');

describe('[Component] - [Aspect]', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame(); // Direct constructor - no testUtils needed
  });

  describe('[Sub-component]', () => {
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
  });
});
```

### Naming Conventions

```javascript
// Test file naming
'[component][Aspect].test.js'           // e.g., 'pawnMovement.test.js'

// Describe block naming
'[Component] - [Aspect]'                // e.g., 'Pawn Movement - Basic Moves'

// Test naming
'should [expected behavior] when [condition]'
// e.g., 'should allow single square move when path is clear'
```

## Common Test Utilities

### Available Test Utilities

The global `testUtils` object provides these normalized utilities:

```javascript
// Game creation
testUtils.createFreshGame()             // Create new ChessGame instance

// Response validation
testUtils.validateSuccessResponse(result)
testUtils.validateErrorResponse(result, expectedCode)

// Game state validation
testUtils.validateGameState(gameState)
testUtils.validateBoardPosition(board, row, col, expectedPiece)
testUtils.validateCastlingRights(castlingRights)

// Move execution helpers
testUtils.ExecutionHelpers.testMove(game, move, shouldSucceed, expectedErrorCode)
testUtils.ExecutionHelpers.executeMovesSequence(game, moves)
testUtils.ExecutionHelpers.testMoveWithStateValidation(game, move, expectedState)

// Test data generators
testUtils.TestPositions.STARTING_POSITION()
testUtils.TestPositions.KINGS_ONLY()
testUtils.TestPositions.CASTLING_READY_KINGSIDE()
testUtils.TestSequences.SCHOLARS_MATE
```

### Using Test Utilities

```javascript
describe('Using Test Utilities', () => {
  let game;

  beforeEach(() => {
    game = testUtils.createFreshGame();
  });

  test('should validate move with utilities', () => {
    const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
    
    // Use utility for move testing
    const result = testUtils.ExecutionHelpers.testMove(game, move, true);
    
    // Use utility for state validation
    testUtils.validateGameState(game.getGameState());
    
    // Use utility for board validation
    testUtils.validateBoardPosition(game.board, 5, 4, { type: 'pawn', color: 'white' });
  });
});
```

## Migration Guide

### From Old API to Current API

#### Property Name Changes

| Old Pattern | Current Pattern | Notes |
|-------------|----------------|-------|
| `game.status` | `game.gameStatus` | Game status property |
| `result.isValid` | `result.success` | Primary success indicator |
| `result.error` | `result.message` | Error message property |
| `game.turn` | `game.currentTurn` | Current player property |

#### Response Structure Changes

```javascript
// OLD PATTERN - Don't use
if (result.isValid) {
  // Handle success
} else {
  console.log(result.error);
}

// CURRENT PATTERN - Use this
if (result.success) {
  // Handle success
  expect(result.data).toBeDefined();
} else {
  // Handle error
  expect(result.errorCode).toBeDefined();
  expect(result.message).toBeDefined();
}
```

#### Method Call Changes

```javascript
// OLD PATTERN - Don't use
const isValid = game.isValidMove(move);
const status = game.getStatus();

// CURRENT PATTERN - Use this
const result = game.makeMove(move);
const status = game.gameStatus;
```

### Updating Existing Tests

1. **Update property access:**
   ```javascript
   // Change this:
   expect(game.status).toBe('active');
   
   // To this:
   expect(game.gameStatus).toBe('active');
   ```

2. **Update response validation:**
   ```javascript
   // Change this:
   expect(result.isValid).toBe(true);
   
   // To this:
   expect(result.success).toBe(true);
   expect(result.isValid).toBe(true); // Keep for compatibility
   ```

3. **Update error handling:**
   ```javascript
   // Change this:
   expect(result.error).toContain('Invalid');
   
   // To this:
   expect(result.message).toContain('Invalid');
   expect(result.errorCode).toBeDefined();
   ```

## Examples and Best Practices

### Complete Test Example

```javascript
/**
 * Pawn Movement Tests
 * Comprehensive tests for pawn movement patterns
 * 
 * Normalized to use current API patterns
 */

const ChessGame = require('../src/shared/chessGame');

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
    
    // Assert - Response validation
    expect(result.success).toBe(true);
    expect(result.isValid).toBe(true);
    expect(result.errorCode).toBeNull();
    expect(result.message).toBeDefined();
    expect(result.data).toBeDefined();
    
    // Assert - Game state validation
    expect(result.data.gameStatus).toBe('active');
    expect(result.data.currentTurn).toBe('black');
    expect(game.currentTurn).toBe('black');
    expect(game.gameStatus).toBe('active');
    
    // Assert - Board state validation
    expect(game.board[5][4]).toEqual({ type: 'pawn', color: 'white' });
    expect(game.board[6][4]).toBeNull();
  });

  test('should allow two square initial move', () => {
    const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
    const result = game.makeMove(move);
    
    testUtils.validateSuccessResponse(result);
    expect(result.data.gameStatus).toBe('active');
    expect(game.enPassantTarget).toEqual({ row: 5, col: 4 });
  });

  test('should reject invalid three square move', () => {
    const move = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_MOVEMENT');
    expect(result.message).toContain('cannot move');
    
    // Verify game state unchanged
    expect(game.currentTurn).toBe('white');
    expect(game.gameStatus).toBe('active');
  });
});
```

### Special Move Testing

```javascript
describe('Castling Tests', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
    // Set up castling position
    game.board[7][1] = null; // Clear knight
    game.board[7][2] = null; // Clear bishop
    game.board[7][3] = null; // Clear queen
  });

  test('should allow kingside castling', () => {
    const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
    const result = game.makeMove(move);
    
    // Validate castling response
    expect(result.success).toBe(true);
    expect(result.data.specialMove).toBeDefined();
    expect(result.data.specialMove.type).toBe('castling');
    
    // Validate final positions
    expect(game.board[7][6]).toEqual({ type: 'king', color: 'white' });
    expect(game.board[7][5]).toEqual({ type: 'rook', color: 'white' });
    expect(game.board[7][4]).toBeNull();
    expect(game.board[7][7]).toBeNull();
    
    // Validate castling rights updated
    expect(game.castlingRights.white.kingside).toBe(false);
    expect(game.castlingRights.white.queenside).toBe(false);
  });
});
```

### Error Handling Best Practices

```javascript
describe('Error Handling Best Practices', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should provide specific error for blocked path', () => {
    // Don't move pawn first - path is blocked
    const move = { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('PATH_BLOCKED');
    expect(result.message).toContain('blocked');
    expect(result.details).toBeDefined();
    expect(result.details.from).toEqual({ row: 7, col: 1 });
    expect(result.details.to).toEqual({ row: 5, col: 2 });
  });

  test('should handle malformed move object', () => {
    const move = { from: { row: 6 }, to: { row: 5, col: 4 } }; // Missing col
    const result = game.makeMove(move);
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MALFORMED_MOVE');
    expect(result.message).toContain('format');
  });
});
```

## Best Practices Summary

### ✅ DO

1. **Use current property names:**
   - `gameStatus` instead of `status`
   - `currentTurn` instead of `turn`
   - `success` as primary success indicator

2. **Validate both success and error responses:**
   ```javascript
   expect(result.success).toBe(true);
   expect(result.isValid).toBe(true);
   expect(result.errorCode).toBeNull();
   ```

3. **Use specific error codes:**
   ```javascript
   expect(result.errorCode).toBe('INVALID_MOVEMENT');
   ```

4. **Test game state consistency:**
   ```javascript
   expect(game.currentTurn).toBe('black');
   expect(result.data.currentTurn).toBe('black');
   ```

5. **Use test utilities for common operations:**
   ```javascript
   testUtils.validateSuccessResponse(result);
   testUtils.validateGameState(game.getGameState());
   ```

### ❌ DON'T

1. **Don't use old property names:**
   ```javascript
   // Wrong:
   expect(game.status).toBe('active');
   
   // Right:
   expect(game.gameStatus).toBe('active');
   ```

2. **Don't rely only on isValid:**
   ```javascript
   // Wrong:
   expect(result.isValid).toBe(true);
   
   // Right:
   expect(result.success).toBe(true);
   expect(result.isValid).toBe(true);
   ```

3. **Don't use generic error expectations:**
   ```javascript
   // Wrong:
   expect(result.success).toBe(false);
   
   // Right:
   expect(result.success).toBe(false);
   expect(result.errorCode).toBe('SPECIFIC_ERROR_CODE');
   ```

This documentation ensures that all future tests will follow the normalized patterns established across the 60+ test files in the WebChess project.