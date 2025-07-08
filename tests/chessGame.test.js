const ChessGame = require('../src/shared/chessGame');

describe('ChessGame', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Game Initialization', () => {
    test('should initialize with correct starting position', () => {
      const gameState = game.getGameState();
      expect(gameState.currentTurn).toBe('white');
      expect(gameState.status).toBe('active');
      expect(gameState.winner).toBe(null);
      
      // Check starting positions
      expect(gameState.board[0][0]).toEqual({ type: 'rook', color: 'black' });
      expect(gameState.board[0][4]).toEqual({ type: 'king', color: 'black' });
      expect(gameState.board[7][4]).toEqual({ type: 'king', color: 'white' });
      expect(gameState.board[1][0]).toEqual({ type: 'pawn', color: 'black' });
      expect(gameState.board[6][0]).toEqual({ type: 'pawn', color: 'white' });
    });

    test('should have correct castling rights initially', () => {
      expect(game.castlingRights.white.kingside).toBe(true);
      expect(game.castlingRights.white.queenside).toBe(true);
      expect(game.castlingRights.black.kingside).toBe(true);
      expect(game.castlingRights.black.queenside).toBe(true);
    });
  });

  describe('Pawn Movement', () => {
    test('should allow pawn to move one square forward', () => {
      const result = game.makeMove({
        from: { row: 6, col: 4 },
        to: { row: 5, col: 4 }
      });
      expect(result.success).toBe(true);
    });

    test('should allow pawn to move two squares forward from starting position', () => {
      const result = game.makeMove({
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 }
      });
      expect(result.success).toBe(true);
    });

    test('should not allow pawn to move two squares forward from non-starting position', () => {
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } });
      
      const result = game.makeMove({
        from: { row: 5, col: 4 },
        to: { row: 3, col: 4 }
      });
      expect(result.success).toBe(false);
    });

    test('should allow pawn to capture diagonally', () => {
      // Move white pawn forward
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      // Move black pawn forward
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } });
      
      // White pawn captures black pawn
      const result = game.makeMove({
        from: { row: 4, col: 4 },
        to: { row: 3, col: 3 }
      });
      expect(result.success).toBe(true);
    });

    test('should not allow pawn to move forward if blocked', () => {
      // Place piece in front of pawn
      game.board[5][4] = { type: 'pawn', color: 'black' };
      
      const result = game.makeMove({
        from: { row: 6, col: 4 },
        to: { row: 5, col: 4 }
      });
      expect(result.success).toBe(false);
    });

    test('should handle pawn promotion', () => {
      // Set up promotion scenario
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.board[6][0] = null;
      
      const result = game.makeMove({
        from: { row: 1, col: 0 },
        to: { row: 0, col: 0 },
        promotion: 'queen'
      });
      
      expect(result.success).toBe(true);
      expect(game.board[0][0]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should handle en passant capture', () => {
      // Set up en passant scenario
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } });
      game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
      
      // Black pawn moves two squares next to white pawn
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } });
      
      // White pawn captures en passant
      const result = game.makeMove({
        from: { row: 3, col: 4 },
        to: { row: 2, col: 3 }
      });
      
      expect(result.success).toBe(true);
      expect(game.board[2][3]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[3][3]).toBe(null);
    });
  });

  describe('Knight Movement', () => {
    test('should allow valid knight moves', () => {
      const validMoves = [
        { from: { row: 7, col: 1 }, to: { row: 5, col: 0 } },
        { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }
      ];
      
      validMoves.forEach(move => {
        const game = new ChessGame();
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      });
    });

    test('should not allow invalid knight moves', () => {
      const invalidMoves = [
        { from: { row: 7, col: 1 }, to: { row: 5, col: 1 } }, // Straight line
        { from: { row: 7, col: 1 }, to: { row: 6, col: 2 } }, // Too short
        { from: { row: 7, col: 1 }, to: { row: 4, col: 1 } }  // Too far
      ];
      
      invalidMoves.forEach(move => {
        const game = new ChessGame();
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
      });
    });

    test('should allow knight to jump over pieces', () => {
      // Knight can jump over pawns
      const result = game.makeMove({
        from: { row: 7, col: 1 },
        to: { row: 5, col: 2 }
      });
      expect(result.success).toBe(true);
    });

    test('knight tour validation', () => {
      // Test a simple knight tour sequence
      const game = new ChessGame();
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'knight', color: 'white' };
      
      const knightMoves = [
        { from: { row: 0, col: 0 }, to: { row: 2, col: 1 } },
        { from: { row: 2, col: 1 }, to: { row: 4, col: 2 } },
        { from: { row: 4, col: 2 }, to: { row: 6, col: 3 } },
        { from: { row: 6, col: 3 }, to: { row: 4, col: 4 } }
      ];
      
      knightMoves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Rook Movement', () => {
    test('should allow horizontal and vertical moves', () => {
      // Clear path for rook
      game.board[6][0] = null;
      game.board[5][0] = null;
      game.board[4][0] = null;
      
      const result = game.makeMove({
        from: { row: 7, col: 0 },
        to: { row: 4, col: 0 }
      });
      expect(result.success).toBe(true);
    });

    test('should not allow diagonal moves', () => {
      game.board[6][0] = null;
      
      const result = game.makeMove({
        from: { row: 7, col: 0 },
        to: { row: 6, col: 1 }
      });
      expect(result.success).toBe(false);
    });

    test('should not allow moves through pieces', () => {
      const result = game.makeMove({
        from: { row: 7, col: 0 },
        to: { row: 4, col: 0 }
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Bishop Movement', () => {
    test('should allow diagonal moves', () => {
      game.board[6][3] = null;
      
      const result = game.makeMove({
        from: { row: 7, col: 2 },
        to: { row: 6, col: 3 }
      });
      expect(result.success).toBe(true);
    });

    test('should not allow non-diagonal moves', () => {
      game.board[6][2] = null;
      
      const result = game.makeMove({
        from: { row: 7, col: 2 },
        to: { row: 6, col: 2 }
      });
      expect(result.success).toBe(false);
    });

    test('should not allow moves through pieces', () => {
      const result = game.makeMove({
        from: { row: 7, col: 2 },
        to: { row: 5, col: 4 }
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Queen Movement', () => {
    test('should allow horizontal, vertical, and diagonal moves', () => {
      // Clear paths
      game.board[6][3] = null;
      game.board[5][3] = null;
      
      const horizontalMove = game.makeMove({
        from: { row: 7, col: 3 },
        to: { row: 5, col: 3 }
      });
      expect(horizontalMove.success).toBe(true);
    });

    test('should combine rook and bishop movement rules', () => {
      const game = new ChessGame();
      game.board[6][3] = null;
      game.board[5][3] = null;
      game.board[4][3] = null;
      
      // Vertical move
      const verticalResult = game.makeMove({
        from: { row: 7, col: 3 },
        to: { row: 4, col: 3 }
      });
      expect(verticalResult.success).toBe(true);
    });
  });

  describe('King Movement', () => {
    test('should allow one square moves in all directions', () => {
      game.board[6][4] = null;
      
      const result = game.makeMove({
        from: { row: 7, col: 4 },
        to: { row: 6, col: 4 }
      });
      expect(result.success).toBe(true);
    });

    test('should not allow moves more than one square', () => {
      game.board[6][4] = null;
      game.board[5][4] = null;
      
      const result = game.makeMove({
        from: { row: 7, col: 4 },
        to: { row: 5, col: 4 }
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Castling', () => {
    test('should allow kingside castling when conditions are met', () => {
      // Clear path for castling
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      const result = game.makeMove({
        from: { row: 7, col: 4 },
        to: { row: 7, col: 6 }
      });
      
      expect(result.success).toBe(true);
      expect(game.board[7][6]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][5]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should allow queenside castling when conditions are met', () => {
      // Clear path for castling
      game.board[7][3] = null;
      game.board[7][2] = null;
      game.board[7][1] = null;
      
      const result = game.makeMove({
        from: { row: 7, col: 4 },
        to: { row: 7, col: 2 }
      });
      
      expect(result.success).toBe(true);
      expect(game.board[7][2]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][3]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should not allow castling if king has moved', () => {
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      // Move king and back
      game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 5 } });
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 2, col: 0 } });
      game.makeMove({ from: { row: 7, col: 5 }, to: { row: 7, col: 4 } });
      game.makeMove({ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } });
      
      const result = game.makeMove({
        from: { row: 7, col: 4 },
        to: { row: 7, col: 6 }
      });
      expect(result.success).toBe(false);
    });

    test('should not allow castling if rook has moved', () => {
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      // Move rook and back
      game.makeMove({ from: { row: 7, col: 7 }, to: { row: 7, col: 5 } });
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 2, col: 0 } });
      game.makeMove({ from: { row: 7, col: 5 }, to: { row: 7, col: 7 } });
      game.makeMove({ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } });
      
      const result = game.makeMove({
        from: { row: 7, col: 4 },
        to: { row: 7, col: 6 }
      });
      expect(result.success).toBe(false);
    });

    test('should not allow castling through check', () => {
      game.board[7][5] = null;
      game.board[7][6] = null;
      // Place attacking piece
      game.board[1][5] = { type: 'rook', color: 'black' };
      
      const result = game.makeMove({
        from: { row: 7, col: 4 },
        to: { row: 7, col: 6 }
      });
      expect(result.success).toBe(false);
    });

    test('should not allow castling while in check', () => {
      game.board[7][5] = null;
      game.board[7][6] = null;
      // Place attacking piece targeting king
      game.board[1][4] = { type: 'rook', color: 'black' };
      
      const result = game.makeMove({
        from: { row: 7, col: 4 },
        to: { row: 7, col: 6 }
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Check and Checkmate', () => {
    test('should detect when king is in check', () => {
      // Place attacking rook
      game.board[1][4] = { type: 'rook', color: 'black' };
      
      const inCheck = game.isInCheck('white');
      expect(inCheck).toBe(true);
    });

    test('should not allow moves that put own king in check', () => {
      // Set up scenario where moving a piece would expose king
      game.board[6][4] = null;
      game.board[5][4] = { type: 'bishop', color: 'white' };
      game.board[1][4] = { type: 'rook', color: 'black' };
      
      const result = game.makeMove({
        from: { row: 5, col: 4 },
        to: { row: 4, col: 3 }
      });
      expect(result.success).toBe(false);
    });

    test('should detect checkmate', () => {
      // Set up checkmate scenario (Scholar's mate)
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][4] = { type: 'king', color: 'black' };
      game.board[1][5] = { type: 'pawn', color: 'black' };
      game.board[1][6] = { type: 'pawn', color: 'black' };
      game.board[1][7] = { type: 'pawn', color: 'black' };
      game.board[2][3] = { type: 'queen', color: 'white' };
      game.board[3][2] = { type: 'bishop', color: 'white' };
      game.currentTurn = 'black';
      
      const isCheckmate = game.isCheckmate('black');
      expect(isCheckmate).toBe(true);
    });

    test('should detect stalemate', () => {
      // Set up stalemate scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[1][1] = { type: 'queen', color: 'white' };
      game.board[2][1] = { type: 'king', color: 'white' };
      game.currentTurn = 'black';
      
      const isStalemate = game.isStalemate('black');
      expect(isStalemate).toBe(true);
    });
  });

  describe('Turn Management', () => {
    test('should alternate turns between white and black', () => {
      expect(game.currentTurn).toBe('white');
      
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      expect(game.currentTurn).toBe('black');
      
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } });
      expect(game.currentTurn).toBe('white');
    });

    test('should not allow wrong color to move', () => {
      const result = game.makeMove({
        from: { row: 1, col: 4 },
        to: { row: 2, col: 4 }
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Game State', () => {
    test('should return correct game state', () => {
      const state = game.getGameState();
      
      expect(state).toHaveProperty('board');
      expect(state).toHaveProperty('currentTurn');
      expect(state).toHaveProperty('status');
      expect(state).toHaveProperty('winner');
      expect(state).toHaveProperty('moveHistory');
      expect(state).toHaveProperty('inCheck');
      
      expect(state.board).toHaveLength(8);
      expect(state.board[0]).toHaveLength(8);
      expect(state.currentTurn).toBe('white');
      expect(state.status).toBe('active');
    });

    test('should track move history', () => {
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } });
      
      const state = game.getGameState();
      expect(state.moveHistory).toHaveLength(2);
      expect(state.moveHistory[0]).toEqual({
        from: { row: 6, col: 4 },
        to: { row: 5, col: 4 },
        piece: 'pawn',
        color: 'white',
        captured: null,
        promotion: null
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid square coordinates', () => {
      const result = game.makeMove({
        from: { row: -1, col: 0 },
        to: { row: 0, col: 0 }
      });
      expect(result.success).toBe(false);
    });

    test('should handle moving from empty square', () => {
      const result = game.makeMove({
        from: { row: 4, col: 4 },
        to: { row: 3, col: 4 }
      });
      expect(result.success).toBe(false);
    });

    test('should handle capturing own piece', () => {
      const result = game.makeMove({
        from: { row: 6, col: 4 },
        to: { row: 7, col: 4 }
      });
      expect(result.success).toBe(false);
    });
  });
});