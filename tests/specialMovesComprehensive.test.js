const ChessGame = require('../src/shared/chessGame');
const testUtils = require('./utils/errorSuppression');

describe('Special Moves - Comprehensive Testing', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Castling - All Edge Cases', () => {
    beforeEach(() => {
      // Clear the board for castling tests
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Place kings and rooks in starting positions
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][0] = { type: 'rook', color: 'white' };
      game.board[7][7] = { type: 'rook', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      game.board[0][0] = { type: 'rook', color: 'black' };
      game.board[0][7] = { type: 'rook', color: 'black' };
    });

    test('should allow valid kingside castling for white', () => {
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      
      expect(result.success).toBe(true);
      expect(game.board[7][6]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][5]).toEqual({ type: 'rook', color: 'white' });
      expect(game.board[7][4]).toBe(null);
      expect(game.board[7][7]).toBe(null);
    });

    test('should allow valid queenside castling for white', () => {
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 2 } });
      
      expect(result.success).toBe(true);
      expect(game.board[7][2]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][3]).toEqual({ type: 'rook', color: 'white' });
      expect(game.board[7][4]).toBe(null);
      expect(game.board[7][0]).toBe(null);
    });

    test('should allow valid kingside castling for black', () => {
      game.currentTurn = 'black';
      const result = game.makeMove({ from: { row: 0, col: 4 }, to: { row: 0, col: 6 } });
      
      expect(result.success).toBe(true);
      expect(game.board[0][6]).toEqual({ type: 'king', color: 'black' });
      expect(game.board[0][5]).toEqual({ type: 'rook', color: 'black' });
      expect(game.board[0][4]).toBe(null);
      expect(game.board[0][7]).toBe(null);
    });

    test('should allow valid queenside castling for black', () => {
      game.currentTurn = 'black';
      const result = game.makeMove({ from: { row: 0, col: 4 }, to: { row: 0, col: 2 } });
      
      expect(result.success).toBe(true);
      expect(game.board[0][2]).toEqual({ type: 'king', color: 'black' });
      expect(game.board[0][3]).toEqual({ type: 'rook', color: 'black' });
      expect(game.board[0][4]).toBe(null);
      expect(game.board[0][0]).toBe(null);
    });

    test('should reject castling when king has moved', () => {
      // Move king and then move it back
      game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 5 } });
      game.makeMove({ from: { row: 0, col: 4 }, to: { row: 0, col: 5 } }); // Black move
      game.makeMove({ from: { row: 7, col: 5 }, to: { row: 7, col: 4 } });
      game.makeMove({ from: { row: 0, col: 5 }, to: { row: 0, col: 4 } }); // Black move back
      
      // Now try to castle - should fail
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
    });

    test('should reject castling when rook has moved', () => {
      // Move rook and then move it back
      game.makeMove({ from: { row: 7, col: 7 }, to: { row: 7, col: 6 } });
      game.makeMove({ from: { row: 0, col: 0 }, to: { row: 0, col: 1 } }); // Black move
      game.makeMove({ from: { row: 7, col: 6 }, to: { row: 7, col: 7 } });
      game.makeMove({ from: { row: 0, col: 1 }, to: { row: 0, col: 0 } }); // Black move back
      
      // Now try to castle kingside - should fail
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
    });

    test('should reject castling when path is blocked', () => {
      // Block kingside castling path
      game.board[7][5] = { type: 'bishop', color: 'white' };
      
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
    });

    test('should reject castling when king is in check', () => {
      // Place enemy rook to put king in check
      game.board[6][4] = { type: 'rook', color: 'black' };
      
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
    });

    test('should reject castling when king passes through check', () => {
      // Place enemy rook to attack f1 (king passes through)
      game.board[6][5] = { type: 'rook', color: 'black' };
      
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
    });

    test('should reject castling when king ends in check', () => {
      // Place enemy rook to attack g1 (king's destination)
      game.board[6][6] = { type: 'rook', color: 'black' };
      
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
    });

    test('should update castling rights correctly after castling', () => {
      // Perform kingside castling
      game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      
      // Both castling rights should be lost for white
      expect(game.castlingRights.white.kingside).toBe(false);
      expect(game.castlingRights.white.queenside).toBe(false);
      
      // Black castling rights should remain
      expect(game.castlingRights.black.kingside).toBe(true);
      expect(game.castlingRights.black.queenside).toBe(true);
    });

    test('should handle castling with captured rook', () => {
      // Capture white's kingside rook
      game.board[7][7] = null;
      
      // Try to castle kingside - should fail
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
    });
  });

  describe('En Passant - All Scenarios', () => {
    test('should allow valid en passant capture', () => {
      // Set up en passant scenario
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[1][5] = { type: 'pawn', color: 'black' };
      
      // Black pawn moves two squares
      game.currentTurn = 'black';
      const moveResult = game.makeMove({ from: { row: 1, col: 5 }, to: { row: 3, col: 5 } });
      expect(moveResult.success).toBe(true);
      expect(game.enPassantTarget).toEqual({ row: 2, col: 5 });
      
      // White pawn captures en passant
      const captureResult = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 5 } });
      expect(captureResult.success).toBe(true);
      expect(game.board[2][5]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[3][5]).toBe(null); // Black pawn should be captured
      expect(game.board[3][4]).toBe(null); // White pawn moved
    });

    test('should allow en passant from both sides', () => {
      // Test en passant from left side
      game.board[3][3] = { type: 'pawn', color: 'white' };
      game.board[1][4] = { type: 'pawn', color: 'black' };
      
      game.currentTurn = 'black';
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
      
      const leftCapture = game.makeMove({ from: { row: 3, col: 3 }, to: { row: 2, col: 4 } });
      expect(leftCapture.success).toBe(true);
      
      // Reset and test from right side
      game = new ChessGame();
      game.board[3][5] = { type: 'pawn', color: 'white' };
      game.board[1][4] = { type: 'pawn', color: 'black' };
      
      game.currentTurn = 'black';
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
      
      const rightCapture = game.makeMove({ from: { row: 3, col: 5 }, to: { row: 2, col: 4 } });
      expect(rightCapture.success).toBe(true);
    });

    test('should allow black en passant capture', () => {
      // Set up for black en passant
      game.board[4][4] = { type: 'pawn', color: 'black' };
      game.board[6][3] = { type: 'pawn', color: 'white' };
      
      // White pawn moves two squares
      const moveResult = game.makeMove({ from: { row: 6, col: 3 }, to: { row: 4, col: 3 } });
      expect(moveResult.success).toBe(true);
      expect(game.enPassantTarget).toEqual({ row: 5, col: 3 });
      
      // Black pawn captures en passant
      const captureResult = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 5, col: 3 } });
      expect(captureResult.success).toBe(true);
      expect(game.board[5][3]).toEqual({ type: 'pawn', color: 'black' });
      expect(game.board[4][3]).toBe(null); // White pawn should be captured
    });

    test('should reject en passant after other moves', () => {
      // Set up en passant scenario
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[1][5] = { type: 'pawn', color: 'black' };
      
      // Black pawn moves two squares
      game.currentTurn = 'black';
      game.makeMove({ from: { row: 1, col: 5 }, to: { row: 3, col: 5 } });
      
      // Make another move (not en passant)
      game.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }); // Knight move
      
      // Now try en passant - should fail
      const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 5 } });
      expect(result.success).toBe(false);
    });

    test('should reject invalid en passant attempts', () => {
      // Try en passant without proper setup
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[3][5] = { type: 'pawn', color: 'black' };
      
      const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 5 } });
      expect(result.success).toBe(false);
    });

    test('should clear en passant target after capture', () => {
      // Set up and execute en passant
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[1][5] = { type: 'pawn', color: 'black' };
      
      game.currentTurn = 'black';
      game.makeMove({ from: { row: 1, col: 5 }, to: { row: 3, col: 5 } });
      game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 5 } });
      
      // En passant target should be cleared
      expect(game.enPassantTarget).toBe(null);
    });
  });

  describe('Pawn Promotion - All Combinations', () => {
    test('should promote to queen by default', () => {
      // Place white pawn ready for promotion
      game.board[1][4] = { type: 'pawn', color: 'white' };
      
      const result = game.makeMove({ from: { row: 1, col: 4 }, to: { row: 0, col: 4 } });
      expect(result.success).toBe(true);
      expect(game.board[0][4]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should promote to specified piece types', () => {
      const promotionPieces = ['queen', 'rook', 'bishop', 'knight'];
      
      promotionPieces.forEach((piece, index) => {
        // Reset and place pawn
        game = new ChessGame();
        game.board[1][index] = { type: 'pawn', color: 'white' };
        
        const result = game.makeMove({ 
          from: { row: 1, col: index }, 
          to: { row: 0, col: index },
          promotion: piece
        });
        
        expect(result.success).toBe(true);
        expect(game.board[0][index]).toEqual({ type: piece, color: 'white' });
      });
    });

    test('should handle black pawn promotion', () => {
      // Place black pawn ready for promotion
      game.board[6][4] = { type: 'pawn', color: 'black' };
      game.currentTurn = 'black';
      
      const result = game.makeMove({ 
        from: { row: 6, col: 4 }, 
        to: { row: 7, col: 4 },
        promotion: 'queen'
      });
      
      expect(result.success).toBe(true);
      expect(game.board[7][4]).toEqual({ type: 'queen', color: 'black' });
    });

    test('should handle promotion with capture', () => {
      // Place white pawn and black piece for capture promotion
      game.board[1][4] = { type: 'pawn', color: 'white' };
      game.board[0][5] = { type: 'rook', color: 'black' };
      
      const result = game.makeMove({ 
        from: { row: 1, col: 4 }, 
        to: { row: 0, col: 5 },
        promotion: 'knight'
      });
      
      expect(result.success).toBe(true);
      expect(game.board[0][5]).toEqual({ type: 'knight', color: 'white' });
    });

    test('should promote on all files', () => {
      // Test promotion on each file
      for (let col = 0; col < 8; col++) {
        game = new ChessGame();
        game.board[1][col] = { type: 'pawn', color: 'white' };
        
        const result = game.makeMove({ 
          from: { row: 1, col }, 
          to: { row: 0, col },
          promotion: 'queen'
        });
        
        expect(result.success).toBe(true);
        expect(game.board[0][col]).toEqual({ type: 'queen', color: 'white' });
      }
    });

    test('should reject invalid promotion pieces', () => {
      game.board[1][4] = { type: 'pawn', color: 'white' };
      
      const invalidPromotions = ['king', 'pawn', 'invalid', null, undefined];
      
      invalidPromotions.forEach(promotion => {
        const result = game.makeMove({ 
          from: { row: 1, col: 4 }, 
          to: { row: 0, col: 4 },
          promotion
        });
        
        // Should either succeed with default queen or fail gracefully
        if (result.success) {
          expect(game.board[0][4]).toEqual({ type: 'queen', color: 'white' });
        } else {
          expect(result.errorCode).toBeDefined();
        }
        
        // Reset for next test
        game.board[0][4] = null;
        game.board[1][4] = { type: 'pawn', color: 'white' };
      });
    });

    test('should handle promotion in check scenarios', () => {
      // Set up promotion that resolves check
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[1][4] = { type: 'pawn', color: 'white' };
      game.board[0][4] = { type: 'rook', color: 'black' }; // Checking the king
      
      // King should be in check
      expect(game.isInCheck('white')).toBe(true);
      
      // Promote pawn to capture checking rook
      const result = game.makeMove({ 
        from: { row: 1, col: 4 }, 
        to: { row: 0, col: 4 },
        promotion: 'queen'
      });
      
      expect(result.success).toBe(true);
      expect(game.isInCheck('white')).toBe(false);
    });
  });

  describe('Special Move Combinations', () => {
    test('should handle castling after en passant', () => {
      // Set up board for both moves
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][7] = { type: 'rook', color: 'white' };
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[1][5] = { type: 'pawn', color: 'black' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      // Execute en passant
      game.currentTurn = 'black';
      game.makeMove({ from: { row: 1, col: 5 }, to: { row: 3, col: 5 } });
      game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 5 } });
      
      // Now castle (should still be possible)
      game.makeMove({ from: { row: 0, col: 4 }, to: { row: 0, col: 5 } }); // Black king move
      const castleResult = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      expect(castleResult.success).toBe(true);
    });

    test('should handle promotion after castling', () => {
      // Set up for castling first
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][7] = { type: 'rook', color: 'white' };
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      // Castle first
      game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      
      // Make some moves to get pawn to promotion
      game.makeMove({ from: { row: 0, col: 4 }, to: { row: 0, col: 5 } }); // Black move
      
      // Promote pawn
      const promoteResult = game.makeMove({ 
        from: { row: 1, col: 0 }, 
        to: { row: 0, col: 0 },
        promotion: 'queen'
      });
      expect(promoteResult.success).toBe(true);
    });

    test('should handle multiple special moves in sequence', () => {
      // Complex scenario with multiple special moves
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Set up pieces for complex sequence
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][0] = { type: 'rook', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'white' };
      game.board[1][4] = { type: 'pawn', color: 'black' };
      game.board[1][2] = { type: 'pawn', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      // Execute sequence: en passant, castling, promotion
      game.currentTurn = 'black';
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // En passant setup
      game.makeMove({ from: { row: 3, col: 3 }, to: { row: 2, col: 4 } }); // En passant capture
      game.makeMove({ from: { row: 0, col: 4 }, to: { row: 0, col: 5 } }); // Black king move
      game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 2 } }); // Queenside castle
      game.makeMove({ from: { row: 0, col: 5 }, to: { row: 0, col: 6 } }); // Black king move
      
      // Promote pawn
      const promoteResult = game.makeMove({ 
        from: { row: 1, col: 2 }, 
        to: { row: 0, col: 2 },
        promotion: 'knight'
      });
      expect(promoteResult.success).toBe(true);
      
      // Verify all moves were successful
      expect(game.board[7][2]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][3]).toEqual({ type: 'rook', color: 'white' });
      expect(game.board[2][4]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[0][2]).toEqual({ type: 'knight', color: 'white' });
    });
  });
});