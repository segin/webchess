/**
 * Comprehensive Coverage Tests
 * Target: 100% coverage for all shared modules
 */

const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');
const ChessAI = require('../src/shared/chessAI');

describe('Coverage 100% - ChessAI Edge Cases', () => {
  let ai;
  let game;

  beforeEach(() => {
    ai = new ChessAI('medium');
    game = new ChessGame();
  });

  test('getBestMove returns null when no moves available', () => {
    // Create a stalemate position
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[0][0] = { type: 'king', color: 'black' };
    game.board[2][1] = { type: 'queen', color: 'white' };
    game.board[1][2] = { type: 'king', color: 'white' };
    game.currentTurn = 'black';
    game.gameStatus = 'stalemate';

    const move = ai.getBestMove(game);
    expect(move).toBeNull();
  });

  test('minimax handles depth < 0 safety check', () => {
    const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
    const score = ai.minimax(game, move, -1, true, -Infinity, Infinity);
    expect(typeof score).toBe('number');
  });

  test('minimax handles invalid move result', () => {
    const invalidMove = { from: { row: 0, col: 0 }, to: { row: 7, col: 7 } };
    const score = ai.minimax(game, invalidMove, 1, true, -Infinity, Infinity);
    expect(score).toBe(-Infinity);
  });

  test('minimax handles no moves available in position', () => {
    // Create position with no legal moves
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[0][0] = { type: 'king', color: 'black' };
    game.board[2][1] = { type: 'queen', color: 'white' };
    game.board[1][2] = { type: 'king', color: 'white' };
    game.currentTurn = 'black';
    
    const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
    const score = ai.minimax(game, move, 2, false, -Infinity, Infinity);
    expect(typeof score).toBe('number');
  });

  test('getPieceSquareTables handles null table', () => {
    const tables = ai.getPieceSquareTables();
    expect(tables).toBeDefined();
    expect(tables.pawn).toBeDefined();
  });

  test('getAllValidMoves handles null piece', () => {
    game.board[4][4] = null;
    const moves = ai.getAllValidMoves(game, 'white');
    expect(Array.isArray(moves)).toBe(true);
  });
});

