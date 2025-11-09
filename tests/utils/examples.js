/**
 * Test Utilities Examples
 * Practical examples demonstrating how to use the test utilities effectively
 */

const TestUtils = require('./testUtils');
const { applyTestSuite } = require('./testSetup');
const { mockManager } = require('./mockingUtils');
const { PromiseTester, EventTester, TimingTester } = require('./asyncTestUtils');
const { MoveSequenceTester, PerformanceTester } = require('./advancedTestUtils');

/**
 * Example 1: Basic Game Testing
 * Demonstrates standard game testing patterns
 */
function exampleBasicGameTesting() {
  describe('Basic Game Testing Example', () => {
    // Apply standard test suite with error suppression
    TestUtils.applyStandardSuite({
      suppressErrors: ['Invalid move', 'Wrong turn'],
      trackResources: true
    });

    test('should create game and make valid moves', () => {
      // Create a fresh game
      const game = TestUtils.createStandardGame();
      
      // Validate initial state
      const initialState = game.getGameState();
      TestUtils.AssertionPatterns.validateGameState(initialState);
      expect(initialState.currentTurn).toBe('white');
      expect(initialState.gameStatus).toBe('active');

      // Make a valid move
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const response = TestUtils.executeAndValidateMove(game, move, true);
      
      // Validate response and new state
      expect(response.data.currentTurn).toBe('black');
      expect(response.data.gameStatus).toBe('active');
    });

    test('should handle invalid moves properly', () => {
      const game = TestUtils.createStandardGame();
      
      // Try an invalid move (wrong turn)
      const invalidMove = { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } };
      const response = TestUtils.executeAndValidateMove(
        game, 
        invalidMove, 
        false, 
        'WRONG_TURN'
      );
      
      expect(response.details.attemptedColor).toBe('black');
      expect(response.details.currentTurn).toBe('white');
    });

    test('should test move sequences', () => {
      const game = TestUtils.createStandardGame();
      
      const sequence = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }  // Nc6
      ];

      const results = TestUtils.ExecutionHelpers.executeMovesSequence(
        game, 
        sequence, 
        true
      );
      
      expect(results).toHaveLength(4);
      expect(game.currentTurn).toBe('white');
    });
  });
}

/**
 * Example 2: Server Testing with Mocks
 * Demonstrates server testing with WebSocket and HTTP mocking
 */
function exampleServerTesting() {
  describe('Server Testing Example', () => {
    // Apply server test suite
    applyTestSuite('server', {
      port: 0, // Random port
      mockSocketIO: true
    });

    test('should handle HTTP server lifecycle', async () => {
      const server = mockManager.createHTTPMocks();
      
      // Test server startup
      const startPromise = new Promise(resolve => {
        server.listen(3001, resolve);
      });
      
      await PromiseTester.expectToResolve(startPromise, undefined, 1000);
      expect(server._isListening()).toBe(true);
      
      // Test server shutdown
      const stopPromise = new Promise(resolve => {
        server.close(resolve);
      });
      
      await PromiseTester.expectToResolve(stopPromise, undefined, 1000);
      expect(server._isListening()).toBe(false);
    });

    test('should handle WebSocket connections', async () => {
      const wsEnv = mockManager.createWebSocketMocks({
        socketCount: 2
      });
      
      const { server, sockets } = wsEnv;
      const [socket1, socket2] = sockets;
      
      // Test socket joining room
      await socket1.join('game-TEST01');
      expect(socket1.rooms.has('game-TEST01')).toBe(true);
      
      // Test server emitting to room
      server.to('game-TEST01').emit('game-update', { status: 'active' });
      
      // Verify socket received event
      expect(socket1.emit).toHaveBeenCalledWith('game-update', { status: 'active' });
      expect(socket2.emit).not.toHaveBeenCalledWith('game-update', { status: 'active' });
    });

    test('should handle WebSocket events with timing', async () => {
      const wsEnv = mockManager.createWebSocketMocks({ socketCount: 1 });
      const socket = wsEnv.sockets[0];
      const eventTester = new EventTester();
      
      // Set up event handler
      const eventPromise = eventTester.waitForEvent(socket, 'test-event', 1000);
      
      // Simulate event after delay
      setTimeout(() => {
        socket._triggerEvent('test-event', { data: 'test' });
      }, 100);
      
      const eventData = await eventPromise;
      expect(eventData.data).toBe('test');
    });
  });
}

