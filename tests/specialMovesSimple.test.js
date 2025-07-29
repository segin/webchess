const ChessGame = require('../src/shared/chessGame');

describe('Simple Special Moves Test', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Basic Castling', () => {
    test('should allow white kingside castling', () => {
      // Clear path between king and rook
      game.board[7][5] = null; // Bishop
      game.board[7][6] = null; // Knight
      
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.board[7][6]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][5]).toEqual({ type: 'rook', color: 'white' });
    });

    test('should reject castling when path is blocked', () => {
      // Don't clear the path - bishop should block
      const move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(move);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_CASTLING');
    });
  });

  describe('Basic En Passant', () => {
    test('should execute en passant capture', () => {
      // Set up en passant scenario
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e2-e4
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } }); // a7-a5
      game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }); // e4-e5
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }); // d7-d5
      
      expect(game.enPassantTarget).toEqual({ row: 2, col: 3 });
      
      // Execute en passant
      const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 3 } });
      
      expect(result.success).toBe(true);
      expect(game.board[2][3]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[3][3]).toBe(null); // Captured pawn removed
    });
  });

  describe('Basic Pawn Promotion', () => {
    test('should promote pawn to queen by default', () => {
      // Set up pawn near promotion
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.board[6][0] = null; // Remove original pawn
      game.board[0][0] = null; // Clear destination
      
      const move = { from: { row: 1, col: 0 }, to: { row: 0, col: 0 } };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.board[0][0]).toEqual({ type: 'queen', color: 'white' });
    });

    test('should promote pawn to specified piece', () => {
      // Set up pawn near promotion
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.board[6][0] = null; // Remove original pawn
      game.board[0][0] = null; // Clear destination
      
      const move = { from: { row: 1, col: 0 }, to: { row: 0, col: 0 }, promotion: 'rook' };
      const result = game.makeMove(move);
      
      expect(result.success).toBe(true);
      expect(game.board[0][0]).toEqual({ type: 'rook', color: 'white' });
    });
  });
});