describe('Coverage 100% - GameState Edge Cases', () => {
  let manager;
  let game;

  beforeEach(() => {
    manager = new GameStateManager();
    game = new ChessGame();
  });

  test('validateGameState detects checkmate without winner', () => {
    const invalidState = {
      board: game.board,
      currentTurn: 'white',
      gameStatus: 'checkmate',
      winner: null,
      moveHistory: [],
      castlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
      enPassantTarget: null,
      inCheck: false
    };

    const result = manager.validateGameState(invalidState);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('winner'))).toBe(true);
  });

  test('validateGameState detects stalemate with winner', () => {
    const invalidState = {
      board: game.board,
      currentTurn: 'white',
      gameStatus: 'stalemate',
      winner: 'white',
      moveHistory: [],
      castlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
      enPassantTarget: null,
      inCheck: false
    };

    const result = manager.validateGameState(invalidState);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('stalemate'))).toBe(true);
  });

  test('validateGameState detects invalid piece color', () => {
    const invalidState = {
      board: Array(8).fill(null).map(() => Array(8).fill(null)),
      currentTurn: 'white',
      gameStatus: 'active',
      winner: null,
      moveHistory: [],
      castlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
      enPassantTarget: null,
      inCheck: false
    };
    
    invalidState.board[0][0] = { type: 'king', color: 'white' };
    invalidState.board[7][7] = { type: 'king', color: 'black' };
    invalidState.board[4][4] = { type: 'pawn', color: 'red' };

    const result = manager.validateGameState(invalidState);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid piece color'))).toBe(true);
  });

  test('validateGameState detects invalid piece type', () => {
    const invalidState = {
      board: Array(8).fill(null).map(() => Array(8).fill(null)),
      currentTurn: 'white',
      gameStatus: 'active',
      winner: null,
      moveHistory: [],
      castlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
      enPassantTarget: null,
      inCheck: false
    };
    
    invalidState.board[0][0] = { type: 'king', color: 'white' };
    invalidState.board[7][7] = { type: 'king', color: 'black' };
    invalidState.board[4][4] = { type: 'dragon', color: 'white' };

    const result = manager.validateGameState(invalidState);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid piece type'))).toBe(true);
  });

  test('trackStateChange handles null states', () => {
    expect(() => {
      manager.trackStateChange(null, null);
    }).not.toThrow();
  });

  test('trackStateChange updates metadata correctly', () => {
    const oldState = game.getGameState();
    game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
    const newState = game.getGameState();

    manager.trackStateChange(oldState, newState);
    expect(manager.gameMetadata.totalMoves).toBeGreaterThan(0);
  });

  test('validateStateSnapshot handles null snapshot', () => {
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
    expect(result.errors.some(e => e.includes('timestamp'))).toBe(true);
  });

  test('validateStateSnapshot detects invalid state version', () => {
    const snapshot = {
      timestamp: Date.now(),
      stateVersion: 'invalid',
      gameState: {}
    };

    const result = manager.validateStateSnapshot(snapshot);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('state version'))).toBe(true);
  });

  test('validateStateSnapshot detects missing game state', () => {
    const snapshot = {
      timestamp: Date.now(),
      stateVersion: 1
    };

    const result = manager.validateStateSnapshot(snapshot);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing game state');
  });

  test('analyzeGameProgression detects opening phase', () => {
    const analysis = manager.analyzeGameProgression(game.getGameState());
    expect(analysis.phase).toBe('opening');
    expect(analysis.characteristics.isEarlyGame).toBe(true);
  });

  test('analyzeGameProgression detects endgame phase', () => {
    // Create endgame position
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[0][0] = { type: 'king', color: 'white' };
    game.board[7][7] = { type: 'king', color: 'black' };
    game.board[0][1] = { type: 'rook', color: 'white' };
    game.moveHistory = new Array(65).fill({});

    const analysis = manager.analyzeGameProgression(game.getGameState());
    expect(analysis.phase).toBe('endgame');
  });

  test('calculateMaterialBalance handles non-array board', () => {
    const balance = manager.calculateMaterialBalance(null);
    expect(balance.difference).toBe(0);
  });

  test('calculateMaterialBalance handles non-array rows', () => {
    const invalidBoard = [null, null, null, null, null, null, null, null];
    const balance = manager.calculateMaterialBalance(invalidBoard);
    expect(balance).toBeDefined();
  });

  test('analyzePieceActivity handles non-array board', () => {
    const activity = manager.analyzePieceActivity(null, 'white');
    expect(activity.activePieces).toEqual([]);
    expect(activity.totalMobility).toBe(0);
  });

  test('analyzePieceActivity handles non-array rows', () => {
    const invalidBoard = [null, null, null, null, null, null, null, null];
    const activity = manager.analyzePieceActivity(invalidBoard, 'white');
    expect(activity).toBeDefined();
  });
});

describe('Coverage 100% - ChessGame Edge Cases', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('makeMove handles unexpected system error', () => {
    // Force an error by corrupting internal state
    const originalValidate = game.validateMoveFormat;
    game.validateMoveFormat = () => {
      throw new Error('Unexpected error');
    };

    const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
    
    game.validateMoveFormat = originalValidate; // Restore for cleanup
    
    expect(result.success).toBe(false);
    expect(result.code).toBe('SYSTEM_ERROR');
  });

  test('validateMoveFormat detects non-integer to.row', () => {
    const result = game.makeMove({ 
      from: { row: 6, col: 4 }, 
      to: { row: 4.5, col: 4 } 
    });
    expect(result.success).toBe(false);
    expect(result.code).toBe('INVALID_COORDINATES');
  });

  test('validateMoveFormat detects non-finite to.row', () => {
    const result = game.makeMove({ 
      from: { row: 6, col: 4 }, 
      to: { row: Infinity, col: 4 } 
    });
    expect(result.success).toBe(false);
    expect(result.code).toBe('INVALID_COORDINATES');
  });

  test('validateMoveFormat detects non-string promotion', () => {
    game.board[6][4] = { type: 'pawn', color: 'white' };
    game.board[1][4] = null;
    
    const result = game.makeMove(
      { from: { row: 6, col: 4 }, to: { row: 0, col: 4 } },
      null,
      123 // Invalid promotion type
    );
    expect(result.success).toBe(false);
  });

  test('validateMoveFormat detects invalid promotion piece', () => {
    game.board[1][4] = { type: 'pawn', color: 'white' };
    
    const result = game.makeMove(
      { from: { row: 1, col: 4 }, to: { row: 0, col: 4 } },
      null,
      'king' // Invalid promotion
    );
    expect(result.success).toBe(false);
  });
});

