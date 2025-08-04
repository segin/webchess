const ChessGame = require('../src/shared/chessGame');
const GameStateManager = require('../src/shared/gameState');
const GameManager = require('../src/server/gameManager');

describe('Comprehensive Security Tests', () => {
  let game;
  let gameState;
  let gameManager;

  beforeEach(() => {
    game = new ChessGame();
    gameState = new GameStateManager();
    gameManager = new GameManager();
  });

  describe('Input Validation Security', () => {
    test('should prevent SQL injection attempts in game IDs', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE games; --",
        "' OR '1'='1",
        "'; DELETE FROM users; --",
        "' UNION SELECT * FROM passwords --",
        "admin'--",
        "' OR 1=1 --",
        "'; EXEC xp_cmdshell('dir'); --",
        "' AND (SELECT COUNT(*) FROM users) > 0 --",
      ];

      sqlInjectionAttempts.forEach(maliciousId => {
        const result = gameManager.createGame(maliciousId);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid game ID');
      });
    });

    test('should prevent XSS attacks in player names and chat messages', () => {
      const xssAttempts = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
        "javascript:alert('xss')",
        "<svg onload=alert('xss')>",
        "<iframe src=javascript:alert('xss')>",
        "<body onload=alert('xss')>",
        "<div onclick=alert('xss')>click me</div>",
        "';alert('xss');//",
        "\"><script>alert('xss')</script>",
        "<script>document.cookie='stolen'</script>",
      ];

      xssAttempts.forEach(maliciousInput => {
        // Test in player names
        const result1 = gameManager.joinGame('TEST01', maliciousInput);
        expect(result1.success).toBe(false);
        expect(result1.message).toContain('Invalid player ID');

        // Test in chat messages (if implemented)
        if (gameManager.sendChatMessage) {
          const result2 = gameManager.sendChatMessage('TEST01', 'player1', maliciousInput);
          expect(result2.success).toBe(false);
          expect(result2.message).toContain('Invalid message');
        }
      });
    });

    test('should sanitize and validate all coordinate inputs', () => {
      const maliciousCoordinates = [
        { row: "'; DROP TABLE moves; --", col: 0 },
        { row: "<script>alert('xss')</script>", col: 0 },
        { row: "javascript:alert('xss')", col: 0 },
        { row: "eval('malicious code')", col: 0 },
        { row: "require('fs').readFileSync('/etc/passwd')", col: 0 },
        { row: "process.exit(1)", col: 0 },
        { row: "__proto__.polluted = true", col: 0 },
        { row: "constructor.constructor('return process')().exit()", col: 0 },
      ];

      maliciousCoordinates.forEach(coord => {
        const result = game.makeMove(coord, { row: 1, col: 1 });
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid coordinates');
      });
    });

    test('should prevent code injection through move notation', () => {
      const codeInjectionAttempts = [
        "e4; require('child_process').exec('rm -rf /')",
        "e4'; eval('malicious code'); //",
        "e4\"; process.exit(1); //",
        "e4`; ${require('fs').readFileSync('/etc/passwd')}; //",
        "e4${eval('alert(1)')}",
        "e4#{system('malicious command')}",
        "e4{{constructor.constructor('return process')().exit()}}",
        "e4[[__proto__.polluted = true]]",
      ];

      codeInjectionAttempts.forEach(maliciousNotation => {
        const result = game.parseMoveNotation(maliciousNotation);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid move notation');
      });
    });

    test('should validate file path inputs to prevent directory traversal', () => {
      const pathTraversalAttempts = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "/etc/shadow",
        "C:\\Windows\\System32\\config\\SAM",
        "file:///etc/passwd",
        "\\\\server\\share\\file",
        "..%2F..%2F..%2Fetc%2Fpasswd",
        "..%5c..%5c..%5cwindows%5csystem32%5cconfig%5csam",
      ];

      pathTraversalAttempts.forEach(maliciousPath => {
        // Test if any methods accept file paths
        if (game.loadGameFromFile) {
          const result = game.loadGameFromFile(maliciousPath);
          expect(result.success).toBe(false);
          expect(result.message).toContain('Invalid file path');
        }
      });
    });
  });

  describe('Prototype Pollution Prevention', () => {
    test('should prevent prototype pollution through move objects', () => {
      const prototypePollutionAttempts = [
        {
          from: { row: 0, col: 0 },
          to: { row: 1, col: 1 },
          "__proto__": { polluted: true }
        },
        {
          from: { row: 0, col: 0 },
          to: { row: 1, col: 1 },
          "constructor": { "prototype": { polluted: true } }
        },
        {
          from: { row: 0, col: 0, "__proto__": { polluted: true } },
          to: { row: 1, col: 1 }
        },
        {
          from: { row: 0, col: 0 },
          to: { row: 1, col: 1, "constructor.prototype.polluted": true }
        },
      ];

      prototypePollutionAttempts.forEach(maliciousMove => {
        const result = game.makeMove(maliciousMove.from, maliciousMove.to);
        expect(result.success).toBe(false);
        
        // Verify prototype was not polluted
        expect(Object.prototype.polluted).toBeUndefined();
        expect({}.polluted).toBeUndefined();
      });
    });

    test('should prevent prototype pollution through game state', () => {
      const maliciousState = {
        board: Array(8).fill(null).map(() => Array(8).fill(null)),
        currentTurn: 'white',
        "__proto__": { polluted: true },
        "constructor": { "prototype": { polluted: true } }
      };

      const result = game.loadFromState(maliciousState);
      expect(result.success).toBe(false);
      
      // Verify prototype was not polluted
      expect(Object.prototype.polluted).toBeUndefined();
      expect({}.polluted).toBeUndefined();
    });

    test('should prevent prototype pollution through JSON parsing', () => {
      const maliciousJsonStrings = [
        '{"__proto__": {"polluted": true}}',
        '{"constructor": {"prototype": {"polluted": true}}}',
        '{"board": [], "__proto__": {"polluted": true}}',
        '{"from": {"row": 0, "col": 0, "__proto__": {"polluted": true}}}',
      ];

      maliciousJsonStrings.forEach(jsonString => {
        try {
          const parsed = JSON.parse(jsonString);
          const result = game.loadFromState(parsed);
          expect(result.success).toBe(false);
        } catch (error) {
          // JSON parsing might fail, which is acceptable
        }
        
        // Verify prototype was not polluted
        expect(Object.prototype.polluted).toBeUndefined();
        expect({}.polluted).toBeUndefined();
      });
    });
  });

  describe('Buffer Overflow and DoS Prevention', () => {
    test('should handle extremely large input strings without crashing', () => {
      const largeStrings = [
        'A'.repeat(1000000), // 1MB string
        'B'.repeat(10000000), // 10MB string (if system allows)
        '\x00'.repeat(100000), // Null bytes
        '\xFF'.repeat(100000), // High bytes
        'unicode🚀'.repeat(100000), // Unicode characters
      ];

      largeStrings.forEach(largeString => {
        expect(() => {
          const result = gameManager.createGame(largeString);
          expect(result.success).toBe(false);
        }).not.toThrow();
      });
    });

    test('should prevent memory exhaustion through large arrays', () => {
      const maliciousArrays = [
        Array(1000000).fill({ type: 'pawn', color: 'white' }), // Large piece array
        Array(100000).fill({ from: { row: 0, col: 0 }, to: { row: 1, col: 1 } }), // Large move history
        Array(50000).fill('A'.repeat(1000)), // Array of large strings
      ];

      maliciousArrays.forEach(largeArray => {
        expect(() => {
          const result = gameState.loadMoveHistory(largeArray);
          expect(result.success).toBe(false);
        }).not.toThrow();
      });
    });

    test('should handle recursive data structures safely', () => {
      const recursiveObject = { type: 'pawn', color: 'white' };
      recursiveObject.self = recursiveObject;
      recursiveObject.nested = { parent: recursiveObject };

      expect(() => {
        game.board[0][0] = recursiveObject;
        const result = game.validateGameState();
        expect(result.success).toBe(false);
      }).not.toThrow();
    });

    test('should prevent stack overflow through deep nesting', () => {
      let deeplyNested = { value: 'base' };
      
      // Create deeply nested object
      for (let i = 0; i < 10000; i++) {
        deeplyNested = { nested: deeplyNested };
      }

      expect(() => {
        const result = game.makeMove(deeplyNested, { row: 1, col: 1 });
        expect(result.success).toBe(false);
      }).not.toThrow();
    });
  });

  describe('Authentication and Authorization Security', () => {
    test('should prevent unauthorized move attempts', () => {
      // Create game with two players
      const gameId = 'SEC001';
      gameManager.createGame(gameId);
      gameManager.joinGame(gameId, 'player1');
      gameManager.joinGame(gameId, 'player2');

      // Attempt moves by unauthorized players
      const unauthorizedAttempts = [
        { gameId, playerId: 'hacker', from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { gameId, playerId: null, from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { gameId, playerId: undefined, from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { gameId, playerId: '', from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
        { gameId, playerId: 'player3', from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
      ];

      unauthorizedAttempts.forEach(({ gameId: gId, playerId, from, to }) => {
        const result = gameManager.makeMove(gId, playerId, from, to);
        expect(result.success).toBe(false);
        expect(result.message).toMatch(/unauthorized|invalid player/i);
      });
    });

    test('should prevent game state manipulation by unauthorized users', () => {
      const gameId = 'SEC002';
      gameManager.createGame(gameId);
      gameManager.joinGame(gameId, 'player1');

      // Attempt to manipulate game state
      const manipulationAttempts = [
        () => gameManager.setGameWinner(gameId, 'hacker', 'player1'),
        () => gameManager.resetGame(gameId, 'hacker'),
        () => gameManager.deleteGame(gameId, 'hacker'),
        () => gameManager.modifyBoard(gameId, 'hacker', []),
      ];

      manipulationAttempts.forEach(attempt => {
        if (typeof attempt === 'function') {
          expect(() => {
            const result = attempt();
            if (result) {
              expect(result.success).toBe(false);
            }
          }).not.toThrow();
        }
      });
    });

    test('should validate session tokens and prevent session hijacking', () => {
      const gameId = 'SEC003';
      gameManager.createGame(gameId);

      const maliciousTokens = [
        'fake-token-123',
        'admin-override-token',
        '../../../etc/passwd',
        '<script>alert("xss")</script>',
        'null',
        'undefined',
        '',
        'Bearer malicious-jwt-token',
      ];

      maliciousTokens.forEach(token => {
        if (gameManager.validateSession) {
          const result = gameManager.validateSession(gameId, token);
          expect(result.success).toBe(false);
        }
      });
    });
  });

  describe('Data Integrity and Tampering Prevention', () => {
    test('should detect and prevent board state tampering', () => {
      // Set up initial game state
      const originalBoard = JSON.parse(JSON.stringify(game.board));
      
      // Attempt various tampering methods
      const tamperingAttempts = [
        () => { game.board[0][0] = { type: 'queen', color: 'white' }; }, // Add illegal piece
        () => { game.board[7][4] = null; }, // Remove king
        () => { game.board.push(Array(8).fill(null)); }, // Add extra row
        () => { game.board[0] = null; }, // Remove row
        () => { game.board = null; }, // Null entire board
      ];

      tamperingAttempts.forEach(tamper => {
        // Reset board
        game.board = JSON.parse(JSON.stringify(originalBoard));
        
        // Attempt tampering
        tamper();
        
        // Validate should detect tampering
        const result = game.validateGameState();
        expect(result.success).toBe(false);
      });
    });

    test('should prevent move history manipulation', () => {
      // Add some legitimate moves
      gameState.addMove({ from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, piece: 'pawn', color: 'white' });
      gameState.addMove({ from: { row: 1, col: 4 }, to: { row: 3, col: 4 }, piece: 'pawn', color: 'black' });

      const originalHistory = JSON.parse(JSON.stringify(gameState.moveHistory));

      // Attempt to manipulate history
      const manipulationAttempts = [
        () => { gameState.moveHistory.pop(); }, // Remove last move
        () => { gameState.moveHistory[0].piece = 'queen'; }, // Change piece type
        () => { gameState.moveHistory[0].color = 'black'; }, // Change color
        () => { gameState.moveHistory.push({ fake: 'move' }); }, // Add fake move
        () => { gameState.moveHistory = []; }, // Clear history
      ];

      manipulationAttempts.forEach(manipulate => {
        // Reset history
        gameState.moveHistory = JSON.parse(JSON.stringify(originalHistory));
        
        // Attempt manipulation
        manipulate();
        
        // Validation should detect manipulation
        const result = gameState.validateMoveHistory();
        expect(result.success).toBe(false);
      });
    });

    test('should verify game state checksums and integrity', () => {
      // Generate checksum for current state
      const checksum = game.generateStateChecksum();
      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('string');

      // Verify checksum matches
      const verification1 = game.verifyStateChecksum(checksum);
      expect(verification1).toBe(true);

      // Modify state slightly
      game.board[0][0] = { type: 'rook', color: 'black' };

      // Checksum should no longer match
      const verification2 = game.verifyStateChecksum(checksum);
      expect(verification2).toBe(false);
    });

    test('should prevent time-based attacks and race conditions', () => {
      const gameId = 'SEC004';
      gameManager.createGame(gameId);
      gameManager.joinGame(gameId, 'player1');
      gameManager.joinGame(gameId, 'player2');

      // Attempt rapid concurrent moves
      const concurrentMoves = [];
      for (let i = 0; i < 100; i++) {
        concurrentMoves.push(
          gameManager.makeMove(gameId, 'player1', { row: 6, col: 4 }, { row: 4, col: 4 })
        );
      }

      // Only one move should succeed
      const successfulMoves = concurrentMoves.filter(result => result.success);
      expect(successfulMoves.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Information Disclosure Prevention', () => {
    test('should not leak sensitive information in error messages', () => {
      const sensitiveAttempts = [
        () => game.makeMove({ row: -1, col: 0 }, { row: 0, col: 0 }),
        () => gameManager.createGame(''),
        () => gameManager.joinGame('NONEXISTENT', 'player1'),
        () => gameState.addMove(null),
      ];

      sensitiveAttempts.forEach(attempt => {
        const result = attempt();
        expect(result.success).toBe(false);
        
        // Error messages should not contain sensitive information
        expect(result.message).not.toMatch(/password|secret|key|token|internal|debug|stack|trace/i);
        expect(result.message).not.toContain('undefined');
        expect(result.message).not.toContain('null');
        expect(result.message).not.toContain('[object Object]');
      });
    });

    test('should not expose internal system information', () => {
      const systemInfoAttempts = [
        () => game.getSystemInfo && game.getSystemInfo(),
        () => gameManager.getDebugInfo && gameManager.getDebugInfo(),
        () => gameState.getInternalState && gameState.getInternalState(),
      ];

      systemInfoAttempts.forEach(attempt => {
        if (typeof attempt === 'function') {
          const result = attempt();
          if (result) {
            // Should not contain system paths, versions, or internal details
            const resultStr = JSON.stringify(result);
            expect(resultStr).not.toMatch(/\/home|\/usr|\/var|C:\\|node_modules|process\.env/i);
          }
        }
      });
    });

    test('should sanitize debug output and logs', () => {
      // Capture console output
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const logs = [];

      console.log = (...args) => logs.push(['log', ...args]);
      console.error = (...args) => logs.push(['error', ...args]);

      try {
        // Perform operations that might log sensitive data
        game.makeMove({ row: 'malicious', col: 'input' }, { row: 0, col: 0 });
        gameManager.createGame('<script>alert("xss")</script>');
        gameState.addMove({ malicious: 'data', __proto__: { polluted: true } });

        // Check that logs don't contain sensitive information
        logs.forEach(log => {
          const logStr = log.join(' ');
          expect(logStr).not.toMatch(/password|secret|key|token|__proto__|constructor/i);
          expect(logStr).not.toContain('<script>');
          expect(logStr).not.toContain('javascript:');
        });

      } finally {
        // Restore console
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
      }
    });
  });
});