/**
 * Example 3: Advanced Move Sequence Testing
 * Demonstrates complex move sequence testing with validation
 */
function exampleAdvancedMoveSequenceTesting() {
  describe('Advanced Move Sequence Testing Example', () => {
    TestUtils.applyStandardSuite();

    test('should test Scholar\'s Mate sequence', () => {
      const game = TestUtils.createStandardGame();
      
      const scholarsSequence = [
        {
          move: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
          shouldSucceed: true,
          expectedGameState: { currentTurn: 'black', gameStatus: 'active' },
          description: 'White plays e4'
        },
        {
          move: { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
          shouldSucceed: true,
          expectedGameState: { currentTurn: 'white', gameStatus: 'active' },
          description: 'Black plays e5'
        },
        {
          move: { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } },
          shouldSucceed: true,
          expectedGameState: { currentTurn: 'black', gameStatus: 'active' },
          description: 'White plays Bc4'
        },
        {
          move: { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } },
          shouldSucceed: true,
          expectedGameState: { currentTurn: 'white', gameStatus: 'active' },
          description: 'Black plays Nc6'
        },
        {
          move: { from: { row: 7, col: 3 }, to: { row: 3, col: 7 } },
          shouldSucceed: true,
          expectedGameState: { currentTurn: 'black', gameStatus: 'active' },
          description: 'White plays Qh5'
        },
        {
          move: { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } },
          shouldSucceed: true,
          expectedGameState: { currentTurn: 'white', gameStatus: 'active' },
          description: 'Black plays Nf6 (defending)'
        },
        {
          move: { from: { row: 3, col: 7 }, to: { row: 1, col: 5 } },
          shouldSucceed: true,
          expectedGameState: { 
            currentTurn: 'black', 
            gameStatus: 'checkmate',
            winner: 'white'
          },
          description: 'White plays Qxf7# (checkmate)'
        }
      ];

      const results = MoveSequenceTester.testMoveSequence(game, scholarsSequence);
      
      expect(results.success).toBe(true);
      expect(results.moves).toHaveLength(7);
      expect(results.gameStates).toHaveLength(8); // Initial + 7 moves
      
      // Verify final state
      const finalState = results.gameStates[results.gameStates.length - 1];
      expect(finalState.gameStatus).toBe('checkmate');
      expect(finalState.winner).toBe('white');
    });

    test('should test invalid move in sequence', () => {
      const game = TestUtils.createStandardGame();
      
      const sequenceWithError = [
        {
          move: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
          shouldSucceed: true,
          description: 'Valid opening move'
        },
        {
          move: { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } }, // No piece there
          shouldSucceed: false,
          expectedErrorCode: 'NO_PIECE',
          description: 'Invalid move - no piece'
        }
      ];

      const results = MoveSequenceTester.testMoveSequence(game, sequenceWithError);
      
      expect(results.success).toBe(false);
      expect(results.failedAt).toBe(1);
      expect(results.moves[1].success).toBe(false);
    });
  });
}

/**
 * Example 4: Performance Testing
 * Demonstrates performance testing patterns
 */
