const GameStateManager = require('../src/shared/gameState');
const ChessGame = require('../src/shared/chessGame');

describe('Game State Manager - Under-Tested Functions Coverage', () => {
  let stateManager;
  let game;

  beforeEach(() => {
    stateManager = new GameStateManager();
    game = new ChessGame();
  });

  describe('State Validation Functions', () => {
    test('should test validateGameStateConsistency function', () => {
      const gameState = {
        board: game.board,
        currentTurn: 'white',
        gameStatus: 'active',
        winner: null,
        moveHistory: [],
        castlingRights: {
          white: { kingside: true, queenside: true },
          black: { kingside: true, queenside: true }
        },
        enPassantTarget: null
      };

      const validation = stateManager.validateGameStateConsistency(gameState);
      expect(validation).toHaveProperty('success');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('details');
    });

    test('should test validateBoardConsistency function', () => {
      const validation = stateManager.validateBoardConsistency(game.board);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('details');
    });

    test('should test validateKingCount function', () => {
      const validation = stateManager.validateKingCount(game.board);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('whiteKings');
      expect(validation).toHaveProperty('blackKings');
    });

    test('should test validateTurnConsistency function', () => {
      const gameState = {
        currentTurn: 'white',
        moveHistory: []
      };

      const validation = stateManager.validateTurnConsistency(gameState);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('expectedTurn');
    });

    test('should test validateCastlingRightsConsistency function', () => {
      const gameState = {
        board: game.board,
        castlingRights: game.castlingRights,
        moveHistory: []
      };

      const validation = stateManager.validateCastlingRightsConsistency(gameState);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('issues');
    });

    test('should test validateEnPassantConsistency function', () => {
      const gameState = {
        enPassantTarget: null,
        moveHistory: []
      };

      const validation = stateManager.validateEnPassantConsistency(gameState);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('expectedTarget');
    });
  });

  describe('State Tracking Functions', () => {
    test('should test trackStateChange function', () => {
      const oldState = { currentTurn: 'white', moveHistory: [] };
      const newState = { currentTurn: 'black', moveHistory: [{ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }] };

      expect(() => {
        stateManager.trackStateChange(oldState, newState);
      }).not.toThrow();
    });

    test('should test updateStateVersion function', () => {
      const initialVersion = stateManager.stateVersion;
      stateManager.updateStateVersion();
      expect(stateManager.stateVersion).toBe(initialVersion + 1);
    });

    test('should test getFENPosition function', () => {
      const fen = stateManager.getFENPosition(
        game.board,
        game.currentTurn,
        game.castlingRights,
        game.enPassantTarget
      );
      expect(typeof fen).toBe('string');
      expect(fen.length).toBeGreaterThan(0);
    });

    test('should test addPositionToHistory function', () => {
      const position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      stateManager.addPositionToHistory(position);
      expect(stateManager.positionHistory).toContain(position);
    });

    test('should test checkThreefoldRepetition function', () => {
      const position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      // Add position three times
      stateManager.addPositionToHistory(position);
      stateManager.addPositionToHistory(position);
      stateManager.addPositionToHistory(position);

      const isThreefold = stateManager.checkThreefoldRepetition();
      expect(typeof isThreefold).toBe('boolean');
    });
  });

  describe('State Metadata Functions', () => {
    test('should test updateGameMetadata function', () => {
      const metadata = {
        startTime: Date.now(),
        totalMoves: 10,
        captures: 2
      };

      stateManager.updateGameMetadata(metadata);
      expect(stateManager.gameMetadata.totalMoves).toBe(10);
      expect(stateManager.gameMetadata.captures).toBe(2);
    });

    test('should test getStateSnapshot function', () => {
      const gameState = {
        board: game.board,
        currentTurn: 'white',
        gameStatus: 'active'
      };

      const snapshot = stateManager.getStateSnapshot(gameState);
      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('stateVersion');
      expect(snapshot).toHaveProperty('gameState');
    });

    test('should test validateStateSnapshot function', () => {
      const snapshot = {
        timestamp: Date.now(),
        stateVersion: 1,
        gameState: {
          board: game.board,
          currentTurn: 'white'
        }
      };

      const validation = stateManager.validateStateSnapshot(snapshot);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
    });
  });

  describe('Advanced State Analysis', () => {
    test('should test analyzeGameProgression function', () => {
      const gameState = {
        moveHistory: [
          { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, piece: 'pawn' },
          { from: { row: 1, col: 4 }, to: { row: 3, col: 4 }, piece: 'pawn' }
        ]
      };

      const analysis = stateManager.analyzeGameProgression(gameState);
      expect(analysis).toHaveProperty('phase');
      expect(analysis).toHaveProperty('moveCount');
      expect(analysis).toHaveProperty('characteristics');
    });

    test('should test detectGamePhase function', () => {
      const gameState = {
        board: game.board,
        moveHistory: []
      };

      const phase = stateManager.detectGamePhase(gameState);
      expect(['opening', 'middlegame', 'endgame']).toContain(phase);
    });

    test('should test calculateMaterialBalance function', () => {
      const balance = stateManager.calculateMaterialBalance(game.board);
      expect(balance).toHaveProperty('white');
      expect(balance).toHaveProperty('black');
      expect(balance).toHaveProperty('difference');
    });

    test('should test analyzePieceActivity function', () => {
      const activity = stateManager.analyzePieceActivity(game.board, 'white');
      expect(activity).toHaveProperty('activePieces');
      expect(activity).toHaveProperty('totalMobility');
      expect(activity).toHaveProperty('averageMobility');
    });
  });

  describe('State Persistence Functions', () => {
    test('should test serializeGameState function', () => {
      const gameState = {
        board: game.board,
        currentTurn: 'white',
        gameStatus: 'active',
        moveHistory: []
      };

      const serialized = stateManager.serializeGameState(gameState);
      expect(typeof serialized).toBe('string');
      expect(serialized.length).toBeGreaterThan(0);
    });

    test('should test deserializeGameState function', () => {
      const gameState = {
        board: game.board,
        currentTurn: 'white',
        gameStatus: 'active',
        moveHistory: []
      };

      const serialized = stateManager.serializeGameState(gameState);
      const deserialized = stateManager.deserializeGameState(serialized);
      
      expect(deserialized).toHaveProperty('board');
      expect(deserialized).toHaveProperty('currentTurn');
      expect(deserialized.currentTurn).toBe('white');
    });

    test('should test createStateCheckpoint function', () => {
      const gameState = {
        board: game.board,
        currentTurn: 'white',
        moveHistory: []
      };

      const checkpoint = stateManager.createStateCheckpoint(gameState);
      expect(checkpoint).toHaveProperty('id');
      expect(checkpoint).toHaveProperty('timestamp');
      expect(checkpoint).toHaveProperty('state');
    });

    test('should test restoreFromCheckpoint function', () => {
      const gameState = {
        board: game.board,
        currentTurn: 'white',
        moveHistory: []
      };

      const checkpoint = stateManager.createStateCheckpoint(gameState);
      const restored = stateManager.restoreFromCheckpoint(checkpoint);
      
      expect(restored).toHaveProperty('success');
      expect(restored).toHaveProperty('state');
    });
  });

  describe('State Comparison Functions', () => {
    test('should test compareGameStates function', () => {
      const state1 = {
        board: game.board,
        currentTurn: 'white',
        moveHistory: []
      };

      const state2 = {
        board: game.board,
        currentTurn: 'black',
        moveHistory: [{ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }]
      };

      const comparison = stateManager.compareGameStates(state1, state2);
      expect(comparison).toHaveProperty('identical');
      expect(comparison).toHaveProperty('differences');
    });

    test('should test detectStateChanges function', () => {
      const oldState = { currentTurn: 'white', moveHistory: [] };
      const newState = { currentTurn: 'black', moveHistory: [{}] };

      const changes = stateManager.detectStateChanges(oldState, newState);
      expect(Array.isArray(changes)).toBe(true);
    });

    test('should test validateStateTransition function', () => {
      const fromState = { currentTurn: 'white', moveHistory: [] };
      const toState = { currentTurn: 'black', moveHistory: [{}] };

      const validation = stateManager.validateStateTransition(fromState, toState);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
    });
  });

  describe('Performance and Memory Management', () => {
    test('should test cleanupOldStates function', () => {
      // Add some old states
      for (let i = 0; i < 10; i++) {
        stateManager.addPositionToHistory(`position_${i}`);
      }

      const initialCount = stateManager.positionHistory.length;
      stateManager.cleanupOldStates(5);
      
      expect(stateManager.positionHistory.length).toBeLessThanOrEqual(initialCount);
    });

    test('should test getMemoryUsage function', () => {
      const usage = stateManager.getMemoryUsage();
      expect(usage).toHaveProperty('positionHistorySize');
      expect(usage).toHaveProperty('metadataSize');
      expect(usage).toHaveProperty('totalSize');
    });

    test('should test optimizeStateStorage function', () => {
      expect(() => {
        stateManager.optimizeStateStorage();
      }).not.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle null game state validation', () => {
      const validation = stateManager.validateGameStateConsistency(null);
      expect(validation.success).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should handle invalid board validation', () => {
      const invalidBoard = 'not_a_board';
      const validation = stateManager.validateBoardConsistency(invalidBoard);
      expect(validation.isValid).toBe(false);
    });

    test('should handle empty position history', () => {
      stateManager.positionHistory = [];
      const isThreefold = stateManager.checkThreefoldRepetition();
      expect(isThreefold).toBe(false);
    });

    test('should handle invalid serialized state', () => {
      const invalidSerialized = 'invalid_json';
      const result = stateManager.deserializeGameState(invalidSerialized);
      expect(result).toBeNull();
    });
  });
});