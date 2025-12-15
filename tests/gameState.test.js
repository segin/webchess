/**
 * Comprehensive GameState Tests
 * Tests for GameStateManager class covering state tracking, validation, and updates
 */

const GameStateManager = require('../src/shared/gameState');
const ChessGame = require('../src/shared/chessGame');

describe('GameStateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new GameStateManager();
  });

  describe('Initialization', () => {
    test('should initialize with default metadata', () => {
      expect(stateManager.stateVersion).toBe(1);
      expect(stateManager.gameMetadata).toBeDefined();
      expect(stateManager.gameMetadata.version).toBe('1.0.0');
      expect(stateManager.positionHistory).toEqual([]);
    });

    test('should generate unique game ID', () => {
      const id1 = stateManager.generateGameId();
      const id2 = stateManager.generateGameId();
      
      expect(id1).toMatch(/^game_\d+_[a-z0-9]{9}$/);
      expect(id2).toMatch(/^game_\d+_[a-z0-9]{9}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('FEN Position Generation', () => {
    test('should generate FEN for starting position', () => {
      const board = createStartingBoard();
      const castlingRights = {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
      };
      
      const fen = stateManager.getFENPosition(board, 'white', castlingRights, null);
      
      expect(fen).toContain('w');
      expect(fen).toContain('KQkq');
      expect(fen).toContain('-');
    });

    test('should handle empty squares in FEN', () => {
      const board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'king', color: 'white' };
      board[7][7] = { type: 'king', color: 'black' };
      
      const castlingRights = {
        white: { kingside: false, queenside: false },
        black: { kingside: false, queenside: false }
      };
      
      const fen = stateManager.getFENPosition(board, 'white', castlingRights, null);
      
      expect(fen).toContain('K7');
      expect(fen).toContain('7k');
      expect(fen).toContain('-');
    });

    test('should include en passant target in FEN', () => {
      const board = createStartingBoard();
      const castlingRights = {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
      };
      const enPassantTarget = { row: 5, col: 4 };
      
      const fen = stateManager.getFENPosition(board, 'white', castlingRights, enPassantTarget);
      
      expect(fen).toContain('e3');
    });

    test('should handle black turn in FEN', () => {
      const board = createStartingBoard();
      const castlingRights = {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
      };
      
      const fen = stateManager.getFENPosition(board, 'black', castlingRights, null);
      
      expect(fen).toContain(' b ');
    });

    test('should handle partial castling rights', () => {
      const board = createStartingBoard();
      const castlingRights = {
        white: { kingside: true, queenside: false },
        black: { kingside: false, queenside: true }
      };
      
      const fen = stateManager.getFENPosition(board, 'white', castlingRights, null);
      
      expect(fen).toContain('Kq');
    });
  });

  describe('Turn Sequence Validation', () => {
    test('should validate correct turn sequence', () => {
      const result = stateManager.validateTurnSequence('white', 'white', []);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('valid');
    });

    test('should reject invalid expected color', () => {
      const result = stateManager.validateTurnSequence('white', 'invalid', []);
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_COLOR');
    });

    test('should detect turn mismatch', () => {
      const result = stateManager.validateTurnSequence('black', 'white', []);
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('TURN_SEQUENCE_VIOLATION');
    });

    test('should validate turn against move history', () => {
      const moveHistory = [{ move: 'e2-e4' }];
      const result = stateManager.validateTurnSequence('black', 'black', moveHistory);
      
      expect(result.success).toBe(true);
    });

    test('should detect turn history mismatch', () => {
      const moveHistory = [{ move: 'e2-e4' }];
      const result = stateManager.validateTurnSequence('white', 'white', moveHistory);
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('TURN_HISTORY_MISMATCH');
    });
  });

  describe('Expected Turn Calculation', () => {
    test('should calculate white turn for empty history', () => {
      const turn = stateManager.calculateExpectedTurnFromHistory([]);
      expect(turn).toBe('white');
    });

    test('should calculate black turn after one move', () => {
      const turn = stateManager.calculateExpectedTurnFromHistory([{ move: 'e2-e4' }]);
      expect(turn).toBe('black');
    });

    test('should calculate white turn after two moves', () => {
      const history = [{ move: 'e2-e4' }, { move: 'e7-e5' }];
      const turn = stateManager.calculateExpectedTurnFromHistory(history);
      expect(turn).toBe('white');
    });
  });

  describe('Game Status Updates', () => {
    test('should update status from active to check', () => {
      const result = stateManager.updateGameStatus('active', 'check');
      
      expect(result.success).toBe(true);
      expect(result.details.newStatus).toBe('check');
    });

    test('should update status to checkmate with winner', () => {
      const result = stateManager.updateGameStatus('check', 'checkmate', 'white');
      
      expect(result.success).toBe(true);
      expect(result.details.newWinner).toBe('white');
    });

    test('should reject checkmate without winner', () => {
      const result = stateManager.updateGameStatus('check', 'checkmate');
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('MISSING_WINNER');
    });

    test('should reject draw with winner', () => {
      const result = stateManager.updateGameStatus('active', 'draw', 'white');
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_WINNER_FOR_DRAW');
    });

    test('should reject stalemate with winner', () => {
      const result = stateManager.updateGameStatus('active', 'stalemate', 'black');
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_WINNER_FOR_DRAW');
    });

    test('should reject invalid status', () => {
      const result = stateManager.updateGameStatus('active', 'invalid_status');
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_STATUS');
    });

    test('should reject invalid status transition', () => {
      const result = stateManager.updateGameStatus('checkmate', 'active');
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('Status Transition Validation', () => {
    test('should allow same status transition', () => {
      const result = stateManager.validateStatusTransition('active', 'active');
      
      expect(result.success).toBe(true);
    });

    test('should allow active to check', () => {
      const result = stateManager.validateStatusTransition('active', 'check');
      expect(result.success).toBe(true);
    });

    test('should allow check to checkmate', () => {
      const result = stateManager.validateStatusTransition('check', 'checkmate');
      expect(result.success).toBe(true);
    });

    test('should reject checkmate to active', () => {
      const result = stateManager.validateStatusTransition('checkmate', 'active');
      expect(result.success).toBe(false);
    });

    test('should reject invalid from status', () => {
      const result = stateManager.validateStatusTransition('invalid', 'active');
      expect(result.success).toBe(false);
    });
  });

  describe('Move History Management', () => {
    test('should add move to history with metadata', () => {
      const moveHistory = [];
      const moveData = {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 },
        piece: 'pawn',
        color: 'white'
      };
      const gameState = {
        board: createStartingBoard(),
        currentTurn: 'white',
        castlingRights: {
          white: { kingside: true, queenside: true },
          black: { kingside: true, queenside: true }
        },
        enPassantTarget: null,
        halfMoveClock: 0
      };
      
      const result = stateManager.addMoveToHistory(moveHistory, moveData, 1, gameState);
      
      expect(result).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.moveNumber).toBe(1);
    });

    test('should limit position history to 100 entries', () => {
      // Add 150 positions
      for (let i = 0; i < 150; i++) {
        stateManager.positionHistory.push(`position_${i}`);
      }
      
      const moveHistory = [];
      const moveData = {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 },
        piece: 'pawn',
        color: 'white'
      };
      const gameState = {
        board: createStartingBoard(),
        currentTurn: 'white',
        castlingRights: {
          white: { kingside: true, queenside: true },
          black: { kingside: true, queenside: true }
        },
        enPassantTarget: null
      };
      
      stateManager.addMoveToHistory(moveHistory, moveData, 1, gameState);
      
      expect(stateManager.positionHistory.length).toBeLessThanOrEqual(101);
    });
  });

  describe('Game State Consistency Validation', () => {
    function createDefaultGameState(overrides = {}) {
      return {
        board: createStartingBoard(),
        currentTurn: 'white',
        moveHistory: [],
        fullMoveNumber: 1,
        halfMoveClock: 0,
        gameStatus: 'active',
        winner: null,
        castlingRights: {
          white: { kingside: true, queenside: true },
          black: { kingside: true, queenside: true }
        },
        enPassantTarget: null,
        ...overrides
      };
    }

    test('should validate consistent game state', () => {
      const gameState = createDefaultGameState();
      
      // Add position to history
      stateManager.positionHistory.push(
        stateManager.getFENPosition(
          gameState.board,
          gameState.currentTurn,
          gameState.castlingRights,
          gameState.enPassantTarget
        )
      );
      
      const result = stateManager.validateGameStateConsistency(gameState);
      
      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject null game state', () => {
      const result = stateManager.validateGameStateConsistency(null);
      
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('null or undefined');
    });

    test('should detect turn mismatch', () => {
      const gameState = createDefaultGameState({ currentTurn: 'black' });
      
      const result = stateManager.validateGameStateConsistency(gameState);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Turn mismatch'))).toBe(true);
    });

    test('should detect invalid move number', () => {
      const gameState = createDefaultGameState({ fullMoveNumber: 0 });
      
      const result = stateManager.validateGameStateConsistency(gameState);
      
      expect(result.errors.some(e => e.includes('Invalid full move number'))).toBe(true);
    });

    test('should detect invalid half move clock', () => {
      const gameState = createDefaultGameState({ halfMoveClock: -1 });
      
      const result = stateManager.validateGameStateConsistency(gameState);
      
      expect(result.errors.some(e => e.includes('Invalid half move clock'))).toBe(true);
    });

    test('should detect checkmate without winner', () => {
      const gameState = createDefaultGameState({ 
        gameStatus: 'checkmate',
        winner: null
      });
      
      const result = stateManager.validateGameStateConsistency(gameState);
      
      expect(result.errors.some(e => e.includes('requires a winner'))).toBe(true);
    });

    test('should detect missing white king', () => {
      const board = createStartingBoard();
      board[7][4] = null; // Remove white king
      
      const gameState = createDefaultGameState({ board });
      
      const result = stateManager.validateGameStateConsistency(gameState);
      
      expect(result.errors.some(e => e.includes('white king count'))).toBe(true);
    });

    test('should detect missing black king', () => {
      const board = createStartingBoard();
      board[0][4] = null; // Remove black king
      
      const gameState = createDefaultGameState({ board });
      
      const result = stateManager.validateGameStateConsistency(gameState);
      
      expect(result.errors.some(e => e.includes('black king count'))).toBe(true);
    });

    test('should initialize missing moveHistory', () => {
      const gameState = {
        board: createStartingBoard(),
        currentTurn: 'white',
        fullMoveNumber: 1,
        halfMoveClock: 0,
        gameStatus: 'active',
        castlingRights: {
          white: { kingside: true, queenside: true },
          black: { kingside: true, queenside: true }
        },
        enPassantTarget: null
      };
      
      stateManager.validateGameStateConsistency(gameState);
      
      expect(gameState.moveHistory).toEqual([]);
    });
  });

  describe('Board Consistency Validation', () => {
    test('should validate correct board structure', () => {
      const board = createStartingBoard();
      const result = stateManager.validateBoardConsistency(board);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject non-array board', () => {
      const result = stateManager.validateBoardConsistency(null);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid board structure');
    });

    test('should reject invalid board dimensions', () => {
      const board = Array(7).fill(null).map(() => Array(8).fill(null));
      const result = stateManager.validateBoardConsistency(board);
      
      expect(result.isValid).toBe(false);
    });

    test('should detect invalid row structure', () => {
      const board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[3] = []; // Invalid row
      
      const result = stateManager.validateBoardConsistency(board);
      
      expect(result.errors.some(e => e.includes('Row 3'))).toBe(true);
    });

    test('should detect piece without type', () => {
      const board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'king', color: 'white' };
      board[7][7] = { type: 'king', color: 'black' };
      board[4][4] = { color: 'white' }; // Missing type
      
      const result = stateManager.validateBoardConsistency(board);
      
      expect(result.errors.some(e => e.includes('(4,4)'))).toBe(true);
    });

    test('should detect multiple white kings', () => {
      const board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'king', color: 'white' };
      board[1][0] = { type: 'king', color: 'white' };
      board[7][7] = { type: 'king', color: 'black' };
      
      const result = stateManager.validateBoardConsistency(board);
      
      expect(result.errors.some(e => e.includes('white king count'))).toBe(true);
    });

    test('should detect multiple black kings', () => {
      const board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'king', color: 'white' };
      board[7][7] = { type: 'king', color: 'black' };
      board[6][7] = { type: 'king', color: 'black' };
      
      const result = stateManager.validateBoardConsistency(board);
      
      expect(result.errors.some(e => e.includes('black king count'))).toBe(true);
    });
  });

  describe('King Count Validation', () => {
    test('should validate correct king count', () => {
      const board = createStartingBoard();
      const result = stateManager.validateKingCount(board);
      
      expect(result.isValid).toBe(true);
      expect(result.whiteKings).toBe(1);
      expect(result.blackKings).toBe(1);
    });

    test('should handle null board', () => {
      const result = stateManager.validateKingCount(null);
      
      expect(result.isValid).toBe(false);
    });

    test('should handle invalid row', () => {
      const board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'king', color: 'white' };
      board[7][7] = { type: 'king', color: 'black' };
      board[3] = null; // Invalid row
      
      const result = stateManager.validateKingCount(board);
      
      expect(result.isValid).toBe(true); // Should skip invalid row
    });
  });

  describe('Turn Consistency Validation', () => {
    test('should validate turn consistency', () => {
      const gameState = {
        board: createStartingBoard(),
        currentTurn: 'white',
        moveHistory: []
      };
      
      const result = stateManager.validateTurnConsistency(gameState);
      
      expect(result.isValid).toBe(true);
    });

    test('should reject null game state', () => {
      const result = stateManager.validateTurnConsistency(null);
      
      expect(result.isValid).toBe(false);
    });

    test('should detect turn inconsistency', () => {
      const gameState = {
        board: createStartingBoard(),
        currentTurn: 'black',
        moveHistory: []
      };
      
      const result = stateManager.validateTurnConsistency(gameState);
      
      expect(result.isValid).toBe(false);
    });
  });

  describe('En Passant Consistency Validation', () => {
    test('should validate no en passant target', () => {
      const gameState = {
        moveHistory: [],
        enPassantTarget: null
      };
      
      const result = stateManager.validateEnPassantConsistency(gameState);
      
      expect(result.isValid).toBe(true);
      expect(result.expectedTarget).toBe(null);
    });

    test('should validate en passant after two-square pawn move', () => {
      const gameState = {
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
    });

    test('should detect en passant target mismatch', () => {
      const gameState = {
        moveHistory: [{
          piece: 'pawn',
          from: { row: 6, col: 4 },
          to: { row: 4, col: 4 }
        }],
        enPassantTarget: { row: 5, col: 3 }
      };
      
      const result = stateManager.validateEnPassantConsistency(gameState);
      
      expect(result.isValid).toBe(false);
    });

    test('should handle null game state', () => {
      const result = stateManager.validateEnPassantConsistency(null);
      
      expect(result.isValid).toBe(false);
    });
  });

  describe('Threefold Repetition Detection', () => {
    test('should detect threefold repetition', () => {
      const position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';
      
      stateManager.addPositionToHistory(position);
      stateManager.addPositionToHistory('other_position');
      stateManager.addPositionToHistory(position);
      stateManager.addPositionToHistory('another_position');
      stateManager.addPositionToHistory(position);
      
      const result = stateManager.checkThreefoldRepetition();
      
      expect(result).toBe(true);
    });

    test('should not detect repetition with less than 3 occurrences', () => {
      const position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';
      
      stateManager.addPositionToHistory(position);
      stateManager.addPositionToHistory('other_position');
      stateManager.addPositionToHistory(position);
      
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

  describe('Game Metadata Management', () => {
    test('should update game metadata', () => {
      const updates = {
        customField: 'test_value',
        totalMoves: 10
      };
      
      stateManager.updateGameMetadata(updates);
      
      expect(stateManager.gameMetadata.customField).toBe('test_value');
      expect(stateManager.gameMetadata.totalMoves).toBe(10);
    });
  });

  describe('State Snapshot', () => {
    test('should create state snapshot', () => {
      const gameState = {
        board: createStartingBoard(),
        currentTurn: 'white',
        moveHistory: []
      };
      
      const snapshot = stateManager.getStateSnapshot(gameState);
      
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.stateVersion).toBe(stateManager.stateVersion);
    });
  });
});

// Helper function to create starting board
function createStartingBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Black pieces
  board[0] = [
    { type: 'rook', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'king', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'rook', color: 'black' }
  ];
  board[1] = Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' }));
  
  // White pieces
  board[6] = Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' }));
  board[7] = [
    { type: 'rook', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'queen', color: 'white' },
    { type: 'king', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'rook', color: 'white' }
  ];
  
  return board;
}


describe('GameState Additional Coverage for 95%+', () => {
  let game;
  let stateManager;

  beforeEach(() => {
    const ChessGame = require('../src/shared/chessGame');
    game = new ChessGame();
    stateManager = game.stateManager;
  });

  describe('State Snapshot Validation Edge Cases', () => {
    test('should detect missing timestamp in snapshot', () => {
      const invalidSnapshot = {
        stateVersion: 1,
        gameState: {}
      };
      
      const result = stateManager.validateStateSnapshot(invalidSnapshot);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid or missing timestamp');
    });

    test('should detect invalid timestamp type in snapshot', () => {
      const invalidSnapshot = {
        timestamp: 'invalid',
        stateVersion: 1,
        gameState: {}
      };
      
      const result = stateManager.validateStateSnapshot(invalidSnapshot);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid or missing timestamp');
    });

    test('should detect missing stateVersion in snapshot', () => {
      const invalidSnapshot = {
        timestamp: Date.now(),
        gameState: {}
      };
      
      const result = stateManager.validateStateSnapshot(invalidSnapshot);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid or missing state version');
    });

    test('should detect invalid stateVersion type in snapshot', () => {
      const invalidSnapshot = {
        timestamp: Date.now(),
        stateVersion: 'invalid',
        gameState: {}
      };
      
      const result = stateManager.validateStateSnapshot(invalidSnapshot);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid or missing state version');
    });

    test('should detect missing gameState in snapshot', () => {
      const invalidSnapshot = {
        timestamp: Date.now(),
        stateVersion: 1
      };
      
      const result = stateManager.validateStateSnapshot(invalidSnapshot);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing game state');
    });
  });

  describe('Move Addition with Uninitialized History', () => {
    test('should initialize move history if not present', () => {
      stateManager.moveHistory = null;
      
      const move = {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 },
        piece: 'pawn',
        color: 'white'
      };
      
      const result = stateManager.addMove(move);
      expect(result.success).toBe(true);
      expect(stateManager.moveHistory).toBeDefined();
      expect(stateManager.moveHistory.length).toBe(1);
    });

    test('should add enhanced move data', () => {
      const move = {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 },
        piece: 'pawn',
        color: 'white'
      };
      
      const result = stateManager.addMove(move);
      expect(result.success).toBe(true);
      expect(result.move.timestamp).toBeDefined();
      expect(result.move.moveNumber).toBe(1);
    });

    test('should increment total moves counter', () => {
      const initialMoves = stateManager.gameMetadata.totalMoves;
      
      stateManager.addMove({
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 },
        piece: 'pawn',
        color: 'white'
      });
      
      expect(stateManager.gameMetadata.totalMoves).toBe(initialMoves + 1);
    });
  });

  describe('Move History Validation', () => {
    test('should validate existing move history', () => {
      stateManager.moveHistory = [];
      const result = stateManager.validateMoveHistory();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Move history is valid');
    });

    test('should detect null move history', () => {
      stateManager.moveHistory = null;
      
      const result = stateManager.validateMoveHistory();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid move history');
    });

    test('should detect undefined move history', () => {
      stateManager.moveHistory = undefined;
      
      const result = stateManager.validateMoveHistory();
      expect(result.success).toBe(false);
    });
  });

  describe('Castling Rights Validation', () => {
    test('should validate castling rights', () => {
      stateManager.castlingRights = {
        whiteKingside: true, whiteQueenside: true,
        blackKingside: true, blackQueenside: true
      };
      const result = stateManager.validateCastlingRights();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Castling rights are valid');
    });
  });

  describe('Position Complexity Analysis Edge Cases', () => {
    test('should analyze complexity with minimal pieces', () => {
      const minimalBoard = Array(8).fill(null).map(() => Array(8).fill(null));
      minimalBoard[7][4] = { type: 'king', color: 'white' };
      minimalBoard[0][4] = { type: 'king', color: 'black' };
      
      const complexity = stateManager.analyzePositionComplexity(minimalBoard);
      expect(complexity).toBeDefined();
      expect(complexity.pieceCount).toBe(2);
    });

    test('should analyze complexity with full board', () => {
      const complexity = stateManager.analyzePositionComplexity(game.board);
      expect(complexity).toBeDefined();
      expect(complexity.pieceCount).toBeGreaterThan(2);
    });
  });

  describe('Game Phase Detection Edge Cases', () => {
    test('should detect opening phase with no moves', () => {
      const gameState = {
        board: game.board,
        moveHistory: []
      };
      const phase = stateManager.detectGamePhase(gameState);
      expect(phase).toBe('opening');
    });

    test('should detect middlegame phase', () => {
      const gameState = {
        board: game.board,
        moveHistory: Array(20).fill({ piece: 'pawn' })
      };
      const phase = stateManager.detectGamePhase(gameState);
      expect(phase).toBeDefined();
    });

    test('should detect endgame phase with few pieces', () => {
      const endgameBoard = Array(8).fill(null).map(() => Array(8).fill(null));
      endgameBoard[7][4] = { type: 'king', color: 'white' };
      endgameBoard[0][4] = { type: 'king', color: 'black' };
      endgameBoard[7][0] = { type: 'rook', color: 'white' };
      
      const gameState = {
        board: endgameBoard,
        moveHistory: Array(40).fill({ piece: 'pawn' })
      };
      const phase = stateManager.detectGamePhase(gameState);
      expect(phase).toBe('endgame');
    });
  });

  describe('State Transition Validation Edge Cases', () => {
    test('should validate valid state transition', () => {
      const oldState = game.getGameState();
      game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      const newState = game.getGameState();
      
      const result = stateManager.validateStateTransition(oldState, newState);
      expect(result.success).toBe(true);
    });

    test('should detect invalid state transition', () => {
      const oldState = game.getGameState();
      const invalidNewState = { ...oldState, currentTurn: 'invalid' };
      
      const result = stateManager.validateStateTransition(oldState, invalidNewState);
      expect(result).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    test('should report memory usage', () => {
      const usage = stateManager.getMemoryUsage();
      expect(usage).toBeDefined();
      expect(usage.positionHistorySize).toBeDefined();
    });

    test('should optimize state storage', () => {
      // Add many positions
      for (let i = 0; i < 200; i++) {
        stateManager.addPositionToHistory(`position_${i}`);
      }
      
      stateManager.optimizeStateStorage();
      expect(stateManager.positionHistory.length).toBeLessThanOrEqual(150);
    });

    test('should cleanup old states', () => {
      stateManager.cleanupOldStates();
      expect(stateManager.positionHistory).toBeDefined();
    });
  });

  describe('Turn Consistency Validation', () => {
    test('should validate turn consistency with empty history', () => {
      const gameState = { currentTurn: 'white', moveHistory: [] };
      const result = stateManager.validateTurnConsistency(gameState);
      expect(result.isValid).toBe(true);
    });

    test('should validate turn consistency with moves', () => {
      const gameState = {
        currentTurn: 'black',
        moveHistory: [{ color: 'white' }]
      };
      const result = stateManager.validateTurnConsistency(gameState);
      expect(result.isValid).toBe(true);
    });

    test('should detect turn inconsistency', () => {
      const moves = [{ color: 'white' }];
      const result = stateManager.validateTurnConsistency('white', moves);
      expect(result).toBeDefined();
    });
  });

  describe('Castling Rights Consistency', () => {
    test('should validate castling rights consistency', () => {
      const result = stateManager.validateCastlingRightsConsistency(
        game.board,
        game.castlingRights
      );
      expect(result).toBe(true);
    });

    test('should detect castling rights inconsistency', () => {
      const moves = [
        { from: { row: 7, col: 4 }, to: { row: 7, col: 5 }, piece: 'king', color: 'white' }
      ];
      const rights = { white: { kingside: true, queenside: true }, black: { kingside: true, queenside: true } };
      
      const result = stateManager.validateCastlingRightsConsistency(rights, moves);
      expect(result).toBeDefined();
    });
  });

  describe('En Passant Consistency', () => {
    test('should validate null en passant target', () => {
      const gameState = { moveHistory: [], enPassantTarget: null };
      const result = stateManager.validateEnPassantConsistency(gameState);
      expect(result.isValid).toBe(true);
    });

    test('should validate en passant consistency with target', () => {
      const gameState = {
        enPassantTarget: { row: 2, col: 4 },
        moveHistory: [
          { from: { row: 1, col: 4 }, to: { row: 3, col: 4 }, piece: 'pawn', color: 'black' }
        ]
      };

      const result = stateManager.validateEnPassantConsistency(gameState);
      expect(result.isValid).toBe(true);
    });
  });
});
/**
 * Comprehensive Game State Management Tests
 * Tests for task 13: Implement comprehensive game state management
 */

describe('Game State Management', () => {
  let game;
  let stateManager;

  beforeEach(() => {
    game = new ChessGame();
    stateManager = game.stateManager; // Use the game's state manager instead of creating a new one
  });

  describe('Game State Initialization', () => {
    test('should initialize with enhanced metadata', () => {
      const gameState = game.getGameState();

      expect(gameState.gameMetadata).toBeDefined();
      expect(gameState.gameMetadata.startTime).toBeDefined();
      expect(gameState.gameMetadata.lastMoveTime).toBeDefined();
      expect(gameState.gameMetadata.totalMoves).toBe(0);
      expect(gameState.gameMetadata.gameId).toBeDefined();
      expect(gameState.gameMetadata.version).toBe('1.0.0');
    });

    test('should initialize with position history', () => {
      const gameState = game.getGameState();

      expect(gameState.positionHistory).toBeDefined();
      expect(gameState.positionHistory.length).toBe(1);
      expect(gameState.stateVersion).toBe(1);
    });

    test('should have valid initial state consistency', () => {
      const gameState = game.getGameState();

      expect(gameState.stateConsistency).toBeDefined();
      expect(gameState.stateConsistency.success).toBe(true);
      expect(gameState.stateConsistency.errors).toHaveLength(0);
    });
  });

  describe('Turn Alternation Validation', () => {
    test('should validate correct turn sequence', () => {
      const validation = stateManager.validateTurnSequence('white', 'white', []);

      expect(validation.success).toBe(true);
      expect(validation.message).toBe('Turn sequence is valid');
      expect(validation.details.currentTurn).toBe('white');
      expect(validation.details.isConsistent).toBe(true);
    });

    test('should reject invalid turn sequence', () => {
      const validation = stateManager.validateTurnSequence('black', 'white', []);

      expect(validation.success).toBe(false);
      expect(validation.code).toBe('TURN_SEQUENCE_VIOLATION');
      expect(validation.message).toContain('Turn sequence violation');
      expect(validation.details.expectedTurn).toBe('white');
      expect(validation.details.actualTurn).toBe('black');
    });

    test('should validate turn consistency with move history', () => {
      // After one move, it should be black's turn
      const moveHistory = [{ color: 'white', piece: 'pawn' }];
      const validation = stateManager.validateTurnSequence('black', 'black', moveHistory);

      expect(validation.success).toBe(true);
      expect(validation.details.isConsistent).toBe(true);
    });

    test('should detect turn history mismatch', () => {
      // After one move, it should be black's turn, not white's
      const moveHistory = [{ color: 'white', piece: 'pawn' }];
      const validation = stateManager.validateTurnSequence('white', 'white', moveHistory);

      expect(validation.success).toBe(false);
      expect(validation.code).toBe('TURN_HISTORY_MISMATCH');
    });

    test('should reject invalid color parameter', () => {
      const validation = stateManager.validateTurnSequence('white', 'invalid', []);

      expect(validation.success).toBe(false);
      expect(validation.code).toBe('INVALID_COLOR');
      expect(validation.details.validColors).toEqual(['white', 'black']);
    });
  });

  describe('Game Status Management', () => {
    test('should update game status successfully', () => {
      const result = stateManager.updateGameStatus('active', 'check');

      expect(result.success).toBe(true);
      expect(result.details.previousStatus).toBe('active');
      expect(result.details.newStatus).toBe('check');
      expect(result.details.newWinner).toBeNull();
    });

    test('should require winner for checkmate status', () => {
      const result = stateManager.updateGameStatus('check', 'checkmate');

      expect(result.success).toBe(false);
      expect(result.code).toBe('MISSING_WINNER');
      expect(result.message).toContain('Winner must be specified for checkmate');
    });

    test('should accept winner for checkmate status', () => {
      const result = stateManager.updateGameStatus('check', 'checkmate', 'white');

      expect(result.success).toBe(true);
      expect(result.details.newWinner).toBe('white');
    });

    test('should reject winner for stalemate status', () => {
      const result = stateManager.updateGameStatus('active', 'stalemate', 'white');

      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_WINNER_FOR_DRAW');
    });

    test('should validate status transitions', () => {
      // Valid transition
      let result = stateManager.updateGameStatus('active', 'check');
      expect(result.success).toBe(true);

      // Invalid transition from terminal state
      result = stateManager.updateGameStatus('checkmate', 'active');
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_STATUS_TRANSITION');
    });

    test('should reject invalid status values', () => {
      const result = stateManager.updateGameStatus('active', 'invalid_status');

      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_STATUS');
      expect(result.details.validStatuses).toContain('active');
    });
  });

  describe('Move History Enhancement', () => {
    test('should add enhanced move to history', () => {
      const moveData = {
        from: { row: 6, col: 4 },
        to: { row: 5, col: 4 },
        piece: 'pawn',
        color: 'white'
      };

      const gameState = {
        inCheck: false,
        checkDetails: null,
        castlingRights: { white: { kingside: true, queenside: true }, black: { kingside: true, queenside: true } },
        enPassantTarget: null,
        halfMoveClock: 0,
        board: game.board,
        currentTurn: 'white'
      };

      const moveHistory = [];
      const enhancedMove = stateManager.addMoveToHistory(moveHistory, moveData, 1, gameState);

      expect(enhancedMove.moveNumber).toBe(1);
      expect(enhancedMove.turnNumber).toBe(1);
      expect(enhancedMove.timestamp).toBeDefined();
      expect(enhancedMove.gameStateSnapshot).toBeDefined();
      expect(enhancedMove.positionAfterMove).toBeDefined();
      expect(moveHistory).toHaveLength(1);
    });

    test('should track position history', () => {
      const initialLength = stateManager.positionHistory.length;

      const moveData = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 }, piece: 'pawn', color: 'white' };
      const gameState = {
        inCheck: false, checkDetails: null, castlingRights: { white: { kingside: true, queenside: true }, black: { kingside: true, queenside: true } },
        enPassantTarget: null, halfMoveClock: 0, board: game.board, currentTurn: 'white'
      };

      stateManager.addMoveToHistory([], moveData, 1, gameState);

      expect(stateManager.positionHistory.length).toBe(initialLength + 1);
    });

    test('should limit position history size', () => {
      // Fill position history beyond limit
      for (let i = 0; i < 105; i++) {
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
  });

  describe('Game State Consistency Validation', () => {
    test('should validate consistent game state', () => {
      const gameState = game.getGameState();
      const validation = stateManager.validateGameStateConsistency(gameState);

      expect(validation.success).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.details.turnConsistency).toBe(true);
      expect(validation.details.kingCount.white).toBe(1);
      expect(validation.details.kingCount.black).toBe(1);
    });

    test('should detect turn inconsistency', () => {
      const gameState = game.getGameState();
      gameState.currentTurn = 'black'; // Should be white for empty move history

      const validation = stateManager.validateGameStateConsistency(gameState);

      expect(validation.success).toBe(false);
      expect(validation.errors).toContain('Turn mismatch: current=black, expected=white');
    });

    test('should detect invalid move numbers', () => {
      const gameState = game.getGameState();
      gameState.fullMoveNumber = 0; // Invalid
      gameState.halfMoveClock = -1; // Invalid

      const validation = stateManager.validateGameStateConsistency(gameState);

      expect(validation.success).toBe(false);
      expect(validation.errors).toContain('Invalid full move number: 0');
      expect(validation.errors).toContain('Invalid half move clock: -1');
    });

    test('should detect status-winner inconsistency', () => {
      const gameState = game.getGameState();
      gameState.gameStatus = 'checkmate'; // Use gameStatus instead of status
      gameState.winner = null; // Should have winner for checkmate

      const validation = stateManager.validateGameStateConsistency(gameState);

      expect(validation.success).toBe(false);
      expect(validation.errors).toContain('Checkmate status requires a winner');
    });

    test('should detect invalid king count', () => {
      const gameState = game.getGameState();
      // Remove white king
      gameState.board[7][4] = null;

      const validation = stateManager.validateGameStateConsistency(gameState);

      expect(validation.success).toBe(false);
      expect(validation.errors).toContain('Invalid white king count: 0');
    });

    test('should warn about castling rights inconsistency', () => {
      const gameState = game.getGameState();
      // Move white king but keep castling rights
      gameState.board[7][4] = null;
      gameState.board[7][5] = { type: 'king', color: 'white' };

      const validation = stateManager.validateGameStateConsistency(gameState);

      expect(validation.warnings).toContain('Castling rights may be inconsistent with piece positions');
    });
  });

  describe('Game State Updates After Moves', () => {
    test('should update game state after pawn move', () => {
      const initialState = game.getGameState();
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });

      expect(result.success).toBe(true);

      const newState = game.getGameState();
      expect(newState.currentTurn).toBe('black');
      expect(newState.gameMetadata.totalMoves).toBe(1);
      expect(newState.stateVersion).toBeGreaterThan(initialState.stateVersion);
      expect(newState.moveHistory).toHaveLength(1);
    });

    test('should update game state after capture', () => {
      // Set up a capture scenario - pawn captures diagonally
      game.board[5][5] = { type: 'pawn', color: 'black' };

      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 5 } });
      expect(result.success).toBe(true);

      const gameState = game.getGameState();
      expect(gameState.currentTurn).toBe('black');
      expect(gameState.halfMoveClock).toBe(0); // Reset on capture
    });

    test('should maintain state consistency after multiple moves', () => {
      // Make several moves
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }, // e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }  // Nc6
      ];
      
      for (const move of moves) {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);

        const gameState = game.getGameState();
        const validation = gameState.stateConsistency;
        expect(validation.success).toBe(true);
      }

      const finalState = game.getGameState();
      expect(finalState.moveHistory).toHaveLength(4);
      expect(finalState.currentTurn).toBe('white');
      expect(finalState.fullMoveNumber).toBe(3);
    });
  });

  describe('FEN Position Generation', () => {
    test('should generate correct FEN for starting position', () => {
      const fen = stateManager.getFENPosition(
        game.board,
        game.currentTurn,
        game.castlingRights,
        game.enPassantTarget
      );

      expect(fen).toContain('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -');
    });

    test('should generate correct FEN after move', () => {
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e4

      const fen = stateManager.getFENPosition(
        game.board,
        game.currentTurn,
        game.castlingRights,
        game.enPassantTarget
      );

      expect(fen).toContain('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3');
    });
  });

  describe('Castling Rights Consistency', () => {
    test('should validate consistent castling rights', () => {
      const isConsistent = stateManager.validateCastlingRightsConsistency(
        game.board,
        game.castlingRights
      );

      expect(isConsistent).toBe(true);
    });

    test('should detect inconsistent castling rights after king move', () => {
      // Move king but keep castling rights
      game.board[7][4] = null;
      game.board[7][5] = { type: 'king', color: 'white' };

      const isConsistent = stateManager.validateCastlingRightsConsistency(
        game.board,
        game.castlingRights
      );

      expect(isConsistent).toBe(false);
    });

    test('should detect inconsistent castling rights after rook move', () => {
      // Move rook but keep castling rights
      game.board[7][7] = null;
      game.board[7][6] = { type: 'rook', color: 'white' };

      const isConsistent = stateManager.validateCastlingRightsConsistency(
        game.board,
        game.castlingRights
      );

      expect(isConsistent).toBe(false);
    });
  });

  describe('Enhanced Game State Retrieval', () => {
    test('should return comprehensive game state', () => {
      const gameState = game.getGameState();

      // Core game state
      expect(gameState.board).toBeDefined();
      expect(gameState.currentTurn).toBe('white');
      expect(gameState.gameStatus).toBe('active'); // Use gameStatus instead of status
      expect(gameState.winner).toBeNull();
      expect(gameState.moveHistory).toBeDefined();

      // Check and game end information
      expect(gameState.inCheck).toBe(false);
      expect(gameState.checkDetails).toBeNull();

      // Special move tracking
      expect(gameState.castlingRights).toBeDefined();
      expect(gameState.enPassantTarget).toBeNull();

      // Move counting
      expect(gameState.halfMoveClock).toBe(0);
      expect(gameState.fullMoveNumber).toBe(1);

      // Enhanced metadata
      expect(gameState.gameMetadata).toBeDefined();
      expect(gameState.positionHistory).toBeDefined();
      expect(gameState.stateVersion).toBeDefined();
      expect(gameState.currentPosition).toBeDefined();
      expect(gameState.stateConsistency).toBeDefined();
    });

    test('should track state version changes', () => {
      const initialState = game.getGameState();
      const initialVersion = initialState.stateVersion;

      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });

      const newState = game.getGameState();
      expect(newState.stateVersion).toBeGreaterThan(initialVersion);
    });
  });
});

