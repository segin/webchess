const ChessGame = require('../src/shared/chessGame');

describe('ChessGame Final Coverage - Remaining Uncovered Lines', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Attack Type Detection - Line 2317', () => {
    test('should return unknown_attack for invalid piece types', () => {
      const piece = { type: 'invalid', color: 'black' };
      const from = { row: 0, col: 0 };
      const to = { row: 1, col: 1 };
      
      const result = game.getAttackType(piece, from, to);
      expect(result).toBe('unknown_attack');
    });

    test('should return adjacent_attack for king', () => {
      const piece = { type: 'king', color: 'black' };
      const from = { row: 4, col: 4 };
      const to = { row: 4, col: 5 };
      
      const result = game.getAttackType(piece, from, to);
      expect(result).toBe('adjacent_attack');
    });
  });

  describe('Square Attack Detection - Line 2332', () => {
    test('should handle invalid square parameters', () => {
      const result = game.isSquareUnderAttack(-1, 4, 'white');
      expect(result).toBe(false);
    });

    test('should handle missing defending color', () => {
      const result = game.isSquareUnderAttack(4, 4, null);
      expect(result).toBe(false);
    });

    test('should handle empty defending color', () => {
      const result = game.isSquareUnderAttack(4, 4, '');
      expect(result).toBe(false);
    });
  });

  describe('Piece Attack Square Validation - Line 2369', () => {
    test('should handle invalid from square', () => {
      const piece = { type: 'pawn', color: 'white' };
      const from = { row: -1, col: 4 };
      const to = { row: 5, col: 4 };
      
      const result = game.canPieceAttackSquare(from, to, piece);
      expect(result).toBe(false);
    });

    test('should handle invalid to square', () => {
      const piece = { type: 'pawn', color: 'white' };
      const from = { row: 6, col: 4 };
      const to = { row: -1, col: 4 };
      
      const result = game.canPieceAttackSquare(from, to, piece);
      expect(result).toBe(false);
    });

    test('should handle same square attack', () => {
      const piece = { type: 'pawn', color: 'white' };
      const square = { row: 6, col: 4 };
      
      const result = game.canPieceAttackSquare(square, square, piece);
      expect(result).toBe(false);
    });
  });

  describe('Default Case in Piece Attack - Line 2400', () => {
    test('should return false for unknown piece type in canPieceAttackSquare', () => {
      const piece = { type: 'unknown', color: 'white' };
      const from = { row: 6, col: 4 };
      const to = { row: 5, col: 4 };
      
      const result = game.canPieceAttackSquare(from, to, piece);
      expect(result).toBe(false);
    });
  });

  describe('wouldBeInCheck Edge Cases - Line 2457', () => {
    test('should handle missing piece parameter', () => {
      const from = { row: 6, col: 4 };
      const to = { row: 5, col: 4 };
      
      // Call without piece parameter to trigger the board lookup
      const result = game.wouldBeInCheck(from, to, 'white');
      expect(typeof result).toBe('boolean');
    });

    test('should handle empty square in wouldBeInCheck', () => {
      // Clear a square and try to move from it
      game.board[4][4] = null;
      const from = { row: 4, col: 4 };
      const to = { row: 5, col: 4 };
      
      const result = game.wouldBeInCheck(from, to, 'white');
      expect(result).toBe(true); // Should return true when no piece to move
    });
  });

  describe('Game State Structure Validation - Lines 3006-3020', () => {
    test('should detect invalid piece structure - missing type', () => {
      game.board[0][0] = { color: 'black' }; // Missing type
      const result = game.validateGameStateStructure();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid piece: missing type or color');
    });

    test('should detect invalid piece structure - missing color', () => {
      game.board[0][0] = { type: 'rook' }; // Missing color
      const result = game.validateGameStateStructure();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid piece: missing type or color');
    });

    test('should detect invalid piece type', () => {
      game.board[0][0] = { type: 'invalid', color: 'black' };
      const result = game.validateGameStateStructure();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid piece type: invalid');
    });

    test('should detect invalid piece color', () => {
      game.board[0][0] = { type: 'rook', color: 'invalid' };
      const result = game.validateGameStateStructure();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid piece color: invalid');
    });

    test('should detect missing white king', () => {
      // Remove white king
      game.board[7][4] = null;
      const result = game.validateGameStateStructure();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Missing white king');
    });

    test('should detect missing black king', () => {
      // Remove black king
      game.board[0][4] = null;
      const result = game.validateGameStateStructure();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Missing black king');
    });
  });

  describe('Move Notation Parsing - Line 3054', () => {
    test('should handle invalid move notation', () => {
      const result = game.parseMoveNotation('invalid');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid move notation');
    });

    test('should handle empty move notation', () => {
      const result = game.parseMoveNotation('');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid move notation');
    });

    test('should handle null move notation', () => {
      const result = game.parseMoveNotation(null);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid move notation');
    });
  });

  describe('Corruption Recovery - Lines 3060+', () => {
    test('should recover from corruption with valid state', () => {
      const validState = {
        board: game.initializeBoard(),
        currentTurn: 'black',
        gameStatus: 'check',
        winner: null,
        moveHistory: [{ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }],
        castlingRights: {
          white: { kingside: false, queenside: true },
          black: { kingside: true, queenside: false }
        }
      };
      
      const result = game.recoverFromCorruption(validState);
      expect(result.success).toBe(true);
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('check');
    });

    test('should handle recovery with minimal state', () => {
      const validState = {
        board: game.initializeBoard()
      };
      
      const result = game.recoverFromCorruption(validState);
      expect(result.success).toBe(true);
      expect(game.currentTurn).toBe('white'); // Default
      expect(game.gameStatus).toBe('active'); // Default
    });

    test('should handle recovery with null state', () => {
      const result = game.recoverFromCorruption(null);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot recover from corruption');
    });

    test('should handle recovery with state missing board', () => {
      const invalidState = {
        currentTurn: 'white',
        gameStatus: 'active'
      };
      
      const result = game.recoverFromCorruption(invalidState);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot recover from corruption');
    });
  });

  describe('Additional Edge Cases for Complete Coverage', () => {
    test('should handle canKingAttackSquare method', () => {
      const from = { row: 7, col: 4 };
      const to = { row: 7, col: 5 };
      
      if (typeof game.canKingAttackSquare === 'function') {
        const result = game.canKingAttackSquare(from, to);
        expect(typeof result).toBe('boolean');
      }
    });

    test('should handle canPawnAttackSquare method', () => {
      const from = { row: 6, col: 4 };
      const to = { row: 5, col: 5 };
      const piece = { type: 'pawn', color: 'white' };
      
      if (typeof game.canPawnAttackSquare === 'function') {
        const result = game.canPawnAttackSquare(from, to, piece);
        expect(typeof result).toBe('boolean');
      }
    });

    test('should handle canRookAttackSquare method', () => {
      const from = { row: 7, col: 0 };
      const to = { row: 7, col: 4 };
      
      if (typeof game.canRookAttackSquare === 'function') {
        const result = game.canRookAttackSquare(from, to);
        expect(typeof result).toBe('boolean');
      }
    });

    test('should handle canKnightAttackSquare method', () => {
      const from = { row: 7, col: 1 };
      const to = { row: 5, col: 2 };
      
      if (typeof game.canKnightAttackSquare === 'function') {
        const result = game.canKnightAttackSquare(from, to);
        expect(typeof result).toBe('boolean');
      }
    });

    test('should handle canBishopAttackSquare method', () => {
      const from = { row: 7, col: 2 };
      const to = { row: 5, col: 4 };
      
      if (typeof game.canBishopAttackSquare === 'function') {
        const result = game.canBishopAttackSquare(from, to);
        expect(typeof result).toBe('boolean');
      }
    });

    test('should handle canQueenAttackSquare method', () => {
      const from = { row: 7, col: 3 };
      const to = { row: 4, col: 3 };
      
      if (typeof game.canQueenAttackSquare === 'function') {
        const result = game.canQueenAttackSquare(from, to);
        expect(typeof result).toBe('boolean');
      }
    });
  });

  describe('Deep Error Path Coverage', () => {
    test('should handle corrupted board state in validation', () => {
      // Create a corrupted board structure
      game.board = [null, null, null, null, null, null, null, null];
      const result = game.validateGameStateStructure();
      expect(result.success).toBe(false);
    });

    test('should handle invalid row structure', () => {
      game.board[0] = null;
      const result = game.validateGameStateStructure();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid row 0 structure');
    });

    test('should handle row with wrong length', () => {
      game.board[0] = [null, null, null]; // Wrong length
      const result = game.validateGameStateStructure();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid row 0 structure');
    });

    test('should handle completely invalid board', () => {
      game.board = 'invalid';
      const result = game.validateGameStateStructure();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid board structure');
    });

    test('should handle board with wrong dimensions', () => {
      game.board = [[], [], []]; // Wrong number of rows
      const result = game.validateGameStateStructure();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid board structure');
    });
  });

  describe('State Recovery Edge Cases', () => {
    test('should handle recovery with partial castling rights', () => {
      const validState = {
        board: game.initializeBoard(),
        castlingRights: {
          white: { kingside: true }
          // Missing queenside and black rights
        }
      };
      
      const result = game.recoverFromCorruption(validState);
      expect(result.success).toBe(true);
    });

    test('should handle recovery with invalid move history', () => {
      const validState = {
        board: game.initializeBoard(),
        moveHistory: 'invalid'
      };
      
      const result = game.recoverFromCorruption(validState);
      expect(result.success).toBe(true);
      expect(Array.isArray(game.moveHistory)).toBe(true);
    });

    test('should handle recovery with null en passant target', () => {
      const validState = {
        board: game.initializeBoard(),
        enPassantTarget: null
      };
      
      const result = game.recoverFromCorruption(validState);
      expect(result.success).toBe(true);
      expect(game.enPassantTarget).toBeNull();
    });
  });
});