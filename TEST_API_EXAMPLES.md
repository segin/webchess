# WebChess Test API Usage Examples

## Overview

This document provides comprehensive examples of correct API usage in WebChess tests. All examples follow the normalized patterns established across the 60+ test files and demonstrate best practices for testing chess game functionality.

## Table of Contents

1. [Basic Test Structure](#basic-test-structure)
2. [Move Validation Examples](#move-validation-examples)
3. [Game State Testing](#game-state-testing)
4. [Error Handling Examples](#error-handling-examples)
5. [Special Move Testing](#special-move-testing)
6. [Integration Test Examples](#integration-test-examples)
7. [Performance Test Examples](#performance-test-examples)
8. [Utility Usage Examples](#utility-usage-examples)

## Basic Test Structure

### Standard Test File Template

```javascript
/**
 * [Component] [Aspect] Tests
 * [Brief description of test coverage]
 * 
 * This test file follows normalized API patterns:
 * - Uses current makeMove API with {from, to, promotion} object format
 * - Validates responses using current success/error structure
 * - Accesses game state using current property names
 * - Uses current error codes and message formats
 */

const ChessGame = require('../src/shared/chessGame');

describe('[Component] - [Aspect]', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame(); // Direct constructor call
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

### Minimal Test Example

```javascript
const ChessGame = require('../src/shared/chessGame');

describe('Basic Pawn Movement', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should allow single square pawn move', () => {
    const result = game.makeMove({ 
      from: { row: 6, col: 4 }, 
      to: { row: 5, col: 4 } 
    });
    
    expect(result.success).toBe(true);
    expect(game.currentTurn).toBe('black');
  });
});
```

## Move Validation Examples

### Successful Move Validation

```javascript
describe('Successful Move Validation', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should validate successful pawn move completely', () => {
    const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
    const result = game.makeMove(move);
    
    // Response structure validation
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.isValid).toBe(true);
    expect(result.errorCode).toBeNull();
    expect(result.message).toBeDefined();
    expect(typeof result.message).toBe('string');
    
    // Response data validation
    expect(result.data).toBeDefined();
    expect(result.data.from).toEqual({ row: 6, col: 4 });
    expect(result.data.to).toEqual({ row: 5, col: 4 });
    expect(result.data.piece).toEqual({ type: 'pawn', color: 'white' });
    expect(result.data.gameStatus).toBe('active');
    expect(result.data.currentTurn).toBe('black');
    
    // Game state validation
    expect(game.currentTurn).toBe('black');
    expect(game.gameStatus).toBe('active');
    expect(game.board[5][4]).toEqual({ type: 'pawn', color: 'white' });
    expect(game.board[6][4]).toBeNull();
    expect(game.moveHistory).toHaveLength(1);
  });

  test('should handle knight L-shaped movement', () => {
    const move = { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(true);
    expect(result.data.piece.type).toBe('knight');
    expect(game.board[5][2]).toEqual({ type: 'knight', color: 'white' });
    expect(game.board[7][1]).toBeNull();
  });

  test('should allow rook horizontal movement', () => {
    // Set up clear path for rook
    game.board[7][1] = null; // Remove knight
    game.board[7][2] = null; // Remove bishop
    game.board[7][3] = null; // Remove queen
    
    const move = { from: { row: 7, col: 0 }, to: { row: 7, col: 3 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(true);
    expect(result.data.piece.type).toBe('rook');
    expect(game.board[7][3]).toEqual({ type: 'rook', color: 'white' });
    expect(game.board[7][0]).toBeNull();
  });
});
```

### Failed Move Validation

```javascript
describe('Failed Move Validation', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should reject invalid pawn movement', () => {
    const move = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } }; // 3 squares
    const result = game.makeMove(move);
    
    // Error response validation
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('INVALID_MOVEMENT');
    expect(result.message).toBeDefined();
    expect(result.message).toContain('cannot move');
    expect(result.details).toBeDefined();
    
    // Game state should be unchanged
    expect(game.currentTurn).toBe('white');
    expect(game.gameStatus).toBe('active');
    expect(game.board[6][4]).toEqual({ type: 'pawn', color: 'white' });
    expect(game.board[3][4]).toBeNull();
    expect(game.moveHistory).toHaveLength(0);
  });

  test('should reject move with no piece at source', () => {
    const move = { from: { row: 4, col: 4 }, to: { row: 5, col: 4 } }; // Empty square
    const result = game.makeMove(move);
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('NO_PIECE');
    expect(result.message).toContain('No piece at source square');
    expect(result.details.from).toEqual({ row: 4, col: 4 });
  });

  test('should reject move when not player turn', () => {
    // Try to move black piece on white's turn
    const move = { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('WRONG_TURN');
    expect(result.message).toContain('Not your turn');
    expect(game.currentTurn).toBe('white'); // Should remain white's turn
  });
});
```

## Game State Testing

### Complete Game State Validation

```javascript
describe('Game State Management', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should maintain correct initial game state', () => {
    const gameState = game.getGameState();
    
    // Validate all required properties exist
    expect(gameState).toBeDefined();
    expect(gameState).toHaveProperty('board');
    expect(gameState).toHaveProperty('currentTurn');
    expect(gameState).toHaveProperty('gameStatus');
    expect(gameState).toHaveProperty('winner');
    expect(gameState).toHaveProperty('moveHistory');
    expect(gameState).toHaveProperty('castlingRights');
    expect(gameState).toHaveProperty('enPassantTarget');
    expect(gameState).toHaveProperty('inCheck');
    expect(gameState).toHaveProperty('checkDetails');
    
    // Validate property types and values
    expect(Array.isArray(gameState.board)).toBe(true);
    expect(gameState.board).toHaveLength(8);
    expect(['white', 'black']).toContain(gameState.currentTurn);
    expect(['active', 'check', 'checkmate', 'stalemate', 'draw']).toContain(gameState.gameStatus);
    expect(Array.isArray(gameState.moveHistory)).toBe(true);
    expect(typeof gameState.inCheck).toBe('boolean');
    
    // Validate initial values
    expect(gameState.currentTurn).toBe('white');
    expect(gameState.gameStatus).toBe('active');
    expect(gameState.winner).toBeNull();
    expect(gameState.moveHistory).toHaveLength(0);
    expect(gameState.inCheck).toBe(false);
    expect(gameState.enPassantTarget).toBeNull();
  });

  test('should update game state after move', () => {
    const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(true);
    
    // Validate state changes
    expect(game.currentTurn).toBe('black');
    expect(game.gameStatus).toBe('active');
    expect(game.moveHistory).toHaveLength(1);
    
    // Validate move history entry
    const lastMove = game.moveHistory[0];
    expect(lastMove.from).toEqual({ row: 6, col: 4 });
    expect(lastMove.to).toEqual({ row: 5, col: 4 });
    expect(lastMove.piece).toBe('pawn');
    expect(lastMove.color).toBe('white');
  });

  test('should track castling rights correctly', () => {
    const gameState = game.getGameState();
    
    expect(gameState.castlingRights).toBeDefined();
    expect(gameState.castlingRights.white).toBeDefined();
    expect(gameState.castlingRights.black).toBeDefined();
    
    // Initial castling rights should be true
    expect(gameState.castlingRights.white.kingside).toBe(true);
    expect(gameState.castlingRights.white.queenside).toBe(true);
    expect(gameState.castlingRights.black.kingside).toBe(true);
    expect(gameState.castlingRights.black.queenside).toBe(true);
  });
});
```

### Game Status Transitions

```javascript
describe('Game Status Transitions', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should transition to check status', () => {
    // Set up a check position
    game.board = testUtils.TestPositions.CHECK_POSITION();
    game.currentTurn = 'black';
    
    // Make move that puts king in check
    const move = { from: { row: 0, col: 3 }, to: { row: 7, col: 3 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(true);
    expect(result.data.gameStatus).toBe('check');
    expect(game.gameStatus).toBe('check');
    expect(game.inCheck).toBe(true);
    expect(game.checkDetails).toBeDefined();
  });

  test('should transition to checkmate status', () => {
    // Set up checkmate position
    game.board = testUtils.TestPositions.CHECKMATE_SETUP();
    game.currentTurn = 'black';
    
    const move = { from: { row: 0, col: 3 }, to: { row: 1, col: 4 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(true);
    expect(result.data.gameStatus).toBe('checkmate');
    expect(result.data.winner).toBe('black');
    expect(game.gameStatus).toBe('checkmate');
    expect(game.winner).toBe('black');
  });

  test('should transition to stalemate status', () => {
    // Set up stalemate position
    game.board = testUtils.TestPositions.STALEMATE_SETUP();
    game.currentTurn = 'black';
    
    const move = { from: { row: 0, col: 0 }, to: { row: 1, col: 0 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(true);
    expect(result.data.gameStatus).toBe('stalemate');
    expect(result.data.winner).toBeNull();
    expect(game.gameStatus).toBe('stalemate');
    expect(game.winner).toBeNull();
  });
});
```

## Error Handling Examples

### Comprehensive Error Testing

```javascript
describe('Comprehensive Error Handling', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should handle malformed move objects', () => {
    const testCases = [
      { move: null, expectedCode: 'MALFORMED_MOVE' },
      { move: undefined, expectedCode: 'MALFORMED_MOVE' },
      { move: {}, expectedCode: 'MALFORMED_MOVE' },
      { move: { from: { row: 6 } }, expectedCode: 'MALFORMED_MOVE' },
      { move: { to: { row: 5, col: 4 } }, expectedCode: 'MALFORMED_MOVE' },
      { move: { from: { row: 6, col: 4 } }, expectedCode: 'MALFORMED_MOVE' }
    ];

    testCases.forEach(({ move, expectedCode }) => {
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(expectedCode);
      expect(result.message).toContain('format');
    });
  });

  test('should handle invalid coordinates', () => {
    const invalidMoves = [
      { from: { row: -1, col: 4 }, to: { row: 5, col: 4 } },
      { from: { row: 8, col: 4 }, to: { row: 5, col: 4 } },
      { from: { row: 6, col: -1 }, to: { row: 5, col: 4 } },
      { from: { row: 6, col: 8 }, to: { row: 5, col: 4 } },
      { from: { row: 6, col: 4 }, to: { row: -1, col: 4 } },
      { from: { row: 6, col: 4 }, to: { row: 8, col: 4 } }
    ];

    invalidMoves.forEach(move => {
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_COORDINATES');
      expect(result.message).toContain('coordinates');
      expect(result.details).toBeDefined();
    });
  });

  test('should handle path blocking errors', () => {
    // Try to move rook through pieces
    const move = { from: { row: 7, col: 0 }, to: { row: 7, col: 3 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('PATH_BLOCKED');
    expect(result.message).toContain('blocked');
    expect(result.details.from).toEqual({ row: 7, col: 0 });
    expect(result.details.to).toEqual({ row: 7, col: 3 });
  });

  test('should handle capturing own piece', () => {
    // Try to capture own piece
    const move = { from: { row: 7, col: 1 }, to: { row: 6, col: 3 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('CAPTURE_OWN_PIECE');
    expect(result.message).toContain('cannot capture own');
  });
});
```

### Error Recovery Testing

```javascript
describe('Error Recovery', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should maintain game state after errors', () => {
    const initialState = game.getGameState();
    
    // Make several invalid moves
    const invalidMoves = [
      { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } }, // Invalid pawn move
      { from: { row: 4, col: 4 }, to: { row: 5, col: 4 } }, // No piece
      { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }  // Wrong turn
    ];

    invalidMoves.forEach(move => {
      const result = game.makeMove(move);
      expect(result.success).toBe(false);
    });

    // Game state should be unchanged
    const currentState = game.getGameState();
    expect(currentState.currentTurn).toBe(initialState.currentTurn);
    expect(currentState.gameStatus).toBe(initialState.gameStatus);
    expect(currentState.moveHistory).toHaveLength(0);
    
    // Should still be able to make valid moves
    const validMove = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
    const result = game.makeMove(validMove);
    expect(result.success).toBe(true);
  });
});
```

## Special Move Testing

### Castling Tests

```javascript
describe('Castling Special Moves', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
    // Clear path for castling
    game.board[7][1] = null; // Knight
    game.board[7][2] = null; // Bishop
    game.board[7][3] = null; // Queen
    game.board[7][5] = null; // Bishop
    game.board[7][6] = null; // Knight
  });

  test('should allow kingside castling', () => {
    const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(true);
    expect(result.data.specialMove).toBeDefined();
    expect(result.data.specialMove.type).toBe('castling');
    expect(result.data.specialMove.side).toBe('kingside');
    
    // Validate final positions
    expect(game.board[7][6]).toEqual({ type: 'king', color: 'white' });
    expect(game.board[7][5]).toEqual({ type: 'rook', color: 'white' });
    expect(game.board[7][4]).toBeNull();
    expect(game.board[7][7]).toBeNull();
    
    // Validate castling rights updated
    expect(game.castlingRights.white.kingside).toBe(false);
    expect(game.castlingRights.white.queenside).toBe(false);
  });

  test('should allow queenside castling', () => {
    const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 2 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(true);
    expect(result.data.specialMove.type).toBe('castling');
    expect(result.data.specialMove.side).toBe('queenside');
    
    // Validate final positions
    expect(game.board[7][2]).toEqual({ type: 'king', color: 'white' });
    expect(game.board[7][3]).toEqual({ type: 'rook', color: 'white' });
    expect(game.board[7][4]).toBeNull();
    expect(game.board[7][0]).toBeNull();
  });

  test('should reject castling when king has moved', () => {
    // Move king first
    game.board[7][4] = null;
    game.board[7][5] = { type: 'king', color: 'white' };
    game.castlingRights.white.kingside = false;
    game.castlingRights.white.queenside = false;
    
    const move = { from: { row: 7, col: 5 }, to: { row: 7, col: 7 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_CASTLING');
    expect(result.message).toContain('castling not allowed');
  });
});
```

### En Passant Tests

```javascript
describe('En Passant Special Moves', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should allow en passant capture', () => {
    // Set up en passant scenario
    const moves = [
      { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // White pawn 2 squares
      { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }, // Black pawn 2 squares
      { from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }, // White pawn forward
      { from: { row: 1, col: 5 }, to: { row: 3, col: 5 } }  // Black pawn 2 squares (sets up en passant)
    ];

    moves.forEach(move => {
      const result = game.makeMove(move);
      expect(result.success).toBe(true);
    });

    // Verify en passant target is set
    expect(game.enPassantTarget).toEqual({ row: 2, col: 5 });

    // Execute en passant capture
    const enPassantMove = { from: { row: 3, col: 4 }, to: { row: 2, col: 5 } };
    const result = game.makeMove(enPassantMove);

    expect(result.success).toBe(true);
    expect(result.data.specialMove).toBeDefined();
    expect(result.data.specialMove.type).toBe('enPassant');
    
    // Validate final positions
    expect(game.board[2][5]).toEqual({ type: 'pawn', color: 'white' });
    expect(game.board[3][4]).toBeNull();
    expect(game.board[3][5]).toBeNull(); // Captured pawn removed
    expect(game.enPassantTarget).toBeNull(); // Target cleared
  });

  test('should reject invalid en passant', () => {
    // Try en passant without proper setup
    const move = { from: { row: 3, col: 4 }, to: { row: 2, col: 5 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_EN_PASSANT');
    expect(result.message).toContain('en passant');
  });
});
```

### Pawn Promotion Tests

```javascript
describe('Pawn Promotion Special Moves', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
    // Set up pawn near promotion
    game.board[1][4] = { type: 'pawn', color: 'white' };
    game.board[6][4] = null;
  });

  test('should allow pawn promotion to queen', () => {
    const move = { 
      from: { row: 1, col: 4 }, 
      to: { row: 0, col: 4 }, 
      promotion: 'queen' 
    };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(true);
    expect(result.data.specialMove).toBeDefined();
    expect(result.data.specialMove.type).toBe('promotion');
    expect(result.data.specialMove.piece).toBe('queen');
    
    // Validate promoted piece
    expect(game.board[0][4]).toEqual({ type: 'queen', color: 'white' });
    expect(game.board[1][4]).toBeNull();
  });

  test('should allow promotion to all piece types', () => {
    const promotionPieces = ['queen', 'rook', 'bishop', 'knight'];
    
    promotionPieces.forEach((piece, index) => {
      const freshGame = new ChessGame();
      freshGame.board[1][index] = { type: 'pawn', color: 'white' };
      
      const move = { 
        from: { row: 1, col: index }, 
        to: { row: 0, col: index }, 
        promotion: piece 
      };
      const result = freshGame.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(freshGame.board[0][index]).toEqual({ type: piece, color: 'white' });
    });
  });

  test('should default to queen if no promotion specified', () => {
    const move = { from: { row: 1, col: 4 }, to: { row: 0, col: 4 } };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(true);
    expect(game.board[0][4]).toEqual({ type: 'queen', color: 'white' });
  });

  test('should reject invalid promotion piece', () => {
    const move = { 
      from: { row: 1, col: 4 }, 
      to: { row: 0, col: 4 }, 
      promotion: 'king' 
    };
    const result = game.makeMove(move);
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_PROMOTION');
    expect(result.message).toContain('promotion');
  });
});
```

## Integration Test Examples

### Complete Game Flow

```javascript
describe('Complete Game Integration', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should handle complete game from start to checkmate', () => {
    // Scholar's Mate sequence
    const moves = [
      { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
      { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
      { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // Bc4
      { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
      { from: { row: 7, col: 3 }, to: { row: 3, col: 7 } }, // Qh5
      { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }, // Nf6
      { from: { row: 3, col: 7 }, to: { row: 1, col: 5 } }  // Qxf7# (checkmate)
    ];

    // Execute all moves except the last
    for (let i = 0; i < moves.length - 1; i++) {
      const result = game.makeMove(moves[i]);
      expect(result.success).toBe(true);
      expect(result.data.gameStatus).toBe('active');
    }

    // Execute checkmate move
    const checkmateResult = game.makeMove(moves[moves.length - 1]);
    
    expect(checkmateResult.success).toBe(true);
    expect(checkmateResult.data.gameStatus).toBe('checkmate');
    expect(checkmateResult.data.winner).toBe('white');
    expect(game.gameStatus).toBe('checkmate');
    expect(game.winner).toBe('white');
    expect(game.moveHistory).toHaveLength(7);
  });

  test('should handle game state consistency throughout', () => {
    const moves = [
      { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } },
      { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } },
      { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } },
      { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }
    ];

    moves.forEach((move, index) => {
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.moveHistory).toHaveLength(index + 1);
      expect(game.currentTurn).toBe(index % 2 === 0 ? 'black' : 'white');
      
      // Validate move history entry
      const lastMove = game.moveHistory[index];
      expect(lastMove.from).toEqual(move.from);
      expect(lastMove.to).toEqual(move.to);
      expect(lastMove.color).toBe(index % 2 === 0 ? 'white' : 'black');
    });
  });
});
```

### Multi-Game Session

```javascript
describe('Multi-Game Session', () => {
  test('should handle multiple independent games', () => {
    const game1 = new ChessGame();
    const game2 = new ChessGame();
    
    // Make different moves in each game
    const result1 = game1.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
    const result2 = game2.makeMove({ from: { row: 6, col: 3 }, to: { row: 5, col: 3 } });
    
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    
    // Games should be independent
    expect(game1.board[5][4]).toEqual({ type: 'pawn', color: 'white' });
    expect(game1.board[5][3]).toEqual({ type: 'pawn', color: 'white' }); // Unchanged
    
    expect(game2.board[5][3]).toEqual({ type: 'pawn', color: 'white' });
    expect(game2.board[5][4]).toEqual({ type: 'pawn', color: 'white' }); // Unchanged
    
    expect(game1.moveHistory).toHaveLength(1);
    expect(game2.moveHistory).toHaveLength(1);
    expect(game1.moveHistory[0].to.col).toBe(4);
    expect(game2.moveHistory[0].to.col).toBe(3);
  });
});
```

## Performance Test Examples

### Move Validation Performance

```javascript
describe('Performance Tests', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('should validate moves efficiently', () => {
    const startTime = Date.now();
    const iterations = 1000;
    
    for (let i = 0; i < iterations; i++) {
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      expect(result.success).toBe(true);
      
      // Reset for next iteration
      game.board[6][4] = { type: 'pawn', color: 'white' };
      game.board[5][4] = null;
      game.currentTurn = 'white';
      game.moveHistory = [];
    }
    
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / iterations;
    
    expect(avgTime).toBeLessThan(10); // Should be under 10ms per move
  });

  test('should handle complex board positions efficiently', () => {
    // Set up complex mid-game position
    game.board = testUtils.TestPositions.COMPLEX_MIDGAME();
    
    const startTime = Date.now();
    
    // Test multiple move validations
    const testMoves = [
      { from: { row: 4, col: 4 }, to: { row: 3, col: 3 } },
      { from: { row: 2, col: 2 }, to: { row: 4, col: 4 } },
      { from: { row: 5, col: 1 }, to: { row: 3, col: 2 } }
    ];
    
    testMoves.forEach(move => {
      const result = game.makeMove(move);
      // Don't assert success - just measure performance
    });
    
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
  });
});
```

## Utility Usage Examples

### Using Test Utilities

```javascript
describe('Test Utility Usage Examples', () => {
  let game;

  beforeEach(() => {
    game = testUtils.createFreshGame();
  });

  test('should use response validation utilities', () => {
    const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
    const result = game.makeMove(move);
    
    // Use utility for validation
    testUtils.validateSuccessResponse(result);
    
    // Additional specific validations
    expect(result.data.gameStatus).toBe('active');
  });

  test('should use game state validation utilities', () => {
    const gameState = game.getGameState();
    
    // Use utility for comprehensive validation
    testUtils.validateGameState(gameState);
    
    // Additional specific checks
    expect(gameState.currentTurn).toBe('white');
  });

  test('should use board position validation utilities', () => {
    const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
    game.makeMove(move);
    
    // Use utility for board validation
    testUtils.validateBoardPosition(game.board, 5, 4, { type: 'pawn', color: 'white' });
    testUtils.validateBoardPosition(game.board, 6, 4, null);
  });

  test('should use execution helper utilities', () => {
    const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
    
    // Use utility for move testing
    const result = testUtils.ExecutionHelpers.testMove(game, move, true);
    
    expect(result.success).toBe(true);
    expect(game.currentTurn).toBe('black');
  });

  test('should use move sequence utilities', () => {
    const moves = [
      { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } },
      { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } },
      { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }
    ];
    
    // Use utility for sequence execution
    const results = testUtils.ExecutionHelpers.executeMovesSequence(game, moves);
    
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
    expect(game.moveHistory).toHaveLength(3);
  });

  test('should use test position utilities', () => {
    // Use predefined test positions
    const kingsOnlyGame = testUtils.createFreshGame();
    kingsOnlyGame.board = testUtils.TestPositions.KINGS_ONLY();
    
    testUtils.validateGameState(kingsOnlyGame.getGameState());
    
    // Validate specific position setup
    expect(kingsOnlyGame.board[7][4]).toEqual({ type: 'king', color: 'white' });
    expect(kingsOnlyGame.board[0][4]).toEqual({ type: 'king', color: 'black' });
  });
});
```

### Custom Test Patterns

```javascript
describe('Custom Test Pattern Examples', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  // Custom helper for testing piece movement
  function testPieceMovement(pieceType, from, to, shouldSucceed = true) {
    const move = { from, to };
    const result = game.makeMove(move);
    
    if (shouldSucceed) {
      expect(result.success).toBe(true);
      expect(result.data.piece.type).toBe(pieceType);
      expect(game.board[to.row][to.col].type).toBe(pieceType);
      expect(game.board[from.row][from.col]).toBeNull();
    } else {
      expect(result.success).toBe(false);
      expect(game.board[from.row][from.col].type).toBe(pieceType);
      expect(game.board[to.row][to.col]).toBeNull();
    }
    
    return result;
  }

  test('should use custom movement helper', () => {
    // Test valid pawn movement
    testPieceMovement('pawn', { row: 6, col: 4 }, { row: 5, col: 4 }, true);
    
    // Test invalid pawn movement
    const freshGame = new ChessGame();
    testPieceMovement.call({ game: freshGame }, 'pawn', { row: 6, col: 4 }, { row: 3, col: 4 }, false);
  });

  // Custom helper for testing game endings
  function testGameEnding(setupFunction, finalMove, expectedStatus, expectedWinner) {
    setupFunction(game);
    
    const result = game.makeMove(finalMove);
    
    expect(result.success).toBe(true);
    expect(result.data.gameStatus).toBe(expectedStatus);
    expect(result.data.winner).toBe(expectedWinner);
    expect(game.gameStatus).toBe(expectedStatus);
    expect(game.winner).toBe(expectedWinner);
    
    return result;
  }

  test('should use custom game ending helper', () => {
    const setupCheckmate = (game) => {
      game.board = testUtils.TestPositions.CHECKMATE_SETUP();
      game.currentTurn = 'black';
    };
    
    const finalMove = { from: { row: 0, col: 3 }, to: { row: 1, col: 4 } };
    
    testGameEnding(setupCheckmate, finalMove, 'checkmate', 'black');
  });
});
```

These examples demonstrate the complete range of normalized API patterns used across all WebChess tests, providing clear guidance for writing consistent, reliable tests that follow the established standards.