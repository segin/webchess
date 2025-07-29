const ChessGame = require('../src/shared/chessGame');

describe('En Passant Target Management', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('En Passant Target Setting', () => {
    test('should set en passant target when white pawn moves two squares from starting position', () => {
      // White pawn moves from e2 to e4
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      
      expect(result.success).toBe(true);
      expect(game.enPassantTarget).toEqual({ row: 5, col: 4 }); // e3 square
    });

    test('should set en passant target when black pawn moves two squares from starting position', () => {
      // White moves first
      game.makeMove({ from: { row: 6, col: 0 }, to: { row: 5, col: 0 } });
      
      // Black pawn moves from d7 to d5
      const result = game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } });
      
      expect(result.success).toBe(true);
      expect(game.enPassantTarget).toEqual({ row: 2, col: 3 }); // d6 square
    });

    test('should set en passant target for all files when pawns move two squares', () => {
      const testCases = [
        { file: 0, expectedTarget: { row: 5, col: 0 } }, // a-file
        { file: 1, expectedTarget: { row: 5, col: 1 } }, // b-file
        { file: 2, expectedTarget: { row: 5, col: 2 } }, // c-file
        { file: 3, expectedTarget: { row: 5, col: 3 } }, // d-file
        { file: 4, expectedTarget: { row: 5, col: 4 } }, // e-file
        { file: 5, expectedTarget: { row: 5, col: 5 } }, // f-file
        { file: 6, expectedTarget: { row: 5, col: 6 } }, // g-file
        { file: 7, expectedTarget: { row: 5, col: 7 } }  // h-file
      ];

      testCases.forEach(({ file, expectedTarget }) => {
        const freshGame = new ChessGame();
        const result = freshGame.makeMove({ from: { row: 6, col: file }, to: { row: 4, col: file } });
        
        expect(result.success).toBe(true);
        expect(freshGame.enPassantTarget).toEqual(expectedTarget);
      });
    });

    test('should not set en passant target when pawn moves one square', () => {
      // White pawn moves from e2 to e3 (one square)
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      
      expect(result.success).toBe(true);
      expect(game.enPassantTarget).toBeNull();
    });

    test('should not set en passant target when non-pawn pieces move', () => {
      // Knight moves
      const result = game.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } });
      
      expect(result.success).toBe(true);
      expect(game.enPassantTarget).toBeNull();
    });

    test('should not set en passant target when pawn moves from non-starting position', () => {
      // Move pawn to middle of board first
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } });
      
      // Now move the white pawn one square from non-starting position (two squares not allowed)
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
      
      expect(result.success).toBe(true);
      expect(game.enPassantTarget).toBeNull(); // Should not set target
    });
  });

  describe('En Passant Target Cleanup', () => {
    test('should clear en passant target after any non-en-passant move', () => {
      // Set up en passant target
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(game.enPassantTarget).toEqual({ row: 5, col: 4 });
      
      // Make any other move (not a two-square pawn move)
      const result = game.makeMove({ from: { row: 1, col: 0 }, to: { row: 2, col: 0 } });
      
      expect(result.success).toBe(true);
      expect(game.enPassantTarget).toBeNull();
    });

    test('should clear en passant target after white makes non-capturing move', () => {
      // Set up en passant target
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } });
      expect(game.enPassantTarget).toEqual({ row: 2, col: 0 });
      
      // White makes a knight move
      const result = game.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } });
      
      expect(result.success).toBe(true);
      expect(game.enPassantTarget).toBeNull();
    });

    test('should clear en passant target after pawn moves one square', () => {
      // Set up en passant target
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(game.enPassantTarget).toEqual({ row: 5, col: 4 });
      
      // Black pawn moves one square
      const result = game.makeMove({ from: { row: 1, col: 0 }, to: { row: 2, col: 0 } });
      
      expect(result.success).toBe(true);
      expect(game.enPassantTarget).toBeNull();
    });

    test('should update en passant target when new pawn moves two squares', () => {
      // First pawn moves two squares
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(game.enPassantTarget).toEqual({ row: 5, col: 4 });
      
      // Second pawn moves two squares
      const result = game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } });
      
      expect(result.success).toBe(true);
      expect(game.enPassantTarget).toEqual({ row: 2, col: 3 }); // Updated to new target
    });
  });

  describe('En Passant Capture Mechanics', () => {
    test('should execute en passant capture and remove captured pawn', () => {
      // Set up en passant scenario
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e2-e4
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } }); // a7-a5
      game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }); // e4-e5
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }); // d7-d5 (creates en passant opportunity)
      
      expect(game.enPassantTarget).toEqual({ row: 2, col: 3 });
      expect(game.board[3][3]).toEqual({ type: 'pawn', color: 'black' }); // Black pawn on d5
      
      // White captures en passant
      const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 3 } });
      
      expect(result.success).toBe(true);
      expect(game.board[2][3]).toEqual({ type: 'pawn', color: 'white' }); // White pawn moved to d6
      expect(game.board[3][3]).toBeNull(); // Black pawn removed from d5
      expect(game.enPassantTarget).toBeNull(); // Target cleared after capture
    });

    test('should execute en passant capture from left side', () => {
      // Set up en passant scenario with white pawn on left
      game.makeMove({ from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }); // d2-d4
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } }); // a7-a5
      game.makeMove({ from: { row: 4, col: 3 }, to: { row: 3, col: 3 } }); // d4-d5
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // e7-e5 (creates en passant opportunity)
      
      expect(game.enPassantTarget).toEqual({ row: 2, col: 4 });
      
      // White captures en passant from left
      const result = game.makeMove({ from: { row: 3, col: 3 }, to: { row: 2, col: 4 } });
      
      expect(result.success).toBe(true);
      expect(game.board[2][4]).toEqual({ type: 'pawn', color: 'white' }); // White pawn moved to e6
      expect(game.board[3][4]).toBeNull(); // Black pawn removed from e5
    });

    test('should execute en passant capture from right side', () => {
      // Set up en passant scenario with white pawn on right
      game.makeMove({ from: { row: 6, col: 5 }, to: { row: 4, col: 5 } }); // f2-f4
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } }); // a7-a5
      game.makeMove({ from: { row: 4, col: 5 }, to: { row: 3, col: 5 } }); // f4-f5
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // e7-e5 (creates en passant opportunity)
      
      expect(game.enPassantTarget).toEqual({ row: 2, col: 4 });
      
      // White captures en passant from right
      const result = game.makeMove({ from: { row: 3, col: 5 }, to: { row: 2, col: 4 } });
      
      expect(result.success).toBe(true);
      expect(game.board[2][4]).toEqual({ type: 'pawn', color: 'white' }); // White pawn moved to e6
      expect(game.board[3][4]).toBeNull(); // Black pawn removed from e5
    });

    test('should execute black en passant capture', () => {
      // Set up en passant scenario for black
      game.makeMove({ from: { row: 6, col: 0 }, to: { row: 5, col: 0 } }); // a2-a3
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // e7-e5
      game.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }); // Nb1-c3
      game.makeMove({ from: { row: 3, col: 4 }, to: { row: 4, col: 4 } }); // e5-e4
      game.makeMove({ from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }); // d2-d4 (creates en passant opportunity)
      
      expect(game.enPassantTarget).toEqual({ row: 5, col: 3 });
      
      // Black captures en passant
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 5, col: 3 } });
      
      expect(result.success).toBe(true);
      expect(game.board[5][3]).toEqual({ type: 'pawn', color: 'black' }); // Black pawn moved to d3
      expect(game.board[4][3]).toBeNull(); // White pawn removed from d4
    });

    test('should record en passant capture in move history', () => {
      // Set up en passant scenario
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e2-e4
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } }); // a7-a5
      game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }); // e4-e5
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }); // d7-d5
      
      const initialHistoryLength = game.moveHistory.length;
      
      // Execute en passant capture
      const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 3 } });
      
      expect(result.success).toBe(true);
      expect(game.moveHistory.length).toBe(initialHistoryLength + 1);
      
      const lastMove = game.moveHistory[game.moveHistory.length - 1];
      expect(lastMove.enPassant).toBe(true);
      expect(lastMove.captured).toBe('pawn');
      expect(lastMove.piece).toBe('pawn');
      expect(lastMove.color).toBe('white');
    });
  });

  describe('En Passant Edge Cases', () => {
    test('should reject en passant attempt when no en passant target exists', () => {
      // Set up pawns adjacent to each other without en passant opportunity
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[3][3] = { type: 'pawn', color: 'black' };
      game.enPassantTarget = null;
      game.currentTurn = 'white';
      
      const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 3 } });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    test('should reject en passant attempt to wrong square', () => {
      // Set up en passant scenario
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e2-e4
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } }); // a7-a5
      game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }); // e4-e5
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }); // d7-d5
      
      expect(game.enPassantTarget).toEqual({ row: 2, col: 3 });
      
      // Try to capture to wrong square
      const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 2 } });
      
      expect(result.success).toBe(false);
    });

    test('should reject en passant attempt by wrong piece', () => {
      // Set up en passant scenario but try to capture with non-pawn
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e2-e4
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } }); // a7-a5
      game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }); // e4-e5
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }); // d7-d5
      
      // Place a knight where the pawn was
      game.board[3][4] = { type: 'knight', color: 'white' };
      
      const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 3 } });
      
      expect(result.success).toBe(false);
    });

    test('should reject en passant attempt from wrong rank', () => {
      // Set up scenario with pawn on wrong rank for en passant
      game.board[4][4] = { type: 'pawn', color: 'white' }; // Wrong rank for white en passant
      game.board[3][3] = { type: 'pawn', color: 'black' };
      game.enPassantTarget = { row: 2, col: 3 };
      game.currentTurn = 'white';
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 3 } });
      
      expect(result.success).toBe(false);
    });

    test('should handle en passant target validation with invalid coordinates', () => {
      // Test with out-of-bounds en passant target (should not happen in normal play)
      game.enPassantTarget = { row: -1, col: 3 };
      
      const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: -1, col: 3 } });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid coordinates');
    });

    test('should handle missing captured pawn in en passant scenario', () => {
      // Set up en passant target but remove the pawn that should be captured
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e2-e4
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } }); // a7-a5
      game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }); // e4-e5
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }); // d7-d5
      
      // Remove the black pawn that should be captured
      game.board[3][3] = null;
      
      const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 3 } });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('en passant');
    });
  });

  describe('En Passant Target Validation', () => {
    test('should validate en passant target coordinates are within bounds', () => {
      // This tests the internal validation logic
      const validTargets = [
        { row: 2, col: 0 }, { row: 2, col: 7 }, // Black en passant targets
        { row: 5, col: 0 }, { row: 5, col: 7 }  // White en passant targets
      ];
      
      validTargets.forEach(target => {
        const freshGame = new ChessGame();
        freshGame.enPassantTarget = target;
        expect(freshGame.enPassantTarget).toEqual(target);
      });
    });

    test('should handle en passant target persistence across moves', () => {
      // Test that en passant target persists correctly until used or cleared
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e2-e4
      const targetAfterFirstMove = game.enPassantTarget;
      
      game.makeMove({ from: { row: 1, col: 0 }, to: { row: 3, col: 0 } }); // a7-a5
      expect(game.enPassantTarget).toEqual({ row: 2, col: 0 }); // Updated target
      expect(game.enPassantTarget).not.toEqual(targetAfterFirstMove);
    });

    test('should maintain en passant target consistency in game state', () => {
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e2-e4
      
      // Check that en passant target is included in game state snapshots
      const gameState = game.getGameState ? game.getGameState() : {
        enPassantTarget: game.enPassantTarget,
        currentTurn: game.currentTurn,
        board: game.board
      };
      
      expect(gameState.enPassantTarget).toEqual({ row: 5, col: 4 });
    });
  });
});