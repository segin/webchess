const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');

describe('Performance Tests - Move Validation and Game State Updates', () => {
  let game;
  let stateManager;

  beforeEach(() => {
    game = new ChessGame();
    stateManager = new GameStateManager();
  });

  describe('Move Validation Performance', () => {
    test('should validate moves within acceptable time limits', () => {
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } },
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }
      ];

      const startTime = process.hrtime.bigint();
      
      for (const move of moves) {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      // Each move should validate in less than 10ms
      const avgTimePerMove = durationMs / moves.length;
      expect(avgTimePerMove).toBeLessThan(10);
    });

    test('should handle complex position validation efficiently', () => {
      // Set up a complex mid-game position
      const complexMoves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // Bc4
        { from: { row: 0, col: 5 }, to: { row: 3, col: 2 } }, // Bc5
        { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }, // d3
        { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }  // d6
      ];

      // Execute setup moves
      for (const move of complexMoves) {
        game.makeMove(move);
      }

      // Test validation performance on complex position
      const testMoves = [
        { from: { row: 5, col: 5 }, to: { row: 3, col: 4 } }, // Knight takes pawn
        { from: { row: 4, col: 2 }, to: { row: 1, col: 5 } }, // Bishop takes pawn
        { from: { row: 7, col: 3 }, to: { row: 3, col: 7 } }  // Queen move
      ];

      const startTime = process.hrtime.bigint();
      
      for (const move of testMoves) {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      // Complex position validation should still be fast
      const avgTimePerMove = durationMs / testMoves.length;
      expect(avgTimePerMove).toBeLessThan(15);
    });

    test('should efficiently validate large numbers of moves', () => {
      const iterations = 100;
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        // Reset game for each iteration
        game = new ChessGame();
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      // Should average less than 1ms per move validation
      const avgTime = durationMs / iterations;
      expect(avgTime).toBeLessThan(1);
    });
  });

  describe('Game State Update Performance', () => {
    test('should update game state efficiently', () => {
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } },
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } },
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }
      ];

      const startTime = process.hrtime.bigint();
      
      for (const move of moves) {
        game.makeMove(move);
        const gameState = game.getGameState();
        expect(gameState).toBeDefined();
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      // State updates should be fast
      const avgTimePerUpdate = durationMs / moves.length;
      expect(avgTimePerUpdate).toBeLessThan(5);
    });

    test('should handle check detection efficiently', () => {
      // Set up position where check detection is needed
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 3 }, to: { row: 3, col: 7 } }  // Qh5 (threatening check)
      ];

      for (const move of moves) {
        game.makeMove(move);
      }

      const iterations = 50;
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        const inCheck = game.isInCheck('black');
        expect(typeof inCheck).toBe('boolean');
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      // Check detection should be fast
      const avgTime = durationMs / iterations;
      expect(avgTime).toBeLessThan(1);
    });
  });

  describe('Memory Usage Performance', () => {
    test('should not leak memory during long games', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Play a long sequence of moves
      for (let gameNum = 0; gameNum < 10; gameNum++) {
        const testGame = new ChessGame();
        
        // Play 50 moves per game
        for (let moveNum = 0; moveNum < 50; moveNum++) {
          const validMoves = testGame.getAllValidMoves(testGame.currentTurn);
          if (validMoves.length === 0) break;
          
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          testGame.makeMove(randomMove);
          
          if (testGame.gameStatus !== 'active') break;
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should efficiently handle game state serialization', () => {
      // Create a complex game state
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } },
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } },
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }
      ];

      for (const move of moves) {
        game.makeMove(move);
      }

      const iterations = 100;
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        const gameState = game.getGameState();
        const serialized = JSON.stringify(gameState);
        const deserialized = JSON.parse(serialized);
        
        expect(deserialized).toBeDefined();
        expect(deserialized.moveHistory).toHaveLength(5);
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      // Serialization should be efficient
      const avgTime = durationMs / iterations;
      expect(avgTime).toBeLessThan(2);
    });
  });

  describe('Concurrent Performance', () => {
    test('should handle multiple simultaneous games efficiently', () => {
      const numGames = 20;
      const games = [];
      
      // Create multiple games
      for (let i = 0; i < numGames; i++) {
        games.push(new ChessGame());
      }
      
      const startTime = process.hrtime.bigint();
      
      // Make moves in all games simultaneously
      for (let moveNum = 0; moveNum < 10; moveNum++) {
        for (let gameIndex = 0; gameIndex < numGames; gameIndex++) {
          const game = games[gameIndex];
          if (game.gameStatus !== 'active') continue;
          
          const validMoves = game.getAllValidMoves(game.currentTurn);
          if (validMoves.length === 0) continue;
          
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          const result = game.makeMove(randomMove);
          expect(result.success).toBe(true);
        }
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      // Should handle concurrent games efficiently
      expect(durationMs).toBeLessThan(1000); // Less than 1 second total
    });
  });
});