---
inclusion: fileMatch
fileMatchPattern: 'src/**/*.js'
---

# API Patterns for WebChess

This document defines the standard patterns and conventions used throughout the WebChess codebase for consistent API design.

## Socket.IO Event Patterns

### Event Naming Convention
- Use kebab-case for event names
- Use descriptive, action-oriented names
- Include context in event names

```javascript
// Good
socket.emit('host-game');
socket.emit('make-move', moveData);
socket.emit('chat-message', messageData);

// Avoid
socket.emit('hostGame');
socket.emit('move', moveData);
socket.emit('msg', messageData);
```

### Request/Response Pattern
All game-related events should follow this pattern:

```javascript
// Client Request
socket.emit('event-name', {
  gameId: string,
  // ... other required data
});

// Server Response (Success)
socket.emit('event-response', {
  success: true,
  data: {
    // ... response data
  }
});

// Server Response (Error)
socket.emit('event-error', {
  success: false,
  message: string,
  code?: string
});
```

### Standard Game Events

#### Game Management
```javascript
// Host new game
socket.emit('host-game');
socket.on('game-created', { gameId: string });

// Join existing game
socket.emit('join-game', { gameId: string });
socket.on('game-joined', { gameId: string, color: 'white'|'black' });
socket.on('join-error', { message: string });

// Game start notification
socket.on('game-start', { gameState: GameState });
```

#### Move Handling
```javascript
// Make move
socket.emit('make-move', {
  gameId: string,
  move: {
    from: { row: number, col: number },
    to: { row: number, col: number },
    promotion?: 'queen'|'rook'|'bishop'|'knight'
  }
});

// Move responses
socket.on('move-made', {
  move: Move,
  gameState: GameState,
  nextTurn: 'white'|'black'
});
socket.on('move-error', { message: string });
```

#### Game End Events
```javascript
// Resign game
socket.emit('resign', { gameId: string });

// Game end notification
socket.on('game-end', {
  status: 'checkmate'|'stalemate'|'resigned'|'draw',
  winner?: 'white'|'black'
});
```

## Data Structure Patterns

### Move Object Structure
```javascript
const move = {
  from: { row: number, col: number },    // Source square (0-7)
  to: { row: number, col: number },      // Destination square (0-7)
  promotion?: string                      // Promotion piece type (optional)
};
```

### Game State Structure
```javascript
const gameState = {
  board: Piece[][],                      // 8x8 board array
  currentTurn: 'white' | 'black',        // Active player
  status: 'active' | 'check' | 'checkmate' | 'stalemate' | 'draw',
  winner: 'white' | 'black' | null,      // Game winner (if ended)
  moveHistory: MoveRecord[],             // Complete move history
  inCheck: boolean,                      // Current player in check
  castlingRights: CastlingRights,        // Castling availability
  enPassantTarget: Square | null         // En passant target square
};
```

### Piece Object Structure
```javascript
const piece = {
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king',
  color: 'white' | 'black'
};
```

### Move History Record
```javascript
const moveRecord = {
  from: { row: number, col: number },
  to: { row: number, col: number },
  piece: string,                         // Piece type that moved
  color: 'white' | 'black',
  captured: string | null,               // Captured piece type
  promotion: string | null,              // Promotion piece type
  castling: 'kingside' | 'queenside' | null,
  enPassant: boolean
};
```

## Method Response Patterns

### Success Response Pattern
```javascript
function gameMethod(params) {
  try {
    // ... method logic
    return {
      success: true,
      data: resultData,
      // ... additional success properties
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      code: 'ERROR_CODE'
    };
  }
}
```

### Chess Move Validation Response
```javascript
function makeMove(move) {
  // Validation
  if (!isValidMove(move)) {
    return {
      success: false,
      message: 'Invalid move: piece cannot move to that square',
      code: 'INVALID_MOVE'
    };
  }
  
  // Execute move
  const gameState = executeMove(move);
  
  return {
    success: true,
    gameState: gameState,
    nextTurn: gameState.currentTurn,
    moveHistory: gameState.moveHistory
  };
}
```

## Error Handling Patterns

### Error Categories
```javascript
const ErrorCodes = {
  // Game Management
  GAME_NOT_FOUND: 'Game not found',
  GAME_FULL: 'Game is full',
  PLAYER_NOT_IN_GAME: 'Player not in this game',
  
  // Move Validation
  INVALID_MOVE: 'Invalid move',
  WRONG_TURN: 'Not your turn',
  PIECE_NOT_FOUND: 'No piece at source square',
  INVALID_COORDINATES: 'Invalid board coordinates',
  
  // Game State
  GAME_NOT_ACTIVE: 'Game is not active',
  KING_IN_CHECK: 'Move would put king in check',
  
  // Input Validation
  MALFORMED_REQUEST: 'Malformed request data',
  MISSING_REQUIRED_FIELD: 'Missing required field'
};
```

