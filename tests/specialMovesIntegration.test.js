const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Special Moves Integration Tests', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Castling Scenarios', () => {
    describe('Valid Castling', () => {
      test('should execute white kingside castling correctly', () => {
        // Clear path
        game.board[7][5] = null;
        game.board[7][6] = null;
        
        const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
        
        expect(result.success).toBe(true);
        expect(game.board[7][6]).toEqual({ type: 'king', color: 'white' });
        expect(game.board[7][5]).toEqual({ type: 'rook', color: 'white' });
        expect(game.castlingRights.white.kingside).toBe(false);
        expect(game.castlingRights.white.queenside).toBe(false);
      });

      test('should execute white queenside castling correctly', () => {
        // Clear path
        game.board[7][1] = null;
        game.board[7][2] = null;
        game.board[7][3] = null;
        
        const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 2 } });
        
        expect(result.success).toBe(true);
        expect(game.board[7][2]).toEqual({ type: 'king', color: 'white' });
        expect(game.board[7][3]).toEqual({ type: 'rook', color: 'white' });
      });

      test('should execute black castling after white move', () => {
        // White move first
        game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
        
        // Clear path for black
        game.board[0][5] = null;
        game.board[0][6] = null;
        
        const result = game.makeMove({ from: { row: 0, col: 4 }, to: { row: 0, col: 6 } });
        
        expect(result.success).toBe(true);
        expect(game.board[0][6]).toEqual({ type: 'king', color: 'black' });
        expect(game.board[0][5]).toEqual({ type: 'rook', color: 'black' });
      });
    });

    describe('Invalid Castling', () => {
      test('should reject castling when king has moved', () => {
        // Move king and back
        game.board[7][5] = null;
        game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 5 } });
        game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } });
        game.makeMove({ from: { row: 7, col: 5 }, to: { row: 7, col: 4 } });
        game.makeMove({ from: { row: 2, col: 4 }, to: { row: 3, col: 4 } });
        
        // Try to castle
        game.board[7][6] = null;
        const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
        
        expect(result.isValid).toBe(false);
        expect(result.errorCode).toBe('INVALID_CASTLING');
      });

      test('should reject castling when rook has moved', () => {
        // Move rook and back
        game.board[7][6] = null;
        game.makeMove({ from: { row: 7, col: 7 }, to: { row: 7, col: 6 } });
        game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } });
        game.makeMove({ from: { row: 7, col: 6 }, to: { row: 7, col: 7 } });
        game.makeMove({ from: { row: 2, col: 4 }, to: { row: 3, col: 4 } });
        
        // Try to castle
        game.board[7][5] = null;
        const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
        
        expect(result.isValid).toBe(false);
        expect(result.errorCode).toBe('INVALID_CASTLING');
      });

      test('should reject castling through check', () => {
        // Clear path
        game.board[7][5] = null;
        game.board[7][6] = null;
        
        // Place enemy rook to attack f1
        game.board[6][5] = null;
        game.board[5][5] = { type: 'rook', color: 'black' };
        
        const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
        
        expect(result.isValid).toBe(false);
        expect(result.errorCode).toBe('INVALID_CASTLING');
      });
    });
  });

  describe('En Passant Scenarios', () => {
    describe('Valid En Passant', () => {
      test('should execute en passant capture correctly', () => {
        // Set up en passant scenario
        game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e2-e4
        game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } }); // a7-a5
        game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }); // e4-e5
        game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }); // d7-d5
        
        expect(game.enPassantTarget).toEqual({ row: 2, col: 3 });
        
        const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 3 } });
        
        expect(result.success).toBe(true);
        expect(game.board[2][3]).toEqual({ type: 'pawn', color: 'white' });
        expect(game.board[3][3]).toBe(null); // Captured pawn removed
        expect(game.enPassantTarget).toBe(null); // Target cleared
      });

      test('should record en passant in move history', () => {
        // Set up en passant
        game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
        game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } });
        game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
        game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } });
        
        const historyLength = game.moveHistory.length;
        game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 3 } });
        
        expect(game.moveHistory.length).toBe(historyLength + 1);
        const lastMove = game.moveHistory[game.moveHistory.length - 1];
        expect(lastMove.enPassant).toBe(true);
        expect(lastMove.captured).toBe('pawn');
      });

      test('should handle black en passant capture', () => {
        // Set up for black en passant
        game.makeMove({ from: { row: 6, col: 0 }, to: { row: 5, col: 0 } }); // a2-a3
        game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // e7-e5
        game.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }); // Nb1-c3
        game.makeMove({ from: { row: 3, col: 4 }, to: { row: 4, col: 4 } }); // e5-e4
        game.makeMove({ from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }); // d2-d4
        
        expect(game.enPassantTarget).toEqual({ row: 5, col: 3 });
        
        const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 5, col: 3 } });
        
        expect(result.success).toBe(true);
        expect(game.board[5][3]).toEqual({ type: 'pawn', color: 'black' });
        expect(game.board[4][3]).toBe(null);
      });
    });

    describe('Invalid En Passant', () => {
      test('should reject en passant when no target exists', () => {
        // Place pawns without en passant setup
        game.board[3][4] = { type: 'pawn', color: 'white' };
        game.board[3][3] = { type: 'pawn', color: 'black' };
        game.enPassantTarget = null;
        game.currentTurn = 'white';
        
        const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 3 } });
        
        expect(result.isValid).toBe(false);
      });

      test('should reject en passant to wrong square', () => {
        // Set up en passant
        game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
        game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } });
        game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
        game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } });
        
        // Try to capture to wrong square
        const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 2 } });
        
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Pawn Promotion Scenarios', () => {
    describe('Valid Promotion', () => {
      test('should promote to queen by default', () => {
        // Set up promotion
        game.board[1][0] = { type: 'pawn', color: 'white' };
        game.board[6][0] = null;
        game.board[0][0] = null;
        
        const result = game.makeMove({ from: { row: 1, col: 0 }, to: { row: 0, col: 0 } });
        
        expect(result.success).toBe(true);
        expect(game.board[0][0]).toEqual({ type: 'queen', color: 'white' });
      });

      test('should promote to specified piece types', () => {
        const promotionPieces = ['queen', 'rook', 'bishop', 'knight'];
        
        promotionPieces.forEach((piece, index) => {
          const freshGame = new ChessGame();
          const file = index;
          
          freshGame.board[1][file] = { type: 'pawn', color: 'white' };
          freshGame.board[6][file] = null;
          freshGame.board[0][file] = null;
          
          const result = freshGame.makeMove({ 
            from: { row: 1, col: file }, 
            to: { row: 0, col: file }, 
            promotion: piece 
          });
          
          expect(result.success).toBe(true);
          expect(freshGame.board[0][file]).toEqual({ type: piece, color: 'white' });
        });
      });

      test('should promote with capture', () => {
        // Set up promotion with capture
        game.board[1][0] = { type: 'pawn', color: 'white' };
        game.board[6][0] = null;
        game.board[0][1] = { type: 'rook', color: 'black' };
        
        const result = game.makeMove({ 
          from: { row: 1, col: 0 }, 
          to: { row: 0, col: 1 }, 
          promotion: 'queen' 
        });
        
        expect(result.success).toBe(true);
        expect(game.board[0][1]).toEqual({ type: 'queen', color: 'white' });
      });

      test('should record promotion in move history', () => {
        game.board[1][0] = { type: 'pawn', color: 'white' };
        game.board[6][0] = null;
        game.board[0][0] = null;
        
        const historyLength = game.moveHistory.length;
        const result = game.makeMove({ 
          from: { row: 1, col: 0 }, 
          to: { row: 0, col: 0 }, 
          promotion: 'rook' 
        });
        
        expect(result.success).toBe(true);
        expect(game.moveHistory.length).toBe(historyLength + 1);
        
        const lastMove = game.moveHistory[game.moveHistory.length - 1];
        expect(lastMove.promotion).toBe('rook');
        expect(lastMove.piece).toBe('pawn');
      });
    });

    describe('Invalid Promotion', () => {
      test('should reject invalid promotion pieces', () => {
        game.board[1][0] = { type: 'pawn', color: 'white' };
        game.board[6][0] = null;
        game.board[0][0] = null;
        
        const result = game.makeMove({ 
          from: { row: 1, col: 0 }, 
          to: { row: 0, col: 0 }, 
          promotion: 'king' 
        });
        
        expect(result.isValid).toBe(false);
        // The error could be INVALID_FORMAT or INVALID_PROMOTION depending on validation order
        expect(['INVALID_FORMAT', 'INVALID_PROMOTION']).toContain(result.errorCode);
      });

      test('should reject promotion by non-pawn', () => {
        game.board[1][0] = { type: 'knight', color: 'white' };
        game.board[0][0] = null;
        
        const result = game.makeMove({ 
          from: { row: 1, col: 0 }, 
          to: { row: 0, col: 0 }, 
          promotion: 'queen' 
        });
        
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Complex Special Move Interactions', () => {
    test('should handle castling followed by en passant', () => {
      // Execute castling
      game.board[7][5] = null;
      game.board[7][6] = null;
      let result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      expect(result.success).toBe(true);
      
      // Set up en passant
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } });
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      game.makeMove({ from: { row: 3, col: 0 }, to: { row: 4, col: 0 } });
      game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } });
      
      // Execute en passant
      result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 3 } });
      expect(result.success).toBe(true);
    });

    test('should handle multiple promotions in same game', () => {
      // Set up multiple pawns for promotion
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.board[1][1] = { type: 'pawn', color: 'white' };
      game.board[6][0] = null;
      game.board[6][1] = null;
      game.board[0][0] = null;
      game.board[0][1] = null;
      
      // First promotion
      let result = game.makeMove({ 
        from: { row: 1, col: 0 }, 
        to: { row: 0, col: 0 }, 
        promotion: 'queen' 
      });
      expect(result.success).toBe(true);
      
      // Black move
      game.makeMove({ from: { row: 1, col: 7 }, to: { row: 2, col: 7 } });
      
      // Second promotion
      result = game.makeMove({ 
        from: { row: 1, col: 1 }, 
        to: { row: 0, col: 1 }, 
        promotion: 'rook' 
      });
      expect(result.success).toBe(true);
      
      expect(game.board[0][0]).toEqual({ type: 'queen', color: 'white' });
      expect(game.board[0][1]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should maintain game state consistency during special moves', () => {
      // Execute castling
      game.board[7][5] = null;
      game.board[7][6] = null;
      game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      
      expect(game.castlingRights.white.kingside).toBe(false);
      expect(game.castlingRights.white.queenside).toBe(false);
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
    });
  });
});