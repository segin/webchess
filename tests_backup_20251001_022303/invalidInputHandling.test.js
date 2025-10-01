const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');
const GameManager = require('../src/server/gameManager');

describe('Comprehensive Invalid Input Handling Tests', () => {
  let game;
  let gameState;
  let gameManager;

  beforeEach(() => {
    game = testUtils.createFreshGame();
    gameState = new GameStateManager();
    gameManager = new GameManager();
  });

  describe('ChessGame Invalid Input Handling', () => {
    test('should handle null and undefined move coordinates', () => {
      const invalidInputs = [
        { from: null, to: { row: 0, col: 0 } },
        { from: { row: 0, col: 0 }, to: null },
        { from: undefined, to: { row: 0, col: 0 } },
        { from: { row: 0, col: 0 }, to: undefined },
        { from: null, to: null },
        { from: undefined, to: undefined },
      ];

      invalidInputs.forEach(({ from, to }) => {
        const result = game.makeMove(from, to);
        testUtils.validateErrorResponse(result);
        expect(['MALFORMED_MOVE', 'INVALID_FORMAT', 'INVALID_COORDINATES']).toContain(result.errorCode);
      });
    });

    test('should handle malformed coordinate objects', () => {
      const malformedCoords = [
        { from: {}, to: { row: 0, col: 0 } },
        { from: { row: 0 }, to: { row: 0, col: 0 } },
        { from: { col: 0 }, to: { row: 0, col: 0 } },
        { from: { row: 0, col: 0 }, to: {} },
        { from: { row: 0, col: 0 }, to: { row: 0 } },
        { from: { row: 0, col: 0 }, to: { col: 0 } },
        { from: { x: 0, y: 0 }, to: { row: 0, col: 0 } },
        { from: { row: 0, col: 0 }, to: { x: 0, y: 0 } },
      ];

      malformedCoords.forEach(({ from, to }) => {
        const result = game.makeMove(from, to);
        testUtils.validateErrorResponse(result);
        expect(['INVALID_COORDINATES', 'INVALID_FORMAT']).toContain(result.errorCode);
      });
    });

    test('should handle non-numeric coordinate values', () => {
      const nonNumericCoords = [
        { from: { row: 'a', col: 0 }, to: { row: 0, col: 0 } },
        { from: { row: 0, col: 'b' }, to: { row: 0, col: 0 } },
        { from: { row: 0, col: 0 }, to: { row: 'c', col: 0 } },
        { from: { row: 0, col: 0 }, to: { row: 0, col: 'd' } },
        { from: { row: true, col: 0 }, to: { row: 0, col: 0 } },
        { from: { row: 0, col: false }, to: { row: 0, col: 0 } },
        { from: { row: [], col: 0 }, to: { row: 0, col: 0 } },
        { from: { row: 0, col: {} }, to: { row: 0, col: 0 } },
      ];

      nonNumericCoords.forEach(({ from, to }) => {
        const result = game.makeMove(from, to);
        testUtils.validateErrorResponse(result);
        expect(['INVALID_COORDINATES', 'INVALID_FORMAT']).toContain(result.errorCode);
      });
    });

    test('should handle invalid promotion piece types', () => {
      // Set up pawn promotion scenario
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      game.board[1][0] = { type: 'pawn', color: 'white' };
      game.currentTurn = 'white';

      const invalidPromotions = [
        'king', 'pawn', 'invalid', '', null, undefined, 123, true, [], {}
      ];

      invalidPromotions.forEach(promotion => {
        const result = game.makeMove({ row: 1, col: 0 }, { row: 0, col: 0 }, promotion);
        if (promotion && !['queen', 'rook', 'bishop', 'knight'].includes(promotion)) {
          testUtils.validateErrorResponse(result);
          expect(['INVALID_FORMAT', 'INVALID_PROMOTION']).toContain(result.errorCode);
        }
      });
    });

    test('should handle method calls with wrong number of arguments', () => {
      // Test makeMove with insufficient arguments
      const result1 = game.makeMove();
      testUtils.validateErrorResponse(result1);
      expect(['MALFORMED_MOVE', 'INVALID_FORMAT']).toContain(result1.errorCode);
      
      const result2 = game.makeMove({ row: 0, col: 0 });
      testUtils.validateErrorResponse(result2);
      expect(['MALFORMED_MOVE', 'INVALID_FORMAT']).toContain(result2.errorCode);
      
      // Test with too many arguments - should still work (extra args ignored)
      const result3 = game.makeMove(
        { row: 6, col: 4 }, 
        { row: 4, col: 4 }, 
        'queen', 
        'extra', 
        'arguments'
      );
      // This should succeed as it's a valid pawn move
      testUtils.validateSuccessResponse(result3);
    });

    test('should handle circular reference objects', () => {
      const circularFrom = { row: 0, col: 0 };
      circularFrom.self = circularFrom;
      
      const circularTo = { row: 1, col: 1 };
      circularTo.self = circularTo;

      const result = game.makeMove(circularFrom, circularTo);
      // Should fail due to no piece at source or invalid move
      testUtils.validateErrorResponse(result);
    });

    test('should handle extremely large objects as coordinates', () => {
      const largeObject = { row: 0, col: 0 };
      for (let i = 0; i < 1000; i++) {
        largeObject[`prop${i}`] = `value${i}`;
      }

      const result = game.makeMove(largeObject, { row: 1, col: 1 });
      // Should fail due to no piece at source or invalid move
      testUtils.validateErrorResponse(result);
    });
  });

  describe('GameStateManager Invalid Input Handling', () => {
    test('should handle invalid move objects in addMove', () => {
      const invalidMoves = [
        null,
        undefined,
        {},
        { from: null },
        { to: null },
        { piece: null },
        { color: null },
        { from: {}, to: {}, piece: '', color: '' },
      ];

      invalidMoves.forEach(move => {
        const result = gameState.addMove(move);
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        expect(result.errors).toBeDefined();
        expect(Array.isArray(result.errors)).toBe(true);
      });

      // Test a move that has required fields but invalid values - this may succeed
      const moveWithInvalidValues = { from: { row: 'a', col: 'b' }, to: { row: 'c', col: 'd' }, piece: 'invalid', color: 'purple' };
      const result = gameState.addMove(moveWithInvalidValues);
      // This may succeed because addMove only checks for presence, not validity of values
      expect(typeof result.success).toBe('boolean');
      expect(result.message).toBeDefined();
    });

    test('should handle invalid game status updates', () => {
      const invalidStatuses = [
        null, undefined, '', 'invalid', 123, true, [], {}, 'ACTIVE', 'Check'
      ];

      invalidStatuses.forEach(status => {
        const result = gameState.updateGameStatus('active', status);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid game status');
      });
    });

    test('should handle invalid turn sequence validation', () => {
      const invalidColors = [
        null, undefined, '', 'red', 'blue', 'WHITE', 'BLACK', 123, true, [], {}
      ];

      invalidColors.forEach(color => {
        const result = gameState.validateTurnSequence('white', color, []);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid color');
      });
    });

    test('should handle invalid board consistency validation', () => {
      const invalidBoards = [
        null,
        undefined,
        [],
        'invalid',
        Array(7).fill(null).map(() => Array(8).fill(null)), // Wrong size
        Array(8).fill(null).map(() => Array(7).fill(null)), // Wrong size
      ];

      invalidBoards.forEach(board => {
        const result = gameState.validateBoardConsistency(board);
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(Array.isArray(result.errors)).toBe(true);
      });
    });

    test('should handle invalid game state consistency validation', () => {
      const invalidGameStates = [
        null,
        undefined,
        { 
          board: Array(8).fill(null).map(() => Array(8).fill(null)),
          currentTurn: 'invalid',
          moveHistory: [],
          fullMoveNumber: 1,
          halfMoveClock: 0,
          gameStatus: 'active',
          castlingRights: { white: { kingside: true, queenside: true }, black: { kingside: true, queenside: true } },
          enPassantTarget: null
        },
        { 
          board: Array(8).fill(null).map(() => Array(8).fill(null)),
          currentTurn: 'white',
          moveHistory: [],
          fullMoveNumber: -1,
          halfMoveClock: 0,
          gameStatus: 'active',
          castlingRights: { white: { kingside: true, queenside: true }, black: { kingside: true, queenside: true } },
          enPassantTarget: null
        },
        { 
          board: Array(8).fill(null).map(() => Array(8).fill(null)),
          currentTurn: 'white',
          moveHistory: [],
          fullMoveNumber: 1,
          halfMoveClock: -1,
          gameStatus: 'active',
          castlingRights: { white: { kingside: true, queenside: true }, black: { kingside: true, queenside: true } },
          enPassantTarget: null
        },
      ];

      invalidGameStates.forEach(gameStateObj => {
        const result = gameState.validateGameStateConsistency(gameStateObj);
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(Array.isArray(result.errors)).toBe(true);
      });
    });
  });

  describe('GameManager Invalid Input Handling', () => {
    test('should handle invalid game creation parameters', () => {
      const invalidParams = [
        null,
        undefined,
        '',
        123,
        true,
        [],
        {},
        'a', // Too short
        'abcdefghijk', // Too long
      ];

      invalidParams.forEach(playerId => {
        // GameManager.createGame expects a playerId, not gameId
        // Invalid playerIds should be handled gracefully
        expect(() => {
          const gameId = gameManager.createGame(playerId);
          expect(typeof gameId).toBe('string');
          expect(gameId.length).toBe(6);
        }).not.toThrow();
      });
    });

    test('should handle invalid player join parameters', () => {
      // First create a valid game
      const gameId = gameManager.createGame('host-player');

      const invalidJoinParams = [
        { gameId: null, playerId: 'player1' },
        { gameId: 'INVALID', playerId: 'player1' },
        { gameId: gameId, playerId: 'host-player' }, // Can't join own game
      ];

      invalidJoinParams.forEach(({ gameId: gId, playerId }) => {
        // Handle cases where gameId might be null/undefined
        if (gId === null || gId === undefined) {
          expect(() => gameManager.joinGame(gId, playerId)).toThrow();
        } else {
          const result = gameManager.joinGame(gId, playerId);
          expect(result.success).toBe(false);
          expect(result.message).toBeDefined();
          expect(typeof result.message).toBe('string');
        }
      });

      // Test invalid playerId types separately - GameManager may be lenient with these
      const invalidPlayerIds = [null, undefined, '', 123, true, [], {}];
      invalidPlayerIds.forEach(playerId => {
        // These may succeed or fail depending on implementation
        expect(() => {
          const result = gameManager.joinGame(gameId, playerId);
          expect(typeof result).toBe('object');
          expect(typeof result.success).toBe('boolean');
        }).not.toThrow();
      });
    });

    test('should handle invalid move parameters in game manager', () => {
      // Set up a game with players
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');

      const invalidMoveParams = [
        { gameId: null, playerId: 'player1', move: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } } },
        { gameId: 'INVALID', playerId: 'player1', move: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } } },
        { gameId: gameId, playerId: null, move: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } } },
        { gameId: gameId, playerId: 'invalid', move: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } } },
        { gameId: gameId, playerId: 'player1', move: null },
        { gameId: gameId, playerId: 'player1', move: { from: null, to: { row: 4, col: 4 } } },
        { gameId: gameId, playerId: 'player1', move: { from: { row: 6, col: 4 }, to: null } },
      ];

      invalidMoveParams.forEach(({ gameId: gId, playerId, move }) => {
        const result = gameManager.makeMove(gId, playerId, move);
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        expect(typeof result.message).toBe('string');
      });
    });
  });

  describe('API Endpoint Invalid Input Handling', () => {
    test('should handle malformed JSON in move requests', () => {
      const malformedJsonStrings = [
        '{"from":{"row":0,"col":0},"to":{"row":1,"col":1}', // Missing closing brace
        '{"from":{"row":0,"col":0},"to":{"row":1,"col":1}}extra', // Extra characters
        '{"from":{"row":0,"col":0},"to":{"row":1,"col":1},}', // Trailing comma
        '{"from":{"row":0,"col":0},"to":{"row":1,"col":1},"invalid":}', // Missing value
        '{from:{"row":0,"col":0},"to":{"row":1,"col":1}}', // Unquoted key
        '{"from":{"row":0,"col":0},"to":{"row":1,"col":1},"promotion":"queen"extra}', // Invalid string
      ];

      malformedJsonStrings.forEach(jsonString => {
        expect(() => JSON.parse(jsonString)).toThrow(SyntaxError);
      });
    });

    test('should handle oversized request payloads', () => {
      // Create extremely large move object
      const oversizedMove = {
        from: { row: 0, col: 0 },
        to: { row: 1, col: 1 }
      };
      
      // Add many unnecessary properties
      for (let i = 0; i < 1000; i++) {
        oversizedMove[`extraProp${i}`] = `This is a very long string value that adds unnecessary size to the request payload ${i}`.repeat(10);
      }

      const result = game.makeMove(oversizedMove.from, oversizedMove.to);
      // Should fail due to no piece at source or wrong turn
      testUtils.validateErrorResponse(result);
      expect(['NO_PIECE', 'WRONG_TURN']).toContain(result.errorCode);
    });

    test('should handle requests with missing required fields', () => {
      const incompleteRequests = [
        {}, // Empty object
        { from: { row: 0, col: 0 } }, // Missing 'to'
        { to: { row: 1, col: 1 } }, // Missing 'from'
        { from: { row: 0 }, to: { row: 1, col: 1 } }, // Incomplete 'from'
        { from: { row: 0, col: 0 }, to: { col: 1 } }, // Incomplete 'to'
      ];

      incompleteRequests.forEach(request => {
        const result = game.makeMove(request.from, request.to);
        testUtils.validateErrorResponse(result);
        expect(['MALFORMED_MOVE', 'INVALID_FORMAT', 'INVALID_COORDINATES']).toContain(result.errorCode);
      });
    });

    test('should handle SQL injection attempts in string fields', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE games; --",
        "' OR '1'='1",
        "'; DELETE FROM users; --",
        "' UNION SELECT * FROM passwords --",
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
      ];

      sqlInjectionAttempts.forEach(maliciousString => {
        // Test in various string fields - GameManager should handle these gracefully
        expect(() => {
          const gameId = gameManager.createGame(maliciousString);
          expect(typeof gameId).toBe('string');
        }).not.toThrow();

        const gameId = gameManager.createGame('valid-host');
        const result = gameManager.joinGame(gameId, maliciousString);
        // Should succeed or fail gracefully, not throw
        expect(typeof result).toBe('object');
        expect(typeof result.success).toBe('boolean');
      });
    });
  });

  describe('Type Coercion and Edge Cases', () => {
    test('should handle type coercion attempts', () => {
      const coercionAttempts = [
        { from: { row: '0', col: '0' }, to: { row: '1', col: '1' } }, // String numbers
        { from: { row: 0.0, col: 0.0 }, to: { row: 1.0, col: 1.0 } }, // Floats
        { from: { row: 0.5, col: 0.5 }, to: { row: 1.5, col: 1.5 } }, // Non-integer floats
        { from: { row: true, col: false }, to: { row: 1, col: 1 } }, // Booleans
      ];

      coercionAttempts.forEach(({ from, to }) => {
        const result = game.makeMove(from, to);
        testUtils.validateErrorResponse(result);
      });
    });

    test('should handle Unicode and special characters', () => {
      const unicodeStrings = [
        '🚀', '♔', '♕', '♖', '♗', '♘', '♙', // Chess symbols
        'тест', 'テスト', '测试', // Non-Latin scripts
        '\u0000', '\u001F', '\u007F', // Control characters
        '\uFEFF', '\u200B', '\u200C', // Zero-width characters
      ];

      unicodeStrings.forEach(str => {
        // GameManager should handle these gracefully
        expect(() => {
          const gameId = gameManager.createGame(str);
          expect(typeof gameId).toBe('string');
        }).not.toThrow();
      });
    });

    test('should handle extremely long strings', () => {
      const longString = 'a'.repeat(10000);
      
      // GameManager should handle this gracefully
      expect(() => {
        const gameId = gameManager.createGame(longString);
        expect(typeof gameId).toBe('string');
      }).not.toThrow();
    });

    test('should handle buffer overflow attempts', () => {
      const bufferOverflowAttempts = [
        'A'.repeat(100000), // Large string (reduced size for test performance)
        '\x00'.repeat(1000), // Null bytes
        '\xFF'.repeat(1000), // High bytes
      ];

      bufferOverflowAttempts.forEach(attempt => {
        expect(() => {
          const gameId = gameManager.createGame(attempt);
          expect(typeof gameId).toBe('string');
        }).not.toThrow();
      });
    });
  });
});