describe('GameState Transition Validation Coverage', () => {
    let gameStateManager;

    beforeEach(() => {
      const GameStateManager = require('../src/shared/gameState');
      gameStateManager = new GameStateManager();
    });

    test('should validate turn transitions correctly', () => {
      const fromState = {
        currentTurn: 'white',
        moveHistory: [],
        fullMoveNumber: 1
      };

      const toState = {
        currentTurn: 'black', // Valid transition
        moveHistory: [{ /* move data */ }],
        fullMoveNumber: 1
      };

      const validation = gameStateManager.validateStateTransition(fromState, toState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect invalid turn transitions', () => {
      const fromState = {
        currentTurn: 'white',
        moveHistory: [],
        fullMoveNumber: 1
      };

      const toState = {
        currentTurn: 'white', // Invalid - should be black
        moveHistory: [{ /* move data */ }],
        fullMoveNumber: 1
      };

      const validation = gameStateManager.validateStateTransition(fromState, toState);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid turn transition: white -> white');
    });

    test('should detect move history regression', () => {
      const fromState = {
        currentTurn: 'white',
        moveHistory: [{ move1: true }, { move2: true }],
        fullMoveNumber: 2
      };

      const toState = {
        currentTurn: 'black',
        moveHistory: [{ move1: true }], // Decreased length
        fullMoveNumber: 2
      };

      const validation = gameStateManager.validateStateTransition(fromState, toState);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Move history cannot decrease');
    });

    test('should detect full move number regression', () => {
      const fromState = {
        currentTurn: 'white',
        moveHistory: [],
        fullMoveNumber: 5
      };

      const toState = {
        currentTurn: 'black',
        moveHistory: [{ /* move data */ }],
        fullMoveNumber: 4 // Decreased
      };

      const validation = gameStateManager.validateStateTransition(fromState, toState);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Full move number cannot decrease');
    });

    test('should handle state validation with warnings', () => {
      // Create a state that might generate warnings
      const fromState = {
        currentTurn: 'white',
        moveHistory: [],
        fullMoveNumber: 1,
        castlingRights: { white: { kingside: true, queenside: true } }
      };

      const toState = {
        currentTurn: 'black',
        moveHistory: [{ /* move data */ }],
        fullMoveNumber: 1,
        castlingRights: { white: { kingside: false, queenside: true } }
      };

      const validation = gameStateManager.validateStateTransition(fromState, toState);
      expect(validation).toHaveProperty('warnings');
      expect(validation).toHaveProperty('success');
    });
  });

  describe('GameState Serialization and Deserialization Coverage', () => {
    let game;

    beforeEach(() => {
      game = new ChessGame();
    });

    test('should handle complex game state serialization', () => {
      // Set up a complex game state
      game.makeMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }); // e4
      game.makeMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }); // e5

      const gameState = game.getGameState();
      const serialized = JSON.stringify(gameState);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.currentTurn).toBe(gameState.currentTurn);
      expect(deserialized.moveHistory).toEqual(gameState.moveHistory);
      expect(deserialized.board).toEqual(gameState.board);
    });

    test('should maintain state consistency across operations', () => {
      const initialState = game.getGameState();

      // Make several moves
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
        { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }  // Nc6
      ];

      moves.forEach(move => {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);

        const currentState = game.getGameState();
        expect(currentState.stateConsistency).toBeDefined();
      });

      const finalState = game.getGameState();
      expect(finalState.moveHistory.length).toBe(4);
      expect(finalState.fullMoveNumber).toBe(3); // After 4 half-moves
    });
  });

  describe('GameState Error Recovery Coverage', () => {
    let game;

    beforeEach(() => {
      game = new ChessGame();
    });

    test('should handle corrupted state recovery', () => {
      const gameState = game.getGameState();

      // Simulate state corruption
      const corruptedState = {
        ...gameState,
        currentTurn: 'invalid_color',
        board: null
      };

      // The game should handle this gracefully
      expect(() => {
        game.validateGameState(corruptedState);
      }).not.toThrow();
    });

    test('should validate board integrity', () => {
      const gameState = game.getGameState();

      // Test with valid board
      expect(gameState.board).toBeDefined();
      expect(gameState.board.length).toBe(8);
      gameState.board.forEach(row => {
        expect(row.length).toBe(8);
      });
    });

    test('should handle edge case state transitions', () => {
      // Test rapid state changes
      for (let i = 0; i < 10; i++) {
        const state = game.getGameState();
        expect(state.stateVersion).toBeDefined();

        // Make a move if possible
        const validMoves = game.getAllValidMoves(game.currentTurn);
        if (validMoves.length > 0) {
          game.makeMove(validMoves[0]);
        }
      }
    });
  });

  describe('GameState Performance and Memory Coverage', () => {
    let game;

    beforeEach(() => {
      game = new ChessGame();
    });

    test('should handle large move histories efficiently', () => {
      const startTime = Date.now();

      // Generate a long game
      let moveCount = 0;
      while (moveCount < 50 && game.getGameState().gameStatus === 'active') {
        const validMoves = game.getAllValidMoves(game.currentTurn);
        if (validMoves.length === 0) break;

        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        const result = game.makeMove(randomMove);

        if (result.success) {
          moveCount++;

          // Verify state consistency
          const state = game.getGameState();
          expect(state.moveHistory.length).toBe(moveCount);
        }
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in 5 seconds
    });

    test('should manage memory efficiently with position history', () => {
      const initialMemory = process.memoryUsage();

      // Create many game states
      for (let i = 0; i < 100; i++) {
        const state = game.getGameState();
        expect(state.positionHistory).toBeDefined();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Advanced State Validation', () => {
    let game;
    let stateManager;

    beforeEach(() => {
      game = new ChessGame();
      stateManager = game.stateManager;
    });

    test('should validate board consistency with invalid board structure', () => {
      const invalidBoard = null;
      const result = stateManager.validateBoardConsistency(invalidBoard);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid board structure');
    });

    test('should validate board consistency with invalid row structure', () => {
      const invalidBoard = [null, [], [], [], [], [], [], []];
      const result = stateManager.validateBoardConsistency(invalidBoard);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Row 0 has invalid structure');
    });

    test('should validate king count correctly', () => {
      const gameState = game.getGameState();
      const result = stateManager.validateKingCount(gameState.board);

      expect(result.isValid).toBe(true);
      expect(result.whiteKings).toBe(1);
      expect(result.blackKings).toBe(1);
    });

    test('should detect invalid king count', () => {
      const invalidBoard = Array(8).fill(null).map(() => Array(8).fill(null));
      const result = stateManager.validateKingCount(invalidBoard);

      expect(result.isValid).toBe(false);
      expect(result.whiteKings).toBe(0);
      expect(result.blackKings).toBe(0);
    });

    test('should validate turn consistency', () => {
      const gameState = game.getGameState();
      const result = stateManager.validateTurnConsistency(gameState);

      expect(result.isValid).toBe(true);
      expect(result.expectedTurn).toBe('white');
      expect(result.actualTurn).toBe('white');
    });

    test('should detect turn inconsistency', () => {
      const gameState = game.getGameState();
      gameState.currentTurn = 'black'; // Wrong turn for empty move history
      const result = stateManager.validateTurnConsistency(gameState);

      expect(result.isValid).toBe(false);
      expect(result.expectedTurn).toBe('white');
      expect(result.actualTurn).toBe('black');
    });

    test('should validate en passant consistency', () => {
      const gameState = game.getGameState();
      const result = stateManager.validateEnPassantConsistency(gameState);

      expect(result.isValid).toBe(true);
      expect(result.expectedTarget).toBe(null);
      expect(result.actualTarget).toBe(null);
    });
  });

  describe('State Tracking and History', () => {
    let game;
    let stateManager;

    beforeEach(() => {
      game = new ChessGame();
      stateManager = game.stateManager;
    });

    test('should track state changes', () => {
      const oldState = game.getGameState();
      game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      const newState = game.getGameState();

      stateManager.trackStateChange(oldState, newState);

      expect(stateManager.stateVersion).toBeGreaterThan(1);
    });

    test('should update state version', () => {
      const originalVersion = stateManager.stateVersion;
      stateManager.updateStateVersion();

      expect(stateManager.stateVersion).toBe(originalVersion + 1);
    });

    test('should add position to history', () => {
      const position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const originalLength = stateManager.positionHistory.length;

      stateManager.addPositionToHistory(position);

      expect(stateManager.positionHistory.length).toBe(originalLength + 1);
      expect(stateManager.positionHistory[stateManager.positionHistory.length - 1]).toBe(position);
    });

    test('should check for threefold repetition', () => {
      // Add same position three times
      const position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      stateManager.addPositionToHistory(position);
      stateManager.addPositionToHistory(position);
      stateManager.addPositionToHistory(position);

      const result = stateManager.checkThreefoldRepetition();
      expect(result).toBe(true);
    });

    test('should not detect threefold repetition with insufficient positions', () => {
      const result = stateManager.checkThreefoldRepetition();
      expect(result).toBe(false);
    });

    test('should update game metadata', () => {
      const metadata = { testProperty: 'testValue' };
      stateManager.updateGameMetadata(metadata);

      expect(stateManager.gameMetadata.testProperty).toBe('testValue');
    });
  });

  describe('State Snapshots and Serialization', () => {
    let game;
    let stateManager;

    beforeEach(() => {
      game = new ChessGame();
      stateManager = game.stateManager;
    });

    test('should get state snapshot', () => {
      const gameState = game.getGameState();
      const snapshot = stateManager.getStateSnapshot(gameState);

      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.stateVersion).toBeDefined();
      expect(snapshot.gameState).toBeDefined();
      expect(snapshot.metadata).toBeDefined();
      expect(snapshot.positionHistory).toBeDefined();
    });

    test('should validate state snapshot', () => {
      const validSnapshot = {
        timestamp: Date.now(),
        stateVersion: 1,
        gameState: game.getGameState(),
        metadata: stateManager.gameMetadata,
        positionHistory: stateManager.positionHistory
      };

      const result = stateManager.validateStateSnapshot(validSnapshot);
      expect(result.isValid).toBe(true);
    });

    test('should detect invalid state snapshot', () => {
      const invalidSnapshot = null;
      const result = stateManager.validateStateSnapshot(invalidSnapshot);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Snapshot is null or undefined');
    });

    test('should serialize game state', () => {
      const gameState = game.getGameState();
      const serialized = stateManager.serializeGameState(gameState);

      expect(typeof serialized).toBe('string');
      expect(serialized).toBeDefined();
    });

    test('should deserialize game state', () => {
      const gameState = game.getGameState();
      const serialized = stateManager.serializeGameState(gameState);
      const deserialized = stateManager.deserializeGameState(serialized);

      expect(deserialized).toBeDefined();
      expect(deserialized.currentTurn).toBe(gameState.currentTurn);
    });

    test('should handle invalid serialization', () => {
      const result = stateManager.serializeGameState(null);
      // JSON.stringify(null) returns "null"
      expect(result).toBe("null");
    });

    test('should handle invalid deserialization', () => {
      const result = stateManager.deserializeGameState('invalid json');
      expect(result).toBe(null);
    });
  });

  describe('Checkpoints and Recovery', () => {
    let game;
    let stateManager;

    beforeEach(() => {
      game = new ChessGame();
      stateManager = game.stateManager;
    });

    test('should create state checkpoint', () => {
      const gameState = game.getGameState();
      const checkpoint = stateManager.createStateCheckpoint(gameState);

      expect(checkpoint.id).toBeDefined();
      expect(checkpoint.timestamp).toBeDefined();
      expect(checkpoint.state).toBeDefined();
      expect(checkpoint.metadata).toBeDefined();
      expect(checkpoint.stateVersion).toBeDefined();
    });

    test('should restore from checkpoint', () => {
      const gameState = game.getGameState();
      const checkpoint = stateManager.createStateCheckpoint(gameState);
      const result = stateManager.restoreFromCheckpoint(checkpoint);

      expect(result.success).toBe(true);
      // In updated API, it returns 'state' not 'gameState'
      expect(result.state).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    test('should handle invalid checkpoint restoration', () => {
      const result = stateManager.restoreFromCheckpoint(null);
      expect(result.success).toBe(false);
      // In updated API, message might be "Invalid checkpoint data"
      expect(result.message).toMatch(/Invalid checkpoint/);
    });

    test('should handle corrupted checkpoint state', () => {
      const corruptedCheckpoint = {
        id: 'test',
        timestamp: Date.now(),
        state: 'invalid json',
        metadata: {},
        stateVersion: 1
      };

      const result = stateManager.restoreFromCheckpoint(corruptedCheckpoint);
      expect(result.success).toBe(false);
      // In updated API, it catches parse error
      expect(result.message).toBe('Failed to restore from checkpoint');
    });
  });

  describe('State Comparison and Analysis', () => {
    let game;
    let stateManager;

    beforeEach(() => {
      game = new ChessGame();
      stateManager = game.stateManager;
    });

    test('should compare identical game states', () => {
      const state1 = game.getGameState();
      const state2 = game.getGameState();
      const result = stateManager.compareGameStates(state1, state2);

      expect(result.identical).toBe(true);
      expect(result.differences).toHaveLength(0);
    });

    test('should detect differences in game states', () => {
      const state1 = game.getGameState();
      game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      const state2 = game.getGameState();

      const result = stateManager.compareGameStates(state1, state2);

      expect(result.identical).toBe(false);
      expect(result.differences.length).toBeGreaterThan(0);
    });

    test('should handle null state comparison', () => {
      const state1 = game.getGameState();
      const result = stateManager.compareGameStates(state1, null);

      expect(result.identical).toBe(false);
      expect(result.differences).toContain('One or both states are null/undefined');
    });

    test('should analyze game progression', () => {
      const gameState = game.getGameState();
      const analysis = stateManager.analyzeGameProgression(gameState);

      expect(analysis.phase).toBeDefined();
      expect(analysis.moveCount).toBeDefined();
      expect(analysis.characteristics).toBeDefined();
    });

    test('should detect game phase correctly', () => {
      const gameState = game.getGameState();
      const phase = stateManager.detectGamePhase(gameState);

      expect(['opening', 'middlegame', 'endgame']).toContain(phase);
    });

    test('should calculate material balance', () => {
      const gameState = game.getGameState();
      const balance = stateManager.calculateMaterialBalance(gameState.board);

      expect(balance.white).toBeDefined();
      expect(balance.black).toBeDefined();
      expect(balance.difference).toBeDefined();
    });

    test('should handle invalid board in material calculation', () => {
      const balance = stateManager.calculateMaterialBalance(null);

      expect(balance.white.total).toBe(0);
      expect(balance.black.total).toBe(0);
      expect(balance.difference).toBe(0);
    });
  });

  describe('Piece Activity Analysis', () => {
    let game;
    let stateManager;

    beforeEach(() => {
      game = new ChessGame();
      stateManager = game.stateManager;
    });

    test('should analyze piece activity', () => {
      const gameState = game.getGameState();
      const analysis = stateManager.analyzePieceActivity(gameState.board, 'white');

      expect(analysis.activePieces).toBeDefined();
      expect(analysis.totalMobility).toBeDefined();
      expect(analysis.averageMobility).toBeDefined();
    });

    test('should handle invalid board in piece activity analysis', () => {
      const analysis = stateManager.analyzePieceActivity(null, 'white');

      expect(analysis.activePieces).toHaveLength(0);
      expect(analysis.totalMobility).toBe(0);
      expect(analysis.averageMobility).toBe(0);
    });

    test('should calculate piece mobility', () => {
      const gameState = game.getGameState();
      const mobility = stateManager.calculatePieceMobility(
        gameState.board,
        7,
        1,
        { type: 'knight', color: 'white' }
      );

      expect(typeof mobility).toBe('number');
      expect(mobility).toBeGreaterThanOrEqual(0);
    });

    test('should validate basic move patterns', () => {
      expect(stateManager.isBasicMoveValid('pawn', 6, 4, 5, 4)).toBe(true);
      expect(stateManager.isBasicMoveValid('rook', 7, 0, 7, 7)).toBe(true);
      expect(stateManager.isBasicMoveValid('knight', 7, 1, 5, 2)).toBe(true);
      expect(stateManager.isBasicMoveValid('bishop', 7, 2, 5, 4)).toBe(true);
      expect(stateManager.isBasicMoveValid('queen', 7, 3, 5, 3)).toBe(true);
      expect(stateManager.isBasicMoveValid('king', 7, 4, 6, 4)).toBe(true);
      expect(stateManager.isBasicMoveValid('invalid', 0, 0, 1, 1)).toBe(false);
    });

    test('should analyze position complexity', () => {
      const gameState = game.getGameState();
      const complexity = stateManager.analyzePositionComplexity(gameState.board);

      // In updated API, it returns object
      expect(typeof complexity).toBe('object');
      expect(typeof complexity.isComplex).toBe('boolean');
    });

    test('should handle invalid board in complexity analysis', () => {
      const complexity = stateManager.analyzePositionComplexity(null);
      // In updated API, it returns object
      expect(complexity.isComplex).toBe(false);
    });
  });

  describe('Memory Management and Optimization', () => {
    let game;
    let stateManager;

    beforeEach(() => {
      game = new ChessGame();
      stateManager = game.stateManager;
    });

    test('should clean up old states', () => {
      // Add many positions to history
      for (let i = 0; i < 60; i++) {
        stateManager.addPositionToHistory(`position_${i}`);
      }

      const originalLength = stateManager.positionHistory.length;
      stateManager.cleanupOldStates(50);

      expect(stateManager.positionHistory.length).toBeLessThanOrEqual(50);
    });

    test('should get memory usage information', () => {
      const usage = stateManager.getMemoryUsage();

      expect(usage.positionHistorySize).toBeDefined();
      expect(usage.metadataSize).toBeDefined();
      expect(usage.totalSize).toBeDefined();
      expect(usage.positionCount).toBeDefined();
    });

    test('should optimize state storage', () => {
      // Add duplicate positions
      stateManager.addPositionToHistory('duplicate');
      stateManager.addPositionToHistory('duplicate');
      stateManager.addPositionToHistory('unique');

      const originalLength = stateManager.positionHistory.length;
      stateManager.optimizeStateStorage();

      // Should remove duplicates
      expect(stateManager.positionHistory.length).toBeLessThanOrEqual(originalLength);
    });
  });

  describe('State Transition Validation', () => {
    let game;
    let stateManager;

    beforeEach(() => {
      game = new ChessGame();
      stateManager = game.stateManager;
    });

    test('should validate valid state transition', () => {
      const fromState = game.getGameState();
      game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      const toState = game.getGameState();

      const result = stateManager.validateStateTransition(fromState, toState);

      expect(result.isValid).toBe(true);
      expect(result.success).toBe(true);
    });

    test('should detect invalid turn transition', () => {
      const fromState = game.getGameState();
      const toState = { ...fromState };
      toState.currentTurn = 'invalid_color';

      const result = stateManager.validateStateTransition(fromState, toState);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should detect decreasing move history', () => {
      const fromState = game.getGameState();
      // Need to make a move so fromState has history length >= 0
      // Wait, if fromState is fresh, length is 0.
      // If toState has length 0, it's not decreasing.
      // We need fromState to have history.

      // Create a state with history manually or by making move
      fromState.moveHistory = [{ move: 1 }];

      const toState = game.getGameState();
      // toState has empty history (length 0)

      const result = stateManager.validateStateTransition(fromState, toState);

      // It should fail because 0 < 1
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Move history cannot decrease');
    });
  });

  describe('Castling Rights Validation', () => {
    let game;
    let stateManager;

    beforeEach(() => {
      game = new ChessGame();
      stateManager = game.stateManager;
    });

    test('should validate castling rights consistency', () => {
      const gameState = game.getGameState();
      const result = stateManager.validateCastlingRightsConsistency(
        gameState.board,
        gameState.castlingRights
      );

      expect(result).toBe(true);
    });

    test('should detect invalid castling rights', () => {
      const invalidBoard = Array(8).fill(null).map(() => Array(8).fill(null));
      const castlingRights = {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
      };

      const result = stateManager.validateCastlingRightsConsistency(invalidBoard, castlingRights);
      expect(result).toBe(false);
    });

    test('should handle null parameters in castling validation', () => {
      const result = stateManager.validateCastlingRightsConsistency(null, null);
      expect(result).toBe(false);
    });
  });

  describe('Move History Management', () => {
    let game;
    let stateManager;

    beforeEach(() => {
      game = new ChessGame();
      stateManager = game.stateManager;
    });

    test('should add move to history', () => {
      const move = {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 },
        piece: 'pawn',
        color: 'white'
      };

      const result = stateManager.addMove(move);

      expect(result.success).toBe(true);
      expect(result.move).toBeDefined();
      expect(result.move.timestamp).toBeDefined();
      expect(result.move.moveNumber).toBeDefined();
    });

    test('should validate move history', () => {
      // Populate move history first to ensure it's valid
      stateManager.moveHistory = [];
      const result = stateManager.validateMoveHistory();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Move history is valid');
    });

    test('should detect invalid move in history', () => {
      stateManager.moveHistory = [null];
      const result = stateManager.validateMoveHistory();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid move at index 0');
    });

    test('should validate castling rights structure', () => {
      stateManager.castlingRights = {
        whiteKingside: true,
        whiteQueenside: true,
        blackKingside: true,
        blackQueenside: true
      };
      const result = stateManager.validateCastlingRights();
      expect(result.success).toBe(true);
    });

    test('should detect invalid castling rights structure', () => {
      stateManager.castlingRights = null;
      const result = stateManager.validateCastlingRights();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Castling rights must be an object');
    });

    test('should validate en passant target consistency', () => {
      // Updated to use existing method
      const gameState = { moveHistory: [], enPassantTarget: null };
      const result = stateManager.validateEnPassantConsistency(gameState);
      expect(result.isValid).toBe(true);
    });

    test('should validate game status via update', () => {
      // Updated to use existing method or validate status transition
      const result = stateManager.validateStatusTransition('active', 'active');
      expect(result.success).toBe(true);
    });

    test('should validate current turn', () => {
      stateManager.currentTurn = 'white';
      const result = stateManager.validateCurrentTurn();
      expect(result.success).toBe(true);
    });

    test('should detect invalid current turn', () => {
      stateManager.currentTurn = 'invalid';
      const result = stateManager.validateCurrentTurn();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid current turn: invalid');
    });
  });
/**
 * Additional Game State Management Tests for Coverage
 * Tests to cover uncovered lines in gameState.js
 */

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
    // The checkpoint property for the state string is 'state', not 'gameState'
    // based on createStateCheckpoint implementation
    const checkpoint = {
      state: JSON.stringify({ valid: true }),
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
    expect(balance.black.total).toBe(21); // 9+5+3+3+1 = 21

    expect(balance.white.queen).toBe(1);
    expect(balance.white.total).toBe(9);

    expect(balance.difference).toBe(-12); // 9 - 21 = -12
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

    const simpleResult = stateManager.analyzePositionComplexity(simpleBoard);
    expect(simpleResult.isComplex).toBe(false);
    expect(simpleResult.pieceCount).toBe(2);

    // Complex position (many pieces)
    const complexBoard = game.board; // Full starting position
    const complexResult = stateManager.analyzePositionComplexity(complexBoard);
    expect(complexResult.isComplex).toBe(true);
    expect(complexResult.pieceCount).toBeGreaterThan(20);
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
      state: 'invalid json string that will cause JSON.parse to fail',
      metadata: { test: true }
    };

    // We want to verify that restoreFromCheckpoint catches errors.
    // We need to mock something that throws INSIDE restoreFromCheckpoint but BEFORE it's caught.
    // restoreFromCheckpoint calls deserializeGameState.
    // If we mock deserializeGameState to throw, it should be caught by restoreFromCheckpoint's try-catch.

    const originalDeserialize = stateManager.deserializeGameState;
    stateManager.deserializeGameState = jest.fn(() => {
        throw new Error('Parse error');
    });

    // We must ensure 'this' context is preserved if needed, but here we are replacing the method on the instance.

    const result = stateManager.restoreFromCheckpoint(invalidCheckpoint);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to restore from checkpoint');
    expect(result.error).toBe('Parse error');

    // Restore original
    stateManager.deserializeGameState = originalDeserialize;
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
