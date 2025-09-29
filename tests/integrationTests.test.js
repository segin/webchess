const ChessGame = require('../src/shared/chessGame');

describe('Comprehensive Integration Tests - Complete Game Flow', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  describe('Complete Game Scenarios', () => {
    test('should handle a complete game from start to checkmate', () => {
      // Scholar's Mate sequence
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // Bc4
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
        { from: { row: 7, col: 3 }, to: { row: 3, col: 7 } }, // Qh5
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }, // Nf6
        { from: { row: 3, col: 7 }, to: { row: 1, col: 5 } }  // Qxf7# (checkmate)
      ];

      let moveCount = 0;
      for (const move of moves) {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        moveCount++;
        
        // Verify game state consistency after each move
        const gameState = game.getGameState();
        expect(gameState.moveHistory).toHaveLength(moveCount);
        expect(gameState.currentTurn).toBe(moveCount % 2 === 0 ? 'white' : 'black');
      }

      // Verify final checkmate state using current property names
      const finalGameState = game.getGameState();
      expect(finalGameState.gameStatus).toBe('checkmate');
      expect(finalGameState.winner).toBe('white');
      expect(game.isInCheck('black')).toBe(true);
      expect(game.hasValidMoves('black')).toBe(false);
    });

    test('should handle a complete game ending in stalemate', () => {
      // Set up a proper stalemate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // King vs King + Queen stalemate: Black king on a8, White king on c6, White queen on b6
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[2][2] = { type: 'king', color: 'white' };
      game.board[2][1] = { type: 'queen', color: 'white' };
      
      game.currentTurn = 'black';
      game.checkGameEnd();
      
      // Verify stalemate state using current property names
      const gameState = game.getGameState();
      expect(gameState.gameStatus).toBe('stalemate');
      expect(gameState.winner).toBe(null);
      expect(game.isInCheck('black')).toBe(false);
      expect(game.hasValidMoves('black')).toBe(false);
    });

    test('should handle complex game with special moves', () => {
      // Test a game that includes castling and other special moves
      const moves = [
        // Setup for white kingside castling
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // Bc4
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }, // Nf6
        
        // White kingside castling
        { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } }  // O-O (kingside castling)
      ];

      for (const move of moves) {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      }

      // Verify castling occurred correctly using current board access
      const gameState = game.getGameState();
      expect(gameState.board[7][6]).toEqual({ type: 'king', color: 'white' });
      expect(gameState.board[7][5]).toEqual({ type: 'rook', color: 'white' });
      
      // Verify castling rights were updated
      expect(gameState.castlingRights.white.kingside).toBe(false);
      expect(gameState.castlingRights.white.queenside).toBe(false);
    });
  });

  describe('Game State Consistency Throughout Complete Games', () => {
    test('should maintain consistent state during long game', () => {
      const moves = [];
      let moveCount = 0;
      
      // Play 20 moves (10 for each side)
      while (moveCount < 20 && game.getGameState().gameStatus === 'active') {
        const validMoves = game.getAllValidMoves(game.currentTurn);
        if (validMoves.length === 0) break;
        
        // Pick a random valid move
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        const result = game.makeMove(randomMove);
        
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        moves.push(randomMove);
        moveCount++;
        
        // Verify state consistency after each move
        const gameState = game.getGameState();
        expect(gameState.moveHistory).toHaveLength(moveCount);
        expect(gameState.currentTurn).toBe(moveCount % 2 === 0 ? 'white' : 'black');
        
        // Verify board integrity using current board access
        let whiteKingCount = 0;
        let blackKingCount = 0;
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.type === 'king') {
              if (piece.color === 'white') whiteKingCount++;
              if (piece.color === 'black') blackKingCount++;
            }
          }
        }
        expect(whiteKingCount).toBe(1);
        expect(blackKingCount).toBe(1);
      }
      
      expect(moveCount).toBeGreaterThan(5);
    });

    test('should handle game state serialization and deserialization', () => {
      // Make some moves
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }
      ];

      for (const move of moves) {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      }

      // Serialize game state
      const gameState = game.getGameState();
      const serialized = JSON.stringify(gameState);
      
      // Create new game and restore state
      const newGame = new ChessGame();
      const deserialized = JSON.parse(serialized);
      
      // Verify serialization preserved all important data using current property names
      expect(deserialized.moveHistory).toHaveLength(3);
      expect(deserialized.currentTurn).toBe('black');
      expect(deserialized.board).toBeDefined();
      expect(deserialized.gameStatus).toBeDefined();
      expect(deserialized.castlingRights).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle invalid moves gracefully during game flow', () => {
      const validMove = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const invalidMove = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } }; // Invalid pawn move

      // Valid move should succeed
      const validResult = game.makeMove(validMove);
      expect(validResult.success).toBe(true);
      expect(validResult.data).toBeDefined();

      // Invalid move should fail gracefully with current error structure
      const invalidResult = game.makeMove(invalidMove);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.message).toBeDefined();
      expect(invalidResult.errorCode).toBeDefined();
      
      // Game state should remain consistent using current property names
      const gameState = game.getGameState();
      expect(gameState.currentTurn).toBe('black');
      expect(gameState.gameStatus).toBe('active');
    });

    test('should recover from edge case scenarios', () => {
      // Test recovery from various edge cases
      const edgeCases = [
        { from: { row: -1, col: 4 }, to: { row: 4, col: 4 } }, // Out of bounds
        { from: { row: 6, col: 4 }, to: { row: 4, col: 9 } }, // Out of bounds destination
        { from: { row: 3, col: 3 }, to: { row: 4, col: 4 } }, // Empty square
        null, // Null move
        undefined, // Undefined move
        { from: null, to: { row: 4, col: 4 } }, // Null from
        { from: { row: 6, col: 4 }, to: null } // Null to
      ];

      for (const edgeCase of edgeCases) {
        const result = game.makeMove(edgeCase);
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        expect(result.errorCode).toBeDefined();
        
        // Game should remain in consistent state using current property names
        const gameState = game.getGameState();
        expect(gameState.currentTurn).toBe('white');
        expect(gameState.gameStatus).toBe('active');
      }
    });
  });

  describe('Multi-Game Session Integration', () => {
    test('should handle multiple concurrent game instances', () => {
      const games = [];
      const numGames = 5;
      
      // Create multiple game instances
      for (let i = 0; i < numGames; i++) {
        games.push(new ChessGame());
      }
      
      // Make different moves in each game
      for (let i = 0; i < numGames; i++) {
        const move = { from: { row: 6, col: i }, to: { row: 4, col: i } };
        const result = games[i].makeMove(move);
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      }
      
      // Verify each game maintains independent state using current property access
      for (let i = 0; i < numGames; i++) {
        const gameState = games[i].getGameState();
        expect(gameState.currentTurn).toBe('black');
        expect(gameState.moveHistory).toHaveLength(1);
        expect(gameState.board[4][i]).toEqual({ type: 'pawn', color: 'white' });
      }
    });
  });
});