/**
 * Comprehensive Game Flow Tests
 * Tests complete games from start to various end conditions
 */

const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Game Flow', () => {
  let game;

  beforeEach(() => {
    game = testUtils.createFreshGame();
  });

  describe('Complete Game Scenarios', () => {
    test('should handle Scholar\'s Mate (4-move checkmate)', () => {
      const scholarsMate = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // 1. e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // 1... e5
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // 2. Bc4
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // 2... Nc6
        { from: { row: 7, col: 3 }, to: { row: 3, col: 7 } }, // 3. Qh5
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }, // 3... Nf6??
        { from: { row: 3, col: 7 }, to: { row: 1, col: 5 } }  // 4. Qxf7# (checkmate)
      ];
      
      // Execute all moves except the last one
      for (let i = 0; i < scholarsMate.length - 1; i++) {
        const result = game.makeMove(scholarsMate[i]);
        testUtils.validateSuccessResponse(result);
      }
      
      // Execute checkmate move
      const checkmateResult = game.makeMove(scholarsMate[scholarsMate.length - 1]);
      testUtils.validateSuccessResponse(checkmateResult);
      
      // Verify game is in checkmate
      expect(game.status).toBe('checkmate');
      expect(game.winner).toBe('white');
    });

    test('should handle Fool\'s Mate (2-move checkmate)', () => {
      const foolsMate = [
        { from: { row: 6, col: 5 }, to: { row: 5, col: 5 } }, // 1. f3??
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // 1... e5
        { from: { row: 6, col: 6 }, to: { row: 4, col: 6 } }, // 2. g4??
        { from: { row: 0, col: 3 }, to: { row: 4, col: 7 } }  // 2... Qh4# (checkmate)
      ];
      
      // Execute all moves
      foolsMate.forEach((move, index) => {
        const result = game.makeMove(move);
        testUtils.validateSuccessResponse(result);
        
        if (index === foolsMate.length - 1) {
          // Last move should result in checkmate
          expect(game.status).toBe('checkmate');
          expect(game.winner).toBe('black');
        }
      });
    });

    test('should handle a typical opening sequence', () => {
      const italianGame = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // 1. e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // 1... e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // 2. Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // 2... Nc6
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // 3. Bc4
        { from: { row: 0, col: 5 }, to: { row: 3, col: 2 } }, // 3... Bc5
        { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }, // 4. d3
        { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }, // 4... d6
        { from: { row: 7, col: 2 }, to: { row: 6, col: 3 } }, // 5. Bg5
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }  // 5... Nf6
      ];
      
      italianGame.forEach(move => {
        const result = game.makeMove(move);
        testUtils.validateSuccessResponse(result);
      });
      
      // Game should still be active
      expect(game.status).toBe('active');
      expect(game.currentTurn).toBe('white');
      expect(game.moveHistory).toHaveLength(10);
    });

    test('should handle castling in game flow', () => {
      const castlingGame = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // 1. e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // 1... e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // 2. Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // 2... Nc6
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // 3. Bc4
        { from: { row: 0, col: 5 }, to: { row: 3, col: 2 } }, // 3... Bc5
        { from: { row: 7, col: 4 }, to: { row: 7, col: 6 }, castling: 'kingside' }, // 4. O-O
        { from: { row: 0, col: 4 }, to: { row: 0, col: 6 }, castling: 'kingside' }  // 4... O-O
      ];
      
      castlingGame.forEach(move => {
        const result = game.makeMove(move);
        testUtils.validateSuccessResponse(result);
      });
      
      // Verify both kings and rooks are in castled positions
      expect(game.board[7][6]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][5]).toEqual({ type: 'rook', color: 'white' });
      expect(game.board[0][6]).toEqual({ type: 'king', color: 'black' });
      expect(game.board[0][5]).toEqual({ type: 'rook', color: 'black' });
    });

    test('should handle pawn promotion in game flow', () => {
      // Set up a position where pawn can promote
      const promotionGame = testUtils.createFreshGame();
      
      // Clear most pieces and set up promotion scenario
      promotionGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      promotionGame.board[0][4] = { type: 'king', color: 'black' };
      promotionGame.board[7][4] = { type: 'king', color: 'white' };
      promotionGame.board[1][0] = { type: 'pawn', color: 'white' };
      promotionGame.board[6][7] = { type: 'pawn', color: 'black' };
      
      // Promote white pawn
      const promotionResult = promotionGame.makeMove({ 
        from: { row: 1, col: 0 }, 
        to: { row: 0, col: 0 },
        promotion: 'queen'
      });
      
      testUtils.validateSuccessResponse(promotionResult);
      expect(promotionGame.board[0][0]).toEqual({ type: 'queen', color: 'white' });
      
      // Black's turn - promote black pawn
      const blackPromotionResult = promotionGame.makeMove({ 
        from: { row: 6, col: 7 }, 
        to: { row: 7, col: 7 },
        promotion: 'knight'
      });
      
      testUtils.validateSuccessResponse(blackPromotionResult);
      expect(promotionGame.board[7][7]).toEqual({ type: 'knight', color: 'black' });
    });

    test('should handle en passant in game flow', () => {
      const enPassantSequence = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // 1. e4
        { from: { row: 1, col: 3 }, to: { row: 2, col: 3 } }, // 1... d6
        { from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }, // 2. e5
        { from: { row: 1, col: 5 }, to: { row: 3, col: 5 } }, // 2... f5 (two squares)
        { from: { row: 3, col: 4 }, to: { row: 2, col: 5 } }  // 3. exf6 e.p.
      ];
      
      enPassantSequence.forEach(move => {
        const result = game.makeMove(move);
        testUtils.validateSuccessResponse(result);
      });
      
      // Verify en passant capture worked
      expect(game.board[2][5]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[3][5]).toBeNull(); // Captured pawn should be removed
    });
  });

  describe('Game End Conditions', () => {
    test('should detect checkmate correctly', () => {
      // Set up back rank mate position
      const checkmateGame = testUtils.createFreshGame();
      checkmateGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      checkmateGame.board[0][4] = { type: 'king', color: 'black' };
      checkmateGame.board[0][3] = { type: 'pawn', color: 'black' };
      checkmateGame.board[0][5] = { type: 'pawn', color: 'black' };
      checkmateGame.board[1][3] = { type: 'pawn', color: 'black' };
      checkmateGame.board[1][4] = { type: 'pawn', color: 'black' };
      checkmateGame.board[1][5] = { type: 'pawn', color: 'black' };
      checkmateGame.board[1][0] = { type: 'rook', color: 'white' };
      checkmateGame.board[7][4] = { type: 'king', color: 'white' };
      checkmateGame.currentTurn = 'white';
      
      // Deliver checkmate
      const result = checkmateGame.makeMove({ from: { row: 1, col: 0 }, to: { row: 0, col: 0 } });
      testUtils.validateSuccessResponse(result);
      
      expect(checkmateGame.status).toBe('checkmate');
      expect(checkmateGame.winner).toBe('white');
    });

    test('should detect stalemate correctly', () => {
      // Set up stalemate position
      const stalemateGame = testUtils.createFreshGame();
      stalemateGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      stalemateGame.board[0][0] = { type: 'king', color: 'black' };
      stalemateGame.board[2][1] = { type: 'king', color: 'white' };
      stalemateGame.board[1][2] = { type: 'queen', color: 'white' };
      stalemateGame.currentTurn = 'black';
      
      // This position should be stalemate (black king has no legal moves but is not in check)
      expect(stalemateGame.status).toBe('stalemate');
    });

    test('should handle draw by insufficient material', () => {
      // Set up position with insufficient material
      const drawGame = testUtils.createFreshGame();
      drawGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      drawGame.board[0][4] = { type: 'king', color: 'black' };
      drawGame.board[7][4] = { type: 'king', color: 'white' };
      
      // King vs King is insufficient material
      expect(drawGame.status).toBe('draw');
    });

    test('should continue game when material is sufficient', () => {
      // Game with sufficient material should continue
      expect(game.status).toBe('active');
      expect(game.winner).toBeNull();
    });

    test('should handle check resolution', () => {
      // Set up check position
      const checkGame = testUtils.createFreshGame();
      checkGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      checkGame.board[4][4] = { type: 'king', color: 'white' };
      checkGame.board[4][0] = { type: 'rook', color: 'black' };
      checkGame.board[0][4] = { type: 'king', color: 'black' };
      checkGame.currentTurn = 'white';
      
      // King should be in check
      expect(checkGame.status).toBe('check');
      
      // Move king out of check
      const result = checkGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
      testUtils.validateSuccessResponse(result);
      
      // Game should no longer be in check
      expect(checkGame.status).toBe('active');
    });
  });

  describe('Game State Consistency', () => {
    test('should maintain consistent turn alternation', () => {
      expect(game.currentTurn).toBe('white');
      
      // Make white move
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      expect(game.currentTurn).toBe('black');
      
      // Make black move
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } });
      expect(game.currentTurn).toBe('white');
    });

    test('should maintain accurate move history', () => {
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } }, // e3
        { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }, // e6
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }  // Nc6
      ];
      
      moves.forEach((move, index) => {
        game.makeMove(move);
        expect(game.moveHistory).toHaveLength(index + 1);
        
        const lastMove = game.moveHistory[game.moveHistory.length - 1];
        expect(lastMove.from).toEqual(move.from);
        expect(lastMove.to).toEqual(move.to);
      });
    });

    test('should track castling rights correctly throughout game', () => {
      // Initially all castling rights should be available
      expect(game.castlingRights.white.kingside).toBe(true);
      expect(game.castlingRights.white.queenside).toBe(true);
      expect(game.castlingRights.black.kingside).toBe(true);
      expect(game.castlingRights.black.queenside).toBe(true);
      
      // Move white king
      game.board[6][4] = null; // Clear path
      game.makeMove({ from: { row: 7, col: 4 }, to: { row: 6, col: 4 } });
      
      // White should lose all castling rights
      expect(game.castlingRights.white.kingside).toBe(false);
      expect(game.castlingRights.white.queenside).toBe(false);
      
      // Black should still have castling rights
      expect(game.castlingRights.black.kingside).toBe(true);
      expect(game.castlingRights.black.queenside).toBe(true);
    });

    test('should track en passant target correctly', () => {
      expect(game.enPassantTarget).toBeNull();
      
      // Make two-square pawn move
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(game.enPassantTarget).toEqual({ row: 5, col: 4 });
      
      // Make another move (not en passant)
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 2, col: 3 } });
      expect(game.enPassantTarget).toBeNull();
    });

    test('should maintain board integrity throughout game', () => {
      const initialPieceCount = countPieces(game.board);
      expect(initialPieceCount.white).toBe(16);
      expect(initialPieceCount.black).toBe(16);
      
      // Make some moves without captures
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } });
      game.makeMove({ from: { row: 7, col: 6 }, to: { row: 5, col: 5 } });
      game.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } });
      
      const afterMovesPieceCount = countPieces(game.board);
      expect(afterMovesPieceCount.white).toBe(16);
      expect(afterMovesPieceCount.black).toBe(16);
      
      // Make a capture
      game.board[2][4] = { type: 'pawn', color: 'black' }; // Place black pawn for capture
      game.makeMove({ from: { row: 5, col: 5 }, to: { row: 2, col: 4 } }); // Knight captures pawn
      
      const afterCapturePieceCount = countPieces(game.board);
      expect(afterCapturePieceCount.white).toBe(16);
      expect(afterCapturePieceCount.black).toBe(15); // One piece captured
    });
  });

  describe('Complex Game Scenarios', () => {
    test('should handle multiple piece exchanges', () => {
      const exchangeSequence = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // 1. e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // 1... e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // 2. Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // 2... Nc6
        { from: { row: 5, col: 5 }, to: { row: 3, col: 4 } }, // 3. Nxe5
        { from: { row: 2, col: 2 }, to: { row: 3, col: 4 } }, // 3... Nxe5
        { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }, // 4. d4
        { from: { row: 3, col: 4 }, to: { row: 5, col: 3 } }  // 4... Nc6
      ];
      
      exchangeSequence.forEach(move => {
        const result = game.makeMove(move);
        testUtils.validateSuccessResponse(result);
      });
      
      // Verify pieces were exchanged correctly
      expect(game.board[5][3]).toEqual({ type: 'knight', color: 'black' });
      expect(game.moveHistory).toHaveLength(8);
    });

    test('should handle tactical combinations', () => {
      // Set up a tactical position (discovered attack)
      const tacticalGame = testUtils.createFreshGame();
      tacticalGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      tacticalGame.board[0][4] = { type: 'king', color: 'black' };
      tacticalGame.board[7][4] = { type: 'king', color: 'white' };
      tacticalGame.board[4][4] = { type: 'knight', color: 'white' };
      tacticalGame.board[6][4] = { type: 'rook', color: 'white' };
      tacticalGame.board[0][3] = { type: 'queen', color: 'black' };
      
      // Move knight to discover rook attack on black king
      const result = tacticalGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 3 } });
      testUtils.validateSuccessResponse(result);
      
      // Black king should be in check from the rook
      expect(tacticalGame.status).toBe('check');
    });

    test('should handle endgame progression', () => {
      // Set up king and pawn endgame
      const endgame = testUtils.createFreshGame();
      endgame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      endgame.board[0][4] = { type: 'king', color: 'black' };
      endgame.board[7][4] = { type: 'king', color: 'white' };
      endgame.board[6][0] = { type: 'pawn', color: 'white' };
      endgame.board[1][7] = { type: 'pawn', color: 'black' };
      
      // Advance pawns
      const endgameSequence = [
        { from: { row: 6, col: 0 }, to: { row: 5, col: 0 } }, // a3
        { from: { row: 1, col: 7 }, to: { row: 2, col: 7 } }, // h6
        { from: { row: 5, col: 0 }, to: { row: 4, col: 0 } }, // a4
        { from: { row: 2, col: 7 }, to: { row: 3, col: 7 } }, // h5
        { from: { row: 4, col: 0 }, to: { row: 3, col: 0 } }, // a5
        { from: { row: 3, col: 7 }, to: { row: 4, col: 7 } }  // h4
      ];
      
      endgameSequence.forEach(move => {
        const result = endgame.makeMove(move);
        testUtils.validateSuccessResponse(result);
      });
      
      expect(endgame.status).toBe('active');
      expect(endgame.moveHistory).toHaveLength(6);
    });
  });

  describe('Performance and Stress Tests', () => {
    test('should handle long games efficiently', () => {
      const startTime = Date.now();
      
      // Simulate a long game with many moves
      for (let i = 0; i < 50; i++) {
        const freshGame = testUtils.createFreshGame();
        
        // Make 20 moves per game
        const moves = [
          { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } },
          { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } },
          { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } },
          { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } },
          { from: { row: 5, col: 5 }, to: { row: 3, col: 4 } },
          { from: { row: 2, col: 2 }, to: { row: 4, col: 3 } },
          { from: { row: 3, col: 4 }, to: { row: 5, col: 5 } },
          { from: { row: 4, col: 3 }, to: { row: 2, col: 2 } },
          { from: { row: 5, col: 5 }, to: { row: 3, col: 4 } },
          { from: { row: 2, col: 2 }, to: { row: 4, col: 3 } }
        ];
        
        moves.forEach(move => {
          freshGame.makeMove(move);
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 200ms
      expect(duration).toBeLessThan(200);
    });

    test('should maintain performance with complex positions', () => {
      const startTime = Date.now();
      
      // Test performance with complex middle game positions
      for (let i = 0; i < 100; i++) {
        const complexGame = testUtils.createFreshGame();
        
        // Create a complex position quickly
        const complexMoves = [
          { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
          { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
          { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }, // Nc3
          { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
          { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // Bc4
          { from: { row: 0, col: 5 }, to: { row: 3, col: 2 } }  // Bc5
        ];
        
        complexMoves.forEach(move => {
          complexGame.makeMove(move);
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });

  // Helper function to count pieces on the board
  function countPieces(board) {
    let white = 0, black = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          if (piece.color === 'white') white++;
          else if (piece.color === 'black') black++;
        }
      }
    }
    
    return { white, black };
  }
});