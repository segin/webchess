/**
 * Comprehensive Game State Management Tests
 * Tests for task 13: Implement comprehensive game state management
 */

const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');

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