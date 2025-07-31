# API Inconsistency Mapping

## Overview
This document provides a detailed mapping of API inconsistencies between test expectations and implementation in the WebChess project.

## Primary Inconsistency: Missing `success` Property

### Affected Methods in `src/shared/chessGame.js`:

| Method | Line | Returns | Tests Expect |
|--------|------|---------|--------------|
| `validateMovementPattern()` | 508, 518 | `{ isValid: false, ... }` | `{ success: false, ... }` |
| `validatePath()` | 538 | `{ isValid: false, ... }` | `{ success: false, ... }` |
| `validateCapture()` | 561 | `{ isValid: false, ... }` | `{ success: false, ... }` |
| `validateSpecialMoves()` | 586, 606, 628, 645 | `{ isValid: false, ... }` | `{ success: false, ... }` |
| `validateCheckConstraints()` | 684, 706, 753, 768 | `{ isValid: false, ... }` | `{ success: false, ... }` |
| `validateCastling()` | 1195, 1264, 1477, 1485 | `{ isValid: false, ... }` | `{ success: false, ... }` |

### Test Files Affected:
- `tests/enPassantTargetManagement.test.js` (6 failures)
- `tests/task10Verification.test.js` (4 failures)
- `tests/pieceMovement.test.js` (15+ failures)
- `tests/errorHandling.test.js` (3 failures)
- `tests/chessAI.test.js` (5 failures)
- `tests/castlingRightsManagement.test.js` (1 failure)

## Secondary Inconsistencies

### 1. Error Message Format Mismatches

| Test File | Line | Expected | Actual |
|-----------|------|----------|--------|
| `tests/enPassantTargetManagement.test.js` | 289 | "Invalid coordinates" | "Invalid board coordinates. Coordinates must be between 0-7." |

### 2. Property Naming Inconsistencies

| Test File | Line | Expected Property | Actual Property |
|-----------|------|-------------------|-----------------|
| `tests/checkmateDetection.test.js` | 464, 496 | `gameStatus: "checkmate"` | `gameStatus: "active"` |

### 3. Game Logic Return Value Issues

| Test File | Line | Expected | Actual | Issue |
|-----------|------|----------|--------|-------|
| `tests/chessAI.test.js` | 40, 45 | 20 moves | 53 moves | Incorrect move counting |
| `tests/chessAI.test.js` | 20 | maxDepth: 2 | maxDepth: 1 | Configuration issue |
| `tests/checkmateDetection.test.js` | 54, 189, 358, 436 | `isInCheck: true` | `isInCheck: false` | Check detection logic |

## Response Structure Analysis

### Current Implementation Patterns:

#### 1. Error Handler (Correct Pattern):
```javascript
// src/shared/errorHandler.js - createError()
{
  success: false,
  isValid: false,
  message: string,
  errorCode: string,
  category: string,
  severity: string,
  recoverable: boolean,
  errors: array,
  suggestions: array,
  details: object,
  context: object,
  recovery: object
}
```

#### 2. Error Handler (Success Pattern):
```javascript
// src/shared/errorHandler.js - createSuccess()
{
  success: true,
  isValid: true,
  message: string,
  errorCode: null,
  category: null,
  severity: null,
  recoverable: null,
  errors: [],
  suggestions: [],
  details: object,
  data: object,
  recovery: null
}
```

#### 3. Validation Methods (Inconsistent Pattern):
```javascript
// Various validation methods in chessGame.js
{
  isValid: false,
  message: string,
  errorCode: string,
  errors: array,
  details: object
}
```

### Test Expectations:

#### Minimal Expected Structure:
```javascript
{
  success: boolean,
  message?: string,
  errorCode?: string,
  data?: any
}
```

## Resolution Strategy

### Phase 1: Standardize Validation Method Responses
Update all validation methods in `src/shared/chessGame.js` to use the error handler:

```javascript
// Before (Inconsistent):
return {
  isValid: false,
  message: 'Invalid movement',
  errorCode: 'INVALID_MOVEMENT',
  errors: ['...'],
  details: { ... }
};

// After (Consistent):
return this.errorHandler.createError(
  'INVALID_MOVEMENT',
  'Invalid movement',
  ['...'],
  { ... }
);
```

### Phase 2: Update Success Responses
Ensure all validation methods return consistent success responses:

```javascript
// Before:
return { isValid: true };

// After:
return this.errorHandler.createSuccess('Validation passed', {}, { validationType: true });
```

### Phase 3: Fix Game Logic Issues
Address specific game logic problems:
1. Check detection algorithms
2. AI move generation counting
3. Checkmate detection logic
4. Castling rights management

## Impact Assessment

### Files Requiring Updates:
- `src/shared/chessGame.js` (Primary - 20+ methods)
- `src/shared/chessAI.js` (Secondary - move generation)
- Tests may need minor adjustments for additional response properties

### Estimated Changes:
- ~25 validation methods need response structure updates
- ~10 game logic methods need bug fixes
- ~5 AI methods need corrections

### Risk Level: Low
- Changes are primarily structural (adding `success` property)
- Existing functionality remains intact
- Tests will validate correct behavior

This mapping provides the detailed foundation needed to systematically resolve all API inconsistencies.