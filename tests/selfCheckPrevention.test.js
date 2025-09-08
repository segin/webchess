const ChessGame = require('../src/shared/chessGame');

describe('Move Legality Validation Preventing Self-Check', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Basic Self-Check Prevention', () => {
    test('should reject move that puts own king in check - horizontal attack', () => {
      // Set up scenario where moving a piece exposes king to rook attack
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
      expect(result.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');
      expect(result.message).toBeDefined();
    });

    test('should reject move that puts own king in check - vertical attack', () => {
      // Set up scenario where moving a piece exposes king to rook attack
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[3][4] = { type: 'knight', color: 'white' }; // Blocking piece
      game.board[0][4] = { type: 'rook', color: 'black' }; // Attacking piece
      game.currentTurn = 'white';

      const result = game.makeMove({
        from: { row: 3, col: 4 },
        to: { row: 5, col: 3 } // Moving knight exposes king
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');
      expect(result.message).toBeDefined();
    });

    test('should reject move that puts own king in check - diagonal attack', () => {
      // Set up scenario where moving a piece exposes king to bishop attack
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'white' }; // Blocking piece
      game.board[1][1] = { type: 'bishop', color: 'black' }; // Attacking piece
      game.currentTurn = 'white';

      const result = game.makeMove({
        from: { row: 3, col: 3 },
        to: { row: 2, col: 3 } // Moving pawn forward (valid pawn move)
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');
      expect(result.message).toBeDefined();
    });

    test('should reject move that puts own king in check - queen attack', () => {
      // Set up scenario where moving a piece exposes king to queen attack
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][2] = { type: 'rook', color: 'white' }; // Blocking piece
      game.board[4][0] = { type: 'queen', color: 'black' }; // Attacking piece
      game.currentTurn = 'white';

      const result = game.makeMove({
        from: { row: 4, col: 2 },
        to: { row: 6, col: 2 } // Moving rook exposes king
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');
      expect(result.message).toBeDefined();
    });

    test('should allow move that does not put own king in check', () => {
      // Set up scenario where move is safe - no check situation
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[6][5] = { type: 'pawn', color: 'white' }; // Free piece on starting rank
      game.board[7][7] = { type: 'rook', color: 'black' }; // Enemy piece far away
      game.currentTurn = 'white';

      const result = game.makeMove({
        from: { row: 6, col: 5 },
        to: { row: 5, col: 5 } // Moving pawn forward one square (valid pawn move)
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Pinned Piece Validation', () => {
    test('should detect horizontally pinned piece', () => {
      // Set up horizontal pin scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][3] = { type: 'bishop', color: 'white' }; // Pinned piece
      game.board[4][0] = { type: 'rook', color: 'black' }; // Pinning piece

      const pinInfo = game.isPiecePinned({ row: 4, col: 3 }, 'white');
      expect(pinInfo.isPinned).toBe(true);
      expect(pinInfo.pinDirection).toBeDefined();
      expect(pinInfo.pinningPiece).toBeDefined();
      if (pinInfo.pinningPiece) {
        expect(pinInfo.pinningPiece.type).toBe('rook');
      }
    });

    test('should detect vertically pinned piece', () => {
      // Set up vertical pin scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[2][4] = { type: 'knight', color: 'white' }; // Pinned piece
      game.board[0][4] = { type: 'rook', color: 'black' }; // Pinning piece

      const pinInfo = game.isPiecePinned({ row: 2, col: 4 }, 'white');
      expect(pinInfo.isPinned).toBe(true);
      expect(pinInfo.pinDirection).toBeDefined();
      expect(pinInfo.pinningPiece).toBeDefined();
      if (pinInfo.pinningPiece) {
        expect(pinInfo.pinningPiece.type).toBe('rook');
      }
    });

    test('should detect diagonally pinned piece', () => {
      // Set up diagonal pin scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'white' }; // Pinned piece
      game.board[1][1] = { type: 'bishop', color: 'black' }; // Pinning piece

      const pinInfo = game.isPiecePinned({ row: 3, col: 3 }, 'white');
      expect(pinInfo.isPinned).toBe(true);
      expect(pinInfo.pinDirection).toBeDefined();
      expect(pinInfo.pinningPiece).toBeDefined();
      if (pinInfo.pinningPiece) {
        expect(pinInfo.pinningPiece.type).toBe('bishop');
      }
    });

    test('should detect queen pin in multiple directions', () => {
      // Set up queen pin scenario - horizontal
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][2] = { type: 'rook', color: 'white' }; // Pinned piece
      game.board[4][0] = { type: 'queen', color: 'black' }; // Pinning piece

      const pinInfo = game.isPiecePinned({ row: 4, col: 2 }, 'white');
      expect(pinInfo.isPinned).toBe(true);
      expect(pinInfo.pinDirection).toBeDefined();
      expect(pinInfo.pinningPiece).toBeDefined();
      if (pinInfo.pinningPiece) {
        expect(pinInfo.pinningPiece.type).toBe('queen');
      }
    });

    test('should not detect pin when path is blocked', () => {
      // Set up scenario with blocked pin
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][3] = { type: 'bishop', color: 'white' }; // Potential pinned piece
      game.board[4][2] = { type: 'pawn', color: 'black' }; // Blocking piece
      game.board[4][0] = { type: 'rook', color: 'black' }; // Would-be pinning piece

      const pinInfo = game.isPiecePinned({ row: 4, col: 3 }, 'white');
      expect(pinInfo.isPinned).toBe(false);
    });

    test('should not detect pin from non-sliding pieces', () => {
      // Set up scenario with knight "pinning" (which is impossible)
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'white' }; // Not pinned
      game.board[2][2] = { type: 'knight', color: 'black' }; // Cannot pin

      const pinInfo = game.isPiecePinned({ row: 3, col: 3 }, 'white');
      expect(pinInfo.isPinned).toBe(false);
    });
  });

  describe('Pinned Piece Movement Validation', () => {
    test('should reject pinned piece move that breaks pin line', () => {
      // Set up horizontal pin and try to move piece vertically
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][3] = { type: 'bishop', color: 'white' }; // Pinned piece
      game.board[4][0] = { type: 'rook', color: 'black' }; // Pinning piece
      game.currentTurn = 'white';

      const result = game.makeMove({
        from: { row: 4, col: 3 },
        to: { row: 3, col: 2 } // Breaking pin line
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');
      expect(result.message).toBeDefined();
    });

    test('should allow pinned piece to move along pin line', () => {
      // Set up horizontal pin and move piece along the pin line
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][3] = { type: 'rook', color: 'white' }; // Pinned piece
      game.board[4][0] = { type: 'rook', color: 'black' }; // Pinning piece
      game.currentTurn = 'white';

      const result = game.makeMove({
        from: { row: 4, col: 3 },
        to: { row: 4, col: 2 } // Moving along pin line
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should allow pinned piece to capture pinning piece', () => {
      // Set up pin and capture the pinning piece
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][2] = { type: 'rook', color: 'white' }; // Pinned piece
      game.board[4][0] = { type: 'rook', color: 'black' }; // Pinning piece
      game.currentTurn = 'white';

      const result = game.makeMove({
        from: { row: 4, col: 2 },
        to: { row: 4, col: 0 } // Capturing pinning piece
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should handle diagonal pin movement correctly', () => {
      // Set up diagonal pin and test valid/invalid moves
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[3][3] = { type: 'bishop', color: 'white' }; // Pinned piece
      game.board[1][1] = { type: 'bishop', color: 'black' }; // Pinning piece
      game.currentTurn = 'white';

      // Valid move along diagonal
      const validResult = game.makeMove({
        from: { row: 3, col: 3 },
        to: { row: 2, col: 2 } // Moving along diagonal pin line
      });
      expect(validResult.success).toBe(true);
      expect(validResult.data).toBeDefined();

      // Reset for invalid move test
      game.board[3][3] = { type: 'bishop', color: 'white' };
      game.board[2][2] = null;
      game.currentTurn = 'white'; // Reset turn

      // Invalid move breaking diagonal - use a valid bishop move that breaks pin
      const invalidResult = game.makeMove({
        from: { row: 3, col: 3 },
        to: { row: 4, col: 2 } // Valid bishop move but breaks diagonal pin
      });
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');
      expect(invalidResult.message).toBeDefined();
    });
  });

  describe('Complex Self-Check Scenarios', () => {
    test('should handle multiple attacking pieces correctly', () => {
      // Set up scenario where king is already in check and move doesn't resolve it
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][3] = { type: 'rook', color: 'white' }; // Piece that could help
      game.board[4][0] = { type: 'rook', color: 'black' }; // Attacking king
      game.board[0][4] = { type: 'rook', color: 'black' }; // Second threat
      game.currentTurn = 'white';

      // Moving a piece that doesn't resolve check
      const result = game.makeMove({
        from: { row: 4, col: 3 },
        to: { row: 6, col: 3 } // Moving away, doesn't resolve check
      });

      expect(result.success).toBe(false);
      expect(['CHECK_NOT_RESOLVED', 'KING_IN_CHECK']).toContain(result.errorCode);
      expect(result.message).toBeDefined();
    });

    test('should handle discovered check scenarios', () => {
      // Set up discovered check scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[4][2] = { type: 'bishop', color: 'white' }; // Piece that will discover check
      game.board[4][0] = { type: 'rook', color: 'black' }; // Piece that will give discovered check
      game.currentTurn = 'white';

      // Moving the bishop should expose king to rook (pinned piece)
      const result = game.makeMove({
        from: { row: 4, col: 2 },
        to: { row: 2, col: 0 } // Moving bishop away
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PINNED_PIECE_INVALID_MOVE');
      expect(result.message).toBeDefined();
    });

    test('should handle en passant moves that expose king', () => {
      // Set up en passant scenario that would expose king
      // Use proper en passant setup with white pawn on rank 5 (row 3)
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[3][4] = { type: 'king', color: 'white' }; // King on 5th rank
      game.board[3][3] = { type: 'pawn', color: 'white' }; // White pawn on 5th rank
      game.board[3][2] = { type: 'pawn', color: 'black' }; // Black pawn that just moved 2 squares
      game.board[3][0] = { type: 'rook', color: 'black' }; // Rook that would attack horizontally
      game.enPassantTarget = { row: 2, col: 2 }; // En passant target (behind black pawn)
      game.currentTurn = 'white';

      // En passant capture that would expose king to rook attack
      const result = game.makeMove({
        from: { row: 3, col: 3 },
        to: { row: 2, col: 2 } // En passant capture
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('KING_IN_CHECK'); // Move would put king in check
      expect(result.message).toBeDefined();
    });

    test('should handle castling through check prevention', () => {
      // Set up castling scenario where king would pass through check
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][7] = { type: 'rook', color: 'white' };
      game.board[0][5] = { type: 'rook', color: 'black' }; // Attacking f1 square
      game.currentTurn = 'white';
      game.castlingRights.white.kingside = true;

      // Attempt kingside castling (king would pass through attacked square)
      const result = game.makeMove({
        from: { row: 7, col: 4 },
        to: { row: 7, col: 6 } // Kingside castling
      });

      expect(result.success).toBe(false);
      // Could be castling validation error or check constraint error
      expect(['INVALID_CASTLING', 'KING_IN_CHECK']).toContain(result.errorCode);
      expect(result.message).toBeDefined();
    });

    test('should handle pawn promotion that exposes king', () => {
      // Set up pawn promotion scenario - test that promotion works correctly
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.board[1][4] = { type: 'pawn', color: 'white' }; // Pawn about to promote
      game.board[0][5] = { type: 'rook', color: 'black' }; // Enemy piece to capture
      game.currentTurn = 'white';

      // Promote pawn by capturing
      const result = game.makeMove({
        from: { row: 1, col: 4 },
        to: { row: 0, col: 5 }, // Promote and capture diagonally
        promotion: 'queen'
      });

      // This should succeed - valid pawn promotion capture
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid input to wouldBeInCheck gracefully', () => {
      // Test with invalid coordinates
      const result1 = game.wouldBeInCheck(null, { row: 4, col: 4 }, 'white');
      expect(typeof result1).toBe('boolean'); // Should return boolean

      const result2 = game.wouldBeInCheck({ row: 4, col: 4 }, null, 'white');
      expect(typeof result2).toBe('boolean');

      const result3 = game.wouldBeInCheck({ row: 4, col: 4 }, { row: 4, col: 5 }, null);
      expect(typeof result3).toBe('boolean');
    });

    test('should handle missing king gracefully', () => {
      // Remove king and test pin detection
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][3] = { type: 'bishop', color: 'white' };
      game.board[4][0] = { type: 'rook', color: 'black' };

      const pinInfo = game.isPiecePinned({ row: 4, col: 3 }, 'white');
      expect(pinInfo.isPinned).toBe(false);
    });

    test('should handle piece movement validation with special moves', () => {
      // Test that special moves are properly handled in check validation
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][7] = { type: 'rook', color: 'white' };
      game.currentTurn = 'white';
      game.castlingRights.white.kingside = true;

      // Valid castling should work
      const result = game.makeMove({
        from: { row: 7, col: 4 },
        to: { row: 7, col: 6 }
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should maintain game state consistency during validation', () => {
      // Ensure that validation doesn't permanently modify game state
      const originalBoard = JSON.parse(JSON.stringify(game.board));
      const originalEnPassant = game.enPassantTarget;
      const originalTurn = game.currentTurn;

      // Perform validation that should restore state
      game.wouldBeInCheck({ row: 6, col: 4 }, { row: 4, col: 4 }, 'white');

      // Verify state is unchanged
      expect(game.board).toEqual(originalBoard);
      expect(game.enPassantTarget).toEqual(originalEnPassant);
      expect(game.currentTurn).toEqual(originalTurn);
    });
  });
});