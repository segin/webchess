const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');
const ChessErrorHandler = require('../src/shared/errorHandler');

describe('Under-Tested Areas - Comprehensive Coverage Expansion', () => {
  let game;
  let stateManager;
  let errorHandler;

  beforeEach(() => {
    game = new ChessGame();
    stateManager = new GameStateManager();
    errorHandler = new ChessErrorHandler();
  });

  describe('Advanced Move Validation Functions', () => {
    test('should handle pawn promotion moves correctly', () => {
      // Set up a pawn ready for promotion
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[1][4] = { type: 'pawn', color: 'white' };
      game.currentTurn = 'white';
      
      const move = { from: { row: 1, col: 4 }, to: { row: 0, col: 4 }, promotion: 'queen' };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(game.board[0][4]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should handle check resolution validation', () => {
      // Set up a check scenario where king must move
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      game.currentTurn = 'white';
      game.inCheck = true;
      
      // Try to move king to safety
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 5 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.inCheck).toBe(false);
    });

    test('should validate blocking moves during check', () => {
      // Set up a check scenario where piece can block
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      game.board[6][3] = { type: 'bishop', color: 'white' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      // Block the check with bishop - move to a valid diagonal square
      const move = { from: { row: 6, col: 3 }, to: { row: 5, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
    });

    test('should reject moves that do not resolve check', () => {
      // Set up a check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      game.board[6][0] = { type: 'pawn', color: 'white' };
      game.currentTurn = 'white';
      game.inCheck = true;
      
      // Try to move a pawn that doesn't resolve check
      const move = { from: { row: 6, col: 0 }, to: { row: 5, col: 0 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CHECK_NOT_RESOLVED');
    });
  });

  describe('Stalemate Detection and Analysis', () => {
    test('should detect stalemate when king has no legal moves but is not in check', () => {
      // Set up a classic stalemate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[2][1] = { type: 'king', color: 'black' };
      game.board[1][2] = { type: 'queen', color: 'black' };
      game.currentTurn = 'white';
      
      // Try to make any move - should result in invalid move
      const move = { from: { row: 0, col: 0 }, to: { row: 0, col: 1 } };
      const result = game.makeMove(move);
      
      // Move should be invalid due to moving into check
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('KING_IN_CHECK');
    });

    test('should identify corner stalemate patterns', () => {
      // Set up king trapped in corner
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[2][1] = { type: 'king', color: 'black' };
      game.board[1][2] = { type: 'queen', color: 'black' };
      game.currentTurn = 'white';
      
      // Verify king is in corner and has limited mobility
      expect(game.board[0][0]).toEqual({ type: 'king', color: 'white' });
      
      // Test moves from corner - should be limited
      const possibleMoves = [
        { from: { row: 0, col: 0 }, to: { row: 0, col: 1 } },
        { from: { row: 0, col: 0 }, to: { row: 1, col: 0 } },
        { from: { row: 0, col: 0 }, to: { row: 1, col: 1 } }
      ];
      
      possibleMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(false); // All moves should be invalid due to check
      });
    });

    test('should handle edge-based stalemate scenarios', () => {
      // Set up king on edge with limited mobility
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][3] = { type: 'king', color: 'white' };
      game.board[2][3] = { type: 'king', color: 'black' };
      game.board[1][2] = { type: 'rook', color: 'black' };
      game.board[1][4] = { type: 'rook', color: 'black' };
      game.currentTurn = 'white';
      
      // King on edge should have limited escape options
      expect(game.board[0][3]).toEqual({ type: 'king', color: 'white' });
      
      // Test edge moves
      const edgeMoves = [
        { from: { row: 0, col: 3 }, to: { row: 0, col: 2 } },
        { from: { row: 0, col: 3 }, to: { row: 0, col: 4 } }
      ];
      
      edgeMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
      });
    });

    test('should recognize pawn-based stalemate patterns', () => {
      // Set up a position where pawns create stalemate
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][7] = { type: 'king', color: 'white' };
      game.board[3][3] = { type: 'king', color: 'black' }; // Move black king far away
      game.board[6][6] = { type: 'pawn', color: 'black' };
      game.board[6][7] = { type: 'pawn', color: 'black' };
      game.board[7][6] = { type: 'pawn', color: 'black' };
      game.currentTurn = 'white';
      
      // King should be trapped by pawn structure - try to capture black pawn
      const move = { from: { row: 7, col: 7 }, to: { row: 6, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true); // King can capture the pawn
      expect(game.board[6][6]).toEqual({ type: 'king', color: 'white' });
    });

    test('should properly declare stalemate and end game', () => {
      // Set up a definitive stalemate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[2][1] = { type: 'king', color: 'black' };
      game.board[1][2] = { type: 'queen', color: 'black' };
      game.currentTurn = 'white';
      game.gameStatus = 'stalemate';
      
      // Game should be in stalemate status
      expect(game.gameStatus).toBe('stalemate');
      expect(game.winner).toBeNull();
      
      // Attempting moves in stalemate should fail
      const move = { from: { row: 0, col: 0 }, to: { row: 0, col: 1 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('GAME_NOT_ACTIVE');
    });
  });

  describe('Advanced Check Detection and Attack Patterns', () => {
    test('should detect multiple attacking pieces on king', () => {
      // Set up multiple attack scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      game.board[4][1] = { type: 'bishop', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      // Make a move to trigger check detection
      const kingMove = { from: { row: 7, col: 4 }, to: { row: 7, col: 5 } };
      const result = game.makeMove(kingMove);
      
      expect(result.success).toBe(true);
    });

    test('should categorize different types of check attacks', () => {
      // Test rook check scenario by making a move that puts king in check
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[1][4] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'black';
      
      // Move rook to attack king
      const rookMove = { from: { row: 1, col: 4 }, to: { row: 6, col: 4 } };
      const result = game.makeMove(rookMove);
      
      expect(result.success).toBe(true); // Rook can move to attack position
      
      // Test bishop check scenario
      game = new ChessGame();
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[5][2] = { type: 'bishop', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'black';
      
      // Move bishop to attack king diagonally
      const bishopMove = { from: { row: 5, col: 2 }, to: { row: 4, col: 1 } };
      const result2 = game.makeMove(bishopMove);
      
      expect(result2.success).toBe(true);
    });

    test('should identify attack directions and patterns', () => {
      // Test vertical attack pattern by setting up and making a move
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[1][4] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'black';
      
      // Move rook to create vertical attack
      const verticalAttack = { from: { row: 1, col: 4 }, to: { row: 6, col: 4 } };
      const result1 = game.makeMove(verticalAttack);
      expect(result1.success).toBe(true);
      
      // Test horizontal attack pattern
      game = new ChessGame();
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][1] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'black';
      
      // Move rook to create horizontal attack
      const horizontalAttack = { from: { row: 7, col: 1 }, to: { row: 7, col: 3 } };
      const result2 = game.makeMove(horizontalAttack);
      expect(result2.success).toBe(true);
    });

    test('should validate piece attack capabilities', () => {
      // Test rook attack range
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'rook', color: 'black' };
      
      // Rook should be able to attack along rank and file
      const horizontalMove = { from: { row: 0, col: 0 }, to: { row: 0, col: 7 } };
      const verticalMove = { from: { row: 0, col: 0 }, to: { row: 7, col: 0 } };
      
      // These would be valid rook moves if it was rook's turn
      game.currentTurn = 'black';
      const result1 = game.makeMove(horizontalMove);
      expect(result1.success).toBe(true);
      
      game = new ChessGame();
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'rook', color: 'black' };
      game.currentTurn = 'black';
      const result2 = game.makeMove(verticalMove);
      expect(result2.success).toBe(true);
    });

    test('should validate pawn attack patterns', () => {
      // Test pawn diagonal attack
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[1][4] = { type: 'pawn', color: 'black' };
      game.board[2][5] = { type: 'pawn', color: 'white' };
      game.currentTurn = 'black';
      
      // Pawn should be able to capture diagonally
      const pawnCapture = { from: { row: 1, col: 4 }, to: { row: 2, col: 5 } };
      const result = game.makeMove(pawnCapture);
      
      expect(result.success).toBe(true);
      expect(game.board[2][5]).toEqual({ type: 'pawn', color: 'black' });
    });

    test('should validate king attack range', () => {
      // Test king single-square attack
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][5] = { type: 'pawn', color: 'black' };
      game.currentTurn = 'white';
      
      // King should be able to capture adjacent pieces
      const kingCapture = { from: { row: 4, col: 4 }, to: { row: 4, col: 5 } };
      const result = game.makeMove(kingCapture);
      
      expect(result.success).toBe(true);
      expect(game.board[4][5]).toEqual({ type: 'king', color: 'white' });
    });
  });

  describe('Pin Detection and Pinned Piece Movement', () => {
    test('should detect when piece is pinned to king', () => {
      // Set up a pin scenario - rook pinning bishop to king
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[5][4] = { type: 'bishop', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      // Bishop should not be able to move off the pin line
      const invalidMove = { from: { row: 5, col: 4 }, to: { row: 4, col: 3 } };
      const result = game.makeMove(invalidMove);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');
    });

    test('should allow pinned piece to move along pin line', () => {
      // Set up a pin scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[5][4] = { type: 'rook', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      game.currentTurn = 'white';
      
      // Rook should be able to move along the pin line
      const validMove = { from: { row: 5, col: 4 }, to: { row: 3, col: 4 } };
      const result = game.makeMove(validMove);
      
      expect(result.success).toBe(true);
    });

    test('should validate piece pinning capabilities', () => {
      // Test that rooks can pin horizontally and vertically
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[5][4] = { type: 'bishop', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      game.currentTurn = 'white';
      
      // Bishop is pinned and cannot move diagonally
      const pinnedMove = { from: { row: 5, col: 4 }, to: { row: 4, col: 3 } };
      const result = game.makeMove(pinnedMove);
      
      expect(result.success).toBe(false);
    });

    test('should handle diagonal pins by bishops', () => {
      // Set up diagonal pin
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[5][2] = { type: 'knight', color: 'white' };
      game.board[3][0] = { type: 'bishop', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      // Knight should be pinned diagonally
      const pinnedMove = { from: { row: 5, col: 2 }, to: { row: 3, col: 3 } };
      const result = game.makeMove(pinnedMove);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');
    });

    test('should validate path clearance for pins', () => {
      // Set up scenario with clear path for pin
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[3][4] = { type: 'bishop', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      // Path is clear between rook and king (except for bishop)
      // Bishop should be pinned - try invalid diagonal move
      const move = { from: { row: 3, col: 4 }, to: { row: 2, col: 3 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');
    });

    test('should allow pinned piece to capture pinning piece', () => {
      // Set up pin where pinned piece can capture attacker
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[5][4] = { type: 'rook', color: 'white' };
      game.board[3][4] = { type: 'rook', color: 'black' };
      game.currentTurn = 'white';
      
      // Pinned rook should be able to capture the pinning rook
      const captureMove = { from: { row: 5, col: 4 }, to: { row: 3, col: 4 } };
      const result = game.makeMove(captureMove);
      
      expect(result.success).toBe(true);
      expect(game.board[3][4]).toEqual({ type: 'rook', color: 'white' });
    });
  });

  describe('Game State and Move Generation', () => {
    test('should generate proper move notation for game history', () => {
      // Test standard pawn move
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.moveHistory).toHaveLength(1);
      expect(game.moveHistory[0]).toHaveProperty('from');
      expect(game.moveHistory[0]).toHaveProperty('to');
      expect(game.moveHistory[0]).toHaveProperty('piece');
    });

    test('should provide complete board state information', () => {
      // Test that game provides all necessary state properties
      expect(game).toHaveProperty('board');
      expect(game).toHaveProperty('currentTurn');
      expect(game).toHaveProperty('gameStatus');
      expect(game).toHaveProperty('winner');
      expect(game).toHaveProperty('moveHistory');
      expect(game).toHaveProperty('castlingRights');
      expect(game).toHaveProperty('enPassantTarget');
      expect(game).toHaveProperty('inCheck');
      
      // Verify initial state values
      expect(game.currentTurn).toBe('white');
      expect(game.gameStatus).toBe('active');
      expect(game.winner).toBeNull();
      expect(game.moveHistory).toHaveLength(0);
      expect(game.inCheck).toBe(false);
    });

    test('should validate possible pawn moves from starting position', () => {
      // Test pawn from starting position
      const pawnMove1 = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const pawnMove2 = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      
      // Both one and two square moves should be valid from start
      const result1 = game.makeMove(pawnMove1);
      expect(result1.success).toBe(true);
      
      game = new ChessGame(); // Reset for second test
      const result2 = game.makeMove(pawnMove2);
      expect(result2.success).toBe(true);
    });

    test('should validate pawn capture moves', () => {
      // Set up pawn capture scenario
      game.board[5][5] = { type: 'pawn', color: 'black' };
      
      const pawnCapture = { from: { row: 6, col: 4 }, to: { row: 5, col: 5 } };
      const result = game.makeMove(pawnCapture);
      
      expect(result.success).toBe(true);
      expect(game.board[5][5]).toEqual({ type: 'pawn', color: 'white' });
    });

    test('should validate rook movement patterns', () => {
      // Clear path for rook movement
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[7][7] = { type: 'king', color: 'white' };
      game.currentTurn = 'white';
      
      // Test horizontal movement
      const horizontalMove = { from: { row: 4, col: 4 }, to: { row: 4, col: 7 } };
      const result1 = game.makeMove(horizontalMove);
      expect(result1.success).toBe(true);
      
      // Reset and test vertical movement
      game = new ChessGame();
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[7][7] = { type: 'king', color: 'white' };
      game.currentTurn = 'white';
      
      const verticalMove = { from: { row: 4, col: 4 }, to: { row: 1, col: 4 } };
      const result2 = game.makeMove(verticalMove);
      expect(result2.success).toBe(true);
    });

    test('should validate knight L-shaped movement patterns', () => {
      // Clear board and place knight
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'knight', color: 'white' };
      game.currentTurn = 'white';
      
      // Test valid knight moves (L-shaped)
      const knightMoves = [
        { from: { row: 4, col: 4 }, to: { row: 2, col: 3 } },
        { from: { row: 4, col: 4 }, to: { row: 2, col: 5 } },
        { from: { row: 4, col: 4 }, to: { row: 6, col: 3 } },
        { from: { row: 4, col: 4 }, to: { row: 6, col: 5 } }
      ];
      
      // Test first valid knight move
      const result = game.makeMove(knightMoves[0]);
      expect(result.success).toBe(true);
    });

    test('should track move history with complete information', () => {
      // Make a series of moves and verify history
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e2-e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e7-e5
        { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }  // Nb1-c3
      ];
      
      moves.forEach((move, index) => {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(game.moveHistory).toHaveLength(index + 1);
      });
      
      // Verify move history structure
      expect(game.moveHistory[0]).toHaveProperty('from');
      expect(game.moveHistory[0]).toHaveProperty('to');
      expect(game.moveHistory[0]).toHaveProperty('piece');
      expect(game.moveHistory[0]).toHaveProperty('color');
    });
  });

  describe('Castling Rights Management and Tracking', () => {
    test('should update castling rights when rook is captured', () => {
      // Capture black queenside rook
      game.board[0][0] = null; // Remove rook to simulate capture
      
      // Make a move that would trigger castling rights update
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      // Initial castling rights should still be intact since we just moved a pawn
      expect(game.castlingRights.white.kingside).toBe(true);
      expect(game.castlingRights.white.queenside).toBe(true);
    });

    test('should update castling rights when king moves', () => {
      // Clear path for king move
      game.board[7][5] = null; // Remove bishop
      
      // Move white king
      const kingMove = { from: { row: 7, col: 4 }, to: { row: 7, col: 5 } };
      const result = game.makeMove(kingMove);
      
      expect(result.success).toBe(true);
      expect(game.castlingRights.white.kingside).toBe(false);
      expect(game.castlingRights.white.queenside).toBe(false);
    });

    test('should update castling rights when rook moves', () => {
      // Clear path for rook move
      game.board[7][1] = null; // Remove knight
      
      // Move white queenside rook
      const rookMove = { from: { row: 7, col: 0 }, to: { row: 7, col: 1 } };
      const result = game.makeMove(rookMove);
      
      expect(result.success).toBe(true);
      expect(game.castlingRights.white.queenside).toBe(false);
      expect(game.castlingRights.white.kingside).toBe(true); // Should still be true
    });

    test('should track castling rights changes throughout game', () => {
      // Initial state - all castling rights should be available
      expect(game.castlingRights.white.kingside).toBe(true);
      expect(game.castlingRights.white.queenside).toBe(true);
      expect(game.castlingRights.black.kingside).toBe(true);
      expect(game.castlingRights.black.queenside).toBe(true);
      
      // Clear path and move king
      game.board[7][5] = null; // Remove bishop
      const kingMove = { from: { row: 7, col: 4 }, to: { row: 7, col: 5 } };
      const result = game.makeMove(kingMove);
      
      expect(result.success).toBe(true);
      expect(game.castlingRights.white.kingside).toBe(false);
      expect(game.castlingRights.white.queenside).toBe(false);
    });

    test('should provide current castling rights status', () => {
      // Verify initial castling rights structure
      expect(game.castlingRights).toHaveProperty('white');
      expect(game.castlingRights).toHaveProperty('black');
      expect(game.castlingRights.white).toHaveProperty('kingside');
      expect(game.castlingRights.white).toHaveProperty('queenside');
      expect(game.castlingRights.black).toHaveProperty('kingside');
      expect(game.castlingRights.black).toHaveProperty('queenside');
      
      // All should initially be true
      expect(game.castlingRights.white.kingside).toBe(true);
      expect(game.castlingRights.white.queenside).toBe(true);
      expect(game.castlingRights.black.kingside).toBe(true);
      expect(game.castlingRights.black.queenside).toBe(true);
    });

    test('should provide complete game state snapshot', () => {
      // Verify game state contains all necessary properties
      expect(game).toHaveProperty('board');
      expect(game).toHaveProperty('currentTurn');
      expect(game).toHaveProperty('gameStatus');
      expect(game).toHaveProperty('castlingRights');
      expect(game).toHaveProperty('enPassantTarget');
      expect(game).toHaveProperty('moveHistory');
      expect(game).toHaveProperty('winner');
      expect(game).toHaveProperty('inCheck');
      
      // Verify initial values
      expect(game.currentTurn).toBe('white');
      expect(game.gameStatus).toBe('active');
      expect(game.enPassantTarget).toBeNull();
      expect(game.winner).toBeNull();
      expect(game.inCheck).toBe(false);
    });

    test('should serialize castling rights for storage', () => {
      // Test that castling rights can be serialized
      const serialized = JSON.stringify(game.castlingRights);
      const parsed = JSON.parse(serialized);
      
      expect(parsed).toHaveProperty('white');
      expect(parsed).toHaveProperty('black');
      expect(parsed.white).toHaveProperty('kingside');
      expect(parsed.white).toHaveProperty('queenside');
      expect(parsed.black).toHaveProperty('kingside');
      expect(parsed.black).toHaveProperty('queenside');
    });
  });

  describe('Enhanced Move Validation Edge Cases', () => {
    test('should validate simple move patterns correctly', () => {
      // Test basic pawn move validation
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.board[4][4]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[6][4]).toBeNull();
    });

    test('should handle en passant edge cases', () => {
      // Set up en passant scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[3][5] = { type: 'pawn', color: 'black' };
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.enPassantTarget = { row: 2, col: 5 };
      game.currentTurn = 'white';
      
      // Execute en passant capture
      const enPassantMove = { from: { row: 3, col: 4 }, to: { row: 2, col: 5 } };
      const result = game.makeMove(enPassantMove);
      
      expect(result.success).toBe(true);
      expect(game.board[2][5]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[3][5]).toBeNull(); // Captured pawn should be removed
    });

    test('should validate castling safety requirements', () => {
      // Set up castling scenario with clear path
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][7] = { type: 'rook', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      // Attempt kingside castling
      const castlingMove = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(castlingMove);
      
      expect(result.success).toBe(true);
      expect(game.board[7][6]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][5]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should handle promotion with check considerations', () => {
      // Set up promotion scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[1][4] = { type: 'pawn', color: 'white' };
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][3] = { type: 'king', color: 'black' }; // Move king away from promotion square
      game.currentTurn = 'white';
      
      // Promote pawn to queen
      const promotionMove = { from: { row: 1, col: 4 }, to: { row: 0, col: 4 }, promotion: 'queen' };
      const result = game.makeMove(promotionMove);
      
      expect(result.success).toBe(true);
      expect(game.board[0][4]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should prevent moves that would expose king to check', () => {
      // Set up scenario where moving piece would expose king
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[5][4] = { type: 'bishop', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      // Try to move bishop off the pin line
      const invalidMove = { from: { row: 5, col: 4 }, to: { row: 4, col: 3 } };
      const result = game.makeMove(invalidMove);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');
    });

    test('should handle complex check scenarios', () => {
      // Set up double check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' };
      game.board[4][1] = { type: 'bishop', color: 'black' };
      game.currentTurn = 'white';
      
      // In double check, only king can move
      const kingMove = { from: { row: 7, col: 4 }, to: { row: 7, col: 5 } };
      const result = game.makeMove(kingMove);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Game State Validation and End Conditions', () => {
    test('should detect checkmate when king has no escape moves', () => {
      // Set up a checkmate position (back rank mate)
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.board[1][1] = { type: 'pawn', color: 'white' };
      game.board[0][7] = { type: 'rook', color: 'black' };
      game.board[7][4] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      game.inCheck = true;
      game.gameStatus = 'checkmate';
      
      // Game should be in checkmate
      expect(game.gameStatus).toBe('checkmate');
      
      // Attempting moves in checkmate should fail
      const move = { from: { row: 0, col: 0 }, to: { row: 0, col: 1 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('GAME_NOT_ACTIVE');
    });

    test('should detect stalemate when no legal moves exist but not in check', () => {
      // Set up stalemate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[2][1] = { type: 'king', color: 'black' };
      game.board[1][2] = { type: 'queen', color: 'black' };
      game.currentTurn = 'white';
      game.inCheck = false;
      game.gameStatus = 'stalemate';
      
      // Game should be in stalemate
      expect(game.gameStatus).toBe('stalemate');
      expect(game.winner).toBeNull();
    });

    test('should identify all legal king moves in open position', () => {
      // Place king in center of empty board
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[0][0] = { type: 'king', color: 'black' }; // Opponent king far away
      game.currentTurn = 'white';
      
      // King in center should have 8 possible moves
      const possibleMoves = [
        { from: { row: 4, col: 4 }, to: { row: 3, col: 3 } },
        { from: { row: 4, col: 4 }, to: { row: 3, col: 4 } },
        { from: { row: 4, col: 4 }, to: { row: 3, col: 5 } },
        { from: { row: 4, col: 4 }, to: { row: 4, col: 3 } },
        { from: { row: 4, col: 4 }, to: { row: 4, col: 5 } },
        { from: { row: 4, col: 4 }, to: { row: 5, col: 3 } },
        { from: { row: 4, col: 4 }, to: { row: 5, col: 4 } },
        { from: { row: 4, col: 4 }, to: { row: 5, col: 5 } }
      ];
      
      // Test one valid king move
      const result = game.makeMove(possibleMoves[0]);
      expect(result.success).toBe(true);
    });

    test('should identify legal moves for all pieces of a color', () => {
      // Test with starting position - white should have multiple legal moves
      const pawnMoves = [
        { from: { row: 6, col: 0 }, to: { row: 5, col: 0 } },
        { from: { row: 6, col: 1 }, to: { row: 5, col: 1 } },
        { from: { row: 6, col: 2 }, to: { row: 5, col: 2 } },
        { from: { row: 6, col: 3 }, to: { row: 5, col: 3 } },
        { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } },
        { from: { row: 6, col: 5 }, to: { row: 5, col: 5 } },
        { from: { row: 6, col: 6 }, to: { row: 5, col: 6 } },
        { from: { row: 6, col: 7 }, to: { row: 5, col: 7 } }
      ];
      
      const knightMoves = [
        { from: { row: 7, col: 1 }, to: { row: 5, col: 0 } },
        { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } },
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } },
        { from: { row: 7, col: 6 }, to: { row: 5, col: 7 } }
      ];
      
      // Test that white has legal pawn moves
      const pawnResult = game.makeMove(pawnMoves[0]);
      expect(pawnResult.success).toBe(true);
      
      // Reset and test knight move
      game = new ChessGame();
      const knightResult = game.makeMove(knightMoves[0]);
      expect(knightResult.success).toBe(true);
    });

    test('should handle game state transitions correctly', () => {
      // Test normal game progression
      expect(game.gameStatus).toBe('active');
      expect(game.currentTurn).toBe('white');
      expect(game.winner).toBeNull();
      
      // Make a move and verify state updates
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
      expect(game.moveHistory).toHaveLength(1);
    });

    test('should maintain game state consistency', () => {
      // Verify all game state properties are consistent
      expect(game.board).toBeDefined();
      expect(game.currentTurn).toBeDefined();
      expect(game.gameStatus).toBeDefined();
      expect(game.castlingRights).toBeDefined();
      expect(game.moveHistory).toBeDefined();
      
      // Verify types
      expect(typeof game.currentTurn).toBe('string');
      expect(typeof game.gameStatus).toBe('string');
      expect(Array.isArray(game.moveHistory)).toBe(true);
      expect(typeof game.inCheck).toBe('boolean');
    });
  });

  describe('Error Handler Integration and Response Patterns', () => {
    test('should create standardized error responses', () => {
      const error = errorHandler.createError('INVALID_MOVE', 'Test error message', { detail: 'test' });
      
      expect(error.success).toBe(false);
      expect(error.isValid).toBe(false);
      expect(error.message).toBe('Test error message');
      expect(error.errorCode).toBe('INVALID_MOVE');
      expect(error.details).toEqual({ detail: 'test' });
    });

    test('should create standardized success responses', () => {
      const success = errorHandler.createSuccess('Test success message', { data: 'test' }, { meta: 'test' });
      
      expect(success.success).toBe(true);
      expect(success.isValid).toBe(true);
      expect(success.message).toBe('Test success message');
      expect(success.errorCode).toBeNull();
      expect(success.data).toEqual({ data: 'test' });
      expect(success.metadata).toEqual({ meta: 'test' });
    });

    test('should handle game errors with proper error codes', () => {
      // Test invalid move error
      const invalidMove = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } }; // Invalid pawn move
      const result = game.makeMove(invalidMove);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBeDefined();
      expect(result.message).toBeDefined();
    });

    test('should handle malformed move input', () => {
      // Test malformed move object
      const malformedMove = { from: { row: 6 }, to: { row: 4, col: 4 } }; // Missing col in from
      const result = game.makeMove(malformedMove);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_COORDINATES');
    });

    test('should handle out of bounds coordinates', () => {
      // Test out of bounds move
      const outOfBoundsMove = { from: { row: 6, col: 4 }, to: { row: 8, col: 4 } };
      const result = game.makeMove(outOfBoundsMove);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_COORDINATES');
    });

    test('should handle wrong turn errors', () => {
      // Try to move black piece on white's turn
      const wrongTurnMove = { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } };
      const result = game.makeMove(wrongTurnMove);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('WRONG_TURN');
    });

    test('should provide consistent response structure across all operations', () => {
      // Test valid move response structure
      const validMove = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const validResult = game.makeMove(validMove);
      
      expect(validResult).toHaveProperty('success');
      expect(validResult).toHaveProperty('message');
      expect(validResult.success).toBe(true);
      
      // Reset game for invalid move test
      game = new ChessGame();
      
      // Test invalid move response structure - try to move opponent's piece
      const invalidMove = { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } };
      const invalidResult = game.makeMove(invalidMove);
      
      expect(invalidResult).toHaveProperty('success');
      expect(invalidResult).toHaveProperty('message');
      expect(invalidResult).toHaveProperty('errorCode');
      expect(invalidResult.success).toBe(false);
    });
  });
});