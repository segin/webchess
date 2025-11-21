/**
 * Complete GameState Coverage Tests
 * Target: 100% coverage for GameStateManager
 */

const GameStateManager = require('../src/shared/gameState');
const ChessGame = require('../src/shared/chessGame');

describe('GameStateManager - Complete Coverage', () => {
  let manager;
  let game;

  beforeEach(() => {
    manager = new GameStateManager();
    game = new ChessGame();
  });

  describe('Position Tracking', () => {
    test('getFENPosition generates correct FEN string', () => {
      const state = game.getGameState();
      const fen = manager.getFENPosition(
        state.board,
        state.currentTurn,
        state.castlingRights,
        state.enPassantTarget
      );
      expect(fen).toContain('w');
      expect(fen).toContain('KQkq');
    });

    test('addPositionToHistory tracks positions', () => {
      const fen = 'test-fen-1';
      manager.addPositionToHistory(fen);
      expect(manager.positionHistory).toContain(fen);
    });

    test('getPositionFrequency counts occurrences', () => {
      const fen = 'test-fen-2';
      manager.addPositionToHistory(fen);
      manager.addPositionToHistory(fen);
      manager.addPositionToHistory(fen);
      
      const freq = manager.getPositionFrequency(fen);
      expect(freq).toBe(3);
    });

    test('isThreefoldRepetition detects repetition', () => {
      const fen = 'test-fen-3';
      manager.addPositionToHistory(fen);
      manager.addPositionToHistory(fen);
      expect(manager.isThreefoldRepetition()).toBe(false);
      
      manager.addPositionToHistory(fen);
      expect(manager.isThreefoldRepetition()).toBe(true);
    });
  });

  describe('State Validation', () => {
    test('validateGameState with valid state', () => {
      const state = game.getGameState();
      const result = manager.validateGameState(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('validateGameState detects missing board', () => {
      const invalidState = {
        currentTurn: 'white',
        gameStatus: 'active',
        winner: null,
        moveHistory: [],
        castlingRights: {},
        enPassantTarget: null,
        inCheck: false
      };
      
      const result = manager.validateGameState(invalidState);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('board'))).toBe(true);
    });

    test('validateGameState detects invalid currentTurn', () => {
      const state = game.getGameState();
      state.currentTurn = 'red';
      
      const result = manager.validateGameState(state);
      expect(result.isValid).toBe(false);
    });

    test('validateGameState detects invalid gameStatus', () => {
      const state = game.getGameState();
      state.gameStatus = 'invalid';
      
      const result = manager.validateGameState(state);
      expect(result.isValid).toBe(false);
    });

    test('validateGameState detects checkmate without winner', () => {
      const state = game.getGameState();
      state.gameStatus = 'checkmate';
      state.winner = null;
      
      const result = manager.validateGameState(state);
      expect(result.isValid).toBe(false);
    });

    test('validateGameState detects stalemate with winner', () => {
      const state = game.getGameState();
      state.gameStatus = 'stalemate';
      state.winner = 'white';
      
      const result = manager.validateGameState(state);
      expect(result.isValid).toBe(false);
    });

    test('validateGameState detects invalid piece color', () => {
      const state = game.getGameState();
      state.board[4][4] = { type: 'pawn', color: 'red' };
      
      const result = manager.validateGameState(state);
      expect(result.isValid).toBe(false);
    });

    test('validateGameState detects invalid piece type', () => {
      const state = game.getGameState();
      state.board[4][4] = { type: 'dragon', color: 'white' };
      
      const result = manager.validateGameState(state);
      expect(result.isValid).toBe(false);
    });
  });

  describe('State Snapshots', () => {
    test('createStateSnapshot creates valid snapshot', () => {
      const state = game.getGameState();
      const snapshot = manager.createStateSnapshot(state);
      
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.stateVersion).toBe(manager.stateVersion);
      expect(snapshot.gameState).toEqual(state);
    });

    test('validateStateSnapshot validates correct snapshot', () => {
      const snapshot = {
        timestamp: Date.now(),
        stateVersion: 1,
        gameState: game.getGameState()
      };
      
      const result = manager.validateStateSnapshot(snapshot);
      expect(result.isValid).toBe(true);
    });

    test('validateStateSnapshot detects null snapshot', () => {
      const result = manager.validateStateSnapshot(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Snapshot is null or undefined');
    });

    test('validateStateSnapshot detects invalid timestamp', () => {
      const snapshot = {
        timestamp: 'invalid',
        stateVersion: 1,
        gameState: {}
      };
      
      const result = manager.validateStateSnapshot(snapshot);
      expect(result.isValid).toBe(false);
    });

    test('validateStateSnapshot detects missing game state', () => {
      const snapshot = {
        timestamp: Date.now(),
        stateVersion: 1
      };
      
      const result = manager.validateStateSnapshot(snapshot);
      expect(result.isValid).toBe(false);
    });
  });

  describe('State Comparison', () => {
    test('compareStates detects changes', () => {
      const state1 = game.getGameState();
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      const state2 = game.getGameState();
      
      const comparison = manager.compareStates(state1, state2);
      expect(comparison.hasChanges).toBe(true);
      expect(comparison.changes).toBeDefined();
    });

    test('compareStates detects no changes', () => {
      const state1 = game.getGameState();
      const state2 = game.getGameState();
      
      const comparison = manager.compareStates(state1, state2);
      expect(comparison.hasChanges).toBe(false);
    });
  });

  describe('Game Progression Analysis', () => {
    test('analyzeGameProgression detects opening', () => {
      const analysis = manager.analyzeGameProgression(game.getGameState());
      expect(analysis.phase).toBe('opening');
      expect(analysis.characteristics.isEarlyGame).toBe(true);
    });

    test('analyzeGameProgression detects endgame', () => {
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[7][7] = { type: 'king', color: 'black' };
      game.moveHistory = new Array(65).fill({});
      
      const analysis = manager.analyzeGameProgression(game.getGameState());
      expect(analysis.phase).toBe('endgame');
    });

    test('detectGamePhase returns correct phase', () => {
      const phase = manager.detectGamePhase(game.getGameState());
      expect(['opening', 'middlegame', 'endgame']).toContain(phase);
    });
  });

  describe('Material Balance', () => {
    test('calculateMaterialBalance with starting position', () => {
      const balance = manager.calculateMaterialBalance(game.board);
      expect(balance.white.total).toBe(balance.black.total);
      expect(balance.difference).toBe(0);
    });

    test('calculateMaterialBalance with non-array board', () => {
      const balance = manager.calculateMaterialBalance(null);
      expect(balance.difference).toBe(0);
    });

    test('calculateMaterialBalance with non-array rows', () => {
      const invalidBoard = [null, null, null, null, null, null, null, null];
      const balance = manager.calculateMaterialBalance(invalidBoard);
      expect(balance).toBeDefined();
    });
  });

  describe('Piece Activity Analysis', () => {
    test('analyzePieceActivity with valid board', () => {
      const activity = manager.analyzePieceActivity(game.board, 'white');
      expect(activity.activePieces.length).toBeGreaterThan(0);
      expect(activity.totalMobility).toBeGreaterThanOrEqual(0);
    });

    test('analyzePieceActivity with non-array board', () => {
      const activity = manager.analyzePieceActivity(null, 'white');
      expect(activity.activePieces).toEqual([]);
      expect(activity.totalMobility).toBe(0);
    });

    test('analyzePieceActivity with non-array rows', () => {
      const invalidBoard = [null, null, null, null, null, null, null, null];
      const activity = manager.analyzePieceActivity(invalidBoard, 'white');
      expect(activity).toBeDefined();
    });
  });

  describe('State Tracking', () => {
    test('trackStateChange updates version', () => {
      const oldVersion = manager.stateVersion;
      const state1 = game.getGameState();
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      const state2 = game.getGameState();
      
      manager.trackStateChange(state1, state2);
      expect(manager.stateVersion).toBe(oldVersion + 1);
    });

    test('trackStateChange handles null states', () => {
      expect(() => {
        manager.trackStateChange(null, null);
      }).not.toThrow();
    });

    test('trackStateChange updates metadata', () => {
      const state1 = game.getGameState();
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      const state2 = game.getGameState();
      
      manager.trackStateChange(state1, state2);
      expect(manager.gameMetadata.totalMoves).toBeGreaterThan(0);
    });
  });

  describe('State Metrics', () => {
    test('getStateMetrics returns metrics', () => {
      const metrics = manager.getStateMetrics();
      expect(metrics.stateVersion).toBeDefined();
      expect(metrics.positionCount).toBeDefined();
      expect(metrics.gameMetadata).toBeDefined();
    });
  });

  describe('State Reset', () => {
    test('resetState clears history', () => {
      manager.addPositionToHistory('test-fen');
      manager.resetState();
      expect(manager.positionHistory.length).toBe(0);
      expect(manager.stateVersion).toBe(1);
    });
  });

  describe('Turn Validation', () => {
    test('validateTurnSequence with correct turn', () => {
      const result = manager.validateTurnSequence('white', 'white', []);
      expect(result.isValid).toBe(true);
    });

    test('validateTurnSequence with incorrect turn', () => {
      const result = manager.validateTurnSequence('black', 'white', []);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Castling Rights Validation', () => {
    test('validateCastlingRights with valid rights', () => {
      const rights = {
        white: { kingSide: true, queenSide: true },
        black: { kingSide: true, queenSide: true }
      };
      
      const result = manager.validateCastlingRights(rights);
      expect(result.isValid).toBe(true);
    });

    test('validateCastlingRights with invalid structure', () => {
      const result = manager.validateCastlingRights(null);
      expect(result.isValid).toBe(false);
    });
  });

  describe('En Passant Validation', () => {
    test('validateEnPassantTarget with valid target', () => {
      const target = { row: 2, col: 4 };
      const result = manager.validateEnPassantTarget(target);
      expect(result.isValid).toBe(true);
    });

    test('validateEnPassantTarget with null target', () => {
      const result = manager.validateEnPassantTarget(null);
      expect(result.isValid).toBe(true);
    });

    test('validateEnPassantTarget with invalid coordinates', () => {
      const target = { row: -1, col: 4 };
      const result = manager.validateEnPassantTarget(target);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Move History Validation', () => {
    test('validateMoveHistory with valid history', () => {
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      const result = manager.validateMoveHistory(game.moveHistory);
      expect(result.isValid).toBe(true);
    });

    test('validateMoveHistory with non-array', () => {
      const result = manager.validateMoveHistory(null);
      expect(result.isValid).toBe(false);
    });
  });
});
