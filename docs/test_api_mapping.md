# Test API Normalization Mapping

## Summary of Required Changes

### 1. Property Name Mappings

| Current Test Usage | Should Use Instead | Reason |
|-------------------|-------------------|---------|
| `gameState.status` | `gameState.gameStatus` | Legacy property, use current implementation |
| `result.isValid` | `result.success` | Redundant property, standardize on success |
| `result.error` | `result.message` | Consistent with current error handler |

### 2. Response Structure Standardization

#### Success Response (Current Implementation)
```javascript
{
  success: true,
  isValid: true,        // ← Remove usage of this
  message: string,
  errorCode: null,
  data: object
}
```

#### Error Response (Current Implementation)
```javascript
{
  success: false,
  isValid: false,       // ← Remove usage of this
  message: string,
  errorCode: string,
  details: object
}
```

### 3. testUtils Functions Requiring Updates

#### tests/helpers/testPatterns.js
```javascript
// CURRENT (INCORRECT)
validateGameState(gameState) {
  expect(gameState.status).toBeDefined();
  expect(['active', 'check', 'checkmate', 'stalemate', 'draw']).toContain(gameState.status);
}

// SHOULD BE
validateGameState(gameState) {
  expect(gameState.gameStatus).toBeDefined();
  expect(['active', 'check', 'checkmate', 'stalemate', 'draw']).toContain(gameState.gameStatus);
}
```

#### tests/utils/errorSuppression.js
```javascript
// CURRENT (CORRECT - keep as is)
validateSuccessResponse(response) {
  expect(response.success).toBe(true);
  expect(response.errorCode).toBeNull();
}

validateErrorResponse(response) {
  expect(response.success).toBe(false);
  expect(response.errorCode).toBeDefined();
}
```

## File-by-File Analysis

### tests/chessGame.test.js
**Issues Found:**
- Line 25: `expect(gameState.status).toBe('active');` → should be `gameState.gameStatus`
- Line 391: `expect(gameState.status).toBe('checkmate');` → should be `gameState.gameStatus`
- Line 405: `expect(gameState.status).toBe('stalemate');` → should be `gameState.gameStatus`
- Line 440: `expect(state.status).toBe('active');` → should be `state.gameStatus`

**Required Changes:**
1. Replace all `gameState.status` with `gameState.gameStatus`
2. Replace all `state.status` with `state.gameStatus`

### tests/pawnMovement.test.js
**Issues Found:**
- Uses `testUtils.validateSuccessResponse()` and `testUtils.validateErrorResponse()` - these should be correct
- Need to verify all response validations use `result.success` not `result.isValid`

**Required Changes:**
1. Ensure all move validations use `result.success`
2. Verify error code expectations match current implementation

### tests/specialMovesIntegration.test.js
**Issues Found:**
- Line 19: `expect(result.success).toBe(true);` ✓ CORRECT
- Line 68: `expect(result.isValid).toBe(false);` → should be `result.success`
- Line 84: `expect(result.isValid).toBe(false);` → should be `result.success`
- Line 99: `expect(result.isValid).toBe(false);` → should be `result.success`
- Line 168: `expect(result.isValid).toBe(false);` → should be `result.success`
- Line 181: `expect(result.isValid).toBe(false);` → should be `result.success`
- Line 271: `expect(result.isValid).toBe(false);` → should be `result.success`
- Line 286: `expect(result.isValid).toBe(false);` → should be `result.success`

**Required Changes:**
1. Replace all `result.isValid` with `result.success`
2. Update boolean expectations accordingly (false → false for errors)

### tests/boundaryConditionsComprehensive.test.js
**Issues Found:**
- Line 26: `expect(result.isValid).toBe(false);` → should be `result.success`
- Line 45: `expect(result.isValid).toBe(false);` → should be `result.success`
- Line 70: `expect(result.isValid).toBe(false);` → should be `result.success`
- Line 88: `expect(result.isValid).toBe(true);` → should be `result.success`
- Line 106: `expect(result.isValid).toBe(true);` → should be `result.success`
- Line 119: `expect(result.isValid).toBe(true);` → should be `result.success`
- Line 141: `expect(result.isValid).toBe(true);` → should be `result.success`
- Line 182: `expect(result.isValid).toBe(true);` → should be `result.success`
- Line 196: `expect(result.isValid).toBe(true);` → should be `result.success`
- Line 208: `expect(result.isValid).toBe(true);` → should be `result.success`
- Line 234: `expect(result.isValid).toBe(true);` → should be `result.success`

**Required Changes:**
1. Replace all `result.isValid` with `result.success`

