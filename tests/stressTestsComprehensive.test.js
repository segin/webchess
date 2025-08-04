const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');
const GameManager = require('../src/server/gameManager');

describe('Comprehensive Stress Tests', () => {
  let game;
  let gameState;
  let gameManager;

  beforeEach(() => {
    game = new ChessGame();
    gameState = new GameStateManager();
    gameManager = new GameManager();
  });

  describe('Rapid Move Sequence Stress Tests', () => {
    test('should handle rapid successive moves without performance degradation', async () => {
      const startTime = Date.now();
      const moveCount = 1000;
      
      // Perform rapid moves
      for (let i = 0; i < moveCount; i++) {
        // Alternate between simple pawn moves
        if (i % 2 === 0) {
          game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
          game.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 });
        } else {
          game.makeMove({ row: 4, col: 4 }, { row: 6, col: 4 });
          game.makeMove({ row: 3, col: 4 }, { row: 1, col: 4 });
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (5 seconds for 1000 moves)
      expect(duration).toBeLessThan(5000);
      
      // Game state should remain consistent
      expect(game.validateGameState().success).toBe(true);
    });

    test('should handle concurrent move validation requests', async () => {
      const concurrentRequests = 100;
      const promises = [];
      
      // Create many concurrent move validation requests
      for (let i = 0; i < concurrentRequests; i++) {
        const promise = new Promise((resolve) => {
          const result = game.isValidMove(
            { row: 6, col: 4 }, 
            { row: 4, col: 4 }
          );
          resolve(result);
        });
        promises.push(promise);
      }
      
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // All requests should complete successfully
      results.forEach(result => {
        expect(result).toBe(true);
      });
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(2000);
    });

    test('should handle rapid game state updates', () => {
      const updateCount = 5000;
      const startTime = Date.now();
      
      for (let i = 0; i < updateCount; i++) {
        gameState.addMove({
          from: { row: i % 8, col: (i + 1) % 8 },
          to: { row: (i + 2) % 8, col: (i + 3) % 8 },
          piece: 'pawn',
          color: i % 2 === 0 ? 'white' : 'black'
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should handle rapid updates efficiently
      expect(duration).toBeLessThan(3000);
      expect(gameState.moveHistory.length).toBe(updateCount);
    });

    test('should maintain performance with complex board positions', () => {
      // Set up complex position with many pieces
      const complexBoard = [
        [{ type: 'rook', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'queen', color: 'black' }, { type: 'king', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'rook', color: 'black' }],
        [{ type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [{ type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }],
        [{ type: 'rook', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'queen', color: 'white' }, { type: 'king', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'rook', color: 'white' }]
      ];
      
      game.board = complexBoard;
      
      const startTime = Date.now();
      const iterations = 1000;
      
      // Perform many check detections on complex position
      for (let i = 0; i < iterations; i++) {
        game.isInCheck('white');
        game.isInCheck('black');
        game.getAllValidMoves('white');
        game.getAllValidMoves('black');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should maintain performance even with complex positions
      expect(duration).toBeLessThan(10000); // 10 seconds for 1000 iterations
    });
  });

  describe('Long Game Stress Tests', () => {
    test('should handle extremely long games without memory leaks', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const moveCount = 10000;
      
      // Simulate a very long game
      for (let i = 0; i < moveCount; i++) {
        const move = {
          from: { row: i % 8, col: (i + 1) % 8 },
          to: { row: (i + 2) % 8, col: (i + 3) % 8 },
          piece: ['pawn', 'rook', 'knight', 'bishop', 'queen'][i % 5],
          color: i % 2 === 0 ? 'white' : 'black',
          captured: i % 10 === 0 ? 'pawn' : null,
          promotion: i % 100 === 0 ? 'queen' : null
        };
        
        gameState.addMove(move);
        
        // Periodically check memory usage
        if (i % 1000 === 0) {
          const currentMemory = process.memoryUsage().heapUsed;
          const memoryGrowth = currentMemory - initialMemory;
          
          // Memory growth should be reasonable (less than 100MB)
          expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024);
        }
      }
      
      expect(gameState.moveHistory.length).toBe(moveCount);
    });

    test('should handle games with maximum theoretical moves', () => {
      // Chess games can theoretically last up to ~5900 moves due to 50-move rule
      const maxMoves = 5900;
      const startTime = Date.now();
      
      // Simulate maximum length game
      for (let i = 0; i < maxMoves; i++) {
        gameState.addMove({
          from: { row: 0, col: 0 },
          to: { row: 1, col: 1 },
          piece: 'king',
          color: i % 2 === 0 ? 'white' : 'black'
        });
        
        // Update move counters
        gameState.incrementMoveCount();
        if (i % 2 === 1) {
          gameState.incrementFullMoveNumber();
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should handle maximum game length efficiently
      expect(duration).toBeLessThan(30000); // 30 seconds
      expect(gameState.moveHistory.length).toBe(maxMoves);
      expect(gameState.getFullMoveNumber()).toBe(Math.floor(maxMoves / 2));
    });

    test('should maintain game state consistency in long games', () => {
      const moveCount = 1000;
      
      // Play a long game with various moves
      for (let i = 0; i < moveCount; i++) {
        const move = {
          from: { row: Math.floor(Math.random() * 8), col: Math.floor(Math.random() * 8) },
          to: { row: Math.floor(Math.random() * 8), col: Math.floor(Math.random() * 8) },
          piece: ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'][Math.floor(Math.random() * 6)],
          color: i % 2 === 0 ? 'white' : 'black'
        };
        
        gameState.addMove(move);
        
        // Periodically validate consistency
        if (i % 100 === 0) {
          const validation = gameState.validateGameState();
          expect(validation.success).toBe(true);
        }
      }
      
      // Final consistency check
      const finalValidation = gameState.validateGameState();
      expect(finalValidation.success).toBe(true);
    });
  });

  describe('Resource-Intensive Scenario Tests', () => {
    test('should handle multiple concurrent games efficiently', () => {
      const gameCount = 100;
      const games = [];
      const startTime = Date.now();
      
      // Create multiple games
      for (let i = 0; i < gameCount; i++) {
        const gameId = `GAME${i.toString().padStart(2, '0')}`;
        const result = gameManager.createGame(gameId);
        expect(result.success).toBe(true);
        games.push(gameId);
      }
      
      // Add players to all games
      games.forEach(gameId => {
        gameManager.joinGame(gameId, `player1_${gameId}`);
        gameManager.joinGame(gameId, `player2_${gameId}`);
      });
      
      // Make moves in all games simultaneously
      games.forEach(gameId => {
        gameManager.makeMove(gameId, `player1_${gameId}`, { row: 6, col: 4 }, { row: 4, col: 4 });
        gameManager.makeMove(gameId, `player2_${gameId}`, { row: 1, col: 4 }, { row: 3, col: 4 });
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should handle multiple games efficiently
      expect(duration).toBeLessThan(10000); // 10 seconds for 100 games
      expect(gameManager.getActiveGameCount()).toBe(gameCount);
    });

    test('should handle high-frequency move validation', () => {
      const validationCount = 50000;
      const startTime = Date.now();
      
      // Perform many move validations
      for (let i = 0; i < validationCount; i++) {
        const from = { row: Math.floor(Math.random() * 8), col: Math.floor(Math.random() * 8) };
        const to = { row: Math.floor(Math.random() * 8), col: Math.floor(Math.random() * 8) };
        
        game.isValidMove(from, to);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should handle high-frequency validations efficiently
      expect(duration).toBeLessThan(15000); // 15 seconds for 50k validations
    });

    test('should handle memory-intensive board operations', () => {
      const operationCount = 10000;
      const startTime = Date.now();
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform memory-intensive operations
      for (let i = 0; i < operationCount; i++) {
        // Create board copies
        const boardCopy = game.getBoardCopy();
        
        // Modify copies
        boardCopy[0][0] = { type: 'queen', color: 'white' };
        
        // Validate copies
        game.validateBoard(boardCopy);
        
        // Clear references to allow garbage collection
        if (i % 1000 === 0) {
          global.gc && global.gc();
        }
      }
      
      const endTime = Date.now();
      const finalMemory = process.memoryUsage().heapUsed;
      const duration = endTime - startTime;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Should complete efficiently without excessive memory growth
      expect(duration).toBeLessThan(20000); // 20 seconds
      expect(memoryGrowth).toBeLessThan(200 * 1024 * 1024); // Less than 200MB growth
    });

    test('should handle complex position analysis under load', () => {
      // Set up a complex tactical position
      game.board = [
        [{ type: 'rook', color: 'black' }, null, null, { type: 'queen', color: 'black' }, { type: 'king', color: 'black' }, null, null, { type: 'rook', color: 'black' }],
        [{ type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, null, null, null, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }],
        [null, null, { type: 'pawn', color: 'black' }, null, null, { type: 'knight', color: 'black' }, null, null],
        [null, null, null, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'white' }, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, { type: 'knight', color: 'white' }, null, null, { type: 'bishop', color: 'white' }, null, null],
        [{ type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, null, null, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }],
        [{ type: 'rook', color: 'white' }, null, { type: 'bishop', color: 'white' }, { type: 'queen', color: 'white' }, { type: 'king', color: 'white' }, null, null, { type: 'rook', color: 'white' }]
      ];
      
      const analysisCount = 1000;
      const startTime = Date.now();
      
      // Perform intensive analysis
      for (let i = 0; i < analysisCount; i++) {
        game.getAllValidMoves('white');
        game.getAllValidMoves('black');
        game.isInCheck('white');
        game.isInCheck('black');
        game.isCheckmate('white');
        game.isCheckmate('black');
        game.isStalemate('white');
        game.isStalemate('black');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should handle complex analysis efficiently
      expect(duration).toBeLessThan(30000); // 30 seconds for 1000 full analyses
    });
  });

  describe('System Resource Stress Tests', () => {
    test('should handle CPU-intensive operations', () => {
      const startTime = Date.now();
      
      // Perform CPU-intensive chess calculations
      for (let i = 0; i < 1000; i++) {
        // Generate all possible moves for both sides
        const whiteMoves = game.getAllValidMoves('white');
        const blackMoves = game.getAllValidMoves('black');
        
        // Analyze each move for checks and threats
        whiteMoves.forEach(move => {
          game.wouldBeInCheck(move.from, move.to, 'white');
        });
        
        blackMoves.forEach(move => {
          game.wouldBeInCheck(move.from, move.to, 'black');
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete CPU-intensive work within reasonable time
      expect(duration).toBeLessThan(60000); // 1 minute
    });

    test('should handle memory pressure gracefully', () => {
      const largeDataSets = [];
      const initialMemory = process.memoryUsage().heapUsed;
      
      try {
        // Create memory pressure
        for (let i = 0; i < 1000; i++) {
          const largeGameState = {
            board: JSON.parse(JSON.stringify(game.board)),
            moveHistory: Array(1000).fill(null).map((_, idx) => ({
              from: { row: idx % 8, col: (idx + 1) % 8 },
              to: { row: (idx + 2) % 8, col: (idx + 3) % 8 },
              piece: 'pawn',
              color: idx % 2 === 0 ? 'white' : 'black'
            })),
            metadata: Array(100).fill(null).map(() => 'large string data '.repeat(100))
          };
          
          largeDataSets.push(largeGameState);
        }
        
        // Game should still function under memory pressure
        const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
        expect(result.success).toBe(true);
        
      } finally {
        // Clean up to prevent test interference
        largeDataSets.length = 0;
        global.gc && global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Memory should be manageable
      expect(memoryGrowth).toBeLessThan(500 * 1024 * 1024); // Less than 500MB
    });

    test('should maintain performance under sustained load', () => {
      const testDuration = 10000; // 10 seconds
      const startTime = Date.now();
      let operationCount = 0;
      
      // Sustained load test
      while (Date.now() - startTime < testDuration) {
        // Mix of different operations
        switch (operationCount % 4) {
          case 0:
            game.isValidMove({ row: 6, col: 4 }, { row: 4, col: 4 });
            break;
          case 1:
            game.getAllValidMoves('white');
            break;
          case 2:
            game.isInCheck('black');
            break;
          case 3:
            game.getBoardCopy();
            break;
        }
        
        operationCount++;
      }
      
      const actualDuration = Date.now() - startTime;
      const operationsPerSecond = operationCount / (actualDuration / 1000);
      
      // Should maintain reasonable throughput
      expect(operationsPerSecond).toBeGreaterThan(100); // At least 100 ops/sec
      expect(operationCount).toBeGreaterThan(1000); // Should complete many operations
    });
  });
});