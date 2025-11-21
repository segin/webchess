/**
 * GameState Coverage Boost Tests
 * Focused tests to achieve 95%+ coverage on gameState.js
 */

const GameStateManager = require('../src/shared/gameState');
const ChessGame = require('../src/shared/chessGame');

describe('GameState Coverage Boost', () => {
  let stateManager;
  let game;

  beforeEach(() => {
    game = new ChessGame();
    stateManager = game.stateManager;
  });

  describe('FEN Position Generation', () => {
    test('should generate FEN position with all piece types', () => {
      const fen = stateManager.getFENPosition(
        game.board,
        'white',
        game.castlingRights,
        null
      );
      
      expect(fen).toContain('rnbqkbnr');
      expect(fen).toContain('RNBQKBNR');
      expect(fen).toContain(' w ');
      expect(fen).toContain('KQkq');
    });

    test('should handle en passant target in FEN', () => {
      const enPassantTarget = { row: 2, col: 4 };
      const fen = stateManager.getFENPosition(
        game.board,
        'black',
        game.castlingRights,
        enPassantTarget
      );
      
      expect(fen).toContain(' e6');
    });

    test('should handle no castling rights', () => {
      const noCastling = {
        white: { kingside: false, queenside: false },
        black: { kingside: false, queenside: false }
      };
      const fen = stateManager.getFENPosition(
        game.board,
        'white',
        noCastling,
        null
      );
      
      expect(fen).toContain(' -');
    });

    test('should handle partial castling rights', () => {
      const partialCastling = {
        white: { kingside: true, queenside: false },
        black: { kingside: false, queenside: true }
      };
      const fen = stateManager.getFENPosition(
        game.board,
        'white',
        partialCastling,
        null
      );
      
      expect(fen).toContain('Kq');
    });
  });

  describe('Turn Sequence Validation', () => {
    test('should validate correct turn sequence', () => {
      const result = stateManager.validateTurnSequence('white', 'white', []);
      expect(result.success).toBe(true);
    });

    test('should detect turn sequence mismatch', () => {
      const result = stateManager.validateTurnSequence('black', 'white', []);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Turn sequence mismatch');
    });

    test('should validate turn based on move history length', () => {
      const moveHistory = [{ piece: 'pawn', color: 'white' }];
      const result = stateManager.validateTurnSequence('black', 'black', moveHistory);
      expect(result.success).toBe(true);
    });
  });

  describe('State Transition Tracking', () => {
    test('should track state transitions', () => {
      const oldState = game.getGameState();
      game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      const newState = game.getGameState();
      
      stateManager.trackStateTransition(oldState, newState);
      expect(stateManager.stateVersion).toBeGreaterThan(1);
    });

    test('should handle null states in transition tracking', () => {
      expect(() => {
        stateManager.trackStateTransition(null, null);
      }).not.toThrow();
    });

    test('should update position history on transition', () => {
      const oldState = game.getGameState();
      game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      const newState = game.getGameState();
      
      const initialLength = stateManager.positionHistory.length;
      stateManager.trackStateTransition(oldState, newState);
      expect(stateManager.positionHistory.length).toBeGreaterThan(initialLength);
    });
  });

  describe('Position History Management', () => {
    test('should add position to history', () => {
      const position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';
      stateManager.addPositionToHistory(position);
      expect(stateManager.positionHistory).toContain(position);
    });

    test('should limit position history size', () => {
      for (let i = 0; i < 200; i++) {
        stateManager.addPositionToHistory(`position_${i}`);
      }
      expect(stateManager.positionHistory.length).toBeLessThanOrEqual(150);
    });
  });

  describe('Threefold Repetition Detection', () => {
    test('should detect threefold repetition', () => {
      const position = 'test_position';
      stateManager.addPositionToHistory(position);
      stateManager.addPositionToHistory(position);
      stateManager.addPositionToHistory(position);
      
      const result = stateManager.checkThreefoldRepetition();
      expect(result).toBe(true);
    });

    test('should not detect repetition with less than 3 occurrences', () => {
      stateManager.addPositionToHistory('pos1');
      stateManager.addPositionToHistory('pos2');
      stateManager.addPositionToHistory('pos1');
      
      const result = stateManager.checkThreefoldRepetition();
      expect(result).toBe(false);
    });
  });

  describe('State Version Management', () => {
    test('should update state version', () => {
      const initialVersion = stateManager.stateVersion;
      stateManager.updateStateVersion();
      expect(stateManager.stateVersion).toBe(initialVersion + 1);
    });
  });

  describe('Game Metadata', () => {
    test('should have valid game metadata', () => {
      expect(stateManager.gameMetadata.startTime).toBeDefined();
      expect(stateManager.gameMetadata.lastMoveTime).toBeDefined();
      expect(stateManager.gameMetadata.totalMoves).toBe(0);
      expect(stateManager.gameMetadata.gameId).toBeDefined();
      expect(stateManager.gameMetadata.version).toBe('1.0.0');
    });

    test('should generate unique game IDs', () => {
      const id1 = stateManager.generateGameId();
      const id2 = stateManager.generateGameId();
      expect(id1).not.toBe(id2);
      expect(id1).toContain('game_');
    });
  });

  describe('State Validation', () => {
    test('should validate board consistency', () => {
      const result = stateManager.validateBoardConsistency(game.board);
      expect(result.success).toBe(true);
    });

    test('should detect invalid board structure', () => {
      const result = stateManager.validateBoardConsistency(null);
      expect(result.success).toBe(false);
    });

    test('should validate castling rights structure', () => {
      const result = stateManager.validateCastlingRights(game.castlingRights);
      expect(result.success).toBe(true);
    });

    test('should detect invalid castling rights', () => {
      const result = stateManager.validateCastlingRights(null);
      expect(result.success).toBe(false);
    });

    test('should validate move history', () => {
      const result = stateManager.validateMoveHistory();
      expect(result.success).toBe(true);
    });

    test('should detect invalid move history', () => {
      stateManager.moveHistory = null;
      const result = stateManager.validateMoveHistory();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid move history');
    });

    test('should validate king count', () => {
      const result = stateManager.validateKingCount(game.board);
      expect(result.success).toBe(true);
    });

    test('should validate game state consistency', () => {
      const state = game.getGameState();
      const result = stateManager.validateGameStateConsistency(state);
      expect(result.success).toBe(true);
    });
  });

  describe('Move History Validation', () => {
    test('should validate move history', () => {
      game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      const result = stateManager.validateMoveHistory(game.moveHistory);
      expect(result.success).toBe(true);
    });

    test('should detect invalid move in history', () => {
      const invalidHistory = [null, { from: {}, to: {} }];
      const result = stateManager.validateMoveHistory(invalidHistory);
      expect(result.success).toBe(false);
    });
  });

  describe('State Checkpoints', () => {
    test('should create state checkpoint', () => {
      const state = game.getGameState();
      const checkpoint = stateManager.createStateCheckpoint(state);
      expect(checkpoint).toBeDefined();
    });

    test('should restore from checkpoint', () => {
      const state = game.getGameState();
      const checkpoint = stateManager.createStateCheckpoint(state);
      const result = stateManager.restoreFromCheckpoint(checkpoint);
      expect(result.success).toBe(true);
    });

    test('should handle invalid checkpoint', () => {
      const result = stateManager.restoreFromCheckpoint(null);
      expect(result.success).toBe(false);
    });

    test('should get state snapshot', () => {
      const snapshot = stateManager.getStateSnapshot(game.getGameState());
      expect(snapshot).toBeDefined();
    });

    test('should validate state snapshot', () => {
      const snapshot = stateManager.getStateSnapshot(game.getGameState());
      const result = stateManager.validateStateSnapshot(snapshot);
      expect(result.success).toBe(true);
    });
  });

  describe('En Passant Target Validation', () => {
    test('should validate valid en passant target', () => {
      const target = { row: 2, col: 4 };
      const result = stateManager.validateEnPassantTarget(target);
      expect(result.success).toBe(true);
    });

    test('should validate null en passant target', () => {
      const result = stateManager.validateEnPassantTarget(null);
      expect(result.success).toBe(true);
    });

    test('should detect invalid en passant coordinates', () => {
      const target = { row: -1, col: 10 };
      const result = stateManager.validateEnPassantTarget(target);
      expect(result.success).toBe(false);
    });
  });

  describe('Current Turn Validation', () => {
    test('should validate valid turn', () => {
      const result = stateManager.validateCurrentTurn('white');
      expect(result.success).toBe(true);
    });

    test('should detect invalid turn value', () => {
      const result = stateManager.validateCurrentTurn('invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('Game Status Validation', () => {
    test('should validate active status', () => {
      const result = stateManager.validateGameStatus('active');
      expect(result.success).toBe(true);
    });

    test('should validate check status', () => {
      const result = stateManager.validateGameStatus('check');
      expect(result.success).toBe(true);
    });

    test('should detect invalid status', () => {
      const result = stateManager.validateGameStatus('invalid');
      expect(result.success).toBe(false);
    });
  });
});


  describe('Material Balance Calculation', () => {
    test('should calculate material balance', () => {
      const balance = stateManager.calculateMaterialBalance(game.board);
      expect(balance).toBeDefined();
      expect(balance.white).toBeDefined();
      expect(balance.black).toBeDefined();
    });
  });

  describe('Piece Mobility Analysis', () => {
    test('should calculate piece mobility', () => {
      const mobility = stateManager.calculatePieceMobility(game.board, 'white');
      expect(mobility).toBeDefined();
    });
  });

  describe('Game Phase Detection', () => {
    test('should detect opening phase', () => {
      const phase = stateManager.detectGamePhase(game.board, game.moveHistory);
      expect(phase).toBeDefined();
    });
  });

  describe('Position Complexity Analysis', () => {
    test('should analyze position complexity', () => {
      const complexity = stateManager.analyzePositionComplexity(game.board);
      expect(complexity).toBeDefined();
    });
  });

  describe('Piece Activity Analysis', () => {
    test('should analyze piece activity', () => {
      const activity = stateManager.analyzePieceActivity(game.board, game.moveHistory);
      expect(activity).toBeDefined();
    });
  });

  describe('Game Progression Analysis', () => {
    test('should analyze game progression', () => {
      const progression = stateManager.analyzeGameProgression(game.moveHistory);
      expect(progression).toBeDefined();
    });
  });

  describe('State Serialization', () => {
    test('should serialize game state', () => {
      const state = game.getGameState();
      const serialized = stateManager.serializeGameState(state);
      expect(serialized).toBeDefined();
      expect(typeof serialized).toBe('string');
    });

    test('should deserialize game state', () => {
      const state = game.getGameState();
      const serialized = stateManager.serializeGameState(state);
      const deserialized = stateManager.deserializeGameState(serialized);
      expect(deserialized).toBeDefined();
    });

    test('should handle invalid JSON in deserialize', () => {
      const result = stateManager.deserializeGameState('invalid json {{{');
      expect(result).toBe(null);
    });

    test('should handle checkpoint with invalid state', () => {
      const badCheckpoint = {
        id: 'test',
        timestamp: Date.now(),
        state: 'invalid json',
        metadata: {}
      };
      const result = stateManager.restoreFromCheckpoint(badCheckpoint);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to deserialize checkpoint state');
    });
  });

  describe('State Change Detection', () => {
    test('should detect state changes', () => {
      const oldState = game.getGameState();
      game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      const newState = game.getGameState();
      
      const changes = stateManager.detectStateChanges(oldState, newState);
      expect(changes).toBeDefined();
    });

    test('should track state change', () => {
      const oldState = game.getGameState();
      game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      const newState = game.getGameState();
      
      expect(() => {
        stateManager.trackStateChange(oldState, newState);
      }).not.toThrow();
    });
  });

  describe('State Comparison', () => {
    test('should compare game states', () => {
      const state1 = game.getGameState();
      const state2 = game.getGameState();
      
      const comparison = stateManager.compareGameStates(state1, state2);
      expect(comparison).toBeDefined();
    });
  });

  describe('Metadata Management', () => {
    test('should update game metadata', () => {
      const metadata = { totalMoves: 5, lastMoveTime: Date.now() };
      stateManager.updateGameMetadata(metadata);
      expect(stateManager.gameMetadata.totalMoves).toBe(5);
    });
  });

  describe('Memory Management', () => {
    test('should get memory usage', () => {
      const usage = stateManager.getMemoryUsage();
      expect(usage).toBeDefined();
    });

    test('should optimize state storage', () => {
      expect(() => {
        stateManager.optimizeStateStorage();
      }).not.toThrow();
    });

    test('should cleanup old states', () => {
      expect(() => {
        stateManager.cleanupOldStates();
      }).not.toThrow();
    });
  });

  describe('Consistency Validation', () => {
    test('should validate turn consistency', () => {
      const result = stateManager.validateTurnConsistency('white', game.moveHistory);
      expect(result.success).toBe(true);
    });

    test('should validate castling rights consistency', () => {
      const result = stateManager.validateCastlingRightsConsistency(
        game.castlingRights,
        game.moveHistory
      );
      expect(result.success).toBe(true);
    });

    test('should validate en passant consistency', () => {
      const result = stateManager.validateEnPassantConsistency(
        null,
        game.moveHistory
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Move Addition', () => {
    test('should add move to history', () => {
      const moveData = {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 },
        piece: 'pawn',
        color: 'white'
      };
      
      const result = stateManager.addMoveToHistory(
        game.moveHistory,
        moveData,
        1,
        game.getGameState()
      );
      expect(result.success).toBe(true);
    });

    test('should add move with validation', () => {
      const moveData = {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 }
      };
      
      const result = stateManager.addMove(moveData, game.getGameState());
      expect(result).toBeDefined();
    });
  });

  describe('Basic Move Validation', () => {
    test('should validate basic move', () => {
      const move = {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 }
      };
      
      const result = stateManager.isBasicMoveValid(move, game.board);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('State Transition Validation', () => {
    test('should validate state transition', () => {
      const oldState = game.getGameState();
      game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      const newState = game.getGameState();
      
      const result = stateManager.validateStateTransition(oldState, newState);
      expect(result.success).toBe(true);
    });
  });