function examplePerformanceTesting() {
  describe('Performance Testing Example', () => {
    TestUtils.applyStandardSuite();

    test('should measure move validation performance', async () => {
      const game = TestUtils.createStandardGame();
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
        { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } },
        { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }
      ];

      const metrics = await PerformanceTester.measurePerformance(
        () => {
          for (const move of moves) {
            game.makeMove(move);
          }
        },
        {
          iterations: 10,
          warmupIterations: 2,
          collectMemoryStats: true
        }
      );

      expect(metrics.success).toBe(true);
      expect(metrics.averageTime).toBeLessThan(100); // Should be fast
      expect(metrics.maxMemory).toBeLessThan(1024 * 1024); // Less than 1MB
      
      console.log(`Average execution time: ${metrics.averageTime}ms`);
      console.log(`Max memory usage: ${metrics.maxMemory} bytes`);
    });

    test('should benchmark different game scenarios', async () => {
      const scenarios = [
        {
          name: 'Starting Position',
          gameFactory: () => TestUtils.createStandardGame(),
          operation: (game) => {
            const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
            return game.makeMove(move);
          }
        },
        {
          name: 'Complex Position',
          gameFactory: () => TestUtils.createFromPosition('CHECKMATE_POSITION'),
          operation: (game) => {
            return game.getGameState();
          }
        }
      ];

      const benchmarks = await PerformanceTester.benchmarkScenarios(scenarios, {
        iterations: 5
      });

      expect(benchmarks['Starting Position']).toBeDefined();
      expect(benchmarks['Complex Position']).toBeDefined();
      
      // Starting position moves should be faster than complex position analysis
      expect(benchmarks['Starting Position'].averageTime)
        .toBeLessThan(benchmarks['Complex Position'].averageTime * 2);
    });
  });
}

/**
 * Example 5: Error Handling and Recovery Testing
 * Demonstrates error injection and recovery testing
 */
function exampleErrorHandlingTesting() {
  describe('Error Handling Testing Example', () => {
    // Apply error handling setup with suppression
    applyTestSuite('error', [
      'Invalid move',
      'Game not active',
      'System error'
    ]);

    test('should handle malformed input gracefully', () => {
      const game = TestUtils.createStandardGame();
      
      const malformedInputs = [
        null,
        undefined,
        {},
        { from: null },
        { to: null },
        { from: { row: 'invalid' }, to: { row: 5, col: 4 } },
        { from: { row: 6, col: 4 }, to: { row: 5, col: 'invalid' } }
      ];

      for (const input of malformedInputs) {
        const response = game.makeMove(input);
        
        expect(response.success).toBe(false);
        expect(response.errorCode).toMatch(/MALFORMED|INVALID_FORMAT|MISSING_REQUIRED_FIELD/);
        expect(response.message).toBeDefined();
        expect(response.details).toBeDefined();
      }
    });

    test('should maintain game state consistency after errors', () => {
      const game = TestUtils.createStandardGame();
      const initialState = game.getGameState();
      
      // Try multiple invalid moves
      const invalidMoves = [
        { from: { row: 0, col: 0 }, to: { row: 1, col: 0 } }, // Wrong turn
        { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } }, // Invalid pawn move
        { from: { row: 4, col: 4 }, to: { row: 5, col: 4 } }  // No piece there
      ];

      for (const move of invalidMoves) {
        const response = game.makeMove(move);
        expect(response.success).toBe(false);
        
        // Game state should remain unchanged
        const currentState = game.getGameState();
        expect(currentState.currentTurn).toBe(initialState.currentTurn);
        expect(currentState.gameStatus).toBe(initialState.gameStatus);
        expect(currentState.moveHistory).toHaveLength(initialState.moveHistory.length);
      }
    });

    test('should handle system errors gracefully', () => {
      const game = TestUtils.createStandardGame();
      
      // Mock a system error by corrupting internal state temporarily
      const originalBoard = game.board;
      game.board = null; // Corrupt state
      
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const response = game.makeMove(move);
      
      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('SYSTEM_ERROR');
      expect(response.message).toContain('system error');
      
      // Restore state
      game.board = originalBoard;
    });
  });
}

/**
 * Example 6: Async Operations and Event Testing
 * Demonstrates async testing patterns
 */