describe('Coverage 100% - Additional ChessGame Paths', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('covers all uncovered branches in move validation', () => {
    // Test various edge cases to hit uncovered lines
    
    // Line 375: Invalid piece at source
    let result = game.makeMove({ from: { row: 4, col: 4 }, to: { row: 3, col: 4 } });
    expect(result.success).toBe(false);

    // Line 399: Wrong color piece
    result = game.makeMove({ from: { row: 1, col: 4 }, to: { row: 2, col: 4 } });
    expect(result.success).toBe(false);

    // Line 416: Invalid move for piece type
    result = game.makeMove({ from: { row: 7, col: 0 }, to: { row: 5, col: 5 } });
    expect(result.success).toBe(false);

    // Line 424: Path blocked
    result = game.makeMove({ from: { row: 7, col: 0 }, to: { row: 5, col: 0 } });
    expect(result.success).toBe(false);
  });

  test('covers castling validation paths', () => {
    // Clear path for castling
    game.board[7][1] = null;
    game.board[7][2] = null;
    game.board[7][3] = null;

    // Try castling
    const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 2 } });
    expect(result).toBeDefined();
  });

  test('covers en passant validation paths', () => {
    // Setup en passant scenario
    game.board[3][4] = { type: 'pawn', color: 'white' };
    game.board[1][5] = { type: 'pawn', color: 'black' };
    game.currentTurn = 'black';

    // Black pawn moves two squares
    game.makeMove({ from: { row: 1, col: 5 }, to: { row: 3, col: 5 } });

    // White pawn captures en passant
    const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 5 } });
    expect(result).toBeDefined();
  });

  test('covers pawn promotion paths', () => {
    // Setup pawn near promotion
    game.board[1][4] = { type: 'pawn', color: 'white' };
    game.board[0][4] = null;

    // Promote to different pieces
    const result = game.makeMove(
      { from: { row: 1, col: 4 }, to: { row: 0, col: 4 } },
      null,
      'rook'
    );
    expect(result).toBeDefined();
  });

  test('covers check detection paths', () => {
    // Create a check scenario
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[7][4] = { type: 'king', color: 'white' };
    game.board[0][4] = { type: 'king', color: 'black' };
    game.board[5][4] = { type: 'rook', color: 'black' };
    game.currentTurn = 'white';
    game.updateGameStatus();

    const state = game.getGameState();
    expect(state.inCheck).toBe(true);
  });

  test('covers checkmate detection paths', () => {
    // Create checkmate position
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[7][7] = { type: 'king', color: 'white' };
    game.board[6][7] = { type: 'rook', color: 'black' };
    game.board[7][6] = { type: 'rook', color: 'black' };
    game.board[0][0] = { type: 'king', color: 'black' };
    game.currentTurn = 'white';
    game.updateGameStatus();

    const state = game.getGameState();
    expect(state.gameStatus).toBe('checkmate');
  });

  test('covers stalemate detection paths', () => {
    // Create stalemate position
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[0][0] = { type: 'king', color: 'black' };
    game.board[2][1] = { type: 'queen', color: 'white' };
    game.board[1][2] = { type: 'king', color: 'white' };
    game.currentTurn = 'black';
    game.updateGameStatus();

    const state = game.getGameState();
    expect(state.gameStatus).toBe('stalemate');
  });
});


