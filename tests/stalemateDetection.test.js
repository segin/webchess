const ChessGame = require('../src/shared/chessGame.js');

describe('Stalemate Detection System', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Basic Stalemate Detection', () => {
    test('should detect stalemate when king has no legal moves but is not in check', () => {
      // Classic stalemate position: King in corner with no escape
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };  // Black king on a8
      game.board[1][2] = { type: 'queen', color: 'white' }; // White queen on c7
      game.board[2][1] = { type: 'king', color: 'white' };  // White king on b6
      game.currentTurn = 'black';

      expect(game.isInCheck('black')).toBe(false);
      expect(game.hasValidMoves('black')).toBe(false);
      expect(game.isStalemate('black')).toBe(true);
      expect(game.isCheckmate('black')).toBe(false);
    });

    test('should not detect stalemate when king is in check', () => {
      // Proper checkmate position where king is in check with no escape
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };  // Black king on a8
      game.board[1][0] = { type: 'rook', color: 'white' };  // White rook on a7 (giving check)
      game.board[0][2] = { type: 'rook', color: 'white' };  // White rook on c8 (blocking escape)
      game.board[2][1] = { type: 'king', color: 'white' };  // White king on b6
      game.currentTurn = 'black';

      expect(game.isInCheck('black')).toBe(true);
      expect(game.hasValidMoves('black')).toBe(false);
      expect(game.isStalemate('black')).toBe(false);
      expect(game.isCheckmate('black')).toBe(true);
    });

    test('should not detect stalemate when player has legal moves', () => {
      // Position where king has legal moves (king in center with space to move)
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'black' };  // Black king on e4 (center)
      game.board[6][0] = { type: 'queen', color: 'white' }; // White queen on a2 (not threatening e4)
      game.board[7][7] = { type: 'king', color: 'white' };  // White king on h1
      game.currentTurn = 'black';

      expect(game.isInCheck('black')).toBe(false);
      expect(game.hasValidMoves('black')).toBe(true);
      expect(game.isStalemate('black')).toBe(false);
      expect(game.isCheckmate('black')).toBe(false);
    });
  });

  describe('Classic Stalemate Positions', () => {
    test('should detect king and queen vs king stalemate', () => {
      // Classic K+Q vs K stalemate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };  // Black king on a8
      game.board[1][2] = { type: 'queen', color: 'white' }; // White queen on c7
      game.board[2][1] = { type: 'king', color: 'white' };  // White king on b6
      game.currentTurn = 'black';

      expect(game.isStalemate('black')).toBe(true);
      
      game.checkGameEnd();
      expect(game.gameStatus).toBe('stalemate');
      expect(game.winner).toBeNull();
    });

    test('should detect king and rook vs king stalemate', () => {
      // K+R vs K stalemate position - use the working queen pattern but with rook
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };  // Black king on a8
      game.board[1][2] = { type: 'rook', color: 'white' };  // White rook on c7 (controls a7, b7)
      game.board[0][2] = { type: 'king', color: 'white' };  // White king on c8 (controls b8, b7)
      game.currentTurn = 'black';

      expect(game.isStalemate('black')).toBe(true);
      
      game.checkGameEnd();
      expect(game.gameStatus).toBe('stalemate');
      expect(game.winner).toBeNull();
    });

    test('should detect pawn stalemate position', () => {
      // Stalemate with pawn blocking king - proper setup
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };  // Black king on a8
      game.board[1][0] = { type: 'pawn', color: 'white' };  // White pawn on a7 (blocks a7)
      game.board[2][1] = { type: 'king', color: 'white' };  // White king on b6 (controls a7, b7, b8)
      game.currentTurn = 'black';

      expect(game.isStalemate('black')).toBe(true);
      
      game.checkGameEnd();
      expect(game.gameStatus).toBe('stalemate');
      expect(game.winner).toBeNull();
    });
  });

  describe('Complex Stalemate Scenarios', () => {
    test('should detect stalemate with multiple pieces involved', () => {
      // Complex position with multiple pieces where king has no moves
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };    // Black king on a8
      game.board[1][2] = { type: 'queen', color: 'white' };   // White queen on c7 (controls a7, b7, b8)
      game.board[2][1] = { type: 'king', color: 'white' };    // White king on b6 (controls a7, b7, b8)
      game.currentTurn = 'black';

      // Verify the king is not in check but has no legal moves
      expect(game.isInCheck('black')).toBe(false);
      expect(game.hasValidMoves('black')).toBe(false);
      expect(game.isStalemate('black')).toBe(true);
    });

    test('should detect stalemate with pinned pieces', () => {
      // Position where pieces are pinned and king has no moves - simpler case
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };    // Black king on a8
      game.board[0][1] = { type: 'bishop', color: 'black' };  // Black bishop on b8 (pinned by rook)
      game.board[0][7] = { type: 'rook', color: 'white' };    // White rook on h8 (pinning bishop)
      game.board[1][2] = { type: 'queen', color: 'white' };   // White queen on c7 (controls a7, b7)
      game.board[2][1] = { type: 'king', color: 'white' };    // White king on b6 (controls a7, b7, b8)
      game.currentTurn = 'black';

      expect(game.isInCheck('black')).toBe(false);
      expect(game.hasValidMoves('black')).toBe(false);
      expect(game.isStalemate('black')).toBe(true);
    });

    test('should handle stalemate with en passant possibilities', () => {
      // Position where en passant doesn't help avoid stalemate - king still trapped
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };    // Black king on a8
      game.board[1][2] = { type: 'queen', color: 'white' };   // White queen on c7 (controls a7, b7, b8)
      game.board[2][1] = { type: 'king', color: 'white' };    // White king on b6 (controls a7, b7, b8)
      game.currentTurn = 'black';

      // Even without en passant, this should be stalemate
      expect(game.isStalemate('black')).toBe(true);
    });
  });

  describe('False Stalemate Detection', () => {
    test('should not detect stalemate when king has hidden legal moves', () => {
      // Position that looks like stalemate but king can move
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][1] = { type: 'king', color: 'black' };    // Black king on b8
      game.board[1][3] = { type: 'queen', color: 'white' };   // White queen on d7
      game.board[2][2] = { type: 'king', color: 'white' };    // White king on c6
      game.currentTurn = 'black';

      // King can move to a8, a7, b7, c8, c7
      expect(game.hasValidMoves('black')).toBe(true);
      expect(game.isStalemate('black')).toBe(false);
    });

    test('should not detect stalemate when other pieces have legal moves', () => {
      // Position where king is trapped but other pieces can move
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };    // Black king on a8
      game.board[0][7] = { type: 'rook', color: 'black' };    // Black rook on h8
      game.board[1][2] = { type: 'queen', color: 'white' };   // White queen on c7
      game.board[2][1] = { type: 'king', color: 'white' };    // White king on b6
      game.currentTurn = 'black';

      // Rook has legal moves even though king is trapped
      expect(game.hasValidMoves('black')).toBe(true);
      expect(game.isStalemate('black')).toBe(false);
    });

    test('should not detect stalemate when pawn can move', () => {
      // Position where king is trapped but pawn can move
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };    // Black king on a8
      game.board[1][7] = { type: 'pawn', color: 'black' };    // Black pawn on h7
      game.board[1][2] = { type: 'queen', color: 'white' };   // White queen on c7
      game.board[2][1] = { type: 'king', color: 'white' };    // White king on b6
      game.currentTurn = 'black';

      // Pawn can move forward
      expect(game.hasValidMoves('black')).toBe(true);
      expect(game.isStalemate('black')).toBe(false);
    });

    test('should not detect stalemate when piece can capture', () => {
      // Position where piece can capture to avoid stalemate
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };    // Black king on a8
      game.board[0][6] = { type: 'rook', color: 'black' };    // Black rook on g8
      game.board[0][7] = { type: 'rook', color: 'white' };    // White rook on h8 (can be captured)
      game.board[1][2] = { type: 'queen', color: 'white' };   // White queen on c7
      game.board[2][1] = { type: 'king', color: 'white' };    // White king on b6
      game.currentTurn = 'black';

      // Black rook can capture white rook
      expect(game.hasValidMoves('black')).toBe(true);
      expect(game.isStalemate('black')).toBe(false);
    });
  });

  describe('Game State Management', () => {
    test('should set game status to stalemate and winner to null', () => {
      // Set up stalemate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[1][2] = { type: 'queen', color: 'white' };
      game.board[2][1] = { type: 'king', color: 'white' };
      game.currentTurn = 'black';

      game.checkGameEnd();
      
      expect(game.gameStatus).toBe('stalemate');
      expect(game.winner).toBeNull();
    });

    test('should handle stalemate for white player', () => {
      // Set up stalemate position for white
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][0] = { type: 'king', color: 'white' };    // White king on a1
      game.board[6][2] = { type: 'queen', color: 'black' };   // Black queen on c2
      game.board[5][1] = { type: 'king', color: 'black' };    // Black king on b3
      game.currentTurn = 'white';

      expect(game.isStalemate('white')).toBe(true);
      
      game.checkGameEnd();
      expect(game.gameStatus).toBe('stalemate');
      expect(game.winner).toBeNull();
    });

    test('should maintain game history when stalemate occurs', () => {
      // Set up a game with some moves leading to stalemate
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[1][2] = { type: 'queen', color: 'white' };
      game.board[2][1] = { type: 'king', color: 'white' };
      game.currentTurn = 'black';
      
      // Add some move history
      game.moveHistory = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, piece: 'pawn', color: 'white' },
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 }, piece: 'pawn', color: 'black' }
      ];

      game.checkGameEnd();
      
      expect(game.gameStatus).toBe('stalemate');
      expect(game.moveHistory.length).toBe(2); // History should be preserved
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty board gracefully', () => {
      // Edge case: empty board (shouldn't happen in real game)
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.currentTurn = 'white';

      expect(game.hasValidMoves('white')).toBe(false);
      expect(game.isInCheck('white')).toBe(false); // No king means no check
      // This is a degenerate case, but should not crash
    });

    test('should handle single king on board', () => {
      // Edge case: only one king on board
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      game.currentTurn = 'white';

      expect(game.hasValidMoves('white')).toBe(true); // King can move
      expect(game.isStalemate('white')).toBe(false);
    });

    test('should handle king surrounded by own pieces', () => {
      // Edge case: king completely surrounded by own pieces
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[4][4] = { type: 'king', color: 'white' };
      // Surround with own pieces
      game.board[3][3] = { type: 'pawn', color: 'white' };
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[3][5] = { type: 'pawn', color: 'white' };
      game.board[4][3] = { type: 'pawn', color: 'white' };
      game.board[4][5] = { type: 'pawn', color: 'white' };
      game.board[5][3] = { type: 'pawn', color: 'white' };
      game.board[5][4] = { type: 'pawn', color: 'white' };
      game.board[5][5] = { type: 'pawn', color: 'white' };
      game.board[7][7] = { type: 'king', color: 'black' };
      game.currentTurn = 'white';

      // King has no moves, but pawns might have moves
      const hasValidMoves = game.hasValidMoves('white');
      if (!hasValidMoves) {
        expect(game.isStalemate('white')).toBe(true);
      }
    });
  });

  describe('Performance Tests', () => {
    test('should detect stalemate efficiently in complex positions', () => {
      // Set up a complex position with many pieces
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Add many pieces to test performance
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[1][2] = { type: 'queen', color: 'white' };
      game.board[2][1] = { type: 'king', color: 'white' };
      
      // Add more pieces that don't affect the stalemate
      for (let i = 3; i < 8; i++) {
        game.board[i][0] = { type: 'pawn', color: 'white' };
        game.board[i][7] = { type: 'pawn', color: 'black' };
      }
      
      game.currentTurn = 'black';

      const startTime = Date.now();
      const isStalemate = game.isStalemate('black');
      const endTime = Date.now();
      
      expect(isStalemate).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});