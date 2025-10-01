const ChessGame = require('../src/shared/chessGame');

describe('ChessGame Coverage Expansion', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(game.board).toBeDefined();
      expect(game.currentTurn).toBe('white');
      expect(game.gameStatus).toBe('active');
      expect(game.winner).toBeNull();
      expect(game.moveHistory).toEqual([]);
      expect(game.castlingRights).toEqual({
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
      });
      expect(game.enPassantTarget).toBeNull();
      expect(game.halfMoveClock).toBe(0);
      expect(game.fullMoveNumber).toBe(1);
      expect(game.inCheck).toBe(false);
      expect(game.checkDetails).toBeNull();
    });

    test('should initialize state manager and error handler', () => {
      expect(game.stateManager).toBeDefined();
      expect(game.errorHandler).toBeDefined();
      expect(game.gameMetadata).toBeDefined();
      expect(game.positionHistory).toBeDefined();
      expect(game.stateVersion).toBeDefined();
    });

    test('should initialize board with correct piece positions', () => {
      // Test white pieces
      expect(game.board[7][0]).toEqual({ type: 'rook', color: 'white' });
      expect(game.board[7][1]).toEqual({ type: 'knight', color: 'white' });
      expect(game.board[7][2]).toEqual({ type: 'bishop', color: 'white' });
      expect(game.board[7][3]).toEqual({ type: 'queen', color: 'white' });
      expect(game.board[7][4]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][5]).toEqual({ type: 'bishop', color: 'white' });
      expect(game.board[7][6]).toEqual({ type: 'knight', color: 'white' });
      expect(game.board[7][7]).toEqual({ type: 'rook', color: 'white' });

      // Test white pawns
      for (let i = 0; i < 8; i++) {
        expect(game.board[6][i]).toEqual({ type: 'pawn', color: 'white' });
      }

      // Test black pieces
      expect(game.board[0][0]).toEqual({ type: 'rook', color: 'black' });
      expect(game.board[0][1]).toEqual({ type: 'knight', color: 'black' });
      expect(game.board[0][2]).toEqual({ type: 'bishop', color: 'black' });
      expect(game.board[0][3]).toEqual({ type: 'queen', color: 'black' });
      expect(game.board[0][4]).toEqual({ type: 'king', color: 'black' });
      expect(game.board[0][5]).toEqual({ type: 'bishop', color: 'black' });
      expect(game.board[0][6]).toEqual({ type: 'knight', color: 'black' });
      expect(game.board[0][7]).toEqual({ type: 'rook', color: 'black' });

      // Test black pawns
      for (let i = 0; i < 8; i++) {
        expect(game.board[1][i]).toEqual({ type: 'pawn', color: 'black' });
      }

      // Test empty squares
      for (let row = 2; row < 6; row++) {
        for (let col = 0; col < 8; col++) {
          expect(game.board[row][col]).toBeNull();
        }
      }
    });
  });

  describe('makeMove - Multiple Calling Patterns', () => {
    test('should handle move object parameter', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = game.makeMove(move);
      expect(result.success).toBe(true);
    });

    test('should handle separate parameters', () => {
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(true);
    });

    test('should handle promotion parameter', () => {
      // Set up a pawn promotion scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.board[0][1] = { type: 'rook', color: 'black' };
      
      const result = game.makeMove({ row: 1, col: 0 }, { row: 0, col: 1 }, 'queen');
      expect(result.success).toBe(true);
    });

    test('should handle options parameter with silent mode', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = game.makeMove(move, null, null, { silent: true });
      expect(result.success).toBe(true);
    });

    test('should handle system errors gracefully', () => {
      // Force an error by providing malformed move
      const result = game.makeMove(null);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('Move Validation Components', () => {
    test('should validate move format', () => {
      // Test invalid move object
      let result = game.validateMove(null);
      expect(result.success).toBe(false);

      result = game.validateMove({});
      expect(result.success).toBe(false);

      result = game.validateMove({ from: { row: 6, col: 4 } });
      expect(result.success).toBe(false);

      // Test valid move format
      result = game.validateMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(result.success).toBe(true);
    });

    test('should validate game state', () => {
      // Test with inactive game
      game.gameStatus = 'checkmate';
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = game.validateMove(move);
      expect(result.success).toBe(false);
    });

    test('should validate coordinates', () => {
      // Test invalid coordinates
      let move = { from: { row: -1, col: 4 }, to: { row: 4, col: 4 } };
      let result = game.validateMove(move);
      expect(result.success).toBe(false);

      move = { from: { row: 6, col: 8 }, to: { row: 4, col: 4 } };
      result = game.validateMove(move);
      expect(result.success).toBe(false);

      move = { from: { row: 6, col: 4 }, to: { row: -1, col: 4 } };
      result = game.validateMove(move);
      expect(result.success).toBe(false);

      move = { from: { row: 6, col: 4 }, to: { row: 4, col: 8 } };
      result = game.validateMove(move);
      expect(result.success).toBe(false);
    });

    test('should validate piece at square', () => {
      // Test empty square
      const move = { from: { row: 4, col: 4 }, to: { row: 3, col: 4 } };
      const result = game.validateMove(move);
      expect(result.success).toBe(false);
    });

    test('should validate turn', () => {
      // Try to move black piece on white's turn
      const move = { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } };
      const result = game.validateMove(move);
      expect(result.success).toBe(false);
    });
  });

  describe('Castling Rights Management', () => {
    test('should have initial castling rights', () => {
      expect(game.castlingRights.white.kingside).toBe(true);
      expect(game.castlingRights.white.queenside).toBe(true);
      expect(game.castlingRights.black.kingside).toBe(true);
      expect(game.castlingRights.black.queenside).toBe(true);
    });

    test('should track castling rights structure', () => {
      expect(game.castlingRights).toHaveProperty('white');
      expect(game.castlingRights).toHaveProperty('black');
      expect(game.castlingRights.white).toHaveProperty('kingside');
      expect(game.castlingRights.white).toHaveProperty('queenside');
    });

    test('should have updateCastlingRights method', () => {
      expect(typeof game.updateCastlingRights).toBe('function');
    });
  });

  describe('Game State Updates', () => {
    test('should update turn after move', () => {
      expect(game.currentTurn).toBe('white');
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(game.currentTurn).toBe('black');
    });

    test('should update move history', () => {
      const initialHistoryLength = game.moveHistory.length;
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(game.moveHistory.length).toBe(initialHistoryLength + 1);
    });

    test('should track half-move clock', () => {
      expect(typeof game.halfMoveClock).toBe('number');
      expect(game.halfMoveClock).toBe(0);
    });

    test('should update full move number', () => {
      const initialMoveNumber = game.fullMoveNumber;
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // White move
      expect(game.fullMoveNumber).toBe(initialMoveNumber);
      
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // Black move
      expect(game.fullMoveNumber).toBe(initialMoveNumber + 1);
    });
  });

  describe('Check Detection and Game End', () => {
    test('should have check detection properties', () => {
      expect(typeof game.inCheck).toBe('boolean');
      expect(game.checkDetails).toBeNull();
    });

    test('should have checkGameEnd method', () => {
      expect(typeof game.checkGameEnd).toBe('function');
    });

    test('should track game status', () => {
      expect(game.gameStatus).toBe('active');
      expect(game.winner).toBeNull();
    });
  });

  describe('Special Moves Execution', () => {
    test('should track en passant target', () => {
      expect(game.enPassantTarget).toBeNull();
    });

    test('should have executeMoveOnBoard method', () => {
      expect(typeof game.executeMoveOnBoard).toBe('function');
    });
  });

  describe('Error Handling Edge Cases', () => {
    test('should handle malformed move objects', () => {
      const result = game.makeMove({ from: "invalid", to: { row: 4, col: 4 } });
      expect(result.success).toBe(false);
    });

    test('should handle moves with invalid piece types', () => {
      // Corrupt a piece
      game.board[6][4] = { type: 'invalid', color: 'white' };
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(result.success).toBe(false);
    });

    test('should handle same square moves', () => {
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 6, col: 4 } });
      expect(result.success).toBe(false);
    });
  });

  describe('Position History and State Management', () => {
    test('should track position history', () => {
      const initialPositions = game.positionHistory.length;
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(game.positionHistory.length).toBe(initialPositions + 1);
    });

    test('should update state version', () => {
      const initialVersion = game.stateVersion;
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(game.stateVersion).toBeGreaterThan(initialVersion);
    });

    test('should maintain game metadata', () => {
      expect(game.gameMetadata).toBeDefined();
      expect(typeof game.gameMetadata).toBe('object');
    });
  });
});