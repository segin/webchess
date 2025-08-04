const GameManager = require('../src/server/gameManager');
const ChessGame = require('../src/shared/chessGame');
const ChessAI = require('../src/shared/chessAI');

describe('Concurrent Game Testing - Resource Management', () => {
  let gameManager;

  beforeEach(() => {
    gameManager = new GameManager();
  });

  describe('Multiple Simultaneous Games', () => {
    test('should handle many concurrent games efficiently', () => {
      const numGames = 25;
      const games = [];
      const players = [];

      // Create many concurrent games
      for (let i = 0; i < numGames; i++) {
        const hostId = `host${i}`;
        const guestId = `guest${i}`;
        
        const gameId = gameManager.createGame(hostId);
        const joinResult = gameManager.joinGame(gameId, guestId);
        
        expect(joinResult.success).toBe(true);
        
        games.push(gameId);
        players.push({ host: hostId, guest: guestId });
      }

      expect(gameManager.getActiveGameCount()).toBe(numGames);

      // Make moves in all games simultaneously
      const startTime = Date.now();
      
      for (let moveNum = 0; moveNum < 5; moveNum++) {
        for (let gameIndex = 0; gameIndex < numGames; gameIndex++) {
          const gameId = games[gameIndex];
          const player = players[gameIndex];
          const currentPlayer = moveNum % 2 === 0 ? player.host : player.guest;
          
          const gameState = gameManager.getGameState(gameId);
          if (gameState && gameState.gameStatus === 'active') {
            const game = gameManager.games.get(gameId);
            const validMoves = game.chess.getAllValidMoves(game.chess.currentTurn);
            
            if (validMoves.length > 0) {
              const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
              const result = gameManager.makeMove(gameId, currentPlayer, randomMove);
              expect(result.success).toBe(true);
            }
          }
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle concurrent games within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds
      
      // Verify all games are still tracked
      expect(gameManager.getActiveGameCount()).toBeLessThanOrEqual(numGames);
    });

    test('should maintain game isolation across concurrent games', () => {
      const numGames = 10;
      const gameData = [];

      // Create games with different initial moves
      for (let i = 0; i < numGames; i++) {
        const hostId = `host${i}`;
        const guestId = `guest${i}`;
        
        const gameId = gameManager.createGame(hostId);
        gameManager.joinGame(gameId, guestId);
        
        // Make a unique first move in each game
        const moves = [
          { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
          { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }, // d4
          { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
          { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }, // Nc3
          { from: { row: 6, col: 2 }, to: { row: 4, col: 2 } }, // c4
          { from: { row: 6, col: 5 }, to: { row: 4, col: 5 } }, // f4
          { from: { row: 6, col: 1 }, to: { row: 4, col: 1 } }, // b4
          { from: { row: 6, col: 6 }, to: { row: 4, col: 6 } }, // g4
          { from: { row: 6, col: 0 }, to: { row: 4, col: 0 } }, // a4
          { from: { row: 6, col: 7 }, to: { row: 4, col: 7 } }  // h4
        ];
        
        const move = moves[i % moves.length];
        const result = gameManager.makeMove(gameId, hostId, move);
        expect(result.success).toBe(true);
        
        gameData.push({
          gameId,
          hostId,
          guestId,
          expectedMove: move
        });
      }

      // Verify each game has the correct state
      gameData.forEach((data, index) => {
        const gameState = gameManager.getGameState(data.gameId);
        expect(gameState.moveHistory.length).toBe(1);
        
        const actualMove = gameState.moveHistory[0];
        expect(actualMove.from).toEqual(data.expectedMove.from);
        expect(actualMove.to).toEqual(data.expectedMove.to);
      });
    });

    test('should handle concurrent AI vs human games', () => {
      const numGames = 8;
      const aiInstances = [];
      const gameData = [];

      // Create games with AI opponents
      for (let i = 0; i < numGames; i++) {
        const humanId = `human${i}`;
        const aiId = `ai${i}`;
        const ai = new ChessAI('medium');
        
        const gameId = gameManager.createGame(humanId);
        gameManager.joinGame(gameId, aiId);
        
        aiInstances.push(ai);
        gameData.push({
          gameId,
          humanId,
          aiId,
          ai
        });
      }

      // Play several rounds with AI making moves
      for (let round = 0; round < 6; round++) {
        for (let gameIndex = 0; gameIndex < numGames; gameIndex++) {
          const data = gameData[gameIndex];
          const gameState = gameManager.getGameState(data.gameId);
          
          if (gameState && gameState.gameStatus === 'active') {
            const game = gameManager.games.get(data.gameId);
            const currentTurn = game.chess.currentTurn;
            
            if (currentTurn === 'white') {
              // Human move (random valid move)
              const validMoves = game.chess.getAllValidMoves('white');
              if (validMoves.length > 0) {
                const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                gameManager.makeMove(data.gameId, data.humanId, randomMove);
              }
            } else {
              // AI move
              const aiMove = data.ai.getBestMove(game.chess);
              if (aiMove) {
                gameManager.makeMove(data.gameId, data.aiId, aiMove);
              }
            }
          }
        }
      }

      // Verify games progressed
      gameData.forEach(data => {
        const gameState = gameManager.getGameState(data.gameId);
        expect(gameState.moveHistory.length).toBeGreaterThan(2);
      });
    });

    test('should handle concurrent chat across multiple games', () => {
      const numGames = 5;
      const gameData = [];

      // Create games
      for (let i = 0; i < numGames; i++) {
        const hostId = `host${i}`;
        const guestId = `guest${i}`;
        
        const gameId = gameManager.createGame(hostId);
        gameManager.joinGame(gameId, guestId);
        
        gameData.push({ gameId, hostId, guestId });
      }

      // Send chat messages in all games
      gameData.forEach((data, index) => {
        const hostResult = gameManager.addChatMessage(
          data.gameId, 
          data.hostId, 
          `Host message in game ${index}`
        );
        
        const guestResult = gameManager.addChatMessage(
          data.gameId, 
          data.guestId, 
          `Guest message in game ${index}`
        );

        expect(hostResult.success).toBe(true);
        expect(guestResult.success).toBe(true);
      });

      // Verify chat isolation
      gameData.forEach((data, index) => {
        const chatMessages = gameManager.getChatMessages(data.gameId, data.hostId);
        expect(chatMessages.success).toBe(true);
        expect(chatMessages.messages.length).toBe(2);
        
        const hostMessage = chatMessages.messages.find(msg => msg.isOwn);
        expect(hostMessage.message).toBe(`Host message in game ${index}`);
      });
    });
  });

  describe('Resource Management and Memory Usage', () => {
    test('should manage memory efficiently with many concurrent games', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const numGames = 20;
      const gameIds = [];

      // Create many games
      for (let i = 0; i < numGames; i++) {
        const hostId = `host${i}`;
        const guestId = `guest${i}`;
        
        const gameId = gameManager.createGame(hostId);
        gameManager.joinGame(gameId, guestId);
        gameIds.push(gameId);
        
        // Play a few moves in each game
        for (let moveNum = 0; moveNum < 3; moveNum++) {
          const game = gameManager.games.get(gameId);
          const validMoves = game.chess.getAllValidMoves(game.chess.currentTurn);
          
          if (validMoves.length > 0) {
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            const currentPlayer = game.chess.currentTurn === 'white' ? hostId : guestId;
            gameManager.makeMove(gameId, currentPlayer, randomMove);
          }
        }
      }

      const peakMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = peakMemory - initialMemory;

      // Memory usage should be reasonable
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // 200MB

      // Clean up games
      gameIds.forEach(gameId => {
        const game = gameManager.games.get(gameId);
        if (game) {
          gameManager.handleDisconnect(game.host);
          gameManager.checkDisconnectedPlayer(game.host);
        }
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryAfterCleanup = finalMemory - initialMemory;

      // Memory should be mostly cleaned up
      expect(memoryAfterCleanup).toBeLessThan(memoryIncrease * 0.5);
    });

    test('should handle game cleanup efficiently', () => {
      const numGames = 15;
      const gameData = [];

      // Create games
      for (let i = 0; i < numGames; i++) {
        const hostId = `host${i}`;
        const guestId = `guest${i}`;
        
        const gameId = gameManager.createGame(hostId);
        gameManager.joinGame(gameId, guestId);
        
        gameData.push({ gameId, hostId, guestId });
      }

      expect(gameManager.getActiveGameCount()).toBe(numGames);

      // Clean up half the games through disconnection
      const gamesToCleanup = gameData.slice(0, Math.floor(numGames / 2));
      
      gamesToCleanup.forEach(data => {
        gameManager.handleDisconnect(data.hostId);
        gameManager.checkDisconnectedPlayer(data.hostId);
      });

      const remainingGames = numGames - gamesToCleanup.length;
      expect(gameManager.getActiveGameCount()).toBe(remainingGames);

      // Verify cleaned up games are gone
      gamesToCleanup.forEach(data => {
        expect(gameManager.games.has(data.gameId)).toBe(false);
        expect(gameManager.playerToGame.has(data.hostId)).toBe(false);
        expect(gameManager.playerToGame.has(data.guestId)).toBe(false);
      });
    });

    test('should handle rapid game creation and destruction', () => {
      const cycles = 10;
      const gamesPerCycle = 5;

      for (let cycle = 0; cycle < cycles; cycle++) {
        const gameIds = [];
        
        // Create games
        for (let i = 0; i < gamesPerCycle; i++) {
          const hostId = `cycle${cycle}_host${i}`;
          const guestId = `cycle${cycle}_guest${i}`;
          
          const gameId = gameManager.createGame(hostId);
          gameManager.joinGame(gameId, guestId);
          gameIds.push({ gameId, hostId, guestId });
        }

        expect(gameManager.getActiveGameCount()).toBe(gamesPerCycle);

        // Destroy games
        gameIds.forEach(data => {
          gameManager.handleDisconnect(data.hostId);
          gameManager.checkDisconnectedPlayer(data.hostId);
        });

        expect(gameManager.getActiveGameCount()).toBe(0);
      }

      // Final state should be clean
      expect(gameManager.games.size).toBe(0);
      expect(gameManager.playerToGame.size).toBe(0);
      expect(gameManager.disconnectedPlayers.size).toBe(0);
    });

    test('should handle concurrent disconnections gracefully', () => {
      const numGames = 12;
      const gameData = [];

      // Create games
      for (let i = 0; i < numGames; i++) {
        const hostId = `host${i}`;
        const guestId = `guest${i}`;
        
        const gameId = gameManager.createGame(hostId);
        gameManager.joinGame(gameId, guestId);
        
        gameData.push({ gameId, hostId, guestId });
      }

      // Simulate many concurrent disconnections
      const startTime = Date.now();
      
      gameData.forEach(data => {
        gameManager.handleDisconnect(data.hostId);
        gameManager.handleDisconnect(data.guestId);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle concurrent disconnections quickly
      expect(duration).toBeLessThan(1000); // 1 second

      // All players should be tracked as disconnected
      expect(gameManager.disconnectedPlayers.size).toBe(numGames * 2);

      // Clean up all disconnected players
      gameData.forEach(data => {
        gameManager.checkDisconnectedPlayer(data.hostId);
        gameManager.checkDisconnectedPlayer(data.guestId);
      });

      // All games should be cleaned up
      expect(gameManager.getActiveGameCount()).toBe(0);
    });
  });

  describe('Performance Under Load', () => {
    test('should maintain performance with high game throughput', () => {
      const numGames = 30;
      const movesPerGame = 10;
      const performanceData = [];

      // Create games
      const gameData = [];
      for (let i = 0; i < numGames; i++) {
        const hostId = `host${i}`;
        const guestId = `guest${i}`;
        
        const gameId = gameManager.createGame(hostId);
        gameManager.joinGame(gameId, guestId);
        
        gameData.push({ gameId, hostId, guestId });
      }

      // Measure performance of concurrent moves
      for (let moveNum = 0; moveNum < movesPerGame; moveNum++) {
        const startTime = process.hrtime.bigint();
        
        gameData.forEach(data => {
          const game = gameManager.games.get(data.gameId);
          if (game && game.chess.gameStatus === 'active') {
            const validMoves = game.chess.getAllValidMoves(game.chess.currentTurn);
            
            if (validMoves.length > 0) {
              const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
              const currentPlayer = game.chess.currentTurn === 'white' ? data.hostId : data.guestId;
              gameManager.makeMove(data.gameId, currentPlayer, randomMove);
            }
          }
        });
        
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1000000;
        performanceData.push(durationMs);
      }

      // Analyze performance
      const avgDuration = performanceData.reduce((sum, time) => sum + time, 0) / performanceData.length;
      const maxDuration = Math.max(...performanceData);

      // Performance should be consistent
      expect(avgDuration).toBeLessThan(1000); // 1 second average
      expect(maxDuration).toBeLessThan(2000); // 2 second max

      // Performance should not degrade significantly over time
      const firstHalf = performanceData.slice(0, Math.floor(performanceData.length / 2));
      const secondHalf = performanceData.slice(Math.floor(performanceData.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
      
      // Second half should not be significantly slower
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 2);
    });

    test('should handle burst traffic patterns', () => {
      const burstSize = 20;
      const numBursts = 5;
      const burstData = [];

      for (let burst = 0; burst < numBursts; burst++) {
        const startTime = process.hrtime.bigint();
        const gameIds = [];

        // Create burst of games
        for (let i = 0; i < burstSize; i++) {
          const hostId = `burst${burst}_host${i}`;
          const guestId = `burst${burst}_guest${i}`;
          
          const gameId = gameManager.createGame(hostId);
          gameManager.joinGame(gameId, guestId);
          gameIds.push({ gameId, hostId, guestId });
        }

        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1000000;
        burstData.push(durationMs);

        // Clean up burst
        gameIds.forEach(data => {
          gameManager.handleDisconnect(data.hostId);
          gameManager.checkDisconnectedPlayer(data.hostId);
        });
      }

      // All bursts should complete within reasonable time
      burstData.forEach(duration => {
        expect(duration).toBeLessThan(3000); // 3 seconds per burst
      });

      // Performance should be consistent across bursts
      const avgBurstTime = burstData.reduce((sum, time) => sum + time, 0) / burstData.length;
      const maxBurstTime = Math.max(...burstData);
      
      expect(maxBurstTime).toBeLessThan(avgBurstTime * 3); // Max should not be 3x average
    });

    test('should handle mixed workload patterns', () => {
      const longRunningGames = 5;
      const shortLivedGames = 15;
      const longGameData = [];
      const shortGameData = [];

      // Create long-running games
      for (let i = 0; i < longRunningGames; i++) {
        const hostId = `long_host${i}`;
        const guestId = `long_guest${i}`;
        
        const gameId = gameManager.createGame(hostId);
        gameManager.joinGame(gameId, guestId);
        
        longGameData.push({ gameId, hostId, guestId });
      }

      // Create and quickly destroy short-lived games
      for (let i = 0; i < shortLivedGames; i++) {
        const hostId = `short_host${i}`;
        const guestId = `short_guest${i}`;
        
        const gameId = gameManager.createGame(hostId);
        gameManager.joinGame(gameId, guestId);
        
        // Make a quick move
        const game = gameManager.games.get(gameId);
        const validMoves = game.chess.getAllValidMoves('white');
        if (validMoves.length > 0) {
          const randomMove = validMoves[0];
          gameManager.makeMove(gameId, hostId, randomMove);
        }
        
        // Immediately disconnect
        gameManager.handleDisconnect(hostId);
        gameManager.checkDisconnectedPlayer(hostId);
      }

      // Long-running games should still be active
      expect(gameManager.getActiveGameCount()).toBe(longRunningGames);

      // Continue playing long-running games
      for (let moveNum = 0; moveNum < 5; moveNum++) {
        longGameData.forEach(data => {
          const game = gameManager.games.get(data.gameId);
          if (game && game.chess.gameStatus === 'active') {
            const validMoves = game.chess.getAllValidMoves(game.chess.currentTurn);
            
            if (validMoves.length > 0) {
              const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
              const currentPlayer = game.chess.currentTurn === 'white' ? data.hostId : data.guestId;
              gameManager.makeMove(data.gameId, currentPlayer, randomMove);
            }
          }
        });
      }

      // Verify long games progressed
      longGameData.forEach(data => {
        const gameState = gameManager.getGameState(data.gameId);
        expect(gameState.moveHistory.length).toBeGreaterThan(2);
      });
    });
  });
});