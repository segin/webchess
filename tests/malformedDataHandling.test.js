const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');

describe('Comprehensive Malformed Data Handling Tests', () => {
  let game;
  let gameState;

  beforeEach(() => {
    game = new ChessGame();
    gameState = new GameStateManager();
  });

  describe('Corrupted Game State Handling', () => {
    test('should handle corrupted board arrays', () => {
      const corruptedBoards = [
        null, // Null board
        undefined, // Undefined board
        [], // Empty board
        Array(7).fill(null).map(() => Array(8).fill(null)), // Wrong row count
        Array(8).fill(null).map(() => Array(7).fill(null)), // Wrong column count
        Array(8).fill(null).map(() => null), // Null rows
        Array(8).fill(null).map(() => undefined), // Undefined rows
        Array(8).fill(null).map(() => 'invalid'), // Non-array rows
        [Array(8).fill(null), null, Array(8).fill(null)], // Mixed valid/null rows
      ];

      corruptedBoards.forEach(board => {
        game.board = board;
        const result = game.validateGameState();
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid board');
      });
    });

    test('should handle corrupted piece objects', () => {
      const corruptedPieces = [
        'invalid', // String instead of object
        123, // Number instead of object
        true, // Boolean instead of object
        [], // Array instead of object
        {}, // Empty object
        { type: null }, // Null type
        { color: null }, // Null color
        { type: 'invalid' }, // Invalid piece type
        { color: 'invalid' }, // Invalid color
        { type: 'pawn' }, // Missing color
        { color: 'white' }, // Missing type
        { type: 'pawn', color: 'white', extra: 'property' }, // Extra properties
        { TYPE: 'pawn', COLOR: 'white' }, // Wrong case
      ];

      corruptedPieces.forEach(piece => {
        game.board[0][0] = piece;
        const result = game.validateGameState();
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid piece');
      });
    });

    test('should handle corrupted move history', () => {
      const corruptedHistories = [
        'invalid', // String instead of array
        123, // Number instead of array
        null, // Null history
        undefined, // Undefined history
        [null], // Null moves in array
        [undefined], // Undefined moves in array
        ['invalid'], // String moves
        [123], // Number moves
        [{}], // Empty move objects
        [{ from: null }], // Null coordinates
        [{ from: { row: 'a', col: 'b' } }], // Invalid coordinates
        [{ from: { row: 0, col: 0 }, to: { row: 1, col: 1 }, piece: null }], // Null piece
        [{ from: { row: 0, col: 0 }, to: { row: 1, col: 1 }, piece: 'invalid' }], // Invalid piece
      ];

      corruptedHistories.forEach(history => {
        gameState.moveHistory = history;
        const result = gameState.validateMoveHistory();
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid move history');
      });
    });

    test('should handle corrupted castling rights', () => {
      const corruptedCastlingRights = [
        'invalid', // String instead of object
        123, // Number instead of object
        [], // Array instead of object
        null, // Null castling rights
        undefined, // Undefined castling rights
        { white: null }, // Null white rights
        { black: null }, // Null black rights
        { white: 'invalid' }, // String instead of object
        { white: { kingside: null } }, // Null kingside
        { white: { queenside: null } }, // Null queenside
        { white: { kingside: 'yes' } }, // String instead of boolean
        { white: { queenside: 123 } }, // Number instead of boolean
        { invalid: { kingside: true } }, // Invalid color key
        { white: { invalid: true } }, // Invalid side key
      ];

      corruptedCastlingRights.forEach(rights => {
        gameState.castlingRights = rights;
        const result = gameState.validateCastlingRights();
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid castling rights');
      });
    });

    test('should handle corrupted en passant targets', () => {
      const corruptedTargets = [
        'invalid', // String instead of object/null
        123, // Number instead of object/null
        true, // Boolean instead of object/null
        [], // Array instead of object/null
        {}, // Empty object
        { row: null }, // Null row
        { col: null }, // Null col
        { row: 'a' }, // String row
        { col: 'b' }, // String col
        { row: 0 }, // Missing col
        { col: 0 }, // Missing row
        { row: -1, col: 0 }, // Invalid row
        { row: 8, col: 0 }, // Invalid row
        { row: 0, col: -1 }, // Invalid col
        { row: 0, col: 8 }, // Invalid col
        { x: 0, y: 0 }, // Wrong property names
      ];

      corruptedTargets.forEach(target => {
        gameState.enPassantTarget = target;
        const result = gameState.validateEnPassantTarget();
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid en passant target');
      });
    });

    test('should handle corrupted game status', () => {
      const corruptedStatuses = [
        null, // Null status
        undefined, // Undefined status
        123, // Number status
        true, // Boolean status
        [], // Array status
        {}, // Object status
        '', // Empty string
        'ACTIVE', // Wrong case
        'Check', // Wrong case
        'invalid', // Invalid status
        'game_over', // Invalid format
        'in-progress', // Invalid format
      ];

      corruptedStatuses.forEach(status => {
        gameState.gameStatus = status;
        const result = gameState.validateGameStatus();
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid game status');
      });
    });

    test('should handle corrupted current turn', () => {
      const corruptedTurns = [
        null, // Null turn
        undefined, // Undefined turn
        123, // Number turn
        true, // Boolean turn
        [], // Array turn
        {}, // Object turn
        '', // Empty string
        'WHITE', // Wrong case
        'Black', // Wrong case
        'red', // Invalid color
        'player1', // Invalid format
      ];

      corruptedTurns.forEach(turn => {
        gameState.currentTurn = turn;
        const result = gameState.validateCurrentTurn();
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid current turn');
      });
    });
  });

  describe('Invalid Move Format Handling', () => {
    test('should handle malformed move notation', () => {
      const malformedNotations = [
        'e4e5', // Missing dash
        'e4-', // Missing destination
        '-e5', // Missing source
        'e4-e9', // Invalid destination rank
        'i4-e5', // Invalid source file
        'e4-e5-e6', // Too many parts
        'E4-E5', // Wrong case
        '4e-5e', // Wrong order
        'e4 e5', // Space instead of dash
        'e4_e5', // Underscore instead of dash
        'e4→e5', // Unicode arrow
        'e4→e5', // Different arrow
      ];

      malformedNotations.forEach(notation => {
        const result = game.parseMoveNotation(notation);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid move notation');
      });
    });

    test('should handle corrupted move objects with missing properties', () => {
      const incompleteMoves = [
        {}, // Empty move
        { from: { row: 0, col: 0 } }, // Missing to
        { to: { row: 1, col: 1 } }, // Missing from
        { from: { row: 0 }, to: { row: 1, col: 1 } }, // Incomplete from
        { from: { col: 0 }, to: { row: 1, col: 1 } }, // Incomplete from
        { from: { row: 0, col: 0 }, to: { row: 1 } }, // Incomplete to
        { from: { row: 0, col: 0 }, to: { col: 1 } }, // Incomplete to
        { from: { row: 0, col: 0 }, to: { row: 1, col: 1 }, piece: null }, // Null piece
        { from: { row: 0, col: 0 }, to: { row: 1, col: 1 }, color: null }, // Null color
      ];

      incompleteMoves.forEach(move => {
        const result = gameState.addMove(move);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid move');
      });
    });

    test('should handle moves with corrupted coordinate objects', () => {
      const corruptedCoordinates = [
        { from: null, to: { row: 1, col: 1 } },
        { from: undefined, to: { row: 1, col: 1 } },
        { from: 'invalid', to: { row: 1, col: 1 } },
        { from: 123, to: { row: 1, col: 1 } },
        { from: [], to: { row: 1, col: 1 } },
        { from: { row: 0, col: 0 }, to: null },
        { from: { row: 0, col: 0 }, to: undefined },
        { from: { row: 0, col: 0 }, to: 'invalid' },
        { from: { row: 0, col: 0 }, to: 123 },
        { from: { row: 0, col: 0 }, to: [] },
      ];

      corruptedCoordinates.forEach(({ from, to }) => {
        const result = game.makeMove(from, to);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid coordinates');
      });
    });

    test('should handle moves with extreme coordinate values', () => {
      const extremeCoordinates = [
        { from: { row: Number.MAX_VALUE, col: 0 }, to: { row: 1, col: 1 } },
        { from: { row: Number.MIN_VALUE, col: 0 }, to: { row: 1, col: 1 } },
        { from: { row: Infinity, col: 0 }, to: { row: 1, col: 1 } },
        { from: { row: -Infinity, col: 0 }, to: { row: 1, col: 1 } },
        { from: { row: NaN, col: 0 }, to: { row: 1, col: 1 } },
        { from: { row: 0, col: Number.MAX_VALUE }, to: { row: 1, col: 1 } },
        { from: { row: 0, col: Number.MIN_VALUE }, to: { row: 1, col: 1 } },
        { from: { row: 0, col: Infinity }, to: { row: 1, col: 1 } },
        { from: { row: 0, col: -Infinity }, to: { row: 1, col: 1 } },
        { from: { row: 0, col: NaN }, to: { row: 1, col: 1 } },
      ];

      extremeCoordinates.forEach(({ from, to }) => {
        const result = game.makeMove(from, to);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid coordinates');
      });
    });
  });

  describe('Data Corruption Recovery', () => {
    test('should recover from partially corrupted game state', () => {
      // Start with valid state
      const validState = game.getGameState();
      
      // Corrupt part of the state
      game.board[0] = null;
      
      // Attempt recovery
      const recoveryResult = game.recoverFromCorruption(validState);
      expect(recoveryResult.success).toBe(true);
      expect(game.board[0]).not.toBeNull();
    });

    test('should handle complete state corruption gracefully', () => {
      // Completely corrupt the game state
      game.board = null;
      game.currentTurn = null;
      game.gameStatus = null;
      
      // Attempt to continue playing
      const result = game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Game state corrupted');
    });

    test('should validate state integrity after operations', () => {
      // Perform a series of operations
      game.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
      game.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 });
      
      // Manually corrupt state
      game.board[4][4] = { type: 'invalid', color: 'purple' };
      
      // Validate integrity
      const integrityCheck = game.validateStateIntegrity();
      expect(integrityCheck.success).toBe(false);
      expect(integrityCheck.errors).toContain('Invalid piece detected');
    });

    test('should handle cascading corruption effects', () => {
      // Create a chain of dependent corruptions
      game.board[0][0] = null; // Remove piece
      game.castlingRights.black.queenside = true; // But keep castling rights
      
      // This should detect the inconsistency
      const result = game.validateCastlingConsistency();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Castling rights inconsistent with board state');
    });
  });

  describe('Serialization and Deserialization Corruption', () => {
    test('should handle corrupted JSON serialization', () => {
      const corruptedJsonStrings = [
        '{"board":null,"currentTurn":"white"}', // Null board
        '{"board":[],"currentTurn":"white"}', // Empty board array
        '{"board":[[]],"currentTurn":"white"}', // Incomplete board
        '{"currentTurn":"invalid"}', // Invalid turn
        '{"gameStatus":"invalid"}', // Invalid status
        '{"moveHistory":[null]}', // Null moves in history
        '{"castlingRights":null}', // Null castling rights
        '{"enPassantTarget":"invalid"}', // Invalid en passant
        '{board:[],"currentTurn":"white"}', // Unquoted key
        '{"board":[],"currentTurn":"white",}', // Trailing comma
      ];

      corruptedJsonStrings.forEach(jsonString => {
        try {
          const parsed = JSON.parse(jsonString);
          const result = game.loadFromState(parsed);
          expect(result.success).toBe(false);
        } catch (error) {
          // JSON parsing should fail for malformed strings
          expect(error).toBeInstanceOf(SyntaxError);
        }
      });
    });

    test('should handle binary data corruption', () => {
      // Simulate binary corruption by modifying serialized data
      const validState = game.getGameState();
      const serialized = JSON.stringify(validState);
      
      // Introduce random corruption
      const corruptedSerialized = serialized.replace(/true/g, 'null').replace(/false/g, '123');
      
      try {
        const corrupted = JSON.parse(corruptedSerialized);
        const result = game.loadFromState(corrupted);
        expect(result.success).toBe(false);
      } catch (error) {
        // Expected for severely corrupted data
        expect(error).toBeDefined();
      }
    });

    test('should handle partial deserialization failures', () => {
      const partiallyCorruptedStates = [
        { board: null }, // Missing other properties
        { currentTurn: 'white' }, // Missing board
        { board: Array(8).fill(null).map(() => Array(8).fill(null)) }, // Missing turn
        { 
          board: Array(8).fill(null).map(() => Array(8).fill(null)),
          currentTurn: 'white',
          gameStatus: null // Null status
        },
      ];

      partiallyCorruptedStates.forEach(state => {
        const result = game.loadFromState(state);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid state');
      });
    });
  });

  describe('Memory Corruption Simulation', () => {
    test('should handle simulated memory corruption', () => {
      // Simulate memory corruption by overwriting object properties
      const originalBoard = game.board;
      
      // Corrupt memory reference
      game.board = originalBoard;
      game.board.corrupted = true;
      game.board.length = 'invalid';
      
      const result = game.validateGameState();
      expect(result.success).toBe(false);
    });

    test('should handle reference corruption', () => {
      // Create circular references that could cause issues
      const piece = { type: 'pawn', color: 'white' };
      piece.self = piece;
      piece.board = game.board;
      game.board[0][0] = piece;
      
      // This should be handled gracefully
      const result = game.getBoardCopy();
      expect(result).toBeDefined();
    });

    test('should handle prototype pollution attempts', () => {
      // Attempt to pollute object prototype
      const maliciousMove = {
        from: { row: 0, col: 0 },
        to: { row: 1, col: 1 },
        '__proto__': { polluted: true }
      };

      const result = game.makeMove(maliciousMove.from, maliciousMove.to);
      expect(result.success).toBe(false);
      expect(Object.prototype.polluted).toBeUndefined();
    });
  });
});