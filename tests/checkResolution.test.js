const ChessGame = require('../src/shared/chessGame');

describe('Check Resolution Validation', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Check Resolution Through Blocking', () => {
    test('should allow blocking rook check with piece', () => {
      // Set up rook check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[6][1] = { type: 'rook', color: 'white' }; // Piece that can block
      game.board[0][0] = { type: 'king', color: 'black' }; // Add missing black king
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // Block the check by moving rook
      const result = game.makeMove({
        from: { row: 6, col: 1 },
        to: { row: 4, col: 1 } // Blocks rook attack
      });

      expect(result.success).toBe(true);
    });

    test('should allow blocking bishop check with piece', () => {
      // Set up bishop check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[0][0] = { type: 'bishop', color: 'black' };
      game.board[5][2] = { type: 'knight', color: 'white' }; // Piece that can block
      game.board[7][0] = { type: 'king', color: 'black' }; // Add missing black king
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // Block the check by moving knight
      const result = game.makeMove({
        from: { row: 5, col: 2 },
        to: { row: 3, col: 3 } // Blocks bishop attack on diagonal
      });

      expect(result.success).toBe(true);
    });

    test('should allow blocking queen check with piece', () => {
      // Set up queen check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'queen', color: 'black' };
      game.board[5][1] = { type: 'pawn', color: 'white' }; // Piece that can block
      game.board[0][7] = { type: 'king', color: 'black' }; // Add missing black king
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // Block the check by moving pawn
      const result = game.makeMove({
        from: { row: 5, col: 1 },
        to: { row: 4, col: 1 } // Blocks queen attack
      });

      expect(result.success).toBe(true);
    });

    test('should reject move that does not block check', () => {
      // Set up rook check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[6][2] = { type: 'bishop', color: 'white' }; // Piece that won't block
      game.board[0][7] = { type: 'king', color: 'black' }; // Add missing black king
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // Try to move piece that doesn't block check
      const result = game.makeMove({
        from: { row: 6, col: 2 },
        to: { row: 5, col: 3 } // Doesn't block rook attack
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CHECK_NOT_RESOLVED');
    });

    test('should not allow blocking knight check (knights cannot be blocked)', () => {
      // Set up knight check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[2][3] = { type: 'knight', color: 'black' };
      game.board[6][1] = { type: 'rook', color: 'white' }; // Piece that tries to "block"
      game.board[0][0] = { type: 'king', color: 'black' }; // Add missing black king
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // Try to "block" knight check with a valid move (should fail because knights can't be blocked)
      const result = game.makeMove({
        from: { row: 6, col: 1 },
        to: { row: 3, col: 1 } // Valid rook move but doesn't resolve knight check
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CHECK_NOT_RESOLVED');
    });
  });

  describe('Check Resolution Through Capturing', () => {
    test('should allow capturing attacking rook', () => {
      // Set up rook check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[2][0] = { type: 'rook', color: 'white' }; // Piece that can capture
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // Capture the attacking rook
      const result = game.makeMove({
        from: { row: 2, col: 0 },
        to: { row: 4, col: 0 } // Captures attacking rook
      });

      expect(result.success).toBe(true);
    });

    test('should allow capturing attacking bishop', () => {
      // Set up bishop check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[1][1] = { type: 'bishop', color: 'black' };
      game.board[0][2] = { type: 'bishop', color: 'white' }; // Piece that can capture diagonally
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // Capture the attacking bishop
      const result = game.makeMove({
        from: { row: 0, col: 2 },
        to: { row: 1, col: 1 } // Captures attacking bishop
      });

      expect(result.success).toBe(true);
    });

    test('should allow capturing attacking knight', () => {
      // Set up knight check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[2][3] = { type: 'knight', color: 'black' };
      game.board[2][1] = { type: 'queen', color: 'white' }; // Piece that can capture
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // Capture the attacking knight
      const result = game.makeMove({
        from: { row: 2, col: 1 },
        to: { row: 2, col: 3 } // Captures attacking knight (horizontal move)
      });

      expect(result.success).toBe(true);
    });

    test('should allow capturing attacking pawn', () => {
      // Set up pawn check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'black' };
      game.board[2][2] = { type: 'bishop', color: 'white' }; // Piece that can capture
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // Capture the attacking pawn
      const result = game.makeMove({
        from: { row: 2, col: 2 },
        to: { row: 3, col: 3 } // Captures attacking pawn
      });

      expect(result.success).toBe(true);
    });

    test('should allow king to capture attacking piece', () => {
      // Set up scenario where king can capture attacker
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[3][4] = { type: 'rook', color: 'black' }; // Adjacent attacking piece
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // King captures the attacking rook
      const result = game.makeMove({
        from: { row: 4, col: 4 },
        to: { row: 3, col: 4 } // King captures attacking rook
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Check Resolution Through King Movement', () => {
    test('should allow king to move out of check', () => {
      // Set up rook check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // King moves out of check
      const result = game.makeMove({
        from: { row: 4, col: 4 },
        to: { row: 3, col: 4 } // King moves to safe square
      });

      expect(result.success).toBe(true);
    });

    test('should reject king move that stays in check', () => {
      // Set up rook check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // King tries to move but stays in check
      const result = game.makeMove({
        from: { row: 4, col: 4 },
        to: { row: 4, col: 5 } // Still on same rank as attacking rook
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('KING_IN_CHECK');
    });

    test('should reject king move into another check', () => {
      // Set up scenario with multiple threats
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[3][0] = { type: 'rook', color: 'black' }; // Another threat
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // King tries to move but enters another check
      const result = game.makeMove({
        from: { row: 4, col: 4 },
        to: { row: 3, col: 4 } // Moves into check from second rook
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('KING_IN_CHECK');
    });
  });

  describe('Double Check Resolution', () => {
    test('should only allow king moves in double check', () => {
      // Set up double check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'bishop', color: 'black' };
      game.board[6][2] = { type: 'knight', color: 'white' }; // Piece that tries to help
      game.currentTurn = 'white';

      // Verify king is in double check
      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
      expect(game.checkDetails.isDoubleCheck).toBe(true);

      // Try to move non-king piece (should fail)
      const result = game.makeMove({
        from: { row: 6, col: 2 },
        to: { row: 4, col: 1 } // Tries to block one of the attacks
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DOUBLE_CHECK_KING_ONLY');
    });

    test('should allow king move in double check if it escapes both attacks', () => {
      // Set up double check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'bishop', color: 'black' };
      game.currentTurn = 'white';

      // Verify king is in double check
      expect(game.isInCheck('white')).toBe(true);

      // King moves to escape both attacks
      const result = game.makeMove({
        from: { row: 4, col: 4 },
        to: { row: 5, col: 3 } // Escapes both rook (different row) and bishop (not on diagonal)
      });

      expect(result.success).toBe(true);
    });

    test('should reject king move in double check that escapes only one attack', () => {
      // Set up double check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'bishop', color: 'black' };
      game.currentTurn = 'white';

      // Verify king is in double check
      expect(game.isInCheck('white')).toBe(true);

      // King tries to move but still in check from rook (same row)
      const result = game.makeMove({
        from: { row: 4, col: 4 },
        to: { row: 4, col: 5 } // Still on same row as rook, so still in check
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('KING_IN_CHECK');
    });
  });

  describe('Complex Check Resolution Scenarios', () => {
    test('should handle pinned piece that cannot resolve check', () => {
      // Set up scenario with pinned piece
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' }; // Attacking piece
      game.board[4][2] = { type: 'bishop', color: 'white' }; // Pinned piece
      game.board[4][7] = { type: 'rook', color: 'black' }; // Pinning piece
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // Try to move pinned piece (should fail because it doesn't resolve check and would expose king)
      const result = game.makeMove({
        from: { row: 4, col: 2 },
        to: { row: 3, col: 1 } // Pinned piece tries to move
      });

      expect(result.success).toBe(false);
      // Could be either CHECK_NOT_RESOLVED or KING_IN_CHECK depending on validation order
      expect(['CHECK_NOT_RESOLVED', 'KING_IN_CHECK']).toContain(result.errorCode);
    });

    test('should allow en passant capture to resolve check', () => {
      // Simplified test - just verify en passant moves work when in check
      // Set up basic en passant scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[3][3] = { type: 'king', color: 'white' };
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[3][5] = { type: 'pawn', color: 'black' }; // Black pawn that just moved 2 squares
      game.board[0][3] = { type: 'rook', color: 'black' }; // Attacking king
      game.enPassantTarget = { row: 2, col: 5 }; // En passant target
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // En passant capture that gets out of check line
      const result = game.makeMove({
        from: { row: 3, col: 4 },
        to: { row: 2, col: 5 } // En passant capture
      });

      // This should work if en passant is properly implemented
      expect(result.success).toBe(true);
    });

    test('should handle check resolution with pawn promotion', () => {
      // Set up pawn promotion scenario that resolves check by capturing
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[1][3] = { type: 'pawn', color: 'white' }; // About to promote
      game.board[0][4] = { type: 'rook', color: 'black' }; // Attacking piece that can be captured
      game.board[4][0] = { type: 'rook', color: 'black' }; // Attacking king
      game.currentTurn = 'white';

      // Verify king is in check
      expect(game.isInCheck('white')).toBe(true);

      // Pawn promotes and captures attacking piece
      const result = game.makeMove({
        from: { row: 1, col: 3 },
        to: { row: 0, col: 4 }, // Promotes and captures rook
        promotion: 'queen'
      });

      expect(result.success).toBe(true);
    });
  });
});