### Error Response Structure
```javascript
const errorResponse = {
  success: false,
  message: string,           // User-friendly error message
  code: string,             // Machine-readable error code
  details?: object          // Additional error context (optional)
};
```

## Validation Patterns

### Input Validation
```javascript
function validateMove(move) {
  // Required field validation
  if (!move || typeof move !== 'object') {
    return { valid: false, message: 'Move must be an object' };
  }
  
  if (!move.from || !move.to) {
    return { valid: false, message: 'Move must have from and to squares' };
  }
  
  // Coordinate validation
  if (!isValidSquare(move.from) || !isValidSquare(move.to)) {
    return { valid: false, message: 'Invalid square coordinates' };
  }
  
  return { valid: true };
}

function isValidSquare(square) {
  return square &&
         typeof square.row === 'number' &&
         typeof square.col === 'number' &&
         square.row >= 0 && square.row < 8 &&
         square.col >= 0 && square.col < 8;
}
```

### Chess Rule Validation Pattern
```javascript
function validateChessMove(from, to, piece, gameState) {
  // 1. Basic validation
  if (!piece || piece.color !== gameState.currentTurn) {
    return { valid: false, message: 'No piece or wrong color' };
  }
  
  // 2. Piece-specific movement validation
  if (!isPieceMovementValid(from, to, piece)) {
    return { valid: false, message: 'Invalid move for this piece' };
  }
  
  // 3. Path obstruction check
  if (!isPathClear(from, to, gameState.board)) {
    return { valid: false, message: 'Path is blocked' };
  }
  
  // 4. Check prevention
  if (wouldBeInCheck(from, to, piece.color, gameState)) {
    return { valid: false, message: 'Move would put king in check' };
  }
  
  return { valid: true };
}
```

## State Management Patterns

### Game State Updates
```javascript
function updateGameState(gameState, move) {
  // Create new state object (immutable pattern)
  const newState = {
    ...gameState,
    board: updateBoard(gameState.board, move),
    currentTurn: gameState.currentTurn === 'white' ? 'black' : 'white',
    moveHistory: [...gameState.moveHistory, createMoveRecord(move)],
    // ... other state updates
  };
  
  // Update derived state
  newState.inCheck = isInCheck(newState.currentTurn, newState.board);
  newState.status = determineGameStatus(newState);
  
  return newState;
}
```

### Immutable Update Pattern
```javascript
// Good: Create new objects
const newBoard = gameState.board.map(row => [...row]);
newBoard[to.row][to.col] = piece;
newBoard[from.row][from.col] = null;

// Avoid: Mutating existing state
gameState.board[to.row][to.col] = piece;
gameState.board[from.row][from.col] = null;
```

## Testing Patterns

### Test Structure Pattern
```javascript
describe('ChessGame.makeMove', () => {
  let game;
  
  beforeEach(() => {
    game = new ChessGame();
  });
  
  describe('valid moves', () => {
    test('should allow valid pawn move', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.currentTurn).toBe('black');
    });
  });
  
  describe('invalid moves', () => {
    test('should reject invalid coordinates', () => {
      const move = { from: { row: -1, col: 0 }, to: { row: 0, col: 0 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid square');
    });
  });
});
```

### Mock Pattern for Testing
```javascript
// Mock WebSocket for testing
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  join: jest.fn(),
  to: jest.fn().mockReturnThis()
};

// Mock game state for testing
const mockGameState = {
  board: createTestBoard(),
  currentTurn: 'white',
  status: 'active',
  // ... other required properties
};
```

## Performance Patterns

### Efficient Board Operations
```javascript
// Efficient board copying
function copyBoard(board) {
  return board.map(row => [...row]);
}

// Efficient square checking
function isSquareEmpty(board, row, col) {
  return board[row][col] === null;
}

// Batch board updates
function applyMoves(board, moves) {
  const newBoard = copyBoard(board);
  moves.forEach(move => {
    newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
    newBoard[move.from.row][move.from.col] = null;
  });
  return newBoard;
}
```

### Memory Management
```javascript
// Clean up game resources
function cleanupGame(gameId) {
  const game = games.get(gameId);
  if (game) {
    // Clear large objects
    game.moveHistory = [];
    game.chatMessages = [];
    
    // Remove from collections
    games.delete(gameId);
    playerToGame.delete(game.host);
    playerToGame.delete(game.guest);
  }
}
```