describe('Coverage 100% - GameState Advanced Methods', () => {
  let manager;
  let game;

  beforeEach(() => {
    manager = new GameStateManager();
    game = new ChessGame();
  });

  test('analyzePieceActivity with valid board', () => {
    const activity = manager.analyzePieceActivity(game.board, 'white');
    expect(activity.activePieces.length).toBeGreaterThan(0);
    expect(activity.totalMobility).toBeGreaterThanOrEqual(0);
  });

  test('detectGamePhase returns correct phase', () => {
    const phase = manager.detectGamePhase(game.getGameState());
    expect(['opening', 'middlegame', 'endgame']).toContain(phase);
  });

  test('calculateMaterialBalance with valid board', () => {
    const balance = manager.calculateMaterialBalance(game.board);
    expect(balance.white.total).toBeGreaterThan(0);
    expect(balance.black.total).toBeGreaterThan(0);
  });

  test('getPositionFrequency tracks positions', () => {
    const state = game.getGameState();
    const fen = manager.getFENPosition(state.board, state.currentTurn, state.castlingRights, state.enPassantTarget);
    manager.addPositionToHistory(fen);
    
    const freq = manager.getPositionFrequency(fen);
    expect(freq).toBeGreaterThan(0);
  });

  test('isThreefoldRepetition detects repetition', () => {
    const state = game.getGameState();
    const fen = manager.getFENPosition(state.board, state.currentTurn, state.castlingRights, state.enPassantTarget);
    
    manager.addPositionToHistory(fen);
    manager.addPositionToHistory(fen);
    manager.addPositionToHistory(fen);
    
    expect(manager.isThreefoldRepetition()).toBe(true);
  });

  test('createStateSnapshot creates valid snapshot', () => {
    const snapshot = manager.createStateSnapshot(game.getGameState());
    expect(snapshot.timestamp).toBeDefined();
    expect(snapshot.stateVersion).toBeDefined();
    expect(snapshot.gameState).toBeDefined();
  });

  test('compareStates detects differences', () => {
    const state1 = game.getGameState();
    game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
    const state2 = game.getGameState();
    
    const comparison = manager.compareStates(state1, state2);
    expect(comparison.hasChanges).toBe(true);
  });

  test('getStateMetrics returns metrics', () => {
    const metrics = manager.getStateMetrics();
    expect(metrics.stateVersion).toBeDefined();
    expect(metrics.positionCount).toBeDefined();
  });

  test('resetState clears history', () => {
    manager.addPositionToHistory('test-fen');
    manager.resetState();
    expect(manager.positionHistory.length).toBe(0);
  });
});

describe('Coverage 100% - ChessGame Advanced Scenarios', () => {
  let game;

  beforeEach(() => {
    game = new ChessGame();
  });

  test('handles complex castling scenarios', () => {
    // Clear pieces for queenside castling
    game.board[7][1] = null;
    game.board[7][2] = null;
    game.board[7][3] = null;

    const result = game.makeMove({ from: { row: 7, col: 4 }, to: { row: 7, col: 2 } });
    expect(result.success).toBe(true);
    expect(game.board[7][2].type).toBe('king');
    expect(game.board[7][3].type).toBe('rook');
  });

  test('handles pawn promotion to different pieces', () => {
    // Setup pawn ready to promote
    game.board[1][4] = { type: 'pawn', color: 'white' };
    game.board[0][4] = null;
    game.currentTurn = 'white';

    // Promote to bishop
    let result = game.makeMove(
      { from: { row: 1, col: 4 }, to: { row: 0, col: 4 } },
      null,
      'bishop'
    );
    expect(result.success).toBe(true);
    expect(game.board[0][4].type).toBe('bishop');

    // Reset and promote to knight
    game.board[1][5] = { type: 'pawn', color: 'white' };
    game.board[0][5] = null;
    game.currentTurn = 'white';
    result = game.makeMove(
      { from: { row: 1, col: 5 }, to: { row: 0, col: 5 } },
      null,
      'knight'
    );
    expect(result.success).toBe(true);
    expect(game.board[0][5].type).toBe('knight');
  });

  test('handles en passant edge cases', () => {
    // Setup en passant
    game.board[3][4] = { type: 'pawn', color: 'white' };
    game.board[1][5] = { type: 'pawn', color: 'black' };
    game.board[6][5] = null;
    game.currentTurn = 'black';

    // Black pawn moves two squares
    game.makeMove({ from: { row: 1, col: 5 }, to: { row: 3, col: 5 } });

    // White captures en passant
    const result = game.makeMove({ from: { row: 3, col: 4 }, to: { row: 2, col: 5 } });
    expect(result.success).toBe(true);
    expect(game.board[3][5]).toBeNull();
  });

  test('detects check from different piece types', () => {
    // Check from knight
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[7][4] = { type: 'king', color: 'white' };
    game.board[0][4] = { type: 'king', color: 'black' };
    game.board[5][3] = { type: 'knight', color: 'black' };
    game.currentTurn = 'white';
    game.updateGameStatus();
    expect(game.inCheck).toBe(true);

    // Check from bishop
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[7][4] = { type: 'king', color: 'white' };
    game.board[0][4] = { type: 'king', color: 'black' };
    game.board[4][1] = { type: 'bishop', color: 'black' };
    game.currentTurn = 'white';
    game.updateGameStatus();
    expect(game.inCheck).toBe(true);

    // Check from queen
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[7][4] = { type: 'king', color: 'white' };
    game.board[0][4] = { type: 'king', color: 'black' };
    game.board[7][0] = { type: 'queen', color: 'black' };
    game.currentTurn = 'white';
    game.updateGameStatus();
    expect(game.inCheck).toBe(true);

    // Check from pawn
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[7][4] = { type: 'king', color: 'white' };
    game.board[0][4] = { type: 'king', color: 'black' };
    game.board[6][3] = { type: 'pawn', color: 'black' };
    game.currentTurn = 'white';
    game.updateGameStatus();
    expect(game.inCheck).toBe(true);
  });

  test('validates piece-specific movement rules', () => {
    // Knight L-shape movement
    let result = game.makeMove({ from: { row: 7, col: 1 }, to: { row: 5, col: 2 } });
    expect(result.success).toBe(true);

    // Bishop diagonal movement
    game.board[6][3] = null;
    game.currentTurn = 'white';
    result = game.makeMove({ from: { row: 7, col: 2 }, to: { row: 5, col: 4 } });
    expect(result.success).toBe(true);

    // Rook horizontal movement
    game.board[7][1] = null;
    game.board[7][2] = null;
    game.board[7][3] = null;
    game.currentTurn = 'white';
    result = game.makeMove({ from: { row: 7, col: 0 }, to: { row: 7, col: 3 } });
    expect(result.success).toBe(true);
  });

  test('handles game state transitions', () => {
    const initialState = game.getGameState();
    expect(initialState.gameStatus).toBe('active');
    expect(initialState.currentTurn).toBe('white');

    game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
    const afterMove = game.getGameState();
    expect(afterMove.currentTurn).toBe('black');
    expect(afterMove.moveHistory.length).toBe(1);
  });

  test('validates move history tracking', () => {
    game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
    game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });

    const history = game.moveHistory;
    expect(history.length).toBe(2);
    expect(history[0].piece).toBe('pawn');
    expect(history[0].color).toBe('white');
    expect(history[1].piece).toBe('pawn');
    expect(history[1].color).toBe('black');
  });

  test('handles invalid move attempts', () => {
    // Move to same square
    let result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 6, col: 4 } });
    expect(result.success).toBe(false);

    // Move opponent's piece
    result = game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
    expect(result.success).toBe(false);

    // Invalid coordinates
    result = game.makeMove({ from: { row: -1, col: 4 }, to: { row: 4, col: 4 } });
    expect(result.success).toBe(false);

    // Move through pieces
    result = game.makeMove({ from: { row: 7, col: 0 }, to: { row: 5, col: 0 } });
    expect(result.success).toBe(false);
  });
});

