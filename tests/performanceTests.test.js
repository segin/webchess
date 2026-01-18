const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');
const { testUtils } = require('./utils/errorSuppression');

describe('Performance Tests - Comprehensive Coverage', () => {
  let game;
  let stateManager;

  beforeEach(() => {
    game = new ChessGame();
    stateManager = new GameStateManager();
    
    // Suppress console output from error handler during performance testing
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    
    console.log = (...args) => {
      const message = args.join(' ');
      // Only suppress chess game error messages, let other logs through
      if (message.includes('Error: PATH_BLOCKED') ||
          message.includes('Error: CAPTURE_OWN_PIECE') ||
          message.includes('Error: INVALID_MOVEMENT') ||
          message.includes('Error: INVALID_CASTLING') ||
          message.includes('Error: WRONG_TURN') ||
          message.includes('ChessErrorHandler.log')) {
        return; // Suppress these specific error logs
      }
      originalConsoleLog(...args);
    };
    
    console.warn = (...args) => {
      const message = args.join(' ');
      // Suppress chess game warning messages during performance tests
      if (message.includes('HIGH SEVERITY ERROR') ||
          message.includes('KING_IN_CHECK') ||
          message.includes('ChessErrorHandler')) {
        return; // Suppress these specific warnings
      }
      originalConsoleWarn(...args);
    };
    
    // Store originals for cleanup
    this.originalConsoleLog = originalConsoleLog;
    this.originalConsoleWarn = originalConsoleWarn;
  });

  afterEach(() => {
    // Restore original console functions
    if (this.originalConsoleLog) {
      console.log = this.originalConsoleLog;
    }
    if (this.originalConsoleWarn) {
      console.warn = this.originalConsoleWarn;
    }
  });

  describe('Move Validation Performance', () => {
    test('should validate moves within acceptable time limits', () => {
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } },
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }
      ];

      // Perform multiple runs for statistical analysis
      const runs = 5;
      const timings = [];
      
      for (let run = 0; run < runs; run++) {
        const testGame = new ChessGame();
        const startTime = process.hrtime.bigint();
        
        for (const move of moves) {
          const result = testGame.makeMove(move);
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
        }
        
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1000000;
        timings.push(durationMs);
      }
      
      // Calculate average and standard deviation
      const avgDuration = timings.reduce((sum, time) => sum + time, 0) / timings.length;
      const avgTimePerMove = avgDuration / moves.length;
      
      // Realistic threshold: 50ms per move (accounts for system variability and CI/CD environments)
      expect(avgTimePerMove).toBeLessThan(50);
      
      // Provide actionable feedback if performance is concerning
      if (avgTimePerMove > 25) {
        console.warn(`Performance Warning: Average move validation time is ${avgTimePerMove.toFixed(2)}ms. Consider optimizing move validation logic if this exceeds 50ms consistently.`);
      }
    });

    test('should handle complex position validation efficiently', () => {
      // Test performance with alternating moves to create a complex position
      const testMoves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // White: e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // Black: e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // White: Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Black: Nc6
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }  // White: Bc4
      ];

      const runs = 3;
      const timings = [];
      
      for (let run = 0; run < runs; run++) {
        const testGame = new ChessGame();
        const startTime = process.hrtime.bigint();
        
        // Execute moves to create complex position
        for (const move of testMoves) {
          const result = testGame.makeMove(move);
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
        }
        
        // Test performance of move validation on complex position
        const validMoves = testGame.getAllValidMoves(testGame.currentTurn);
        expect(validMoves.length).toBeGreaterThan(0);
        
        // Test a few more moves for performance measurement
        if (validMoves.length > 0) {
          const testMove = validMoves[0];
          const result = testGame.makeMove(testMove);
          expect(result.success).toBe(true);
        }
        
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1000000;
        timings.push(durationMs);
      }
      
      const avgDuration = timings.reduce((sum, time) => sum + time, 0) / timings.length;
      const avgTimePerMove = avgDuration / (testMoves.length + 1); // Account for setup moves + test move
      
      // Realistic threshold for complex positions: 100ms per move (accounts for check detection, path validation)
      expect(avgTimePerMove).toBeLessThan(100);
      
      // Provide optimization guidance
      if (avgTimePerMove > 50) {
        console.warn(`Complex Position Performance Warning: Average validation time is ${avgTimePerMove.toFixed(2)}ms. Consider optimizing check detection or path validation algorithms if this consistently exceeds 100ms.`);
      }
    });

    test('should efficiently validate large numbers of moves', () => {
      const iterations = 50; // Reduced iterations for CI/CD stability
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        // Reset game for each iteration
        const testGame = new ChessGame();
        const result = testGame.makeMove(move);
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      // Realistic threshold: 10ms per move validation (accounts for object creation and initialization)
      const avgTime = durationMs / iterations;
      expect(avgTime).toBeLessThan(10);
      
      // Performance guidance
      if (avgTime > 5) {
        console.warn(`Bulk Validation Performance Warning: Average time per move is ${avgTime.toFixed(2)}ms. Consider optimizing game initialization or move validation if this consistently exceeds 10ms.`);
      }
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

      const runs = 3;
      const timings = [];
      
      for (let run = 0; run < runs; run++) {
        const testGame = new ChessGame();
        const startTime = process.hrtime.bigint();
        
        for (const move of moves) {
          const result = testGame.makeMove(move);
          expect(result.success).toBe(true);
          const gameState = testGame.getGameState();
          expect(gameState).toBeDefined();
          expect(gameState.gameStatus).toBeDefined();
          expect(gameState.currentTurn).toBeDefined();
        }
        
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1000000;
        timings.push(durationMs);
      }
      
      const avgDuration = timings.reduce((sum, time) => sum + time, 0) / timings.length;
      const avgTimePerUpdate = avgDuration / moves.length;
      
      // Realistic threshold: 25ms per state update (includes move validation, state update, and serialization)
      expect(avgTimePerUpdate).toBeLessThan(25);
      
      // Performance guidance
      if (avgTimePerUpdate > 15) {
        console.warn(`Game State Performance Warning: Average state update time is ${avgTimePerUpdate.toFixed(2)}ms. Consider optimizing state serialization or move history management if this consistently exceeds 25ms.`);
      }
    });

    test('should handle check detection efficiently', () => {
      // Set up position where check detection is needed
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 3 }, to: { row: 3, col: 7 } }  // Qh5 (threatening check)
      ];

      for (const move of moves) {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      }

      const iterations = 25; // Reduced for stability
      const runs = 3;
      const timings = [];
      
      for (let run = 0; run < runs; run++) {
        const startTime = process.hrtime.bigint();
        
        for (let i = 0; i < iterations; i++) {
          const inCheck = game.isInCheck('black');
          expect(typeof inCheck).toBe('boolean');
        }
        
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1000000;
        timings.push(durationMs);
      }
      
      const avgDuration = timings.reduce((sum, time) => sum + time, 0) / timings.length;
      const avgTime = avgDuration / iterations;
      
      // Realistic threshold: 5ms per check detection (accounts for complex board analysis)
      expect(avgTime).toBeLessThan(5);
      
      // Performance guidance
      if (avgTime > 2) {
        console.warn(`Check Detection Performance Warning: Average check detection time is ${avgTime.toFixed(2)}ms. Consider optimizing king safety algorithms if this consistently exceeds 5ms.`);
      }
    });
  });

  describe('Memory Usage Performance', () => {
    test('should not leak memory during long games', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Play a shorter sequence for CI/CD stability
      for (let gameNum = 0; gameNum < 5; gameNum++) {
        const testGame = new ChessGame();
        
        // Play 20 moves per game (reduced for stability)
        for (let moveNum = 0; moveNum < 20; moveNum++) {
          const validMoves = testGame.getAllValidMoves(testGame.currentTurn);
          if (validMoves.length === 0) break;
          
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          const result = testGame.makeMove(randomMove);
          expect(result.success).toBe(true);
          
          if (testGame.gameStatus !== 'active') break;
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Realistic memory threshold: 100MB (accounts for Node.js overhead and test environment)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      
      // Memory usage guidance
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
      if (memoryIncreaseMB > 50) {
        console.warn(`Memory Usage Warning: Memory increased by ${memoryIncreaseMB.toFixed(2)}MB during test. Consider investigating memory leaks if this consistently exceeds 100MB.`);
      }
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

      const iterations = 50; // Reduced for stability
      const runs = 3;
      const timings = [];
      
      for (let run = 0; run < runs; run++) {
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
        timings.push(durationMs);
      }
      
      const avgDuration = timings.reduce((sum, time) => sum + time, 0) / timings.length;
      const avgTime = avgDuration / iterations;
      
      // Realistic threshold: 10ms per serialization cycle (accounts for JSON processing overhead)
      expect(avgTime).toBeLessThan(10);
      
      // Performance guidance
      if (avgTime > 5) {
        console.warn(`Serialization Performance Warning: Average serialization time is ${avgTime.toFixed(2)}ms. Consider optimizing game state structure or using more efficient serialization if this consistently exceeds 10ms.`);
      }
    });
  });

  describe('Complex Board Position Performance', () => {
    test('should handle complex tactical positions efficiently', () => {
      // Set up a complex tactical position with many pieces
      const complexSetup = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
        { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } }, // Bc4
        { from: { row: 0, col: 5 }, to: { row: 2, col: 3 } }, // Bd6
        { from: { row: 6, col: 3 }, to: { row: 5, col: 3 } }, // d3
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }  // Nf6
      ];

      for (const move of complexSetup) {
        const result = game.makeMove(move);
        if (!result.success) {
          console.log(`Failed move: ${JSON.stringify(move)}, Error: ${result.message}`);
        }
        expect(result.success).toBe(true);
      }

      const runs = 3;
      const timings = [];
      
      for (let run = 0; run < runs; run++) {
        const startTime = process.hrtime.bigint();
        
        // Test move validation on complex position
        const validMoves = game.getAllValidMoves(game.currentTurn);
        expect(validMoves.length).toBeGreaterThan(10);
        
        // Test multiple move validations
        for (let i = 0; i < Math.min(5, validMoves.length); i++) {
          const testMove = validMoves[i];
          const piece = game.board[testMove.from.row][testMove.from.col];
          const isValid = game.isValidMove(testMove.from, testMove.to, piece);
          expect(typeof isValid).toBe('boolean');
        }
        
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1000000;
        timings.push(durationMs);
      }
      
      const avgDuration = timings.reduce((sum, time) => sum + time, 0) / timings.length;
      
      // Complex positions should still be processed quickly
      expect(avgDuration).toBeLessThan(200); // 200ms threshold
      
      if (avgDuration > 100) {
        console.warn(`Complex Position Warning: Processing took ${avgDuration.toFixed(2)}ms. Consider optimizing move generation for complex positions.`);
      }
    });

    test('should handle endgame positions with few pieces efficiently', () => {
      // Set up a King and Queen vs King endgame
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[7][7] = { type: 'king', color: 'white' };
      game.board[6][6] = { type: 'queen', color: 'white' };
      game.currentTurn = 'white';
      game.gameStatus = 'active';

      const startTime = process.hrtime.bigint();
      
      // Test endgame move generation
      const validMoves = game.getAllValidMoves(game.currentTurn);
      expect(validMoves.length).toBeGreaterThan(0);
      
      // Test check detection in endgame
      const inCheck = game.isInCheck('black');
      expect(typeof inCheck).toBe('boolean');
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      // Endgame positions should be very fast
      expect(durationMs).toBeLessThan(50);
    });

    test('should handle positions with many possible moves efficiently', () => {
      // Set up a position with queens that have many possible moves
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[7][7] = { type: 'king', color: 'white' };
      game.board[4][4] = { type: 'queen', color: 'white' };
      game.board[3][3] = { type: 'queen', color: 'white' };
      game.board[5][5] = { type: 'queen', color: 'white' };
      game.currentTurn = 'white';
      game.gameStatus = 'active';

      const startTime = process.hrtime.bigint();
      
      const validMoves = game.getAllValidMoves(game.currentTurn);
      expect(validMoves.length).toBeGreaterThan(50); // Many queen moves
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      // Should handle many moves efficiently
      expect(durationMs).toBeLessThan(100);
    });

    test('should handle positions requiring deep check analysis', () => {
      // Set up a position with potential discovered checks
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][4] = { type: 'king', color: 'black' };
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[4][4] = { type: 'bishop', color: 'white' };
      game.board[2][4] = { type: 'knight', color: 'white' };
      game.board[0][0] = { type: 'rook', color: 'black' };
      game.currentTurn = 'white';
      game.gameStatus = 'active';

      const startTime = process.hrtime.bigint();
      
      // Test moves that might create discovered checks
      const validMoves = game.getAllValidMoves(game.currentTurn);
      expect(validMoves.length).toBeGreaterThan(0);
      
      // Test each move for check prevention
      for (let i = 0; i < Math.min(10, validMoves.length); i++) {
        const move = validMoves[i];
        const piece = game.board[move.from.row][move.from.col];
        const wouldBeInCheck = game.wouldBeInCheck(move.from, move.to, piece.color);
        expect(typeof wouldBeInCheck).toBe('boolean');
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      // Deep check analysis should still be reasonable
      expect(durationMs).toBeLessThan(300);
    });
  });

  describe('Long Game Performance and Memory Usage', () => {
    test('should maintain performance during long games', () => {
      const maxMoves = 100;
      const performanceData = [];
      
      for (let moveNum = 0; moveNum < maxMoves && game.gameStatus === 'active'; moveNum++) {
        const startTime = process.hrtime.bigint();
        
        const validMoves = game.getAllValidMoves(game.currentTurn);
        if (validMoves.length === 0) break;
        
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        const result = game.makeMove(randomMove);
        expect(result.success).toBe(true);
        
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1000000;
        performanceData.push(durationMs);
        
        // Check performance every 20 moves
        if (moveNum > 0 && moveNum % 20 === 0) {
          const recentPerformance = performanceData.slice(-20);
          const avgRecent = recentPerformance.reduce((sum, time) => sum + time, 0) / recentPerformance.length;
          
          // Performance should not degrade significantly over time
          expect(avgRecent).toBeLessThan(100); // 100ms per move
        }
      }
      
      expect(performanceData.length).toBeGreaterThanOrEqual(5);
      
      // Overall performance should be consistent
      const overallAvg = performanceData.reduce((sum, time) => sum + time, 0) / performanceData.length;
      expect(overallAvg).toBeLessThan(100);
    });

    test('should handle move history growth efficiently', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const movesToPlay = 50;
      let actualMoves = 0;
      
      for (let i = 0; i < movesToPlay && game.gameStatus === 'active'; i++) {
        const validMoves = game.getAllValidMoves(game.currentTurn);
        if (validMoves.length === 0) break;
        
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        const result = game.makeMove(randomMove);
        expect(result.success).toBe(true);
        actualMoves++;
        
        // Verify move history is maintained
        expect(game.moveHistory.length).toBe(actualMoves);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory growth should be reasonable for move history (adjusted for test environment)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB (more realistic for test environment)
      
      // Move history should be complete - expect at least 5 moves (more realistic)
      expect(game.moveHistory.length).toBeGreaterThan(5);
    });

    test('should handle game state serialization for long games', () => {
      // Play a longer game to build up state
      for (let i = 0; i < 30 && game.gameStatus === 'active'; i++) {
        const validMoves = game.getAllValidMoves(game.currentTurn);
        if (validMoves.length === 0) break;
        
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        const result = game.makeMove(randomMove);
        expect(result.success).toBe(true);
      }
      
      const runs = 10;
      const timings = [];
      
      for (let run = 0; run < runs; run++) {
        const startTime = process.hrtime.bigint();
        
        const gameState = game.getGameState();
        const serialized = JSON.stringify(gameState);
        const deserialized = JSON.parse(serialized);
        
        expect(deserialized.moveHistory.length).toBe(game.moveHistory.length);
        
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1000000;
        timings.push(durationMs);
      }
      
      const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
      
      // Serialization should remain fast even for long games
      expect(avgTime).toBeLessThan(20); // 20ms
    });

    test('should handle memory cleanup after game completion', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const games = [];
      
      // Create and play multiple short games
      for (let gameNum = 0; gameNum < 10; gameNum++) {
        const testGame = new ChessGame();
        games.push(testGame);
        
        // Play a short game
        for (let moveNum = 0; moveNum < 20 && testGame.gameStatus === 'active'; moveNum++) {
          const validMoves = testGame.getAllValidMoves(testGame.currentTurn);
          if (validMoves.length === 0) break;
          
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          const result = testGame.makeMove(randomMove);
          expect(result.success).toBe(true);
        }
      }
      
      // Clear references to allow garbage collection
      games.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory should not grow excessively
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });
  });

  describe('Concurrent Performance and Resource Management', () => {
    test('should handle multiple simultaneous games efficiently', () => {
      const numGames = 15; // Increased for better testing
      const games = [];
      
      // Create multiple games
      for (let i = 0; i < numGames; i++) {
        games.push(new ChessGame());
      }
      
      const runs = 3;
      const timings = [];
      
      for (let run = 0; run < runs; run++) {
        // Reset games for each run
        for (let i = 0; i < numGames; i++) {
          games[i] = new ChessGame();
        }
        
        const startTime = process.hrtime.bigint();
        
        // Make moves in all games simultaneously
        for (let moveNum = 0; moveNum < 8; moveNum++) {
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
        timings.push(durationMs);
      }
      
      const avgDuration = timings.reduce((sum, time) => sum + time, 0) / timings.length;
      
      // Realistic threshold for concurrent games
      expect(avgDuration).toBeLessThan(8000); // 8 seconds
      
      if (avgDuration > 4000) {
        console.warn(`Concurrent Performance Warning: Average concurrent game processing time is ${avgDuration.toFixed(0)}ms. Consider optimizing for concurrent load.`);
      }
    });

    test('should handle concurrent move validation efficiently', () => {
      const numConcurrentValidations = 100;
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } },
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } },
        { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }
      ];
      
      const startTime = process.hrtime.bigint();
      
      // Simulate concurrent move validations
      for (let i = 0; i < numConcurrentValidations; i++) {
        const testGame = new ChessGame();
        const move = moves[i % moves.length];
        const piece = testGame.board[move.from.row][move.from.col];
        
        const isValid = testGame.isValidMove(move.from, move.to, piece);
        expect(typeof isValid).toBe('boolean');
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      // Should handle many concurrent validations quickly
      expect(durationMs).toBeLessThan(1000); // 1 second
      
      const avgTimePerValidation = durationMs / numConcurrentValidations;
      expect(avgTimePerValidation).toBeLessThan(10); // 10ms per validation
    });

    test('should manage memory efficiently with concurrent games', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const numGames = 20;
      const games = [];
      
      // Create many concurrent games
      for (let i = 0; i < numGames; i++) {
        const game = new ChessGame();
        games.push(game);
        
        // Play a few moves in each game
        for (let moveNum = 0; moveNum < 5; moveNum++) {
          const validMoves = game.getAllValidMoves(game.currentTurn);
          if (validMoves.length === 0) break;
          
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          const result = game.makeMove(randomMove);
          expect(result.success).toBe(true);
        }
      }
      
      const peakMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = peakMemory - initialMemory;
      
      // Memory usage should be reasonable for concurrent games
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB
      
      // Cleanup
      games.length = 0;
      if (global.gc) {
        global.gc();
      }
    });

    test('should handle resource contention gracefully', () => {
      const numOperations = 50;
      const operations = [];
      
      // Create multiple resource-intensive operations
      for (let i = 0; i < numOperations; i++) {
        operations.push(() => {
          const testGame = new ChessGame();
          
          // Perform resource-intensive operations
          for (let j = 0; j < 10; j++) {
            const validMoves = testGame.getAllValidMoves(testGame.currentTurn);
            if (validMoves.length === 0) break;
            
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            const result = testGame.makeMove(randomMove);
            expect(result.success).toBe(true);
          }
          
          return testGame.getGameState();
        });
      }
      
      const startTime = process.hrtime.bigint();
      
      // Execute all operations
      const results = operations.map(op => op());
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      // All operations should complete successfully
      expect(results.length).toBe(numOperations);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.board).toBeDefined();
      });
      
      // Should handle resource contention reasonably
      expect(durationMs).toBeLessThan(20000); // 20 seconds
    });
  });

  describe('Performance Measurement Utilities', () => {
    test('should provide statistical analysis of performance metrics', () => {
      const measurements = [];
      const iterations = 10;
      
      // Collect performance measurements
      for (let i = 0; i < iterations; i++) {
        const testGame = new ChessGame();
        const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
        
        const startTime = process.hrtime.bigint();
        const result = testGame.makeMove(move);
        const endTime = process.hrtime.bigint();
        
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        
        const durationMs = Number(endTime - startTime) / 1000000;
        measurements.push(durationMs);
      }
      
      // Calculate statistical metrics
      const mean = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
      const variance = measurements.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / measurements.length;
      const stdDev = Math.sqrt(variance);
      const min = Math.min(...measurements);
      const max = Math.max(...measurements);
      
      // Validate statistical properties
      expect(mean).toBeGreaterThan(0);
      expect(stdDev).toBeGreaterThanOrEqual(0);
      expect(min).toBeLessThanOrEqual(mean);
      expect(max).toBeGreaterThanOrEqual(mean);
      
      // Performance should be consistent (low standard deviation relative to mean)
      const coefficientOfVariation = stdDev / mean;
      expect(coefficientOfVariation).toBeLessThan(2.0); // Less than 200% variation
      
      // Log performance statistics for analysis
      console.log(`Performance Statistics:
        Mean: ${mean.toFixed(3)}ms
        Std Dev: ${stdDev.toFixed(3)}ms
        Min: ${min.toFixed(3)}ms
        Max: ${max.toFixed(3)}ms
        Coefficient of Variation: ${(coefficientOfVariation * 100).toFixed(1)}%`);
    });

    test('should detect performance regressions with baseline comparison', () => {
      // Baseline performance expectations (these would be updated based on system capabilities)
      const performanceBaselines = {
        simpleMoveValidation: 50, // ms
        complexPositionValidation: 100, // ms
        checkDetection: 5, // ms
        stateUpdate: 25, // ms
        serialization: 10 // ms
      };
      
      // Test simple move validation against baseline
      const testGame = new ChessGame();
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      
      const startTime = process.hrtime.bigint();
      const result = testGame.makeMove(move);
      const endTime = process.hrtime.bigint();
      
      expect(result.success).toBe(true);
      
      const durationMs = Number(endTime - startTime) / 1000000;
      
      // Check against baseline with tolerance
      const tolerance = 1.5; // 50% tolerance for system variability
      const threshold = performanceBaselines.simpleMoveValidation * tolerance;
      
      expect(durationMs).toBeLessThan(threshold);
      
      // Provide actionable feedback for performance issues
      if (durationMs > performanceBaselines.simpleMoveValidation) {
        const regressionPercent = ((durationMs / performanceBaselines.simpleMoveValidation) - 1) * 100;
        console.warn(`Performance Regression Detected: Simple move validation took ${durationMs.toFixed(2)}ms, which is ${regressionPercent.toFixed(1)}% slower than baseline (${performanceBaselines.simpleMoveValidation}ms). Consider investigating recent changes if this persists.`);
      }
    });
  });
});