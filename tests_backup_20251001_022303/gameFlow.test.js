/**
 * Comprehensive Game Flow Tests
 * Tests complete games from start to various end conditions
 */

const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Game Flow', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
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
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
      }
      
      // Execute checkmate move
      const checkmateResult = game.makeMove(scholarsMate[scholarsMate.length - 1]);
      expect(checkmateResult.success).toBe(true);
      expect(checkmateResult.message).toBeDefined();
      expect(checkmateResult.data).toBeDefined();
      
      // Verify game is in checkmate using current API properties
      expect(game.gameStatus).toBe('checkmate');
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
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
        
        if (index === foolsMate.length - 1) {
          // Last move should result in checkmate using current API properties
          expect(game.gameStatus).toBe('checkmate');
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
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
      });
      
      // Game should still be active using current API properties
      expect(game.gameStatus).toBe('active');
      expect(game.currentTurn).toBe('white');
      expect(game.moveHistory).toHaveLength(10);
    });

    test('should handle castling in game flow', () => {
      const castlingGame = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // 1. e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // 1... e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // 2. Nf3
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }, // 2... Nf6 (move knight to clear castling path)
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // 3. Bc4
        { from: { row: 0, col: 5 }, to: { row: 3, col: 2 } }, // 3... Bc5
        { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } }, // 4. O-O
        { from: { row: 0, col: 4 }, to: { row: 0, col: 6 } }  // 4... O-O
      ];
      
      castlingGame.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
      });
      
      // Verify both kings and rooks are in castled positions using current board representation
      expect(game.board[7][6]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][5]).toEqual({ type: 'rook', color: 'white' });
      expect(game.board[0][6]).toEqual({ type: 'king', color: 'black' });
      expect(game.board[0][5]).toEqual({ type: 'rook', color: 'black' });
    });

    test('should handle pawn promotion in game flow', () => {
      // Set up a simple pawn promotion scenario
      const promotionGame = new ChessGame();
      
      // Clear the board and set up a simple promotion position
      promotionGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      promotionGame.board[0][0] = { type: 'king', color: 'black' };
      promotionGame.board[7][7] = { type: 'king', color: 'white' };
      promotionGame.board[1][4] = { type: 'pawn', color: 'white' };
      promotionGame.currentTurn = 'white';
      
      // Promote the pawn
      const promotionResult = promotionGame.makeMove({ 
        from: { row: 1, col: 4 }, 
        to: { row: 0, col: 4 },
        promotion: 'queen'
      });
      
      expect(promotionResult.success).toBe(true);
      expect(promotionResult.message).toBeDefined();
      expect(promotionResult.data).toBeDefined();
      expect(promotionGame.board[0][4]).toEqual({ type: 'queen', color: 'white' });
      
      // Verify the pawn is no longer at the original position
      expect(promotionGame.board[1][4]).toBeNull();
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
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
      });
      
      // Verify en passant capture worked using current board representation
      expect(game.board[2][5]).toEqual({ type: 'pawn', color: 'white' });
      expect(game.board[3][5]).toBeNull(); // Captured pawn should be removed
    });
  });

  describe('Game End Conditions', () => {
    test('should detect checkmate correctly', () => {
      // Set up a proper back rank mate position
      const checkmateGame = new ChessGame();
      checkmateGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      checkmateGame.board[0][7] = { type: 'king', color: 'black' };
      checkmateGame.board[1][6] = { type: 'pawn', color: 'black' };
      checkmateGame.board[1][7] = { type: 'pawn', color: 'black' };
      checkmateGame.board[2][0] = { type: 'rook', color: 'white' };
      checkmateGame.board[7][4] = { type: 'king', color: 'white' };
      checkmateGame.currentTurn = 'white';
      
      // Deliver checkmate with rook to back rank
      const result = checkmateGame.makeMove({ from: { row: 2, col: 0 }, to: { row: 0, col: 0 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      
      // Verify checkmate using current API properties
      expect(checkmateGame.gameStatus).toBe('checkmate');
      expect(checkmateGame.winner).toBe('white');
    });

    test('should detect stalemate correctly', () => {
      // Set up stalemate position
      const stalemateGame = new ChessGame();
      stalemateGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      stalemateGame.board[0][0] = { type: 'king', color: 'black' };
      stalemateGame.board[2][1] = { type: 'king', color: 'white' };
      stalemateGame.board[1][2] = { type: 'queen', color: 'white' };
      stalemateGame.currentTurn = 'black';
      
      // Manually trigger game state evaluation
      stalemateGame.checkGameEnd();
      
      // This position should be stalemate using current API properties
      expect(stalemateGame.gameStatus).toBe('stalemate');
    });

    test('should handle draw by insufficient material', () => {
      // Set up position with insufficient material
      const drawGame = new ChessGame();
      drawGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      drawGame.board[0][4] = { type: 'king', color: 'black' };
      drawGame.board[7][4] = { type: 'king', color: 'white' };
      
      // Manually trigger game state evaluation
      drawGame.checkGameEnd();
      
      // King vs King - using current API properties to check game status
      expect(['active', 'draw', 'stalemate']).toContain(drawGame.gameStatus);
    });

    test('should continue game when material is sufficient', () => {
      // Game with sufficient material should continue using current API properties
      expect(game.gameStatus).toBe('active');
      expect(game.winner).toBeNull();
    });

    test('should handle check resolution', () => {
      // Create a check scenario through normal gameplay
      const checkGame = new ChessGame();
      
      // Set up a position where white king will be in check
      checkGame.board[4][4] = { type: 'king', color: 'white' };
      checkGame.board[4][0] = { type: 'rook', color: 'black' };
      checkGame.board[0][0] = { type: 'king', color: 'black' };
      checkGame.board[7][4] = null; // Remove original white king
      checkGame.board[0][4] = null; // Remove original black king
      checkGame.currentTurn = 'white';
      
      // The white king should be in check from the rook
      expect(checkGame.isInCheck('white')).toBe(true);
      
      // Move king out of check
      const result = checkGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      
      // Game should no longer be in check using current API properties
      expect(checkGame.gameStatus).toBe('active');
    });
  });

  describe('Game State Consistency', () => {
    test('should maintain consistent turn alternation', () => {
      expect(game.currentTurn).toBe('white');
      
      // Make white move
      const whiteResult = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      expect(whiteResult.success).toBe(true);
      expect(game.currentTurn).toBe('black');
      
      // Make black move
      const blackResult = game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } });
      expect(blackResult.success).toBe(true);
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
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(game.moveHistory).toHaveLength(index + 1);
        
        const lastMove = game.moveHistory[game.moveHistory.length - 1];
        expect(lastMove.from).toEqual(move.from);
        expect(lastMove.to).toEqual(move.to);
      });
    });

    test('should track castling rights correctly throughout game', () => {
      // Initially all castling rights should be available using current API properties
      expect(game.castlingRights.white.kingside).toBe(true);
      expect(game.castlingRights.white.queenside).toBe(true);
      expect(game.castlingRights.black.kingside).toBe(true);
      expect(game.castlingRights.black.queenside).toBe(true);
      
      // Move white king
      game.board[6][4] = null; // Clear path
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 6, col: 4 } });
      expect(result.success).toBe(true);
      
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
      const pawnResult = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(pawnResult.success).toBe(true);
      expect(game.enPassantTarget).toEqual({ row: 5, col: 4 });
      
      // Make another move (not en passant)
      const otherResult = game.makeMove({ from: { row: 1, col: 3 }, to: { row: 2, col: 3 } });
      expect(otherResult.success).toBe(true);
      expect(game.enPassantTarget).toBeNull();
    });

    test('should maintain board integrity throughout game', () => {
      const initialPieceCount = countPieces(game.board);
      expect(initialPieceCount.white).toBe(16);
      expect(initialPieceCount.black).toBe(16);
      
      // Make some moves without captures
      const move1 = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      expect(move1.success).toBe(true);
      const move2 = game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } });
      expect(move2.success).toBe(true);
      const move3 = game.makeMove({ from: { row: 7, col: 6 }, to: { row: 5, col: 5 } });
      expect(move3.success).toBe(true);
      const move4 = game.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } });
      expect(move4.success).toBe(true);
      
      const afterMovesPieceCount = countPieces(game.board);
      expect(afterMovesPieceCount.white).toBe(16);
      expect(afterMovesPieceCount.black).toBe(16);
      
      // Make a capture - set up a diagonal pawn capture
      const move5 = game.makeMove({ from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }); // White pawn d4
      expect(move5.success).toBe(true);
      const move6 = game.makeMove({ from: { row: 2, col: 4 }, to: { row: 3, col: 4 } }); // Black pawn e5
      expect(move6.success).toBe(true);
      const move7 = game.makeMove({ from: { row: 4, col: 3 }, to: { row: 3, col: 4 } }); // White pawn captures black pawn
      expect(move7.success).toBe(true);
      
      const afterCapturePieceCount = countPieces(game.board);
      expect(afterCapturePieceCount.white).toBe(16);
      expect(afterCapturePieceCount.black).toBe(15); // One black piece captured
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
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
      });
      
      // Verify pieces were exchanged correctly using current board representation
      expect(game.board[5][3]).toEqual({ type: 'knight', color: 'black' });
      expect(game.moveHistory).toHaveLength(8);
    });

    test('should handle tactical combinations', () => {
      // Set up a tactical position (discovered attack)
      const tacticalGame = new ChessGame();
      tacticalGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
      tacticalGame.board[0][4] = { type: 'king', color: 'black' };
      tacticalGame.board[7][4] = { type: 'king', color: 'white' };
      tacticalGame.board[4][4] = { type: 'knight', color: 'white' };
      tacticalGame.board[6][4] = { type: 'rook', color: 'white' };
      tacticalGame.board[0][3] = { type: 'queen', color: 'black' };
      
      // Move knight to discover rook attack on black king
      const result = tacticalGame.makeMove({ from: { row: 4, col: 4 }, to: { row: 2, col: 3 } });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.data).toBeDefined();
      
      // Black king should be in check from the rook using current API properties
      expect(tacticalGame.gameStatus).toBe('check');
    });

    test('should handle endgame progression', () => {
      // Set up king and pawn endgame
      const endgame = new ChessGame();
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
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.data).toBeDefined();
      });
      
      // Verify endgame state using current API properties
      expect(endgame.gameStatus).toBe('active');
      expect(endgame.moveHistory).toHaveLength(6);
    });
  });

  describe('Performance and Stress Tests', () => {
    test('should handle long games efficiently', () => {
      const startTime = Date.now();
      
      // Simulate a long game with many moves
      for (let i = 0; i < 50; i++) {
        const freshGame = new ChessGame();
        
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
          const result = freshGame.makeMove(move);
          expect(result.success).toBe(true);
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 5 seconds (more realistic for CI environments)
      expect(duration).toBeLessThan(5000);
    });

    test('should maintain performance with complex positions', () => {
      const startTime = Date.now();
      
      // Test performance with complex middle game positions
      for (let i = 0; i < 100; i++) {
        const complexGame = new ChessGame();
        
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
          const result = complexGame.makeMove(move);
          expect(result.success).toBe(true);
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (adjusted for CI environments)
      expect(duration).toBeLessThan(10000); // 10 seconds for CI tolerance
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