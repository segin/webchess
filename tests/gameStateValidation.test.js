/**
 * Game State Management Validation Tests
 * Jest-based validation tests for the enhanced game state management system
 */

const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');

describe('Game State Management Validation', () => {
  describe('Game State Initialization', () => {
    test('should initialize game state with enhanced metadata', () => {
      const game = new ChessGame();
      const gameState = game.getGameState();
      
      // Test enhanced metadata
      expect(gameState.gameMetadata).toBeDefined();
      expect(gameState.gameMetadata.startTime).toBeDefined();
      expect(gameState.gameMetadata.gameId).toBeDefined();
      expect(gameState.gameMetadata.totalMoves).toBe(0);
      expect(gameState.gameMetadata.version).toBe('1.0.0');
      
      // Test position history
      expect(gameState.positionHistory).toBeDefined();
      expect(gameState.positionHistory.length).toBe(1);
      
      // Test state consistency
      expect(gameState.stateConsistency).toBeDefined();
      expect(gameState.stateConsistency.success).toBe(true);
      expect(gameState.stateConsistency.errors.length).toBe(0);
    });
  });

  describe('Turn Alternation Validation', () => {
    test('should validate turn sequences correctly', () => {
      const stateManager = new GameStateManager();
      
      // Test valid turn sequence
      const validResult = stateManager.validateTurnSequence('white', 'white', []);
      expect(validResult.success).toBe(true);
      expect(validResult.details.currentTurn).toBe('white');
      
      // Test invalid turn sequence
      const invalidResult = stateManager.validateTurnSequence('black', 'white', []);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.code).toBe('TURN_SEQUENCE_VIOLATION');
      
      // Test turn consistency with move history
      const moveHistory = [{ color: 'white', piece: 'pawn' }];
      const historyResult = stateManager.validateTurnSequence('black', 'black', moveHistory);
      expect(historyResult.success).toBe(true);
    });
  });

  describe('Game Status Management', () => {
    test('should manage game status updates correctly', () => {
      const stateManager = new GameStateManager();
      
      // Test valid status update
      const validUpdate = stateManager.updateGameStatus('active', 'check');
      expect(validUpdate.success).toBe(true);
      expect(validUpdate.details.newStatus).toBe('check');
      
      // Test checkmate requires winner
      const checkmateWithoutWinner = stateManager.updateGameStatus('check', 'checkmate');
      expect(checkmateWithoutWinner.success).toBe(false);
      expect(checkmateWithoutWinner.code).toBe('MISSING_WINNER');
      
      // Test checkmate with winner
      const checkmateWithWinner = stateManager.updateGameStatus('check', 'checkmate', 'white');
      expect(checkmateWithWinner.success).toBe(true);
      expect(checkmateWithWinner.details.newWinner).toBe('white');
      
      // Test invalid status
      const invalidStatus = stateManager.updateGameStatus('active', 'invalid_status');
      expect(invalidStatus.success).toBe(false);
      expect(invalidStatus.code).toBe('INVALID_STATUS');
    });
  });

  describe('Move History Enhancement', () => {
    test('should enhance move history with metadata', () => {
      const stateManager = new GameStateManager();
      const moveHistory = [];
      
      const moveData = {
        from: { row: 6, col: 4 },
        to: { row: 5, col: 4 },
        piece: 'pawn',
        color: 'white'
      };
      
      // Create a simple test board
      const testBoard = Array(8).fill(null).map(() => Array(8).fill(null));
      
      const gameState = {
        inCheck: false,
        checkDetails: null,
        castlingRights: { white: { kingside: true, queenside: true }, black: { kingside: true, queenside: true } },
        enPassantTarget: null,
        halfMoveClock: 0,
        board: testBoard,
        currentTurn: 'white'
      };
      
      const enhancedMove = stateManager.addMoveToHistory(moveHistory, moveData, 1, gameState);
      
      expect(enhancedMove.moveNumber).toBeDefined();
      expect(enhancedMove.turnNumber).toBeDefined();
      expect(enhancedMove.timestamp).toBeDefined();
      expect(enhancedMove.gameStateSnapshot).toBeDefined();
      expect(enhancedMove.positionAfterMove).toBeDefined();
      expect(moveHistory.length).toBe(1);
    });
  });

  describe('Game State Consistency Validation', () => {
    test('should validate game state consistency', () => {
      const game = new ChessGame();
      
      // Test consistent state - use the game's built-in validation from getGameState
      const fullGameState = game.getGameState();
      const validation = fullGameState.stateConsistency;
      
      expect(validation.success).toBe(true);
      expect(validation.errors.length).toBe(0);
      expect(validation.details.kingCount.white).toBe(1);
      expect(validation.details.kingCount.black).toBe(1);
      
      // Test inconsistent state (wrong turn) - create a separate state manager for this test
      const testStateManager = new GameStateManager();
      const inconsistentState = game.getGameStateForSnapshot();
      inconsistentState.currentTurn = 'black'; // Should be white for empty move history
      inconsistentState.moveHistory = [];
      
      const inconsistentValidation = testStateManager.validateGameStateConsistency(inconsistentState);
      expect(inconsistentValidation.success).toBe(false);
      expect(inconsistentValidation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Game State After Moves', () => {
    test('should update game state correctly after moves', () => {
      const game = new ChessGame();
      const initialState = game.getGameState();
      
      // Make a move using current API
      const result = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      expect(result.success).toBe(true);
      
      const newState = game.getGameState();
      
      // Verify state updates using current property names
      expect(newState.currentTurn).toBe('black');
      expect(newState.gameMetadata.totalMoves).toBe(1);
      expect(newState.stateVersion).toBeGreaterThan(initialState.stateVersion);
      expect(newState.moveHistory.length).toBe(1);
      
      // Verify state consistency
      expect(newState.stateConsistency.success).toBe(true);
    });
  });

  describe('FEN Position Generation', () => {
    test('should generate correct FEN positions', () => {
      const stateManager = new GameStateManager();
      const game = new ChessGame();
      
      // Test starting position FEN using current API
      const startingFEN = stateManager.getFENPosition(
        game.board,
        game.currentTurn,
        game.castlingRights,
        game.enPassantTarget
      );
      
      expect(startingFEN).toContain('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
      expect(startingFEN).toContain(' w ');
      expect(startingFEN).toContain('KQkq');
    });
  });

  describe('Game State Property Validation', () => {
    test('should validate game state properties use current API structure', () => {
      const game = new ChessGame();
      const gameState = game.getGameState();
      
      // Verify current property names are used
      expect(gameState).toHaveProperty('gameStatus'); // Current API uses gameStatus
      expect(gameState).toHaveProperty('currentTurn');
      expect(gameState).toHaveProperty('winner');
      expect(gameState).toHaveProperty('moveHistory');
      expect(gameState).toHaveProperty('castlingRights');
      expect(gameState).toHaveProperty('enPassantTarget');
      expect(gameState).toHaveProperty('inCheck');
      expect(gameState).toHaveProperty('checkDetails');
      
      // Verify initial values match current implementation
      expect(gameState.gameStatus).toBe('active');
      expect(gameState.currentTurn).toBe('white');
      expect(gameState.winner).toBeNull();
      expect(gameState.moveHistory).toEqual([]);
      expect(gameState.inCheck).toBe(false);
      expect(gameState.checkDetails).toBeNull();
    });

    test('should validate state consistency validation uses current error format', () => {
      const game = new ChessGame();
      
      // Use a real game state which will have proper position history
      const gameState = game.getGameStateForSnapshot();
      const validation = game.stateManager.validateGameStateConsistency(gameState);
      
      expect(validation.success).toBe(true);
      expect(validation.errors).toEqual([]);
      expect(validation.details).toBeDefined();
      expect(validation.details.kingCount).toEqual({ white: 1, black: 1 });
    });

    test('should handle invalid state validation with current error structure', () => {
      const stateManager = new GameStateManager();
      
      // Test with invalid state (missing kings)
      const invalidState = {
        currentTurn: 'white',
        moveHistory: [],
        gameStatus: 'active',
        winner: null,
        fullMoveNumber: 1,
        halfMoveClock: 0,
        board: Array(8).fill(null).map(() => Array(8).fill(null)),
        castlingRights: { white: { kingside: true, queenside: true }, black: { kingside: true, queenside: true } },
        enPassantTarget: null
      };
      
      const validation = stateManager.validateGameStateConsistency(invalidState);
      expect(validation.success).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Invalid white king count'),
          expect.stringContaining('Invalid black king count')
        ])
      );
    });
  });

  describe('Move Validation Integration', () => {
    test('should validate moves return current response structure', () => {
      const game = new ChessGame();
      
      // Test valid move
      const validResult = game.makeMove({ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      expect(validResult.success).toBe(true);
      expect(validResult.message).toBeDefined();
      expect(validResult.data).toBeDefined();
      expect(validResult.data.gameStatus).toBe('active');
      expect(validResult.data.currentTurn).toBe('black');
      
      // Test invalid move
      const invalidResult = game.makeMove({ from: { row: 5, col: 4 }, to: { row: 3, col: 4 } });
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.message).toBeDefined();
      expect(invalidResult.errorCode).toBeDefined();
    });

    test('should maintain state consistency after moves', () => {
      const game = new ChessGame();
      
      // Make several moves
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } }, // e4
        { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } }, // e5
        { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }, // d4
        { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }  // d5
      ];
      
      moves.forEach((move, index) => {
        const result = game.makeMove(move);
        expect(result.success).toBe(true);
        
        const gameState = game.getGameState();
        expect(gameState.moveHistory.length).toBe(index + 1);
        expect(gameState.stateConsistency.success).toBe(true);
        expect(gameState.currentTurn).toBe(index % 2 === 0 ? 'black' : 'white');
      });
    });
  });
});