### tests/gameFlow.test.js
**Issues Found:**
- Line 38: `expect(game.status).toBe('checkmate');` → should be `game.gameStatus`
- Line 57: `expect(game.status).toBe('checkmate');` → should be `game.gameStatus`
- Line 83: `expect(game.status).toBe('active');` → should be `game.gameStatus`
- Line 183: `expect(checkmateGame.status).toBe('checkmate');` → should be `checkmateGame.gameStatus`
- Line 197: `expect(stalemateGame.status).toBe('stalemate');` → should be `stalemateGame.gameStatus`
- Line 208: `expect(drawGame.status).toBe('draw');` → should be `drawGame.gameStatus`
- Line 213: `expect(game.status).toBe('active');` → should be `game.gameStatus`
- Line 227: `expect(checkGame.status).toBe('check');` → should be `checkGame.gameStatus`
- Line 234: `expect(checkGame.status).toBe('active');` → should be `checkGame.gameStatus`
- Line 364: `expect(tacticalGame.status).toBe('check');` → should be `tacticalGame.gameStatus`
- Line 391: `expect(endgame.status).toBe('active');` → should be `endgame.gameStatus`

**Required Changes:**
1. Replace all `game.status` with `game.gameStatus`
2. Replace all `[gameInstance].status` with `[gameInstance].gameStatus`

## Error Code Validation

### Current Error Codes (from errorHandler.js)
All tests should validate against these standardized error codes:

#### Format Errors
- `MALFORMED_MOVE`
- `INVALID_FORMAT`
- `MISSING_REQUIRED_FIELD`

#### Coordinate Errors
- `INVALID_COORDINATES`
- `OUT_OF_BOUNDS`
- `SAME_SQUARE`

#### Piece Errors
- `NO_PIECE`
- `INVALID_PIECE`
- `INVALID_PIECE_TYPE`
- `INVALID_PIECE_COLOR`
- `WRONG_TURN`

#### Movement Errors
- `INVALID_MOVE`
- `INVALID_MOVEMENT`
- `UNKNOWN_PIECE_TYPE`

#### Path Errors
- `PATH_BLOCKED`

#### Rule Errors
- `CAPTURE_OWN_PIECE`
- `INVALID_CASTLING`
- `INVALID_PROMOTION`
- `INVALID_EN_PASSANT`
- `INVALID_EN_PASSANT_TARGET`

#### Check/Checkmate Errors
- `KING_IN_CHECK`
- `PINNED_PIECE_INVALID_MOVE`
- `DOUBLE_CHECK_KING_ONLY`
- `CHECK_NOT_RESOLVED`

#### Game State Errors
- `GAME_NOT_ACTIVE`
- `INVALID_STATUS`
- `INVALID_STATUS_TRANSITION`

#### System Errors
- `SYSTEM_ERROR`
- `VALIDATION_FAILURE`
- `STATE_CORRUPTION`

## Test Data Updates Required

### tests/helpers/testData.js
**Current ERROR_CODES object needs verification:**
```javascript
ERROR_CODES: {
  INVALID_COORDINATES: 'INVALID_COORDINATES',  // ✓ CORRECT
  NO_PIECE: 'NO_PIECE',                        // ✓ CORRECT
  WRONG_TURN: 'WRONG_TURN',                    // ✓ CORRECT
  INVALID_MOVE: 'INVALID_MOVE',                // ✓ CORRECT
  INVALID_MOVEMENT: 'INVALID_MOVEMENT',        // ✓ CORRECT
  INVALID_CASTLING: 'INVALID_CASTLING',        // ✓ CORRECT
  KING_IN_CHECK: 'KING_IN_CHECK',              // ✓ CORRECT
  PINNED_PIECE_INVALID_MOVE: 'PINNED_PIECE_INVALID_MOVE', // ✓ CORRECT
  PATH_BLOCKED: 'PATH_BLOCKED',                // ✓ CORRECT
  GAME_OVER: 'GAME_OVER'                       // ← CHECK: Should be GAME_NOT_ACTIVE?
}
```

**Potential Updates:**
- Verify `GAME_OVER` should be `GAME_NOT_ACTIVE`
- Add missing error codes if needed

## Systematic Update Pattern

### For Each Test File:

1. **Property Name Updates:**
   ```javascript
   // FIND AND REPLACE
   gameState.status → gameState.gameStatus
   game.status → game.gameStatus
   state.status → state.gameStatus
   ```

2. **Response Validation Updates:**
   ```javascript
   // FIND AND REPLACE
   result.isValid → result.success
   response.isValid → response.success
   ```

3. **Error Message Validation:**
   ```javascript
   // ENSURE CONSISTENT PATTERN
   expect(result.success).toBe(false);
   expect(result.errorCode).toBe('EXPECTED_ERROR_CODE');
   expect(result.message).toBeDefined();
   ```

4. **Success Response Validation:**
   ```javascript
   // ENSURE CONSISTENT PATTERN
   expect(result.success).toBe(true);
   expect(result.errorCode).toBeNull();
   expect(result.data).toBeDefined();
   ```

This mapping provides the specific changes needed for each identified inconsistency across all test files.