function exampleAsyncTesting() {
  describe('Async Operations Testing Example', () => {
    TestUtils.applyStandardSuite();

    test('should test promise-based operations', async () => {
      // Simulate async game operation
      const asyncGameOperation = () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const game = TestUtils.createStandardGame();
            const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
            const result = game.makeMove(move);
            resolve(result);
          }, 100);
        });
      };

      // Test promise resolution
      const result = await PromiseTester.expectToResolve(
        asyncGameOperation(),
        undefined,
        1000
      );
      
      expect(result.success).toBe(true);
    });

    test('should test operation timing', async () => {
      const slowOperation = () => {
        return new Promise(resolve => {
          setTimeout(() => {
            const game = TestUtils.createStandardGame();
            resolve(game.getGameState());
          }, 200);
        });
      };

      const { result, duration } = await TimingTester.expectExecutionTime(
        slowOperation,
        150, // min time
        300  // max time
      );

      expect(result.gameStatus).toBe('active');
      expect(duration).toBeGreaterThanOrEqual(150);
      expect(duration).toBeLessThanOrEqual(300);
    });

    test('should test condition waiting', async () => {
      let gameStatus = 'active';
      
      // Simulate status change after delay
      setTimeout(() => {
        gameStatus = 'checkmate';
      }, 500);

      await TimingTester.waitForCondition(
        () => gameStatus === 'checkmate',
        { timeout: 1000, interval: 50 }
      );

      expect(gameStatus).toBe('checkmate');
    });

    test('should test parallel operations', async () => {
      const operations = [
        () => Promise.resolve(TestUtils.createStandardGame()),
        () => Promise.resolve(TestUtils.createFromPosition('KINGS_ONLY')),
        () => Promise.resolve(TestUtils.createFromPosition('CASTLING_READY'))
      ];

      const results = await PromiseTester.testParallel(
        operations.map(op => op()),
        { expectAllToResolve: true, collectTiming: true }
      );

      expect(results.results).toHaveLength(3);
      expect(results.duration).toBeLessThan(1000);
      
      // All games should be valid
      for (const game of results.results) {
        expect(game.getGameState).toBeDefined();
      }
    });
  });
}

/**
 * Example 7: Integration Testing
 * Demonstrates full integration testing patterns
 */
function exampleIntegrationTesting() {
  describe('Integration Testing Example', () => {
    applyTestSuite('integration');

    test('should test complete game flow', async () => {
      const { game, whitePlayer, blackPlayer } = this.createGameWithPlayers();
      
      // Simulate game flow
      const gameFlow = [
        { player: whitePlayer, move: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } } },
        { player: blackPlayer, move: { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } } },
        { player: whitePlayer, move: { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } } },
        { player: blackPlayer, move: { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } } }
      ];

      for (const { player, move } of gameFlow) {
        // Verify it's the correct player's turn
        const gameState = game.getGameState();
        expect(gameState.currentTurn).toBe(player.color);
        
        // Make the move
        const response = game.makeMove(move);
        expect(response.success).toBe(true);
      }

      // Verify final state
      const finalState = game.getGameState();
      expect(finalState.moveHistory).toHaveLength(4);
      expect(finalState.currentTurn).toBe('white');
    });

    test('should test multiplayer WebSocket integration', async () => {
      const wsEnv = mockManager.createWebSocketMocks({ socketCount: 2 });
      const [socket1, socket2] = wsEnv.sockets;
      const eventTester = new EventTester();

      // Both players join the same game
      const gameId = 'INTEGRATION_TEST';
      await socket1.join(`game-${gameId}`);
      await socket2.join(`game-${gameId}`);

      // Player 1 makes a move
      const movePromise = eventTester.waitForEvent(socket2, 'move-made', 1000);
      
      wsEnv.server.to(`game-${gameId}`).emit('move-made', {
        gameId,
        move: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        player: 'white'
      });

      const moveEvent = await movePromise;
      expect(moveEvent.gameId).toBe(gameId);
      expect(moveEvent.player).toBe('white');
    });
  });
}

// Export all examples for use in actual tests
module.exports = {
  exampleBasicGameTesting,
  exampleServerTesting,
  exampleAdvancedMoveSequenceTesting,
  examplePerformanceTesting,
  exampleErrorHandlingTesting,
  exampleAsyncTesting,
  exampleIntegrationTesting
};