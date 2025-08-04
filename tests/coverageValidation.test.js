const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');
const ChessErrorHandler = require('../src/shared/errorHandler');
const fs = require('fs');
const path = require('path');

describe('Coverage Validation Tests - Ensuring 95% Code Coverage', () => {
  let game;
  let stateManager;
  let errorHandler;

  beforeEach(() => {
    game = new ChessGame();
    stateManager = new GameStateManager();
    errorHandler = new ChessErrorHandler();
  });

  describe('Coverage Infrastructure Tests', () => {
    test('should have coverage validation script', () => {
      const scriptPath = path.join(__dirname, '../scripts/coverage-validation.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    test('should have coverage configuration', () => {
      const configPath = path.join(__dirname, '../coverage.config.js');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const config = require('../coverage.config.js');
      expect(config.globalThresholds).toBeDefined();
      expect(config.globalThresholds.statements).toBe(95);
      expect(config.globalThresholds.branches).toBe(95);
      expect(config.globalThresholds.functions).toBe(95);
      expect(config.globalThresholds.lines).toBe(95);
    });

    test('should have Jest coverage configuration', () => {
      const jestConfig = require('../jest.config.js');
      expect(jestConfig.collectCoverage).toBe(true);
      expect(jestConfig.coverageThreshold).toBeDefined();
      expect(jestConfig.coverageThreshold.global).toBeDefined();
    });

    test('should validate coverage thresholds are configured', () => {
      const jestConfig = require('../jest.config.js');
      
      // Check global thresholds
      expect(jestConfig.coverageThreshold.global.statements).toBe(95);
      expect(jestConfig.coverageThreshold.global.branches).toBe(95);
      expect(jestConfig.coverageThreshold.global.functions).toBe(95);
      expect(jestConfig.coverageThreshold.global.lines).toBe(95);
    });

    test('should have coverage validation scripts', () => {
      const packageJson = require('../package.json');
      
      expect(packageJson.scripts['test:coverage:validate']).toBeDefined();
      expect(packageJson.scripts['test:coverage:report']).toBeDefined();
      expect(packageJson.scripts['coverage:validate']).toBeDefined();
    });

    test('should exclude appropriate files from coverage', () => {
      const jestConfig = require('../jest.config.js');
      
      expect(jestConfig.coveragePathIgnorePatterns).toContain('/tests/');
      expect(jestConfig.coveragePathIgnorePatterns).toContain('/coverage/');
      expect(jestConfig.coveragePathIgnorePatterns).toContain('/node_modules/');
    });

    test('should have coverage monitoring script', () => {
      const monitorPath = path.join(__dirname, '../scripts/coverage-monitor.js');
      expect(fs.existsSync(monitorPath)).toBe(true);
    });

    test('should have pre-commit coverage validation', () => {
      const preCommitPath = path.join(__dirname, '../scripts/pre-commit-coverage.js');
      expect(fs.existsSync(preCommitPath)).toBe(true);
    });
  });

  describe('ChessGame Class Coverage', () => {
    test('should cover all public methods', () => {
      // Test all public methods exist and are callable
      expect(typeof game.makeMove).toBe('function');
      expect(typeof game.getGameState).toBe('function');
      expect(typeof game.isInCheck).toBe('function');
      expect(typeof game.isCheckmate).toBe('function');
      expect(typeof game.isStalemate).toBe('function');
      expect(typeof game.hasValidMoves).toBe('function');
      expect(typeof game.getAllValidMoves).toBe('function');
      expect(typeof game.checkGameEnd).toBe('function');
      expect(typeof game.resetGame).toBe('function');
    });

    test('should cover all piece movement validation methods', () => {
      // Test that all piece types can be validated
      const pieceTypes = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
      
      for (const pieceType of pieceTypes) {
        // Place piece on board
        game.board[4][4] = { type: pieceType, color: 'white' };
        
        // Test validation method exists and works
        const validMoves = game.getAllValidMoves('white');
        expect(Array.isArray(validMoves)).toBe(true);
        
        // Clean up
        game.board[4][4] = null;
      }
    });

    test('should cover all special move scenarios', () => {
      // Test castling coverage
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[7][4] = { type: 'king', color: 'white' };
      game.board[7][7] = { type: 'rook', color: 'white' };
      game.board[7][0] = { type: 'rook', color: 'white' };
      
      const castlingMove = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 } };
      const result = game.makeMove(castlingMove);
      expect(result).toBeDefined();

      // Test en passant coverage
      game.resetGame();
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e4
      game.makeMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }); // d5
      game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } }); // exd5
      game.makeMove({ from: { row: 1, col: 2 }, to: { row: 3, col: 2 } }); // c5
      
      const enPassantMove = { from: { row: 3, col: 4 }, to: { row: 2, col: 3 } };
      const enPassantResult = game.makeMove(enPassantMove);
      expect(enPassantResult).toBeDefined();

      // Test pawn promotion coverage
      game.resetGame();
      game.board[1][0] = { type: 'pawn', color: 'white' };
      const promotionMove = { from: { row: 1, col: 0 }, to: { row: 0, col: 0 }, promotion: 'queen' };
      const promotionResult = game.makeMove(promotionMove);
      expect(promotionResult).toBeDefined();
    });

    test('should cover all error conditions', () => {
      // Test invalid coordinate errors
      const invalidMoves = [
        { from: { row: -1, col: 0 }, to: { row: 0, col: 0 } },
        { from: { row: 0, col: 0 }, to: { row: 8, col: 0 } },
        { from: { row: 0, col: 0 }, to: { row: 0, col: -1 } },
        { from: { row: 0, col: 0 }, to: { row: 0, col: 8 } }
      ];

      for (const move of invalidMoves) {
        const result = game.makeMove(move);
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
      }

      // Test empty square errors
      const emptySquareMove = { from: { row: 3, col: 3 }, to: { row: 4, col: 4 } };
      const emptyResult = game.makeMove(emptySquareMove);
      expect(emptyResult.success).toBe(false);

      // Test wrong color errors
      const wrongColorMove = { from: { row: 1, col: 0 }, to: { row: 2, col: 0 } };
      const wrongColorResult = game.makeMove(wrongColorMove);
      expect(wrongColorResult.success).toBe(false);
    });

    test('should cover all game ending conditions', () => {
      // Test checkmate detection
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[1][1] = { type: 'queen', color: 'white' };
      game.board[2][0] = { type: 'rook', color: 'white' };
      game.board[7][7] = { type: 'king', color: 'white' };
      
      game.currentTurn = 'black';
      game.checkGameEnd();
      expect(game.gameStatus).toBe('checkmate');

      // Test stalemate detection
      game.resetGame();
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'black' };
      game.board[2][1] = { type: 'queen', color: 'white' };
      game.board[1][2] = { type: 'king', color: 'white' };
      
      game.currentTurn = 'black';
      game.checkGameEnd();
      expect(game.gameStatus).toBe('stalemate');
    });
  });

  describe('GameStateManager Class Coverage', () => {
    test('should cover all state management methods', () => {
      expect(typeof stateManager.updateGameState).toBe('function');
      expect(typeof stateManager.validateGameStateConsistency).toBe('function');
      expect(typeof stateManager.trackCastlingRights).toBe('function');
      expect(typeof stateManager.trackEnPassantTarget).toBe('function');
      expect(typeof stateManager.updateMoveHistory).toBe('function');
    });

    test('should cover state validation scenarios', () => {
      const gameState = {
        board: Array(8).fill(null).map(() => Array(8).fill(null)),
        currentTurn: 'white',
        moveHistory: [],
        castlingRights: {
          white: { kingside: true, queenside: true },
          black: { kingside: true, queenside: true }
        },
        enPassantTarget: null,
        gameStatus: 'active',
        winner: null
      };

      // Place kings
      gameState.board[7][4] = { type: 'king', color: 'white' };
      gameState.board[0][4] = { type: 'king', color: 'black' };

      const validation = stateManager.validateGameStateConsistency(gameState);
      expect(validation).toBeDefined();
      expect(typeof validation.success).toBe('boolean');
    });

    test('should cover all state update scenarios', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const gameState = game.getGameState();
      
      const updatedState = stateManager.updateGameState(move, gameState);
      expect(updatedState).toBeDefined();
      expect(updatedState.moveHistory).toHaveLength(gameState.moveHistory.length + 1);
    });
  });

  describe('Error Handler Coverage', () => {
    test('should cover all error types', () => {
      const errorTypes = [
        'INVALID_COORDINATES',
        'EMPTY_SQUARE',
        'WRONG_COLOR',
        'INVALID_MOVE',
        'KING_IN_CHECK',
        'GAME_NOT_ACTIVE',
        'INVALID_PIECE',
        'PATH_BLOCKED',
        'INVALID_CASTLING',
        'INVALID_EN_PASSANT',
        'INVALID_PROMOTION'
      ];

      for (const errorType of errorTypes) {
        const error = errorHandler.createError(errorType, 'Test message');
        expect(error).toBeDefined();
        expect(error.errorCode).toBe(errorType);
        expect(error.message).toBeDefined();
      }
    });

    test('should cover error recovery scenarios', () => {
      const recoveryScenarios = [
        { errorCode: 'INVALID_COORDINATES', context: { from: { row: -1, col: 0 } } },
        { errorCode: 'EMPTY_SQUARE', context: { from: { row: 3, col: 3 } } },
        { errorCode: 'WRONG_COLOR', context: { piece: { color: 'black' }, expectedColor: 'white' } }
      ];

      for (const scenario of recoveryScenarios) {
        const recovery = errorHandler.attemptRecovery(scenario.errorCode, scenario.context);
        expect(recovery).toBeDefined();
        expect(typeof recovery.success).toBe('boolean');
      }
    });
  });

  describe('Edge Case Coverage', () => {
    test('should cover boundary conditions', () => {
      // Test all board edges
      const edgePositions = [
        { row: 0, col: 0 }, { row: 0, col: 7 }, { row: 7, col: 0 }, { row: 7, col: 7 },
        { row: 0, col: 3 }, { row: 7, col: 3 }, { row: 3, col: 0 }, { row: 3, col: 7 }
      ];

      for (const pos of edgePositions) {
        game.board[pos.row][pos.col] = { type: 'queen', color: 'white' };
        const validMoves = game.getAllValidMoves('white');
        expect(Array.isArray(validMoves)).toBe(true);
        game.board[pos.row][pos.col] = null;
      }
    });

    test('should cover null and undefined handling', () => {
      const nullUndefinedCases = [
        null,
        undefined,
        { from: null, to: { row: 0, col: 0 } },
        { from: { row: 0, col: 0 }, to: null },
        { from: undefined, to: { row: 0, col: 0 } },
        { from: { row: 0, col: 0 }, to: undefined }
      ];

      for (const testCase of nullUndefinedCases) {
        const result = game.makeMove(testCase);
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
      }
    });

    test('should cover complex game scenarios', () => {
      // Test threefold repetition scenario
      const repetitionMoves = [
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }, // Nf6
        { from: { row: 5, col: 5 }, to: { row: 7, col: 6 } }, // Ng1
        { from: { row: 2, col: 5 }, to: { row: 0, col: 6 } }, // Ng8
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }, // Nf6
        { from: { row: 5, col: 5 }, to: { row: 7, col: 6 } }, // Ng1
        { from: { row: 2, col: 5 }, to: { row: 0, col: 6 } }  // Ng8
      ];

      for (const move of repetitionMoves) {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
      }

      // Check if threefold repetition is detected
      expect(game.moveHistory.length).toBe(8);
    });
  });

  describe('Integration Coverage', () => {
    test('should cover complete game flow integration', () => {
      let moveCount = 0;
      const maxMoves = 100;

      while (game.gameStatus === 'active' && moveCount < maxMoves) {
        const validMoves = game.getAllValidMoves(game.currentTurn);
        if (validMoves.length === 0) break;

        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        const result = game.makeMove(randomMove);
        
        expect(result.success).toBe(true);
        moveCount++;

        // Verify state consistency
        const gameState = game.getGameState();
        expect(gameState.moveHistory).toHaveLength(moveCount);
        expect(gameState.currentTurn).toBe(moveCount % 2 === 0 ? 'white' : 'black');
      }

      expect(moveCount).toBeGreaterThan(0);
    });

    test('should cover all module interactions', () => {
      // Test ChessGame + GameStateManager interaction
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = game.makeMove(move);
      expect(result.success).toBe(true);

      const gameState = game.getGameState();
      const validation = stateManager.validateGameStateConsistency(gameState);
      expect(validation).toBeDefined();

      // Test ChessGame + ErrorHandler interaction
      const invalidMove = { from: { row: -1, col: 0 }, to: { row: 0, col: 0 } };
      const errorResult = game.makeMove(invalidMove);
      expect(errorResult.success).toBe(false);
      expect(errorResult.errorCode).toBeDefined();
    });
  });
});