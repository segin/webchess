const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');

describe('Comprehensive Integration Tests - Complete Game Flow', () => {
  let game;
  let stateManager;

  beforeEach(() => {
    game = new ChessGame();
    stateManager = new GameStateManager();
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
        moveCount++;
        
        // Verify game state consistency after each move
        const gameState = game.getGameState();
        expect(gameState.moveHistory).toHaveLength(moveCount);
        expect(gameState.currentTurn).toBe(moveCount % 2 === 0 ? 'white' : 'black');
      }

      // Verify final checkmate state
      expect(game.gameStatus).toBe('checkmate');
      expect(game.winner).toBe('white');
      expect(game.isInCheck('black')).toBe(true);
      expect(game.hasValidMoves('black')).toBe(false);
    });

    test('should handle a complete game ending in stalemate', () => {
      // Set up a stalemate position
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king on a8, Black king on a6, White queen on b6
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[2][0] = { type: 'king', color: 'black' };
      game.board[2][1] = { type: 'queen', color: 'white' };
      
      game.currentTurn = 'black';
      game.checkGameEnd();
      
      expect(game.gameStatus).toBe('stalemate');
      expect(game.winner).toBe(null);
      expect(game.isInCheck('black')).toBe(false);
      expect(game.hasValidMoves('black')).toBe(false);
    });

    test('should handle complex game with all special moves', () => {
      // Test a game that includes castling, en passant, and promotion
      const moves = [
        // Setup for castling
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }, // Nf6
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // Bc4
        { from: { row: 0, col: 5 }, to: { row: 3, col: 2 } }, // Bc5
        
        // Castling
        { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } }, // O-O (kingside castling)
        { from: { row: 0, col: 4 }, to: { row: 0, col: 2 } }  // O-O-O (queenside castling)
      ];

      for (const move of moves) {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      }

      // Verify castling occurred correctly
      expect(game.board[7][6]).toEqual({ type: 'king', color: 'white' });
      expect(game.board[7][5]).toEqual({ type: 'rook', color: 'white' });
      expect(game.board[0][2]).toEqual({ type: 'king', color: 'black' });
      expect(game.board[0][3]).toEqual({ type: 'rook', color: 'black' });
    });
  });

  describe('Game State Consistency Throughout Complete Games', () => {
    test('should maintain consistent state during long game', () => {
      const moves = [];
      let moveCount = 0;
      
      // Play 20 moves (10 for each side)
      while (moveCount < 20 && game.gameStatus === 'active') {
        const validMoves = game.getAllValidMoves(game.currentTurn);
        if (validMoves.length === 0) break;
        
        // Pick a random valid move
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        const result = game.makeMove(randomMove);
        
        expect(result.success).toBe(true);
        moves.push(randomMove);
        moveCount++;
        
        // Verify state consistency after each move
        const gameState = game.getGameState();
        expect(gameState.moveHistory).toHaveLength(moveCount);
        expect(gameState.currentTurn).toBe(moveCount % 2 === 0 ? 'white' : 'black');
        
        // Verify board integrity
        let whiteKingCount = 0;
        let blackKingCount = 0;
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const piece = game.board[row][col];
            if (piece && piece.type === 'king') {
              if (piece.color === 'white') whiteKingCount++;
              if (piece.color === 'black') blackKingCount++;
            }
          }
        }
        expect(whiteKingCount).toBe(1);
        expect(blackKingCount).toBe(1);
      }
      
      expect(moveCount).toBeGreaterThan(10);
    });

    test('should handle game state serialization and deserialization', () => {
      // Make some moves
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }
      ];

      for (const move of moves) {
        game.makeMove(move);
      }

      // Serialize game state
      const gameState = game.getGameState();
      const serialized = JSON.stringify(gameState);
      
      // Create new game and restore state
      const newGame = new ChessGame();
      const deserialized = JSON.parse(serialized);
      
      // Verify serialization preserved all important data
      expect(deserialized.moveHistory).toHaveLength(3);
      expect(deserialized.currentTurn).toBe('black');
      expect(deserialized.board).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle invalid moves gracefully during game flow', () => {
      const validMove = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const invalidMove = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } }; // Invalid pawn move

      // Valid move should succeed
      const validResult = game.makeMove(validMove);
      expect(validResult.success).toBe(true);

      // Invalid move should fail gracefully
      const invalidResult = game.makeMove(invalidMove);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.message).toBeDefined();
      
      // Game state should remain consistent
      expect(game.currentTurn).toBe('black');
      expect(game.gameStatus).toBe('active');
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
        
        // Game should remain in consistent state
        expect(game.currentTurn).toBe('white');
        expect(game.gameStatus).toBe('active');
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
      }
      
      // Verify each game maintains independent state
      for (let i = 0; i < numGames; i++) {
        expect(games[i].currentTurn).toBe('black');
        expect(games[i].moveHistory).toHaveLength(1);
        expect(games[i].board[4][i]).toEqual({ type: 'pawn', color: 'white' });
      }
    });
  });
});