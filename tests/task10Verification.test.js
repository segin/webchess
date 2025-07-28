const ChessGame = require('../src/shared/chessGame');

describe('Task 10: Move Legality Validation Preventing Self-Check - Verification', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Requirement 3.2: Prevent moves that put own king in check', () => {
    test('should prevent any move that would put the player\'s own king in check', () => {
      // Set up scenario where moving a piece exposes king
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][3] = { type: 'bishop', color: 'white' }; // Blocking piece
      game.board[4][0] = { type: 'rook', color: 'black' }; // Attacking piece
      game.currentTurn = 'white';

      const result = game.makeMove({
        from: { row: 4, col: 3 },
        to: { row: 3, col: 2 } // Moving bishop exposes king
      });

      expect(result.success).toBe(false);
      expect(['KING_IN_CHECK', 'PINNED_PIECE_INVALID_MOVE']).toContain(result.errorCode);
      expect(result.message).toMatch(/king in check|pinned piece/i);
    });

    test('should use temporary move simulation to test for resulting check conditions', () => {
      // Verify that wouldBeInCheck method works correctly
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][3] = { type: 'rook', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };

      // Test that simulation correctly identifies check
      const wouldBeInCheck = game.wouldBeInCheck(
        { row: 4, col: 3 }, 
        { row: 6, col: 3 }, 
        'white'
      );
      expect(wouldBeInCheck).toBe(true);

      // Test that simulation correctly identifies safe move
      const wouldBeSafe = game.wouldBeInCheck(
        { row: 4, col: 3 }, 
        { row: 4, col: 2 }, 
        'white'
      );
      expect(wouldBeSafe).toBe(false);
    });

    test('should validate pinned pieces that cannot move without exposing king', () => {
      // Set up pinned piece scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][3] = { type: 'bishop', color: 'white' }; // Pinned piece
      game.board[4][0] = { type: 'rook', color: 'black' }; // Pinning piece

      // Test pin detection
      const pinInfo = game.isPiecePinned({ row: 4, col: 3 }, 'white');
      expect(pinInfo.isPinned).toBe(true);
      expect(pinInfo.pinDirection).toBe('horizontal');
      expect(pinInfo.pinningPiece.type).toBe('rook');

      // Test that pinned piece cannot move off pin line
      const result = game.makeMove({
        from: { row: 4, col: 3 },
        to: { row: 3, col: 2 } // Breaking pin line
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');
      expect(result.message).toBe('Pinned piece cannot move without exposing king');
    });
  });

  describe('Requirement 1.1: General move validation', () => {
    test('should integrate self-check prevention with existing move validation', () => {
      // Test that self-check prevention works with normal game flow
      game.currentTurn = 'white';

      // Make a normal move first
      const normalMove = game.makeMove({
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 }
      });
      expect(normalMove.success).toBe(true);

      // Set up a scenario where white would expose their king
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[3][4] = { type: 'bishop', color: 'white' }; // Blocking piece
      game.board[0][4] = { type: 'rook', color: 'black' }; // Black rook attacking vertically
      game.currentTurn = 'white';

      // White tries to move the blocking piece (this would expose king)
      const exposingMove = game.makeMove({
        from: { row: 3, col: 4 },
        to: { row: 2, col: 3 }
      });

      expect(exposingMove.success).toBe(false);
      expect(['KING_IN_CHECK', 'PINNED_PIECE_INVALID_MOVE']).toContain(exposingMove.errorCode);
    });
  });

  describe('Complex scenarios with multiple attacking pieces', () => {
    test('should handle scenarios with multiple attacking pieces and limited legal moves', () => {
      // Set up complex scenario with king not initially in check but piece is pinned
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][2] = { type: 'rook', color: 'white' }; // Pinned by queen
      game.board[4][0] = { type: 'queen', color: 'black' }; // Pinning piece
      game.board[7][7] = { type: 'rook', color: 'black' }; // Another piece (not threatening)
      game.currentTurn = 'white';

      // Try to move the pinned rook
      const pinnedMoveResult = game.makeMove({
        from: { row: 4, col: 2 },
        to: { row: 6, col: 2 } // Would expose king to queen
      });

      expect(pinnedMoveResult.success).toBe(false);
      expect(pinnedMoveResult.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');

      // King should be able to move to escape
      const kingMoveResult = game.makeMove({
        from: { row: 4, col: 4 },
        to: { row: 5, col: 3 } // King moves to safety
      });

      expect(kingMoveResult.success).toBe(true);
    });
  });

  describe('Special moves and self-check prevention', () => {
    test('should handle castling with self-check prevention', () => {
      // Set up castling scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][7] = { type: 'rook', color: 'white' };
      game.currentTurn = 'white';
      game.castlingRights.white.kingside = true;

      // Valid castling should work
      const castlingResult = game.makeMove({
        from: { row: 7, col: 4 },
        to: { row: 7, col: 6 }
      });

      expect(castlingResult.success).toBe(true);
    });

    test('should handle en passant with self-check prevention', () => {
      // Set up en passant scenario that's safe
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'white' };
      game.board[3][4] = { type: 'pawn', color: 'black' };
      game.enPassantTarget = { row: 2, col: 4 };
      game.currentTurn = 'white';

      // En passant capture
      const enPassantResult = game.makeMove({
        from: { row: 3, col: 3 },
        to: { row: 2, col: 4 }
      });

      expect(enPassantResult.success).toBe(true);
    });
  });

  describe('Error handling and edge cases', () => {
    test('should handle invalid inputs gracefully', () => {
      // Test wouldBeInCheck with invalid inputs
      expect(game.wouldBeInCheck(null, { row: 4, col: 4 }, 'white')).toBe(true);
      expect(game.wouldBeInCheck({ row: 4, col: 4 }, null, 'white')).toBe(true);
      expect(game.wouldBeInCheck({ row: 4, col: 4 }, { row: 4, col: 5 }, null)).toBe(true);
    });

    test('should maintain game state consistency during validation', () => {
      const originalBoard = JSON.parse(JSON.stringify(game.board));
      const originalEnPassant = game.enPassantTarget;

      // Perform validation that should restore state
      game.wouldBeInCheck({ row: 6, col: 4 }, { row: 4, col: 4 }, 'white');

      // Verify state is unchanged
      expect(game.board).toEqual(originalBoard);
      expect(game.enPassantTarget).toEqual(originalEnPassant);
    });
  });
});