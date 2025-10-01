/**
 * Comprehensive Castling Validation Tests
 * Tests all aspects of castling rules according to FIDE standards
 * Covers both kingside and queenside castling for both colors
 */

const ChessGame = require('../src/shared/chessGame');

describe('Castling Validation - Comprehensive Rules Testing', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Valid Kingside Castling Scenarios', () => {
    test('should allow white kingside castling with clear path', () => {
      // Clear path for white kingside castling
      game.board[7][5] = null; // Bishop
      game.board[7][6] = null; // Knight
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      
      // Validate castling result
      expect(game.board[7][6]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][5]).toEqual({ type: 'rook', color: 'white' });
      expect(game.board[7][4]).toBeNull(); // King moved
      expect(game.board[7][7]).toBeNull(); // Rook moved
    });

    test('should allow black kingside castling when all conditions are met', () => {
      const game = new ChessGame();
      
      // Make a white move first
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      
      // Clear path between black king and rook
      game.board[0][5] = null; // Bishop
      game.board[0][6] = null; // Knight
      
      const move = { from: { row: 0, col: 4 }, to: { row: 0, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.board[0][6]).toEqual({ type: 'king', color: 'black' });
      expect(game.board[0][5]).toEqual({ type: 'rook', color: 'black' });
      expect(game.board[0][4]).toBe(null); // King moved
      expect(game.board[0][7]).toBe(null); // Rook moved
    });

    test('should update castling rights after kingside castling', () => {
      // Clear path for white kingside castling
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.castlingRights.white.kingside).toBe(false);
      expect(game.castlingRights.white.queenside).toBe(false);
    });
  });

  describe('Valid Queenside Castling', () => {
    test('should allow white queenside castling when all conditions are met', () => {
      // Clear path between king and rook
      game.board[7][1] = null; // Knight
      game.board[7][2] = null; // Bishop
      game.board[7][3] = null; // Queen
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 2 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.board[7][2]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][3]).toEqual({ type: 'rook', color: 'white' });
      expect(game.board[7][4]).toBeNull(); // King moved
      expect(game.board[7][0]).toBeNull(); // Rook moved
    });

    test('should allow black queenside castling when all conditions are met', () => {
      // Make a white move first
      const whiteMove = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      expect(whiteMove.success).toBe(true);
      
      // Clear path between black king and rook
      game.board[0][1] = null; // Knight
      game.board[0][2] = null; // Bishop
      game.board[0][3] = null; // Queen
      
      const move = { from: { row: 0, col: 4 }, to: { row: 0, col: 2 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.board[0][2]).toEqual({ type: 'king', color: 'black' });
      expect(game.board[0][3]).toEqual({ type: 'rook', color: 'black' });
      expect(game.board[0][4]).toBeNull(); // King moved
      expect(game.board[0][0]).toBeNull(); // Rook moved
    });

    test('should update castling rights after queenside castling', () => {
      // Clear path for white queenside castling
      game.board[7][1] = null;
      game.board[7][2] = null;
      game.board[7][3] = null;
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 2 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.castlingRights.white.kingside).toBe(false);
      expect(game.castlingRights.white.queenside).toBe(false);
    });
  });

  describe('Invalid Castling - King Moved', () => {
    test('should reject kingside castling when king has moved', () => {
      // Clear bishop first so king can move
      game.board[7][5] = null;
      
      // Move king and then move it back
      const kingMove1 = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 5 } });
      expect(kingMove1.success).toBe(true);
      
      const blackMove1 = game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }); // Black move
      expect(blackMove1.success).toBe(true);
      
      const kingMove2 = game.makeMove({ from: { row: 7, col: 5 }, to: { row: 7, col: 4 } });
      expect(kingMove2.success).toBe(true);
      
      const blackMove2 = game.makeMove({ from: { row: 2, col: 4 }, to: { row: 3, col: 4 } }); // Black move
      expect(blackMove2.success).toBe(true);
      
      // Clear path and try to castle
      game.board[7][6] = null;
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling rights lost');
    });

    test('should reject queenside castling when king has moved', () => {
      // Clear queen first so king can move
      game.board[7][3] = null;
      
      // Move king and then move it back
      const kingMove1 = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 3 } });
      expect(kingMove1.success).toBe(true);
      
      const blackMove1 = game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }); // Black move
      expect(blackMove1.success).toBe(true);
      
      const kingMove2 = game.makeMove({ from: { row: 7, col: 3 }, to: { row: 7, col: 4 } });
      expect(kingMove2.success).toBe(true);
      
      const blackMove2 = game.makeMove({ from: { row: 2, col: 4 }, to: { row: 3, col: 4 } }); // Black move
      expect(blackMove2.success).toBe(true);
      
      // Clear path and try to castle
      game.board[7][1] = null;
      game.board[7][2] = null;
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 2 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling rights lost');
    });
  });

  describe('Invalid Castling - Rook Moved', () => {
    test('should reject kingside castling when kingside rook has moved', () => {
      // Clear knight first so rook can move
      game.board[7][6] = null;
      
      // Move kingside rook and then move it back
      const rookMove1 = game.makeMove({ from: { row: 7, col: 7 }, to: { row: 7, col: 6 } });
      expect(rookMove1.success).toBe(true);
      
      const blackMove1 = game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }); // Black move
      expect(blackMove1.success).toBe(true);
      
      const rookMove2 = game.makeMove({ from: { row: 7, col: 6 }, to: { row: 7, col: 7 } });
      expect(rookMove2.success).toBe(true);
      
      const blackMove2 = game.makeMove({ from: { row: 2, col: 4 }, to: { row: 3, col: 4 } }); // Black move
      expect(blackMove2.success).toBe(true);
      
      // Clear path and try to castle
      game.board[7][5] = null;
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });

    test('should reject queenside castling when queenside rook has moved', () => {
      // Clear knight first so rook can move
      game.board[7][1] = null;
      
      // Move queenside rook and then move it back
      const rookMove1 = game.makeMove({ from: { row: 7, col: 0 }, to: { row: 7, col: 1 } });
      expect(rookMove1.success).toBe(true);
      
      const blackMove1 = game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }); // Black move
      expect(blackMove1.success).toBe(true);
      
      const rookMove2 = game.makeMove({ from: { row: 7, col: 1 }, to: { row: 7, col: 0 } });
      expect(rookMove2.success).toBe(true);
      
      const blackMove2 = game.makeMove({ from: { row: 2, col: 4 }, to: { row: 3, col: 4 } }); // Black move
      expect(blackMove2.success).toBe(true);
      
      // Clear path and try to castle
      game.board[7][2] = null;
      game.board[7][3] = null;
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 2 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });
  });

  describe('Invalid Castling - Path Blocked', () => {
    test('should reject kingside castling when path is blocked by bishop', () => {
      // Only clear knight, leave bishop
      game.board[7][6] = null;
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });

    test('should reject kingside castling when path is blocked by knight', () => {
      // Only clear bishop, leave knight
      game.board[7][5] = null;
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });

    test('should reject queenside castling when path is blocked by queen', () => {
      // Clear knight and bishop, leave queen
      game.board[7][1] = null;
      game.board[7][2] = null;
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 2 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });

    test('should reject queenside castling when path is blocked by bishop', () => {
      // Clear knight and queen, leave bishop
      game.board[7][1] = null;
      game.board[7][3] = null;
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 2 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });

    test('should reject queenside castling when path is blocked by knight', () => {
      // Clear bishop and queen, leave knight
      game.board[7][2] = null;
      game.board[7][3] = null;
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 2 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });
  });

  describe('Invalid Castling - Through Check', () => {
    test('should reject kingside castling when king passes through check', () => {
      // Clear path for castling
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      // Clear white pawn and place enemy rook to attack f1 (square king passes through)
      game.board[6][5] = null; // Remove white pawn
      game.board[5][5] = { type: 'rook', color: 'black' }; // Place rook to attack f1
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });

    test('should reject queenside castling when king passes through check', () => {
      // Clear path for castling
      game.board[7][1] = null;
      game.board[7][2] = null;
      game.board[7][3] = null;
      
      // Clear white pawn and place enemy rook to attack d1 (square king passes through)
      game.board[6][3] = null; // Remove white pawn
      game.board[5][3] = { type: 'rook', color: 'black' }; // Place rook to attack d1
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 2 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });

    test('should reject kingside castling when king ends up in check', () => {
      // Clear path for castling
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      // Clear white pawn and place enemy rook to attack g1 (king's destination)
      game.board[6][6] = null; // Remove white pawn
      game.board[5][6] = { type: 'rook', color: 'black' }; // Place rook to attack g1
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });

    test('should reject queenside castling when king ends up in check', () => {
      // Clear path for castling
      game.board[7][1] = null;
      game.board[7][2] = null;
      game.board[7][3] = null;
      
      // Clear white pawn and place enemy rook to attack c1 (king's destination)
      game.board[6][2] = null; // Remove white pawn
      game.board[5][2] = { type: 'rook', color: 'black' }; // Place rook to attack c1
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 2 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });
  });

  describe('Invalid Castling - While in Check', () => {
    test('should reject castling when king is currently in check', () => {
      // Clear path for castling
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      // Clear white pawn and place enemy rook to put white king in check
      game.board[6][4] = null; // Remove white pawn
      game.board[5][4] = { type: 'rook', color: 'black' }; // Place rook to attack white king
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });

    test('should reject queenside castling when king is currently in check', () => {
      // Clear path for castling
      game.board[7][1] = null;
      game.board[7][2] = null;
      game.board[7][3] = null;
      
      // Clear white pawn and place enemy queen to put white king in check
      game.board[6][4] = null; // Remove white pawn
      game.board[5][4] = { type: 'queen', color: 'black' }; // Place queen to attack white king
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 2 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });
  });

  describe('Castling Rights Management', () => {
    test('should lose all castling rights when king moves', () => {
      // Clear bishop so king can move
      game.board[7][5] = null;
      
      // Move king
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 5 } });
      expect(result.success).toBe(true);
      
      expect(game.castlingRights.white.kingside).toBe(false);
      expect(game.castlingRights.white.queenside).toBe(false);
    });

    test('should lose kingside castling rights when kingside rook moves', () => {
      // Clear knight so rook can move
      game.board[7][6] = null;
      
      // Move kingside rook
      const result = game.makeMove({ from: { row: 7, col: 7 }, to: { row: 7, col: 6 } });
      expect(result.success).toBe(true);
      
      expect(game.castlingRights.white.kingside).toBe(false);
      expect(game.castlingRights.white.queenside).toBe(true); // Should still have queenside
    });

    test('should lose queenside castling rights when queenside rook moves', () => {
      // Clear knight so rook can move
      game.board[7][1] = null;
      
      // Move queenside rook
      const result = game.makeMove({ from: { row: 7, col: 0 }, to: { row: 7, col: 1 } });
      expect(result.success).toBe(true);
      
      expect(game.castlingRights.white.queenside).toBe(false);
      expect(game.castlingRights.white.kingside).toBe(true); // Should still have kingside
    });

    test('should lose castling rights when rook is captured', () => {
      // Clear the path and place black piece in position to capture white rook
      game.board[6][7] = null; // Remove white pawn
      game.board[5][7] = { type: 'rook', color: 'black' };
      
      // Make a white move first
      const whiteMove = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      expect(whiteMove.success).toBe(true);
      
      // Black captures white kingside rook
      const blackMove = game.makeMove({ from: { row: 5, col: 7 }, to: { row: 7, col: 7 } });
      expect(blackMove.success).toBe(true);
      
      expect(game.castlingRights.white.kingside).toBe(false);
      expect(game.castlingRights.white.queenside).toBe(true); // Should still have queenside
    });

    test('should maintain separate castling rights for each color', () => {
      // Clear bishop so king can move
      game.board[7][5] = null;
      
      // Move white king
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 5 } });
      expect(result.success).toBe(true);
      
      // Black should still have castling rights
      expect(game.castlingRights.black.kingside).toBe(true);
      expect(game.castlingRights.black.queenside).toBe(true);
      
      // White should have lost castling rights
      expect(game.castlingRights.white.kingside).toBe(false);
      expect(game.castlingRights.white.queenside).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should reject castling with invalid king position', () => {
      // Move king to wrong position
      game.board[7][3] = game.board[7][4]; // Move king to d1
      game.board[7][4] = null;
      
      const move = { from: { row: 7, col: 3 }, to: { row: 7, col: 5 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
    });

    test('should reject castling with missing rook', () => {
      // Remove kingside rook
      game.board[7][7] = null;
      
      // Clear path
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });

    test('should reject castling with wrong piece in rook position', () => {
      // Replace rook with queen
      game.board[7][7] = { type: 'queen', color: 'white' };
      
      // Clear path
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
      expect(result.message).toContain('castling');
    });

    test('should allow regular king move when not castling', () => {
      // Clear path
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      // Regular king move (one square) should be allowed
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 5 } };
      const result = game.makeMove(move);
      
      // This should succeed as a regular king move
      expect(result.success).toBe(true);
      expect(game.board[7][5]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][4]).toBeNull();
    });
  });
});

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log('Running Castling Validation Tests...');
}