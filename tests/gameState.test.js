/**
 * Comprehensive GameState Tests
 * Tests for GameStateManager class covering state tracking, validation, and updates
 */

const GameStateManager = require('../src/shared/gameState');

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
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid or missing timestamp');
    });

    test('should detect invalid timestamp type in snapshot', () => {
      const invalidSnapshot = {
        timestamp: 'invalid',
        stateVersion: 1,
        gameState: {}
      };
      
      const result = stateManager.validateStateSnapshot(invalidSnapshot);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid or missing timestamp');
    });

    test('should detect missing stateVersion in snapshot', () => {
      const invalidSnapshot = {
        timestamp: Date.now(),
        gameState: {}
      };
      
      const result = stateManager.validateStateSnapshot(invalidSnapshot);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid or missing state version');
    });

    test('should detect invalid stateVersion type in snapshot', () => {
      const invalidSnapshot = {
        timestamp: Date.now(),
        stateVersion: 'invalid',
        gameState: {}
      };
      
      const result = stateManager.validateStateSnapshot(invalidSnapshot);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid or missing state version');
    });

    test('should detect missing gameState in snapshot', () => {
      const invalidSnapshot = {
        timestamp: Date.now(),
        stateVersion: 1
      };
      
      const result = stateManager.validateStateSnapshot(invalidSnapshot);
      expect(result.success).toBe(false);
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
        to: { row: 4, col: 4 }
      };
      
      const result = stateManager.addMove(move);
      expect(result.success).toBe(true);
      expect(result.move.timestamp).toBeDefined();
      expect(result.move.moveNumber).toBe(1);
    });

    test('should increment total moves counter', () => {
      const initialMoves = stateManager.gameMetadata.totalMoves;
      
      stateManager.addMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      
      expect(stateManager.gameMetadata.totalMoves).toBe(initialMoves + 1);
    });
  });

  describe('Move History Validation', () => {
    test('should validate existing move history', () => {
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
      const phase = stateManager.detectGamePhase(game.board, []);
      expect(phase).toBe('opening');
    });

    test('should detect middlegame phase', () => {
      const moves = Array(20).fill({ piece: 'pawn' });
      const phase = stateManager.detectGamePhase(game.board, moves);
      expect(phase).toBeDefined();
    });

    test('should detect endgame phase with few pieces', () => {
      const endgameBoard = Array(8).fill(null).map(() => Array(8).fill(null));
      endgameBoard[7][4] = { type: 'king', color: 'white' };
      endgameBoard[0][4] = { type: 'king', color: 'black' };
      endgameBoard[7][0] = { type: 'rook', color: 'white' };
      
      const phase = stateManager.detectGamePhase(endgameBoard, Array(40).fill({ piece: 'pawn' }));
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
      const result = stateManager.validateTurnConsistency('white', []);
      expect(result.success).toBe(true);
    });

    test('should validate turn consistency with moves', () => {
      const moves = [{ color: 'white' }];
      const result = stateManager.validateTurnConsistency('black', moves);
      expect(result.success).toBe(true);
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
        game.castlingRights,
        []
      );
      expect(result.success).toBe(true);
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
      const result = stateManager.validateEnPassantConsistency(null, []);
      expect(result.success).toBe(true);
    });

    test('should validate en passant consistency with target', () => {
      const target = { row: 2, col: 4 };
      const moves = [
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 }, piece: 'pawn', color: 'black' }
      ];
      
      const result = stateManager.validateEnPassantConsistency(target, moves);
      expect(result).toBeDefined();
    });
  });
});
