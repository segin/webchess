const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');
const { testUtils } = require('./utils/errorSuppression');

describe('Performance Tests - Move Validation and Game State Updates', () => {
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
        }
        
        // Test performance of move validation on complex position
        const validMoves = testGame.getAllValidMoves(testGame.currentTurn);
        expect(validMoves.length).toBeGreaterThan(0);
        
        // Test a few more moves for performance measurement
        if (validMoves.length > 0) {
          const testMove = validMoves[0];
          testGame.makeMove(testMove);
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
          testGame.makeMove(move);
          const gameState = testGame.getGameState();
          expect(gameState).toBeDefined();
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
        game.makeMove(move);
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

  describe('Concurrent Performance', () => {
    test('should handle multiple simultaneous games efficiently', () => {
      const numGames = 10; // Reduced for CI/CD stability
      const games = [];
      
      // Create multiple games
      for (let i = 0; i < numGames; i++) {
        games.push(new ChessGame());
      }
      
      const runs = 2;
      const timings = [];
      
      for (let run = 0; run < runs; run++) {
        // Reset games for each run
        for (let i = 0; i < numGames; i++) {
          games[i] = new ChessGame();
        }
        
        const startTime = process.hrtime.bigint();
        
        // Make moves in all games simultaneously (reduced moves)
        for (let moveNum = 0; moveNum < 5; moveNum++) {
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
      
      // Realistic threshold: 5 seconds for concurrent games (accounts for system load and CI/CD environments)
      expect(avgDuration).toBeLessThan(5000);
      
      // Performance guidance
      if (avgDuration > 2000) {
        console.warn(`Concurrent Performance Warning: Average concurrent game processing time is ${avgDuration.toFixed(0)}ms. Consider optimizing for concurrent load if this consistently exceeds 5000ms.`);
      }
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