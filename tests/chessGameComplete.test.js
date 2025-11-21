/**
 * Complete ChessGame Coverage Tests
 * Target: 100% coverage for ChessGame
 */

const ChessGame = require('../src/shared/chessGame');

describe('ChessGame - Complete Coverage', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Error Handling and Edge Cases', () => {
    test('makeMove handles system error in try-catch', () => {
      // Force an error by corrupting the validation method
      const originalValidate = game.validateMoveFormat;
      game.validateMoveFormat = () => {
        throw new Error('Forced error for coverage');
      };

      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      
      game.validateMoveFormat = originalValidate;
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('SYSTEM_ERROR');
    });

    test('validateGameState handles system error', () => {
      // Force an error by corrupting board
      const originalBoard = game.board;
      game.board = { invalid: 'structure' };

      const result = game.validateGameState();
      
      game.board = originalBoard;
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('SYSTEM_ERROR');
    });

    test('validatePieceAtSquare detects invalid piece type', () => {
      game.board[4][4] = { type: 'dragon', color: 'white' };
      
      const result = game.validatePieceAtSquare({ row: 4, col: 4 });
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_PIECE_TYPE');
    });

    test('validatePieceAtSquare detects invalid piece color', () => {
      game.board[4][4] = { type: 'pawn', color: 'red' };
      
      const result = game.validatePieceAtSquare({ row: 4, col: 4 });
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_PIECE_COLOR');
    });

    test('validatePieceAtSquare handles system error', () => {
      // Force an error
      const originalBoard = game.board;
      game.board = null;

      const result = game.validatePieceAtSquare({ row: 4, col: 4 });
      
      game.board = originalBoard;
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('SYSTEM_ERROR');
    });
  });

  describe('Move Format Validation Edge Cases', () => {
    test('validateMoveFormat detects non-integer to.row', () => {
      const result = game.makeMove({ 
        from: { row: 6, col: 4 }, 
        to: { row: 4.5, col: 4 } 
      });
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_COORDINATES');
    });

    test('validateMoveFormat detects non-finite to.row', () => {
      const result = game.makeMove({ 
        from: { row: 6, col: 4 }, 
        to: { row: Infinity, col: 4 } 
      });
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_COORDINATES');
    });

    test('validateMoveFormat detects non-integer to.col', () => {
      const result = game.makeMove({ 
        from: { row: 6, col: 4 }, 
        to: { row: 4, col: 4.5 } 
      });
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_COORDINATES');
    });

    test('validateMoveFormat detects non-finite to.col', () => {
      const result = game.makeMove({ 
        from: { row: 6, col: 4 }, 
        to: { row: 4, col: Infinity } 
      });
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_COORDINATES');
    });

    test('validateMoveFormat detects non-string promotion', () => {
      game.board[1][4] = { type: 'pawn', color: 'white' };
      game.board[0][4] = null;
      game.currentTurn = 'white';
      
      const result = game.makeMove(
        { from: { row: 1, col: 4 }, to: { row: 0, col: 4 } },
        null,
        123
      );
      expect(result.success).toBe(false);
    });

    test('validateMoveFormat detects invalid promotion piece', () => {
      game.board[1][4] = { type: 'pawn', color: 'white' };
      game.board[0][4] = null;
      game.currentTurn = 'white';
      
      const result = game.makeMove(
        { from: { row: 1, col: 4 }, to: { row: 0, col: 4 } },
        null,
        'king'
      );
      expect(result.success).toBe(false);
    });
  });

  describe('Piece Movement Validation', () => {
    test('validates pawn cannot move backward', () => {
      game.board[4][4] = { type: 'pawn', color: 'white' };
      game.board[6][4] = null;
      game.currentTurn = 'white';
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 5, col: 4 } });
      expect(result.success).toBe(false);
    });

    test('validates pawn cannot move two squares from non-starting position', () => {
      game.board[4][4] = { type: 'pawn', color: 'white' };
      game.board[6][4] = null;
      game.currentTurn = 'white';
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 4 } });
      expect(result.success).toBe(false);
    });

    test('validates rook cannot move diagonally', () => {
      game.board[4][4] = { type: 'rook', color: 'white' };
      game.currentTurn = 'white';
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 2 } });
      expect(result.success).toBe(false);
    });

    test('validates bishop cannot move horizontally', () => {
      game.board[4][4] = { type: 'bishop', color: 'white' };
      game.currentTurn = 'white';
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 6 } });
      expect(result.success).toBe(false);
    });

    test('validates knight L-shape movement', () => {
      game.board[4][4] = { type: 'knight', color: 'white' };
      game.currentTurn = 'white';
      
      // Invalid non-L-shape move
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 4, col: 6 } });
      expect(result.success).toBe(false);
    });

    test('validates king cannot move more than one square', () => {
      game.board[4][4] = { type: 'king', color: 'white' };
      game.currentTurn = 'white';
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 4 } });
      expect(result.success).toBe(false);
    });

    test('validates queen movement combines rook and bishop', () => {
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.currentTurn = 'white';
      
      // Invalid knight-like move
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 6, col: 5 } });
      expect(result.success).toBe(false);
    });
  });

  describe('Path Blocking Validation', () => {
    test('validates rook path is blocked horizontally', () => {
      game.board[7][0] = { type: 'rook', color: 'white' };
      game.board[7][1] = { type: 'knight', color: 'white' };
      game.currentTurn = 'white';
      
      const result = game.makeMove({ from: { row: 7, col: 0 }, to: { row: 7, col: 3 } });
      expect(result.success).toBe(false);
    });

    test('validates rook path is blocked vertically', () => {
      game.board[7][0] = { type: 'rook', color: 'white' };
      game.board[6][0] = { type: 'pawn', color: 'white' };
      game.currentTurn = 'white';
      
      const result = game.makeMove({ from: { row: 7, col: 0 }, to: { row: 4, col: 0 } });
      expect(result.success).toBe(false);
    });

    test('validates bishop path is blocked diagonally', () => {
      game.board[7][2] = { type: 'bishop', color: 'white' };
      game.board[6][3] = { type: 'pawn', color: 'white' };
      game.currentTurn = 'white';
      
      const result = game.makeMove({ from: { row: 7, col: 2 }, to: { row: 4, col: 5 } });
      expect(result.success).toBe(false);
    });

    test('validates queen path is blocked', () => {
      game.board[7][3] = { type: 'queen', color: 'white' };
      game.board[6][3] = { type: 'pawn', color: 'white' };
      game.currentTurn = 'white';
      
      const result = game.makeMove({ from: { row: 7, col: 3 }, to: { row: 4, col: 3 } });
      expect(result.success).toBe(false);
    });
  });

  describe('Check and Checkmate Scenarios', () => {
    test('validates move that would put own king in check', () => {
      // Setup: white king in potential check
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][3] = { type: 'rook', color: 'white' };
      game.board[0][3] = { type: 'rook', color: 'black' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      
      // Moving the rook would expose king to check
      const result = game.makeMove({ from: { row: 7, col: 3 }, to: { row: 7, col: 2 } });
      expect(result.success).toBe(false);
    });

    test('detects check from knight', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.board[5][3] = { type: 'knight', color: 'black' };
      game.currentTurn = 'white';
      game.updateGameStatus();
      
      expect(game.inCheck).toBe(true);
    });

    test('detects check from bishop', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.board[4][1] = { type: 'bishop', color: 'black' };
      game.currentTurn = 'white';
      game.updateGameStatus();
      
      expect(game.inCheck).toBe(true);
    });

    test('detects check from pawn', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.board[6][3] = { type: 'pawn', color: 'black' };
      game.currentTurn = 'white';
      game.updateGameStatus();
      
      expect(game.inCheck).toBe(true);
    });

    test('detects checkmate', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][7] = { type: 'king', color: 'white' };
      game.board[6][7] = { type: 'rook', color: 'black' };
      game.board[7][6] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';
      game.updateGameStatus();
      
      expect(game.gameStatus).toBe('checkmate');
      expect(game.winner).toBe('black');
    });

    test('detects stalemate', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[2][1] = { type: 'queen', color: 'white' };
      game.board[1][2] = { type: 'king', color: 'white' };
      game.currentTurn = 'black';
      game.updateGameStatus();
      
      expect(game.gameStatus).toBe('stalemate');
    });
  });

  describe('Special Moves', () => {
    test('validates castling kingside', () => {
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      expect(result.success).toBe(true);
      expect(game.board[7][6].type).toBe('king');
      expect(game.board[7][5].type).toBe('rook');
    });

    test('validates castling queenside', () => {
      game.board[7][1] = null;
      game.board[7][2] = null;
      game.board[7][3] = null;
      
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 2 } });
      expect(result.success).toBe(true);
      expect(game.board[7][2].type).toBe('king');
      expect(game.board[7][3].type).toBe('rook');
    });

    test('validates en passant capture', () => {
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[1][5] = { type: 'pawn', color: 'black' };
      game.board[6][5] = null;
      game.currentTurn = 'black';
      
      game.makeMove({ from: { row: 1, col: 5 }, to: { row: 3, col: 5 } });
      const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 5 } });
      
      expect(result.success).toBe(true);
      expect(game.board[3][5]).toBeNull();
    });

    test('validates pawn promotion to queen', () => {
      game.board[1][4] = { type: 'pawn', color: 'white' };
      game.board[0][4] = null;
      game.currentTurn = 'white';
      
      const result = game.makeMove(
        { from: { row: 1, col: 4 }, to: { row: 0, col: 4 } },
        null,
        'queen'
      );
      
      expect(result.success).toBe(true);
      expect(game.board[0][4].type).toBe('queen');
    });

    test('validates pawn promotion to rook', () => {
      game.board[1][5] = { type: 'pawn', color: 'white' };
      game.board[0][5] = null;
      game.currentTurn = 'white';
      
      const result = game.makeMove(
        { from: { row: 1, col: 5 }, to: { row: 0, col: 5 } },
        null,
        'rook'
      );
      
      expect(result.success).toBe(true);
      expect(game.board[0][5].type).toBe('rook');
    });

    test('validates pawn promotion to bishop', () => {
      game.board[1][6] = { type: 'pawn', color: 'white' };
      game.board[0][6] = null;
      game.currentTurn = 'white';
      
      const result = game.makeMove(
        { from: { row: 1, col: 6 }, to: { row: 0, col: 6 } },
        null,
        'bishop'
      );
      
      expect(result.success).toBe(true);
      expect(game.board[0][6].type).toBe('bishop');
    });

    test('validates pawn promotion to knight', () => {
      game.board[1][7] = { type: 'pawn', color: 'white' };
      game.board[0][7] = null;
      game.currentTurn = 'white';
      
      const result = game.makeMove(
        { from: { row: 1, col: 7 }, to: { row: 0, col: 7 } },
        null,
        'knight'
      );
      
      expect(result.success).toBe(true);
      expect(game.board[0][7].type).toBe('knight');
    });
  });

  describe('Game State Management', () => {
    test('getGameState returns complete state', () => {
      const state = game.getGameState();
      
      expect(state.board).toBeDefined();
      expect(state.currentTurn).toBe('white');
      expect(state.gameStatus).toBe('active');
      expect(state.moveHistory).toEqual([]);
      expect(state.castlingRights).toBeDefined();
      expect(state.inCheck).toBe(false);
    });

    test('move history tracks all moves', () => {
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
      game.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } });
      
      expect(game.moveHistory.length).toBe(3);
      expect(game.moveHistory[0].piece).toBe('pawn');
      expect(game.moveHistory[1].piece).toBe('pawn');
      expect(game.moveHistory[2].piece).toBe('knight');
    });

    test('castling rights are updated after king moves', () => {
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 5 } });
      
      expect(game.castlingRights.white.kingSide).toBe(false);
      expect(game.castlingRights.white.queenSide).toBe(false);
    });

    test('castling rights are updated after rook moves', () => {
      game.board[6][0] = null;
      
      game.makeMove({ from: { row: 7, col: 0 }, to: { row: 6, col: 0 } });
      
      expect(game.castlingRights.white.queenSide).toBe(false);
    });

    test('en passant target is set after pawn two-square move', () => {
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      
      expect(game.enPassantTarget).toEqual({ row: 5, col: 4 });
    });

    test('en passant target is cleared after other moves', () => {
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } });
      game.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } });
      
      expect(game.enPassantTarget).toBeNull();
    });
  });
});
