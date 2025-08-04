const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');

describe('Game State Consistency - Comprehensive Testing', () => {
  let game;
  let stateManager;

  beforeEach(() => {
    game = new ChessGame();
    stateManager = new GameStateManager();
  });

  describe('State Transitions', () => {
    test('should maintain consistent state through normal moves', () => {
      const initialState = game.getGameState();
      
      // Make a series of moves
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }, // Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }  // Nc6
      ];
      
      moves.forEach((move, index) => {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        
        const currentState = game.getGameState();
        
        // Verify state consistency
        expect(currentState.moveHistory.length).toBe(index + 1);
        expect(currentState.currentTurn).toBe(index % 2 === 0 ? 'black' : 'white');
        expect(currentState.status).toBe('active');
        
        // Verify board consistency
        const pieceCount = countPieces(currentState.board);
        expect(pieceCount.total).toBe(32); // No captures yet
      });
    });

    test('should handle state transitions with captures', () => {
      // Set up capture scenario
      game.board[4][4] = { type: 'pawn', color: 'white' };
      game.board[3][5] = { type: 'pawn', color: 'black' };
      game.currentTurn = 'white';
      
      const initialPieceCount = countPieces(game.board);
      
      // Execute capture
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 5 } });
      expect(result.success).toBe(true);
      
      const finalState = game.getGameState();
      const finalPieceCount = countPieces(finalState.board);
      
      // Verify capture was recorded
      expect(finalPieceCount.total).toBe(initialPieceCount.total - 1);
      expect(finalState.moveHistory[finalState.moveHistory.length - 1].captured).toBe('pawn');
    });

    test('should maintain castling rights consistency', () => {
      // Clear path for castling
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      const initialRights = JSON.parse(JSON.stringify(game.castlingRights));
      
      // Perform castling
      const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      expect(result.success).toBe(true);
      
      const finalState = game.getGameState();
      
      // Verify castling rights were updated
      expect(finalState.castlingRights.white.kingside).toBe(false);
      expect(finalState.castlingRights.white.queenside).toBe(false);
      expect(finalState.castlingRights.black.kingside).toBe(true);
      expect(finalState.castlingRights.black.queenside).toBe(true);
    });

    test('should handle en passant state transitions', () => {
      // Set up en passant scenario
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[1][5] = { type: 'pawn', color: 'black' };
      game.currentTurn = 'black';
      
      // Black pawn moves two squares
      const moveResult = game.makeMove({ from: { row: 1, col: 5 }, to: { row: 3, col: 5 } });
      expect(moveResult.success).toBe(true);
      expect(game.enPassantTarget).toEqual({ row: 2, col: 5 });
      
      // Execute en passant capture
      const captureResult = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 5 } });
      expect(captureResult.success).toBe(true);
      
      const finalState = game.getGameState();
      
      // Verify en passant was executed correctly
      expect(finalState.board[2][5]).toEqual({ type: 'pawn', color: 'white' });
      expect(finalState.board[3][5]).toBe(null); // Captured pawn removed
      expect(finalState.enPassantTarget).toBe(null); // Target cleared
    });

    test('should handle promotion state transitions', () => {
      // Place pawn ready for promotion
      game.board[1][4] = { type: 'pawn', color: 'white' };
      
      const result = game.makeMove({ 
        from: { row: 1, col: 4 }, 
        to: { row: 0, col: 4 },
        promotion: 'queen'
      });
      
      expect(result.success).toBe(true);
      
      const finalState = game.getGameState();
      
      // Verify promotion was recorded
      expect(finalState.board[0][4]).toEqual({ type: 'queen', color: 'white' });
      expect(finalState.moveHistory[finalState.moveHistory.length - 1].promotion).toBe('queen');
    });
  });

  describe('History Tracking', () => {
    test('should maintain complete move history', () => {
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
        { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } },
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }
      ];
      
      moves.forEach((move, index) => {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        
        const history = game.moveHistory;
        expect(history.length).toBe(index + 1);
        
        const lastMove = history[history.length - 1];
        expect(lastMove.from).toEqual(move.from);
        expect(lastMove.to).toEqual(move.to);
        expect(lastMove.piece).toBeDefined();
        expect(lastMove.color).toBeDefined();
      });
    });

    test('should track captured pieces in history', () => {
      // Set up capture scenario
      game.board[4][4] = { type: 'pawn', color: 'white' };
      game.board[3][5] = { type: 'pawn', color: 'black' };
      game.currentTurn = 'white';
      
      const result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 5 } });
      expect(result.success).toBe(true);
      
      const lastMove = game.moveHistory[game.moveHistory.length - 1];
      expect(lastMove.captured).toBe('pawn');
    });

    test('should track special moves in history', () => {
      // Test castling history
      game.board[7][5] = null;
      game.board[7][6] = null;
      
      const castleResult = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 } });
      expect(castleResult.success).toBe(true);
      
      const castleMove = game.moveHistory[game.moveHistory.length - 1];
      expect(castleMove.castling).toBe('kingside');
      
      // Test en passant history
      game = new ChessGame();
      game.board[3][4] = { type: 'pawn', color: 'white' };
      game.board[1][5] = { type: 'pawn', color: 'black' };
      game.currentTurn = 'black';
      
      game.makeMove({ from: { row: 1, col: 5 }, to: { row: 3, col: 5 } });
      const enPassantResult = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 5 } });
      expect(enPassantResult.success).toBe(true);
      
      const enPassantMove = game.moveHistory[game.moveHistory.length - 1];
      expect(enPassantMove.enPassant).toBe(true);
    });

    test('should maintain position history for repetition detection', () => {
      // Make moves that could lead to repetition
      const moves = [
        { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }, // Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
        { from: { row: 5, col: 2 }, to: { row: 7, col: 1 } }, // Ng1
        { from: { row: 2, col: 2 }, to: { row: 0, col: 1 } }, // Nb8
        { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }, // Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }  // Nc6
      ];
      
      moves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      });
      
      // Position history should track all positions
      expect(game.positionHistory.length).toBeGreaterThan(moves.length);
    });
  });

  describe('State Validation', () => {
    test('should validate board consistency', () => {
      const state = game.getGameState();
      const validation = stateManager.validateGameStateConsistency(state);
      
      expect(validation.success).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.details.kingCount.white).toBe(1);
      expect(validation.details.kingCount.black).toBe(1);
    });

    test('should detect invalid king counts', () => {
      // Remove a king
      game.board[7][4] = null;
      
      const state = game.getGameState();
      const validation = stateManager.validateGameStateConsistency(state);
      
      expect(validation.success).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.includes('king'))).toBe(true);
    });

    test('should detect turn consistency issues', () => {
      // Manually corrupt turn state
      game.currentTurn = 'invalid';
      
      const state = game.getGameState();
      const validation = stateManager.validateGameStateConsistency(state);
      
      expect(validation.success).toBe(false);
      expect(validation.errors.some(error => error.includes('turn'))).toBe(true);
    });

    test('should validate castling rights consistency', () => {
      // Move king but don't update castling rights
      game.board[7][4] = null;
      game.board[7][5] = { type: 'king', color: 'white' };
      // Don't update castling rights - should be detected as inconsistent
      
      const state = game.getGameState();
      const validation = stateManager.validateGameStateConsistency(state);
      
      // This should detect the inconsistency
      expect(validation.details.castlingConsistency).toBeDefined();
    });

    test('should validate en passant target consistency', () => {
      // Set invalid en passant target
      game.enPassantTarget = { row: 4, col: 4 }; // Invalid position
      
      const state = game.getGameState();
      const validation = stateManager.validateGameStateConsistency(state);
      
      expect(validation.details.enPassantConsistency).toBeDefined();
    });
  });

  describe('State Serialization and Deserialization', () => {
    test('should serialize and deserialize game state correctly', () => {
      // Make some moves to create interesting state
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
      
      const originalState = game.getGameState();
      const serialized = JSON.stringify(originalState);
      const deserialized = JSON.parse(serialized);
      
      // Verify all important fields are preserved
      expect(deserialized.board).toEqual(originalState.board);
      expect(deserialized.currentTurn).toBe(originalState.currentTurn);
      expect(deserialized.moveHistory).toEqual(originalState.moveHistory);
      expect(deserialized.castlingRights).toEqual(originalState.castlingRights);
      expect(deserialized.enPassantTarget).toEqual(originalState.enPassantTarget);
    });

    test('should handle state snapshots for undo functionality', () => {
      const initialSnapshot = game.getGameStateForSnapshot();
      
      // Make a move
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      const afterMoveSnapshot = game.getGameStateForSnapshot();
      
      // Snapshots should be different
      expect(afterMoveSnapshot).not.toEqual(initialSnapshot);
      expect(afterMoveSnapshot.moveHistory.length).toBe(initialSnapshot.moveHistory.length + 1);
    });
  });

  describe('Concurrent State Access', () => {
    test('should handle multiple simultaneous state requests', () => {
      const states = [];
      
      // Request multiple states simultaneously
      for (let i = 0; i < 10; i++) {
        states.push(game.getGameState());
      }
      
      // All states should be identical
      states.forEach(state => {
        expect(state).toEqual(states[0]);
      });
    });

    test('should maintain state consistency during rapid moves', () => {
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
        { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } },
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }
      ];
      
      // Execute moves rapidly and check state after each
      moves.forEach((move, index) => {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        
        const state = game.getGameState();
        expect(state.moveHistory.length).toBe(index + 1);
        
        // Verify state is internally consistent
        const validation = stateManager.validateGameStateConsistency(state);
        expect(validation.success).toBe(true);
      });
    });
  });

  describe('Memory Management', () => {
    test('should manage memory efficiently with long games', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate a long game with many moves
      for (let i = 0; i < 50; i++) {
        // Simple back and forth moves
        game.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } });
        game.makeMove({ from: { row: 0, col: 1 }, to: { row: 2, col: 2 } });
        game.makeMove({ from: { row: 5, col: 2 }, to: { row: 7, col: 1 } });
        game.makeMove({ from: { row: 2, col: 2 }, to: { row: 0, col: 1 } });
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      expect(game.moveHistory.length).toBe(200);
    });

    test('should handle state cleanup properly', () => {
      // Create multiple game instances
      const games = [];
      for (let i = 0; i < 10; i++) {
        games.push(new ChessGame());
      }
      
      // Make moves in each game
      games.forEach(g => {
        g.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
        g.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
      });
      
      // Clear references
      games.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Memory should be manageable
      const memoryUsage = process.memoryUsage();
      expect(memoryUsage.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });

  describe('Edge Case State Handling', () => {
    test('should handle state with all pieces promoted', () => {
      // Create scenario with multiple promotions
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Place kings
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      // Place promoted pieces
      game.board[0][0] = { type: 'queen', color: 'white' };
      game.board[0][1] = { type: 'queen', color: 'white' };
      game.board[7][0] = { type: 'queen', color: 'black' };
      game.board[7][1] = { type: 'queen', color: 'black' };
      
      const state = game.getGameState();
      const validation = stateManager.validateGameStateConsistency(state);
      
      // Should handle unusual but valid state
      expect(validation.success).toBe(true);
    });

    test('should handle state with minimal pieces', () => {
      // Create endgame scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Only kings remaining
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[0][4] = { type: 'king', color: 'black' };
      
      const state = game.getGameState();
      const validation = stateManager.validateGameStateConsistency(state);
      
      expect(validation.success).toBe(true);
      expect(validation.details.kingCount.white).toBe(1);
      expect(validation.details.kingCount.black).toBe(1);
    });

    test('should handle state transitions to game end', () => {
      // Set up checkmate scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][7] = { type: 'king', color: 'white' };
      game.board[6][6] = { type: 'queen', color: 'black' };
      game.board[5][7] = { type: 'rook', color: 'black' };
      game.board[0][0] = { type: 'king', color: 'black' };
      
      // Check game end
      game.checkGameEnd();
      
      const state = game.getGameState();
      expect(state.status).toBe('checkmate');
      expect(state.winner).toBe('black');
      
      // State should still be valid
      const validation = stateManager.validateGameStateConsistency(state);
      expect(validation.success).toBe(true);
    });
  });

  // Helper function to count pieces
  function countPieces(board) {
    let white = 0, black = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col]) {
          if (board[row][col].color === 'white') white++;
          else black++;
        }
      }
    }
    
    return { white, black, total: white + black };
  }
});