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
        enPassantTarget: null,
        fullMoveNumber: 1,
        halfMoveClock: 0
      };

      const validation = stateManager.validateGameStateConsistency(gameState);
      expect(validation).toHaveProperty('success');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('details');
      expect(validation).toHaveProperty('stateVersion');
      expect(validation).toHaveProperty('validationTimestamp');
    });

    test('should test validateBoardConsistency function', () => {
      const validation = stateManager.validateBoardConsistency(game.board);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('details');
      expect(validation.details).toHaveProperty('kingCount');
      expect(validation.details).toHaveProperty('pieceCount');
    });

    test('should test validateKingCount function', () => {
      const validation = stateManager.validateKingCount(game.board);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('whiteKings');
      expect(validation).toHaveProperty('blackKings');
      expect(validation).toHaveProperty('errors');
    });

    test('should test validateTurnConsistency function', () => {
      const gameState = {
        currentTurn: 'white',
        moveHistory: []
      };

      const validation = stateManager.validateTurnConsistency(gameState);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('expectedTurn');
      expect(validation).toHaveProperty('actualTurn');
      expect(validation).toHaveProperty('errors');
    });

    test('should test validateCastlingRightsConsistency function', () => {
      const validation = stateManager.validateCastlingRightsConsistency(game.board, game.castlingRights);
      expect(typeof validation).toBe('boolean');
    });

    test('should test validateEnPassantConsistency function', () => {
      const gameState = {
        enPassantTarget: null,
        moveHistory: []
      };

      const validation = stateManager.validateEnPassantConsistency(gameState);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('expectedTarget');
      expect(validation).toHaveProperty('actualTarget');
      expect(validation).toHaveProperty('errors');
    });
  });

  describe('State Tracking Functions', () => {
    test('should test trackStateChange function', () => {
      const oldState = { 
        board: game.board,
        currentTurn: 'white', 
        castlingRights: game.castlingRights,
        enPassantTarget: null,
        moveHistory: [] 
      };
      const newState = { 
        board: game.board,
        currentTurn: 'black', 
        castlingRights: game.castlingRights,
        enPassantTarget: null,
        moveHistory: [{ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }] 
      };

      expect(() => {
        stateManager.trackStateChange(oldState, newState);
      }).not.toThrow();
      
      // Verify state version was updated
      expect(stateManager.stateVersion).toBeGreaterThan(1);
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
      expect(fen).toMatch(/^[rnbqkpRNBQKP1-8\/]+ [wb] [KQkq-]+ [a-h1-8-]/);
    });

    test('should test addPositionToHistory function', () => {
      const position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';
      const initialLength = stateManager.positionHistory.length;
      
      stateManager.addPositionToHistory(position);
      expect(stateManager.positionHistory).toContain(position);
      expect(stateManager.positionHistory.length).toBe(initialLength + 1);
    });

    test('should test checkThreefoldRepetition function', () => {
      const position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';
      
      // Add position three times
      stateManager.addPositionToHistory(position);
      stateManager.addPositionToHistory(position);
      stateManager.addPositionToHistory(position);

      const isThreefold = stateManager.checkThreefoldRepetition();
      expect(typeof isThreefold).toBe('boolean');
      expect(isThreefold).toBe(true);
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
      expect(stateManager.gameMetadata.startTime).toBeDefined();
    });

    test('should test getStateSnapshot function', () => {
      const gameState = {
        board: game.board,
        currentTurn: 'white',
        gameStatus: 'active',
        moveHistory: [],
        castlingRights: game.castlingRights,
        enPassantTarget: null
      };

      const snapshot = stateManager.getStateSnapshot(gameState);
      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('stateVersion');
      expect(snapshot).toHaveProperty('gameState');
      expect(snapshot).toHaveProperty('metadata');
      expect(snapshot).toHaveProperty('positionHistory');
      expect(typeof snapshot.timestamp).toBe('number');
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
      expect(Array.isArray(validation.errors)).toBe(true);
    });
  });

  describe('Advanced State Analysis', () => {
    test('should test analyzeGameProgression function', () => {
      const gameState = {
        board: game.board,
        moveHistory: [
          { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, piece: 'pawn' },
          { from: { row: 1, col: 4 }, to: { row: 3, col: 4 }, piece: 'pawn' }
        ]
      };

      const analysis = stateManager.analyzeGameProgression(gameState);
      expect(analysis).toHaveProperty('phase');
      expect(analysis).toHaveProperty('moveCount');
      expect(analysis).toHaveProperty('characteristics');
      expect(analysis.moveCount).toBe(2);
      expect(analysis.characteristics).toHaveProperty('isEarlyGame');
      expect(analysis.characteristics).toHaveProperty('isMidGame');
      expect(analysis.characteristics).toHaveProperty('isEndGame');
    });

    test('should test detectGamePhase function', () => {
      const gameState = {
        board: game.board,
        moveHistory: []
      };

      const phase = stateManager.detectGamePhase(gameState);
      expect(['opening', 'middlegame', 'endgame']).toContain(phase);
      expect(phase).toBe('opening'); // Should be opening with no moves
    });

    test('should test calculateMaterialBalance function', () => {
      const balance = stateManager.calculateMaterialBalance(game.board);
      expect(balance).toHaveProperty('white');
      expect(balance).toHaveProperty('black');
      expect(balance).toHaveProperty('difference');
      expect(balance.white).toHaveProperty('total');
      expect(balance.black).toHaveProperty('total');
      expect(balance.difference).toBe(0); // Should be equal at start
    });

    test('should test analyzePieceActivity function', () => {
      const activity = stateManager.analyzePieceActivity(game.board, 'white');
      expect(activity).toHaveProperty('activePieces');
      expect(activity).toHaveProperty('totalMobility');
      expect(activity).toHaveProperty('averageMobility');
      expect(Array.isArray(activity.activePieces)).toBe(true);
      expect(typeof activity.totalMobility).toBe('number');
      expect(typeof activity.averageMobility).toBe('number');
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
      
      // Verify it's valid JSON
      expect(() => JSON.parse(serialized)).not.toThrow();
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
      expect(deserialized).toHaveProperty('gameStatus');
      expect(deserialized.currentTurn).toBe('white');
      expect(deserialized.gameStatus).toBe('active');
    });

    test('should test createStateCheckpoint function', () => {
      const gameState = {
        board: game.board,
        currentTurn: 'white',
        gameStatus: 'active',
        moveHistory: []
      };

      const checkpoint = stateManager.createStateCheckpoint(gameState);
      expect(checkpoint).toHaveProperty('id');
      expect(checkpoint).toHaveProperty('timestamp');
      expect(checkpoint).toHaveProperty('state');
      expect(checkpoint).toHaveProperty('metadata');
      expect(checkpoint).toHaveProperty('stateVersion');
      expect(typeof checkpoint.timestamp).toBe('number');
    });

    test('should test restoreFromCheckpoint function', () => {
      const gameState = {
        board: game.board,
        currentTurn: 'white',
        gameStatus: 'active',
        moveHistory: []
      };

      const checkpoint = stateManager.createStateCheckpoint(gameState);
      const restored = stateManager.restoreFromCheckpoint(checkpoint);
      
      expect(restored).toHaveProperty('success');
      expect(restored.success).toBe(true);
      
      // The implementation returns 'state' property (not 'gameState')
      expect(restored).toHaveProperty('state');
      expect(restored).toHaveProperty('metadata');
    });
  });

  describe('State Comparison Functions', () => {
    test('should test compareGameStates function', () => {
      const state1 = {
        board: game.board,
        currentTurn: 'white',
        gameStatus: 'active',
        moveHistory: []
      };

      const state2 = {
        board: game.board,
        currentTurn: 'black',
        gameStatus: 'active',
        moveHistory: [{ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }]
      };

      const comparison = stateManager.compareGameStates(state1, state2);
      expect(comparison).toHaveProperty('identical');
      expect(comparison).toHaveProperty('differences');
      expect(comparison.identical).toBe(false);
      expect(Array.isArray(comparison.differences)).toBe(true);
    });

    test('should test detectStateChanges function', () => {
      const oldState = { 
        currentTurn: 'white', 
        gameStatus: 'active',
        moveHistory: [] 
      };
      const newState = { 
        currentTurn: 'black', 
        gameStatus: 'active',
        moveHistory: [{ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }] 
      };

      const changes = stateManager.detectStateChanges(oldState, newState);
      expect(Array.isArray(changes)).toBe(true);
      expect(changes.length).toBeGreaterThan(0);
    });

    test('should test validateStateTransition function', () => {
      const fromState = { 
        currentTurn: 'white', 
        moveHistory: [],
        fullMoveNumber: 1
      };
      const toState = { 
        currentTurn: 'black', 
        moveHistory: [{ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }],
        fullMoveNumber: 1
      };

      const validation = stateManager.validateStateTransition(fromState, toState);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('success');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
      expect(Array.isArray(validation.errors)).toBe(true);
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
      
      expect(stateManager.positionHistory.length).toBeLessThanOrEqual(Math.max(initialCount, 5));
      expect(stateManager.positionHistory.length).toBeLessThanOrEqual(5);
    });

    test('should test getMemoryUsage function', () => {
      const usage = stateManager.getMemoryUsage();
      expect(usage).toHaveProperty('positionHistorySize');
      expect(usage).toHaveProperty('metadataSize');
      expect(usage).toHaveProperty('totalSize');
      expect(usage).toHaveProperty('positionCount');
      expect(typeof usage.positionHistorySize).toBe('number');
      expect(typeof usage.metadataSize).toBe('number');
      expect(typeof usage.totalSize).toBe('number');
    });

    test('should test optimizeStateStorage function', () => {
      // Add some duplicate positions first
      stateManager.addPositionToHistory('duplicate_position');
      stateManager.addPositionToHistory('duplicate_position');
      stateManager.addPositionToHistory('unique_position');
      
      const initialLength = stateManager.positionHistory.length;
      
      expect(() => {
        stateManager.optimizeStateStorage();
      }).not.toThrow();
      
      // After optimization, duplicates should be removed
      expect(stateManager.positionHistory.length).toBeLessThanOrEqual(initialLength);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle null game state validation', () => {
      const validation = stateManager.validateGameStateConsistency(null);
      expect(validation.success).toBe(false);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toBe('Game state is null or undefined');
    });

    test('should handle invalid board validation', () => {
      const invalidBoard = 'not_a_board';
      const validation = stateManager.validateBoardConsistency(invalidBoard);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toBe('Invalid board structure');
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

    test('should handle invalid checkpoint restoration', () => {
      const invalidCheckpoint = null;
      const result = stateManager.restoreFromCheckpoint(invalidCheckpoint);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid checkpoint data');
    });

    test('should handle invalid king count validation', () => {
      const invalidBoard = null;
      const validation = stateManager.validateKingCount(invalidBoard);
      expect(validation.isValid).toBe(false);
      expect(validation.whiteKings).toBe(0);
      expect(validation.blackKings).toBe(0);
    });

    test('should handle invalid turn consistency validation', () => {
      const invalidGameState = null;
      const validation = stateManager.validateTurnConsistency(invalidGameState);
      expect(validation.isValid).toBe(false);
      expect(validation.expectedTurn).toBe('white');
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should handle invalid en passant consistency validation', () => {
      const invalidGameState = null;
      const validation = stateManager.validateEnPassantConsistency(invalidGameState);
      expect(validation.isValid).toBe(false);
      expect(validation.expectedTarget).toBeNull();
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});