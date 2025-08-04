const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');
const GameManager = require('../src/server/gameManager');

describe('Comprehensive Invalid Input Handling Tests', () => {
  let game;
  let gameState;
  let gameManager;

  beforeEach(() => {
    game = new ChessGame();
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
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid coordinates');
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
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid coordinates');
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
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid coordinates');
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
          expect(result.success).toBe(false);
          expect(result.message).toContain('Invalid promotion');
        }
      });
    });

    test('should handle method calls with wrong number of arguments', () => {
      // Test makeMove with insufficient arguments
      expect(() => game.makeMove()).not.toThrow();
      expect(() => game.makeMove({ row: 0, col: 0 })).not.toThrow();
      
      // Test with too many arguments
      const result = game.makeMove(
        { row: 6, col: 4 }, 
        { row: 4, col: 4 }, 
        'queen', 
        'extra', 
        'arguments'
      );
      expect(result.success).toBe(false);
    });

    test('should handle circular reference objects', () => {
      const circularFrom = { row: 0, col: 0 };
      circularFrom.self = circularFrom;
      
      const circularTo = { row: 1, col: 1 };
      circularTo.self = circularTo;

      const result = game.makeMove(circularFrom, circularTo);
      expect(result.success).toBe(false);
    });

    test('should handle extremely large objects as coordinates', () => {
      const largeObject = { row: 0, col: 0 };
      for (let i = 0; i < 1000; i++) {
        largeObject[`prop${i}`] = `value${i}`;
      }

      const result = game.makeMove(largeObject, { row: 1, col: 1 });
      expect(result.success).toBe(false);
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
        { from: { row: 'a', col: 'b' }, to: { row: 'c', col: 'd' }, piece: 'invalid', color: 'purple' },
      ];

      invalidMoves.forEach(move => {
        const result = gameState.addMove(move);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid move');
      });
    });

    test('should handle invalid game status values', () => {
      const invalidStatuses = [
        null, undefined, '', 'invalid', 123, true, [], {}, 'ACTIVE', 'Check'
      ];

      invalidStatuses.forEach(status => {
        const result = gameState.setGameStatus(status);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid game status');
      });
    });

    test('should handle invalid player colors', () => {
      const invalidColors = [
        null, undefined, '', 'red', 'blue', 'WHITE', 'BLACK', 123, true, [], {}
      ];

      invalidColors.forEach(color => {
        const result = gameState.setCurrentTurn(color);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid player color');
      });
    });

    test('should handle corrupted castling rights', () => {
      const invalidCastlingRights = [
        null,
        undefined,
        'invalid',
        { white: null },
        { black: null },
        { white: { kingside: 'yes' } },
        { white: { queenside: 123 } },
        { invalid: { kingside: true } },
      ];

      invalidCastlingRights.forEach(rights => {
        const result = gameState.setCastlingRights(rights);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid castling rights');
      });
    });

    test('should handle invalid en passant targets', () => {
      const invalidTargets = [
        'invalid',
        { row: 'a' },
        { col: 'b' },
        { row: -1, col: 0 },
        { row: 0, col: 8 },
        { x: 0, y: 0 },
        123,
        true,
        [],
      ];

      invalidTargets.forEach(target => {
        const result = gameState.setEnPassantTarget(target);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid en passant target');
      });
    });
  });

  describe('GameManager Invalid Input Handling', () => {
    test('should handle invalid game creation parameters', () => {
      const invalidParams = [
        { gameId: null },
        { gameId: undefined },
        { gameId: '' },
        { gameId: 123 },
        { gameId: true },
        { gameId: [] },
        { gameId: {} },
        { gameId: 'a' }, // Too short
        { gameId: 'abcdefghijk' }, // Too long
        { gameId: 'ABC123' }, // Invalid characters
      ];

      invalidParams.forEach(params => {
        const result = gameManager.createGame(params.gameId);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid game ID');
      });
    });

    test('should handle invalid player join parameters', () => {
      // First create a valid game
      const gameId = 'TEST01';
      gameManager.createGame(gameId);

      const invalidJoinParams = [
        { gameId: null, playerId: 'player1' },
        { gameId: 'INVALID', playerId: 'player1' },
        { gameId: gameId, playerId: null },
        { gameId: gameId, playerId: undefined },
        { gameId: gameId, playerId: '' },
        { gameId: gameId, playerId: 123 },
        { gameId: gameId, playerId: true },
        { gameId: gameId, playerId: [] },
        { gameId: gameId, playerId: {} },
      ];

      invalidJoinParams.forEach(({ gameId: gId, playerId }) => {
        const result = gameManager.joinGame(gId, playerId);
        expect(result.success).toBe(false);
        expect(result.message).toMatch(/Invalid (game ID|player ID)/);
      });
    });

    test('should handle invalid move parameters in game manager', () => {
      // Set up a game with players
      const gameId = 'TEST02';
      gameManager.createGame(gameId);
      gameManager.joinGame(gameId, 'player1');
      gameManager.joinGame(gameId, 'player2');

      const invalidMoveParams = [
        { gameId: null, playerId: 'player1', from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { gameId: 'INVALID', playerId: 'player1', from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { gameId: gameId, playerId: null, from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { gameId: gameId, playerId: 'invalid', from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { gameId: gameId, playerId: 'player1', from: null, to: { row: 4, col: 4 } },
        { gameId: gameId, playerId: 'player1', from: { row: 6, col: 4 }, to: null },
      ];

      invalidMoveParams.forEach(({ gameId: gId, playerId, from, to }) => {
        const result = gameManager.makeMove(gId, playerId, from, to);
        expect(result.success).toBe(false);
        expect(result.message).toMatch(/Invalid (game ID|player ID|move)/);
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
        expect(() => JSON.parse(jsonString)).toThrow();
      });
    });

    test('should handle oversized request payloads', () => {
      // Create extremely large move object
      const oversizedMove = {
        from: { row: 0, col: 0 },
        to: { row: 1, col: 1 }
      };
      
      // Add many unnecessary properties
      for (let i = 0; i < 10000; i++) {
        oversizedMove[`extraProp${i}`] = `This is a very long string value that adds unnecessary size to the request payload ${i}`.repeat(100);
      }

      const result = game.makeMove(oversizedMove.from, oversizedMove.to);
      expect(result.success).toBe(false);
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
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid coordinates');
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
        // Test in various string fields
        const result1 = gameManager.createGame(maliciousString);
        expect(result1.success).toBe(false);

        const result2 = gameManager.joinGame('TEST03', maliciousString);
        expect(result2.success).toBe(false);
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
        expect(result.success).toBe(false);
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
        const result = gameManager.createGame(str);
        expect(result.success).toBe(false);
      });
    });

    test('should handle extremely long strings', () => {
      const longString = 'a'.repeat(10000);
      
      const result = gameManager.createGame(longString);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid game ID');
    });

    test('should handle buffer overflow attempts', () => {
      const bufferOverflowAttempts = [
        'A'.repeat(1000000), // 1MB string
        '\x00'.repeat(1000), // Null bytes
        '\xFF'.repeat(1000), // High bytes
      ];

      bufferOverflowAttempts.forEach(attempt => {
        expect(() => {
          const result = gameManager.createGame(attempt);
          expect(result.success).toBe(false);
        }).not.toThrow();
      });
    });
  });
});