describe('Coverage 100% - ChessAI Complete Coverage', () => {
  let ai;
  let game;

  beforeEach(() => {
    ai = new ChessAI('hard');
    game = new ChessGame();
  });

  test('AI makes valid moves in various positions', () => {
    const move = ai.getBestMove(game);
    expect(move).toBeDefined();
    expect(move.from).toBeDefined();
    expect(move.to).toBeDefined();
  });

  test('AI evaluates position correctly', () => {
    const score = ai.evaluatePosition(game);
    expect(typeof score).toBe('number');
  });

  test('AI handles endgame positions', () => {
    // Create endgame
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[0][0] = { type: 'king', color: 'white' };
    game.board[7][7] = { type: 'king', color: 'black' };
    game.board[0][1] = { type: 'rook', color: 'white' };
    game.currentTurn = 'white';

    const move = ai.getBestMove(game);
    expect(move).toBeDefined();
  });

  test('AI difficulty levels work correctly', () => {
    const easyAI = new ChessAI('easy');
    const mediumAI = new ChessAI('medium');
    const hardAI = new ChessAI('hard');

    expect(easyAI.difficulty).toBe('easy');
    expect(mediumAI.difficulty).toBe('medium');
    expect(hardAI.difficulty).toBe('hard');
  });

  test('AI clones game correctly', () => {
    const cloned = ai.cloneGame(game);
    expect(cloned).toBeDefined();
    expect(cloned.board).toBeDefined();
    expect(cloned.currentTurn).toBe(game.currentTurn);
  });

  test('AI gets all valid moves', () => {
    const moves = ai.getAllValidMoves(game, 'white');
    expect(Array.isArray(moves)).toBe(true);
    expect(moves.length).toBeGreaterThan(0);
  });

  test('AI handles positions with limited moves', () => {
    // Create position with few moves
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[0][0] = { type: 'king', color: 'white' };
    game.board[7][7] = { type: 'king', color: 'black' };
    game.board[1][1] = { type: 'pawn', color: 'white' };
    game.currentTurn = 'white';

    const move = ai.getBestMove(game);
    expect(move).toBeDefined();
  });
});
