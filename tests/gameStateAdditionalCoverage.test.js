/**
 * Additional Game State Management Tests for Coverage
 * Tests to cover uncovered lines in gameState.js
 */

const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');

describe('GameState Additional Coverage', () => {
  let game;
  let stateManager;

  beforeEach(() => {
    game = new ChessGame();
    stateManager = game.stateManager;
  });

  test('should handle null game state in consistency validation', () => {
    const validation = stateManager.validateGameStateConsistency(null);
    
    expect(validation.success).toBe(false);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Game state is null or undefined');
  });

  test('should handle game state without move history', () => {
    const gameState = { 
      currentTurn: 'white',
      board: game.board, // Add board to prevent errors
      fullMoveNumber: 1,
      halfMoveClock: 0,
      gameStatus: 'active',
      winner: null,
      castlingRights: { white: { kingside: true, queenside: true }, black: { kingside: true, queenside: true } },
      enPassantTarget: null
    };
    const validation = stateManager.validateGameStateConsistency(gameState);
    
    expect(validation.success).toBe(true); // Should add empty moveHistory
    expect(validation.errors).toHaveLength(0);
  });

  test('should validate board consistency with invalid piece data', () => {
    const invalidBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    invalidBoard[0][0] = { type: null, color: 'white' }; // Invalid piece
    
    const result = stateManager.validateBoardConsistency(invalidBoard);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid piece at (0,0): missing type or color');
  });

  test('should validate board consistency with invalid piece color', () => {
    const invalidBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    invalidBoard[0][0] = { type: 'pawn', color: 'invalid' }; // Invalid color
    
    const result = stateManager.validateBoardConsistency(invalidBoard);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid piece color at (0,0): invalid');
  });

  test('should validate board consistency with invalid piece type', () => {
    const invalidBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    invalidBoard[0][0] = { type: 'invalid', color: 'white' }; // Invalid type
    
    const result = stateManager.validateBoardConsistency(invalidBoard);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid piece type at (0,0): invalid');
  });

  test('should validate king count with invalid board structure', () => {
    const result = stateManager.validateKingCount(null);
    
    expect(result.isValid).toBe(false);
    expect(result.whiteKings).toBe(0);
    expect(result.blackKings).toBe(0);
    expect(result.errors).toContain('Invalid board structure');
  });

  test('should validate king count with invalid row structure', () => {
    const invalidBoard = [null, [], [], [], [], [], [], []];
    const result = stateManager.validateKingCount(invalidBoard);
    
    expect(result.isValid).toBe(false);
    expect(result.whiteKings).toBe(0);
    expect(result.blackKings).toBe(0);
  });

  test('should validate turn consistency with null game state', () => {
    const result = stateManager.validateTurnConsistency(null);
    
    expect(result.isValid).toBe(false);
    expect(result.expectedTurn).toBe('white');
    expect(result.errors).toContain('Invalid game state or missing move history');
  });

  test('should validate turn consistency with missing move history', () => {
    const gameState = { currentTurn: 'white' };
    const result = stateManager.validateTurnConsistency(gameState);
    
    expect(result.isValid).toBe(false);
    expect(result.expectedTurn).toBe('white');
    expect(result.errors).toContain('Invalid game state or missing move history');
  });

  test('should validate en passant consistency with null game state', () => {
    const result = stateManager.validateEnPassantConsistency(null);
    
    expect(result.isValid).toBe(false);
    expect(result.expectedTarget).toBe(null);
    expect(result.errors).toContain('Invalid game state or missing move history');
  });

  test('should validate en passant consistency with missing move history', () => {
    const gameState = { currentTurn: 'white' };
    const result = stateManager.validateEnPassantConsistency(gameState);
    
    expect(result.isValid).toBe(false);
    expect(result.expectedTarget).toBe(null);
    expect(result.errors).toContain('Invalid game state or missing move history');
  });

  test('should validate en passant consistency after pawn two-square move', () => {
    const gameState = {
      currentTurn: 'black',
      moveHistory: [{
        piece: 'pawn',
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 }
      }],
      enPassantTarget: { row: 5, col: 4 }
    };
    
    const result = stateManager.validateEnPassantConsistency(gameState);
    
    expect(result.isValid).toBe(true);
    expect(result.expectedTarget).toEqual({ row: 5, col: 4 });
    expect(result.actualTarget).toEqual({ row: 5, col: 4 });
  });

  test('should detect en passant target mismatch', () => {
    const gameState = {
      currentTurn: 'black',
      moveHistory: [{
        piece: 'pawn',
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 }
      }],
      enPassantTarget: { row: 5, col: 5 } // Wrong target
    };
    
    const result = stateManager.validateEnPassantConsistency(gameState);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('En passant target mismatch');
  });

  test('should track state changes with null states', () => {
    stateManager.trackStateChange(null, null);
    // Should not throw error
    expect(stateManager.stateVersion).toBeGreaterThan(0);
  });

  test('should track state changes with valid states', () => {
    const oldState = game.getGameState();
    game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
    const newState = game.getGameState();
    
    const originalVersion = stateManager.stateVersion;
    stateManager.trackStateChange(oldState, newState);
    
    expect(stateManager.stateVersion).toBeGreaterThan(originalVersion);
  });

  test('should detect state changes between different states', () => {
    const oldState = game.getGameState();
    game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
    const newState = game.getGameState();
    
    const changes = stateManager.detectStateChanges(oldState, newState);
    
    expect(changes.length).toBeGreaterThan(0);
    expect(changes).toContain('Turn changed from white to black');
  });

  test('should detect state changes with null states', () => {
    const changes = stateManager.detectStateChanges(null, null);
    
    expect(changes).toContain('State comparison with null/undefined');
  });

  test('should handle invalid board in castling rights validation', () => {
    const result = stateManager.validateCastlingRightsConsistency(null, null);
    expect(result).toBe(false);
  });

  test('should handle invalid castling rights object', () => {
    const board = game.board;
    const result = stateManager.validateCastlingRightsConsistency(board, null);
    expect(result).toBe(false);
  });

  test('should validate castling rights with missing pieces', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    const castlingRights = {
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true }
    };
    
    const result = stateManager.validateCastlingRightsConsistency(board, castlingRights);
    expect(result).toBe(false);
  });

  test('should validate castling rights with wrong piece types', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[7][4] = { type: 'queen', color: 'white' }; // Wrong piece type
    board[7][7] = { type: 'rook', color: 'white' };
    
    const castlingRights = {
      white: { kingside: true, queenside: true },
      black: { kingside: false, queenside: false }
    };
    
    const result = stateManager.validateCastlingRightsConsistency(board, castlingRights);
    expect(result).toBe(false);
  });

  test('should validate castling rights with wrong piece colors', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[7][4] = { type: 'king', color: 'black' }; // Wrong color
    board[7][7] = { type: 'rook', color: 'white' };
    
    const castlingRights = {
      white: { kingside: true, queenside: true },
      black: { kingside: false, queenside: false }
    };
    
    const result = stateManager.validateCastlingRightsConsistency(board, castlingRights);
    expect(result).toBe(false);
  });

  test('should add move with missing properties', () => {
    const invalidMove = { from: { row: 6, col: 4 } }; // Missing to and piece
    const result = stateManager.addMove(invalidMove);
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Move must have from and to coordinates');
    expect(result.errors).toContain('Move must specify piece');
  });

  test('should add move with null move object', () => {
    const result = stateManager.addMove(null);
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Move must be an object');
  });

  test('should validate move history with invalid structure', () => {
    stateManager.moveHistory = 'invalid'; // Not an array
    const result = stateManager.validateMoveHistory();
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Move history must be an array');
  });

  test('should validate move history with invalid move objects', () => {
    stateManager.moveHistory = [{ from: { row: 6, col: 4 } }]; // Missing to
    const result = stateManager.validateMoveHistory();
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Move at index 0 missing from/to coordinates');
  });

  test('should validate castling rights with invalid structure', () => {
    stateManager.castlingRights = 'invalid'; // Not an object
    const result = stateManager.validateCastlingRights();
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Castling rights must be an object');
  });

  test('should validate castling rights with missing properties', () => {
    stateManager.castlingRights = { whiteKingside: 'invalid' }; // Wrong type
    const result = stateManager.validateCastlingRights();
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Invalid castling right: whiteKingside');
  });

  test('should handle invalid current turn validation', () => {
    stateManager.currentTurn = null;
    const result = stateManager.validateCurrentTurn();
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Invalid current turn: null');
  });

  test('should restore from checkpoint with invalid data', () => {
    const result = stateManager.restoreFromCheckpoint('invalid');
    
    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid checkpoint data');
  });

  test('should restore from checkpoint with error handling', () => {
    const checkpoint = {
      gameState: { valid: true },
      metadata: { test: true }
    };
    
    const result = stateManager.restoreFromCheckpoint(checkpoint);
    
    expect(result.success).toBe(true);
    expect(result.state).toEqual({ valid: true });
    expect(result.metadata).toEqual({ test: true });
  });

  test('should handle material balance calculation with invalid rows', () => {
    const invalidBoard = [null, [], 'invalid', [], [], [], [], []];
    const balance = stateManager.calculateMaterialBalance(invalidBoard);
    
    expect(balance.white.total).toBe(0);
    expect(balance.black.total).toBe(0);
    expect(balance.difference).toBe(0);
  });

  test('should handle piece activity analysis with invalid rows', () => {
    const invalidBoard = [null, [], 'invalid', [], [], [], [], []];
    const analysis = stateManager.analyzePieceActivity(invalidBoard, 'white');
    
    expect(analysis.activePieces).toHaveLength(0);
    expect(analysis.totalMobility).toBe(0);
    expect(analysis.averageMobility).toBe(0);
  });

  test('should handle piece activity analysis with invalid pieces', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[0][0] = { type: null, color: 'white' }; // Invalid piece
    
    const analysis = stateManager.analyzePieceActivity(board, 'white');
    
    // The function still processes the piece even if type is null
    expect(analysis.activePieces).toHaveLength(1);
    expect(analysis.totalMobility).toBe(0);
  });

  test('should optimize state storage with old metadata', () => {
    // Set old start time to trigger metadata cleanup
    stateManager.gameMetadata.startTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
    stateManager.gameMetadata.intermediateStates = { test: 'data' };
    
    stateManager.optimizeStateStorage();
    
    expect(stateManager.gameMetadata.intermediateStates).toBeUndefined();
  });

  test('should handle same-turn state transitions with no move', () => {
    const fromState = {
      currentTurn: 'white',
      moveHistory: [],
      fullMoveNumber: 1
    };
    
    const toState = {
      currentTurn: 'white', // Same turn
      moveHistory: [], // No new move
      fullMoveNumber: 1
    };
    
    const result = stateManager.validateStateTransition(fromState, toState);
    
    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain('No move made but turn unchanged');
  });

  test('should handle invalid turn transitions with move made', () => {
    const fromState = {
      currentTurn: 'white',
      moveHistory: [],
      fullMoveNumber: 1
    };
    
    const toState = {
      currentTurn: 'white', // Should be black after move
      moveHistory: [{ move: 'data' }], // Move was made
      fullMoveNumber: 1
    };
    
    const result = stateManager.validateStateTransition(fromState, toState);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid turn transition: white -> white');
  });

  test('should handle FEN generation with empty squares', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    // Add a few pieces to test empty square counting
    board[0][0] = { type: 'rook', color: 'black' };
    board[0][7] = { type: 'rook', color: 'black' };
    board[7][0] = { type: 'rook', color: 'white' };
    board[7][7] = { type: 'rook', color: 'white' };
    
    const fen = stateManager.getFENPosition(
      board,
      'white',
      { white: { kingside: false, queenside: false }, black: { kingside: false, queenside: false } },
      null
    );
    
    expect(fen).toContain('r6r/8/8/8/8/8/8/R6R w - -');
  });

  test('should handle status transition validation with unknown source status', () => {
    const result = stateManager.validateStatusTransition('unknown', 'active');
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('Unknown source status: unknown');
  });

  test('should handle status transition validation with same status', () => {
    const result = stateManager.validateStatusTransition('active', 'active');
    
    expect(result.success).toBe(true);
    expect(result.message).toBe('Status remains active');
  });

  test('should handle invalid status transition', () => {
    const result = stateManager.validateStatusTransition('checkmate', 'active');
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid transition from checkmate to active');
  });

  test('should handle position history limit during move addition', () => {
    // Fill position history to near limit
    for (let i = 0; i < 98; i++) {
      stateManager.positionHistory.push(`position_${i}`);
    }
    
    const moveData = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 }, piece: 'pawn', color: 'white' };
    const gameState = {
      inCheck: false, checkDetails: null, castlingRights: { white: { kingside: true, queenside: true }, black: { kingside: true, queenside: true } },
      enPassantTarget: null, halfMoveClock: 0, board: game.board, currentTurn: 'white'
    };
    
    stateManager.addMoveToHistory([], moveData, 1, gameState);
    
    expect(stateManager.positionHistory.length).toBeLessThanOrEqual(100);
  });

  test('should handle empty position history in validation', () => {
    stateManager.positionHistory = [];
    const gameState = game.getGameState();
    const validation = stateManager.validateGameStateConsistency(gameState);
    
    expect(validation.success).toBe(false);
    expect(validation.errors).toContain('Position history is empty');
  });

  test('should handle position mismatch warning', () => {
    const gameState = game.getGameState();
    stateManager.positionHistory = ['different_position'];
    
    const validation = stateManager.validateGameStateConsistency(gameState);
    
    expect(validation.warnings).toContain('Current position does not match last recorded position');
  });
 
  // Additional tests to reach 95%+ coverage
  test('should handle FEN generation with piece symbols', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    // Test all piece types for symbol mapping
    board[0][0] = { type: 'king', color: 'black' };
    board[0][1] = { type: 'queen', color: 'black' };
    board[0][2] = { type: 'rook', color: 'black' };
    board[0][3] = { type: 'bishop', color: 'black' };
    board[0][4] = { type: 'knight', color: 'black' };
    board[0][5] = { type: 'pawn', color: 'black' };
    board[7][0] = { type: 'king', color: 'white' };
    board[7][1] = { type: 'queen', color: 'white' };
    
    const fen = stateManager.getFENPosition(
      board,
      'white',
      { white: { kingside: false, queenside: false }, black: { kingside: false, queenside: false } },
      null
    );
    
    expect(fen).toContain('kqrbnp2/8/8/8/8/8/8/KQ6 w - -');
  });

  test('should handle FEN generation with unknown piece type', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[0][0] = { type: 'unknown', color: 'black' }; // Unknown piece type
    
    const fen = stateManager.getFENPosition(
      board,
      'white',
      { white: { kingside: false, queenside: false }, black: { kingside: false, queenside: false } },
      null
    );
    
    expect(fen).toContain('u7/8/8/8/8/8/8/8 w - -'); // Should use first character
  });

  test('should handle en passant target in FEN', () => {
    const board = game.board;
    const enPassantTarget = { row: 5, col: 4 }; // e3 square
    
    const fen = stateManager.getFENPosition(
      board,
      'white',
      { white: { kingside: true, queenside: true }, black: { kingside: true, queenside: true } },
      enPassantTarget
    );
    
    expect(fen).toContain(' e3');
  });

  test('should handle castling rights in FEN with partial rights', () => {
    const board = game.board;
    const castlingRights = {
      white: { kingside: true, queenside: false },
      black: { kingside: false, queenside: true }
    };
    
    const fen = stateManager.getFENPosition(
      board,
      'white',
      castlingRights,
      null
    );
    
    expect(fen).toContain(' Kq ');
  });

  test('should handle board consistency with piece count details', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[0][0] = { type: 'king', color: 'black' };
    board[7][0] = { type: 'king', color: 'white' };
    board[0][1] = { type: 'pawn', color: 'black' };
    board[7][1] = { type: 'pawn', color: 'white' };
    
    const result = stateManager.validateBoardConsistency(board);
    
    expect(result.isValid).toBe(true);
    expect(result.details.kingCount.white).toBe(1);
    expect(result.details.kingCount.black).toBe(1);
    expect(result.details.pieceCount.white).toBe(2);
    expect(result.details.pieceCount.black).toBe(2);
  });

  test('should handle game progression analysis with different phases', () => {
    // Test opening phase
    const openingState = {
      moveHistory: Array(10).fill({ move: 'test' }),
      board: game.board
    };
    let analysis = stateManager.analyzeGameProgression(openingState);
    expect(analysis.phase).toBe('opening');
    expect(analysis.characteristics.isEarlyGame).toBe(true);

    // Test middlegame phase
    const middlegameState = {
      moveHistory: Array(30).fill({ move: 'test' }),
      board: game.board
    };
    analysis = stateManager.analyzeGameProgression(middlegameState);
    expect(analysis.phase).toBe('middlegame');
    expect(analysis.characteristics.isMidGame).toBe(true);

    // Test endgame phase
    const endgameState = {
      moveHistory: Array(70).fill({ move: 'test' }),
      board: game.board
    };
    analysis = stateManager.analyzeGameProgression(endgameState);
    expect(analysis.phase).toBe('endgame');
    expect(analysis.characteristics.isEndGame).toBe(true);
  });

  test('should detect game phase based on material', () => {
    // Create a board with low material for endgame
    const lowMaterialBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    lowMaterialBoard[0][0] = { type: 'king', color: 'black' };
    lowMaterialBoard[7][0] = { type: 'king', color: 'white' };
    lowMaterialBoard[0][1] = { type: 'pawn', color: 'black' };
    
    const endgameState = {
      moveHistory: Array(30).fill({ move: 'test' }),
      board: lowMaterialBoard
    };
    
    const phase = stateManager.detectGamePhase(endgameState);
    expect(phase).toBe('endgame');
  });

  test('should calculate material balance with all piece types', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    // Add various pieces
    board[0][0] = { type: 'king', color: 'black' };
    board[0][1] = { type: 'queen', color: 'black' };
    board[0][2] = { type: 'rook', color: 'black' };
    board[0][3] = { type: 'bishop', color: 'black' };
    board[0][4] = { type: 'knight', color: 'black' };
    board[0][5] = { type: 'pawn', color: 'black' };
    
    board[7][0] = { type: 'king', color: 'white' };
    board[7][1] = { type: 'queen', color: 'white' };
    
    const balance = stateManager.calculateMaterialBalance(board);
    
    expect(balance.black.queen).toBe(1);
    expect(balance.black.rook).toBe(1);
    expect(balance.black.bishop).toBe(1);
    expect(balance.black.knight).toBe(1);
    expect(balance.black.pawn).toBe(1);
    expect(balance.black.total).toBe(17); // 9+5+3+3+1
    
    expect(balance.white.queen).toBe(1);
    expect(balance.white.total).toBe(9);
    
    expect(balance.difference).toBe(-8); // white - black
  });

  test('should calculate material balance with unknown piece types', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[0][0] = { type: 'unknown', color: 'black' }; // Unknown piece type
    
    const balance = stateManager.calculateMaterialBalance(board);
    
    expect(balance.black.total).toBe(0); // Unknown pieces have 0 value
  });

  test('should analyze piece activity with different piece types', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[4][4] = { type: 'queen', color: 'white' }; // Queen in center
    board[0][0] = { type: 'rook', color: 'white' }; // Rook in corner
    
    const analysis = stateManager.analyzePieceActivity(board, 'white');
    
    expect(analysis.activePieces).toHaveLength(2);
    expect(analysis.totalMobility).toBeGreaterThan(0);
    expect(analysis.averageMobility).toBeGreaterThan(0);
  });

  test('should calculate piece mobility for all piece types', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Test different piece types
    expect(stateManager.calculatePieceMobility(board, 4, 4, { type: 'queen', color: 'white' })).toBeGreaterThan(0);
    expect(stateManager.calculatePieceMobility(board, 4, 4, { type: 'rook', color: 'white' })).toBeGreaterThan(0);
    expect(stateManager.calculatePieceMobility(board, 4, 4, { type: 'bishop', color: 'white' })).toBeGreaterThan(0);
    expect(stateManager.calculatePieceMobility(board, 4, 4, { type: 'knight', color: 'white' })).toBeGreaterThan(0);
    expect(stateManager.calculatePieceMobility(board, 4, 4, { type: 'king', color: 'white' })).toBeGreaterThan(0);
    expect(stateManager.calculatePieceMobility(board, 4, 4, { type: 'pawn', color: 'white' })).toBeGreaterThan(0);
  });

  test('should handle basic move validation for all piece types', () => {
    // Test all piece types with valid moves
    expect(stateManager.isBasicMoveValid('pawn', 6, 4, 4, 4)).toBe(true); // 2 squares forward
    expect(stateManager.isBasicMoveValid('pawn', 6, 4, 5, 5)).toBe(true); // diagonal capture
    expect(stateManager.isBasicMoveValid('rook', 0, 0, 0, 7)).toBe(true); // horizontal
    expect(stateManager.isBasicMoveValid('rook', 0, 0, 7, 0)).toBe(true); // vertical
    expect(stateManager.isBasicMoveValid('knight', 0, 1, 2, 0)).toBe(true); // L-shape
    expect(stateManager.isBasicMoveValid('knight', 0, 1, 2, 2)).toBe(true); // L-shape
    expect(stateManager.isBasicMoveValid('bishop', 0, 0, 7, 7)).toBe(true); // diagonal
    expect(stateManager.isBasicMoveValid('queen', 0, 0, 0, 7)).toBe(true); // horizontal
    expect(stateManager.isBasicMoveValid('queen', 0, 0, 7, 7)).toBe(true); // diagonal
    expect(stateManager.isBasicMoveValid('king', 4, 4, 4, 5)).toBe(true); // one square
    expect(stateManager.isBasicMoveValid('king', 4, 4, 5, 5)).toBe(true); // diagonal one square
    
    // Test invalid moves
    expect(stateManager.isBasicMoveValid('pawn', 6, 4, 3, 4)).toBe(false); // too far
    expect(stateManager.isBasicMoveValid('rook', 0, 0, 1, 1)).toBe(false); // diagonal
    expect(stateManager.isBasicMoveValid('bishop', 0, 0, 0, 7)).toBe(false); // horizontal
    expect(stateManager.isBasicMoveValid('king', 4, 4, 4, 6)).toBe(false); // too far
  });

  test('should handle position complexity analysis', () => {
    // Simple position (few pieces)
    const simpleBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    simpleBoard[0][0] = { type: 'king', color: 'black' };
    simpleBoard[7][0] = { type: 'king', color: 'white' };
    
    expect(stateManager.analyzePositionComplexity(simpleBoard)).toBe(false);
    
    // Complex position (many pieces)
    const complexBoard = game.board; // Full starting position
    expect(stateManager.analyzePositionComplexity(complexBoard)).toBe(true);
  });

  test('should handle memory usage tracking', () => {
    // Add some data to track
    stateManager.positionHistory = ['pos1', 'pos2', 'pos3'];
    stateManager.gameMetadata = { test: 'data', more: 'info' };
    
    const usage = stateManager.getMemoryUsage();
    
    expect(usage.positionHistorySize).toBeGreaterThan(0);
    expect(usage.metadataSize).toBeGreaterThan(0);
    expect(usage.totalSize).toBeGreaterThan(0);
    expect(usage.positionCount).toBe(3);
  });

  test('should handle state storage optimization', () => {
    // Add duplicate positions
    stateManager.positionHistory = ['pos1', 'pos2', 'pos1', 'pos3', 'pos2'];
    
    const originalLength = stateManager.positionHistory.length;
    stateManager.optimizeStateStorage();
    
    // Should remove duplicates
    expect(stateManager.positionHistory.length).toBeLessThan(originalLength);
    expect(new Set(stateManager.positionHistory).size).toBe(stateManager.positionHistory.length);
  });

  test('should handle checkpoint restoration with try-catch', () => {
    // Test error handling in restoration
    const invalidCheckpoint = {
      gameState: 'invalid json string that will cause JSON.parse to fail',
      metadata: { test: true }
    };
    
    // Mock JSON.parse to throw an error
    const originalParse = JSON.parse;
    JSON.parse = jest.fn(() => {
      throw new Error('Parse error');
    });
    
    const result = stateManager.restoreFromCheckpoint(invalidCheckpoint);
    
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to restore from checkpoint');
    expect(result.error).toBe('Parse error');
    
    // Restore original JSON.parse
    JSON.parse = originalParse;
  });

  test('should handle state comparison with different properties', () => {
    const state1 = {
      currentTurn: 'white',
      gameStatus: 'active',
      moveHistory: [{ move: 1 }]
    };
    
    const state2 = {
      currentTurn: 'black',
      gameStatus: 'check',
      moveHistory: [{ move: 1 }, { move: 2 }]
    };
    
    const result = stateManager.compareGameStates(state1, state2);
    
    expect(result.identical).toBe(false);
    expect(result.differences).toContain('Current turn: white vs black');
    expect(result.differences).toContain('Game status: active vs check');
    expect(result.differences).toContain('Move history length: 1 vs 2');
  });

  test('should handle state change detection with status changes', () => {
    const oldState = {
      currentTurn: 'white',
      gameStatus: 'active'
    };
    
    const newState = {
      currentTurn: 'black',
      gameStatus: 'check'
    };
    
    const changes = stateManager.detectStateChanges(oldState, newState);
    
    expect(changes).toContain('Turn changed from white to black');
    expect(changes).toContain('Status changed from active to check');
  });

  test('should handle castling rights validation with black pieces', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[0][4] = { type: 'king', color: 'black' };
    board[0][7] = { type: 'rook', color: 'black' };
    board[0][0] = { type: 'rook', color: 'black' };
    board[7][4] = { type: 'king', color: 'white' };
    
    const castlingRights = {
      white: { kingside: false, queenside: false },
      black: { kingside: true, queenside: true }
    };
    
    const result = stateManager.validateCastlingRightsConsistency(board, castlingRights);
    expect(result).toBe(true);
  });

  test('should handle castling rights validation with missing black pieces', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[7][4] = { type: 'king', color: 'white' };
    
    const castlingRights = {
      white: { kingside: false, queenside: false },
      black: { kingside: true, queenside: true } // Rights but no pieces
    };
    
    const result = stateManager.validateCastlingRightsConsistency(board, castlingRights);
    expect(result).toBe(false);
  });

  test('should handle move addition with valid move', () => {
    const validMove = {
      from: { row: 6, col: 4 },
      to: { row: 4, col: 4 },
      piece: 'pawn',
      color: 'white'
    };
    
    const result = stateManager.addMove(validMove);
    
    expect(result.success).toBe(true);
    expect(result.move.from).toEqual({ row: 6, col: 4 });
    expect(result.move.to).toEqual({ row: 4, col: 4 });
    expect(result.move.piece).toBe('pawn');
    expect(result.move.timestamp).toBeDefined();
    expect(result.move.moveNumber).toBeDefined();
  });
});
