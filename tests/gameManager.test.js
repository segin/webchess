const GameManager = require('../src/server/gameManager');

describe('GameManager', () => {
  let gameManager;

  beforeEach(() => {
    gameManager = new GameManager();
  });

  describe('Game Creation', () => {
    test('should create a new game with 6-character ID', () => {
      const playerId = 'player1';
      const gameId = gameManager.createGame(playerId);
      
      expect(gameId).toHaveLength(6);
      expect(gameId).toMatch(/^[A-Z0-9]{6}$/);
      expect(gameManager.games.has(gameId)).toBe(true);
    });

    test('should create unique game IDs', () => {
      const gameIds = new Set();
      for (let i = 0; i < 100; i++) {
        const gameId = gameManager.createGame(`player${i}`);
        expect(gameIds.has(gameId)).toBe(false);
        gameIds.add(gameId);
      }
    });

    test('should set correct initial game state', () => {
      const playerId = 'player1';
      const gameId = gameManager.createGame(playerId);
      const game = gameManager.games.get(gameId);
      
      expect(game.host).toBe(playerId);
      expect(game.guest).toBe(null);
      expect(game.status).toBe('waiting');
      expect(game.chess).toBeDefined();
      expect(game.createdAt).toBeDefined();
      expect(game.lastActivity).toBeDefined();
    });
  });

  describe('Game Joining', () => {
    test('should allow player to join existing game', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      
      const result = gameManager.joinGame(gameId, guestId);
      
      expect(result.success).toBe(true);
      expect(result.color).toBe('black');
      expect(result.opponentColor).toBe('white');
      
      const game = gameManager.games.get(gameId);
      expect(game.guest).toBe(guestId);
      expect(game.status).toBe('active');
    });

    test('should handle case-insensitive game IDs', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      
      const result = gameManager.joinGame(gameId.toLowerCase(), guestId);
      expect(result.success).toBe(true);
    });

    test('should reject joining non-existent game', () => {
      const result = gameManager.joinGame('NONEXISTENT', 'player');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game not found');
    });

    test('should reject joining full game', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const thirdId = 'third';
      const gameId = gameManager.createGame(hostId);
      
      gameManager.joinGame(gameId, guestId);
      const result = gameManager.joinGame(gameId, thirdId);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game is full');
    });

    test('should reject host joining their own game', () => {
      const hostId = 'host';
      const gameId = gameManager.createGame(hostId);
      
      const result = gameManager.joinGame(gameId, hostId);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot join your own game');
    });
  });

  describe('Move Making', () => {
    test('should allow valid moves', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const result = gameManager.makeMove(gameId, hostId, {
        from: { row: 6, col: 4 },
        to: { row: 5, col: 4 }
      });
      
      expect(result.success).toBe(true);
      expect(result.gameState).toBeDefined();
      expect(result.nextTurn).toBe('black');
    });

    test('should reject moves from non-participants', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const outsiderId = 'outsider';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const result = gameManager.makeMove(gameId, outsiderId, {
        from: { row: 6, col: 4 },
        to: { row: 5, col: 4 }
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('You are not in this game');
    });

    test('should reject moves when not player turn', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const result = gameManager.makeMove(gameId, guestId, {
        from: { row: 1, col: 4 },
        to: { row: 2, col: 4 }
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Not your turn');
    });

    test('should reject moves for non-existent game', () => {
      const result = gameManager.makeMove('NONEXISTENT', 'player', {
        from: { row: 6, col: 4 },
        to: { row: 5, col: 4 }
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game not found');
    });

    test('should update last activity on valid move', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const game = gameManager.games.get(gameId);
      const originalActivity = game.lastActivity;
      
      setTimeout(() => {
        gameManager.makeMove(gameId, hostId, {
          from: { row: 6, col: 4 },
          to: { row: 5, col: 4 }
        });
        
        expect(game.lastActivity).toBeGreaterThan(originalActivity);
      }, 10);
    });
  });

  describe('Game Resignation', () => {
    test('should allow player to resign', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const result = gameManager.resignGame(gameId, hostId);
      
      expect(result.success).toBe(true);
      expect(result.winner).toBe('black');
      
      const game = gameManager.games.get(gameId);
      expect(game.status).toBe('resigned');
    });

    test('should determine correct winner when host resigns', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const result = gameManager.resignGame(gameId, hostId);
      expect(result.winner).toBe('black');
    });

    test('should determine correct winner when guest resigns', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const result = gameManager.resignGame(gameId, guestId);
      expect(result.winner).toBe('white');
    });

    test('should reject resignation from non-participant', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const outsiderId = 'outsider';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const result = gameManager.resignGame(gameId, outsiderId);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('You are not in this game');
    });
  });

  describe('Disconnection Handling', () => {
    test('should track disconnected players', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      gameManager.handleDisconnect(hostId);
      
      expect(gameManager.disconnectedPlayers.has(hostId)).toBe(true);
      const disconnectedInfo = gameManager.disconnectedPlayers.get(hostId);
      expect(disconnectedInfo.gameId).toBe(gameId);
      expect(disconnectedInfo.disconnectedAt).toBeDefined();
    });

    test('should not track disconnection if game not active', () => {
      const hostId = 'host';
      const gameId = gameManager.createGame(hostId);
      
      gameManager.handleDisconnect(hostId);
      
      expect(gameManager.disconnectedPlayers.has(hostId)).toBe(false);
    });

    test('should clean up abandoned games', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      gameManager.handleDisconnect(hostId);
      gameManager.checkDisconnectedPlayer(hostId);
      
      expect(gameManager.games.has(gameId)).toBe(false);
      expect(gameManager.playerToGame.has(hostId)).toBe(false);
      expect(gameManager.playerToGame.has(guestId)).toBe(false);
    });
  });

  describe('Game State Retrieval', () => {
    test('should return game state for existing game', () => {
      const hostId = 'host';
      const gameId = gameManager.createGame(hostId);
      
      const gameState = gameManager.getGameState(gameId);
      
      expect(gameState).toBeDefined();
      expect(gameState.board).toBeDefined();
      expect(gameState.currentTurn).toBe('white');
    });

    test('should return null for non-existent game', () => {
      const gameState = gameManager.getGameState('NONEXISTENT');
      expect(gameState).toBe(null);
    });
  });

  describe('Player-to-Game Mapping', () => {
    test('should track player to game mapping', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      expect(gameManager.playerToGame.get(hostId)).toBe(gameId);
      expect(gameManager.playerToGame.get(guestId)).toBe(gameId);
    });

    test('should handle disconnection based on player mapping', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      gameManager.handleDisconnect(hostId);
      
      const disconnectedInfo = gameManager.disconnectedPlayers.get(hostId);
      expect(disconnectedInfo.gameId).toBe(gameId);
    });
  });
});