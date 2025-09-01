const GameManager = require('../src/server/gameManager');
const ChessGame = require('../src/shared/chessGame');

describe.skip('Server Components - Under-Tested Functions Coverage', () => {
  let gameManager;

  beforeEach(() => {
    gameManager = new GameManager();
  });

  afterEach(() => {
    // Clean up any active games
    gameManager.cleanup();
  });

  describe('Game Manager Core Functions', () => {
    test('should test createGame function', () => {
      const gameId = gameManager.createGame('player1');
      
      expect(typeof gameId).toBe('string');
      expect(gameId.length).toBe(6);
      expect(gameManager.games.has(gameId)).toBe(true);
    });

    test('should test joinGame function', () => {
      const gameId = gameManager.createGame('player1');
      const result = gameManager.joinGame(gameId, 'player2');
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('game');
    });

    test('should test getGame function', () => {
      const gameId = gameManager.createGame('player1');
      const game = gameManager.getGame(gameId);
      
      expect(game).toBeDefined();
      expect(game).toHaveProperty('id');
      expect(game.id).toBe(gameId);
    });

    test('should test removeGame function', () => {
      const gameId = gameManager.createGame('player1');
      expect(gameManager.games.has(gameId)).toBe(true);
      
      gameManager.removeGame(gameId);
      expect(gameManager.games.has(gameId)).toBe(false);
    });

    test('should test getActiveGameCount function', () => {
      const initialCount = gameManager.getActiveGameCount();
      
      const gameId1 = gameManager.createGame('player1');
      const gameId2 = gameManager.createGame('player2');
      
      expect(gameManager.getActiveGameCount()).toBe(initialCount + 2);
    });
  });

  describe('Game State Management', () => {
    test('should test getGameState function', () => {
      const gameId = gameManager.createGame('player1');
      const gameState = gameManager.getGameState(gameId);
      
      expect(gameState).toHaveProperty('board');
      expect(gameState).toHaveProperty('currentTurn');
      expect(gameState).toHaveProperty('gameStatus');
      expect(gameState).toHaveProperty('players');
    });

    test('should test updateGameState function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = gameManager.makeMove(gameId, 'player1', move);
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });

    test('should test validateGameAccess function', () => {
      const gameId = gameManager.createGame('player1');
      
      const validAccess = gameManager.validateGameAccess(gameId, 'player1');
      expect(validAccess).toBe(true);
      
      const invalidAccess = gameManager.validateGameAccess(gameId, 'unknown_player');
      expect(invalidAccess).toBe(false);
    });

    test('should test isPlayerTurn function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const game = gameManager.getGame(gameId);
      const whitePlayer = game.players.white;
      const blackPlayer = game.players.black;
      
      // White moves first
      expect(gameManager.isPlayerTurn(gameId, whitePlayer)).toBe(true);
      expect(gameManager.isPlayerTurn(gameId, blackPlayer)).toBe(false);
    });
  });

  describe('Player Management', () => {
    test('should test addPlayer function', () => {
      const gameId = gameManager.createGame('player1');
      const game = gameManager.getGame(gameId);
      
      expect(game.players.white).toBe('player1');
      expect(game.players.black).toBeNull();
      
      gameManager.joinGame(gameId, 'player2');
      expect(game.players.black).toBe('player2');
    });

    test('should test removePlayer function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const result = gameManager.removePlayer(gameId, 'player1');
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });

    test('should test getPlayerColor function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      expect(gameManager.getPlayerColor(gameId, 'player1')).toBe('white');
      expect(gameManager.getPlayerColor(gameId, 'player2')).toBe('black');
      expect(gameManager.getPlayerColor(gameId, 'unknown')).toBeNull();
    });

    test('should test getOpponentId function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      expect(gameManager.getOpponentId(gameId, 'player1')).toBe('player2');
      expect(gameManager.getOpponentId(gameId, 'player2')).toBe('player1');
    });

    test('should test isGameFull function', () => {
      const gameId = gameManager.createGame('player1');
      expect(gameManager.isGameFull(gameId)).toBe(false);
      
      gameManager.joinGame(gameId, 'player2');
      expect(gameManager.isGameFull(gameId)).toBe(true);
    });
  });

  describe('Game Lifecycle Management', () => {
    test('should test startGame function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const result = gameManager.startGame(gameId);
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      
      const game = gameManager.getGame(gameId);
      expect(game.status).toBe('active');
    });

    test('should test endGame function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      gameManager.startGame(gameId);
      
      const result = gameManager.endGame(gameId, 'checkmate', 'player1');
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      
      const game = gameManager.getGame(gameId);
      expect(game.status).toBe('finished');
    });

    test('should test pauseGame function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      gameManager.startGame(gameId);
      
      const result = gameManager.pauseGame(gameId);
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      
      const game = gameManager.getGame(gameId);
      expect(game.status).toBe('paused');
    });

    test('should test resumeGame function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      gameManager.startGame(gameId);
      gameManager.pauseGame(gameId);
      
      const result = gameManager.resumeGame(gameId);
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      
      const game = gameManager.getGame(gameId);
      expect(game.status).toBe('active');
    });
  });

  describe('Move Handling', () => {
    test('should test makeMove function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      gameManager.startGame(gameId);
      
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = gameManager.makeMove(gameId, 'player1', move);
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('gameState');
    });

    test('should test validateMove function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      gameManager.startGame(gameId);
      
      const validMove = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const invalidMove = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } };
      
      expect(gameManager.validateMove(gameId, 'player1', validMove)).toBe(true);
      expect(gameManager.validateMove(gameId, 'player1', invalidMove)).toBe(false);
    });

    test('should test getMoveHistory function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      gameManager.startGame(gameId);
      
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      gameManager.makeMove(gameId, 'player1', move);
      
      const history = gameManager.getMoveHistory(gameId);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(1);
    });

    test('should test undoMove function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      gameManager.startGame(gameId);
      
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      gameManager.makeMove(gameId, 'player1', move);
      
      const result = gameManager.undoMove(gameId);
      expect(result).toHaveProperty('success');
    });
  });

  describe('Game Search and Filtering', () => {
    test('should test findGamesByPlayer function', () => {
      const gameId1 = gameManager.createGame('player1');
      const gameId2 = gameManager.createGame('player1');
      gameManager.createGame('player2');
      
      const playerGames = gameManager.findGamesByPlayer('player1');
      expect(Array.isArray(playerGames)).toBe(true);
      expect(playerGames.length).toBe(2);
    });

    test('should test getGamesByStatus function', () => {
      const gameId1 = gameManager.createGame('player1');
      const gameId2 = gameManager.createGame('player2');
      
      gameManager.joinGame(gameId1, 'player3');
      gameManager.startGame(gameId1);
      
      const activeGames = gameManager.getGamesByStatus('active');
      const waitingGames = gameManager.getGamesByStatus('waiting');
      
      expect(Array.isArray(activeGames)).toBe(true);
      expect(Array.isArray(waitingGames)).toBe(true);
      expect(activeGames.length).toBe(1);
      expect(waitingGames.length).toBe(1);
    });

    test('should test getAvailableGames function', () => {
      gameManager.createGame('player1');
      gameManager.createGame('player2');
      
      const availableGames = gameManager.getAvailableGames();
      expect(Array.isArray(availableGames)).toBe(true);
      expect(availableGames.length).toBe(2);
    });
  });

  describe('Statistics and Analytics', () => {
    test('should test getGameStatistics function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      gameManager.startGame(gameId);
      
      const stats = gameManager.getGameStatistics(gameId);
      expect(stats).toHaveProperty('duration');
      expect(stats).toHaveProperty('moveCount');
      expect(stats).toHaveProperty('players');
    });

    test('should test getPlayerStatistics function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      gameManager.startGame(gameId);
      
      const stats = gameManager.getPlayerStatistics('player1');
      expect(stats).toHaveProperty('gamesPlayed');
      expect(stats).toHaveProperty('wins');
      expect(stats).toHaveProperty('losses');
      expect(stats).toHaveProperty('draws');
    });

    test('should test getServerStatistics function', () => {
      gameManager.createGame('player1');
      gameManager.createGame('player2');
      
      const stats = gameManager.getServerStatistics();
      expect(stats).toHaveProperty('totalGames');
      expect(stats).toHaveProperty('activeGames');
      expect(stats).toHaveProperty('totalPlayers');
    });
  });

  describe('Cleanup and Maintenance', () => {
    test('should test cleanupInactiveGames function', () => {
      const gameId = gameManager.createGame('player1');
      const game = gameManager.getGame(gameId);
      
      // Simulate old game
      game.lastActivity = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      
      const cleaned = gameManager.cleanupInactiveGames();
      expect(typeof cleaned).toBe('number');
    });

    test('should test cleanup function', () => {
      gameManager.createGame('player1');
      gameManager.createGame('player2');
      
      expect(gameManager.getActiveGameCount()).toBeGreaterThan(0);
      
      gameManager.cleanup();
      expect(gameManager.getActiveGameCount()).toBe(0);
    });

    test('should test getMemoryUsage function', () => {
      gameManager.createGame('player1');
      gameManager.createGame('player2');
      
      const usage = gameManager.getMemoryUsage();
      expect(usage).toHaveProperty('gameCount');
      expect(usage).toHaveProperty('estimatedMemory');
    });
  });

  describe('Event Handling', () => {
    test('should test addEventHandler function', () => {
      let eventFired = false;
      const handler = () => { eventFired = true; };
      
      gameManager.addEventHandler('gameCreated', handler);
      gameManager.createGame('player1');
      
      expect(eventFired).toBe(true);
    });

    test('should test removeEventHandler function', () => {
      let eventFired = false;
      const handler = () => { eventFired = true; };
      
      gameManager.addEventHandler('gameCreated', handler);
      gameManager.removeEventHandler('gameCreated', handler);
      gameManager.createGame('player1');
      
      expect(eventFired).toBe(false);
    });

    test('should test emitEvent function', () => {
      let eventData = null;
      const handler = (data) => { eventData = data; };
      
      gameManager.addEventHandler('testEvent', handler);
      gameManager.emitEvent('testEvent', { test: 'data' });
      
      expect(eventData).toEqual({ test: 'data' });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid game ID', () => {
      const result = gameManager.joinGame('invalid_id', 'player1');
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
    });

    test('should handle duplicate player join', () => {
      const gameId = gameManager.createGame('player1');
      const result = gameManager.joinGame(gameId, 'player1');
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
    });

    test('should handle move on non-existent game', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = gameManager.makeMove('invalid_id', 'player1', move);
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
    });

    test('should handle move by non-participant', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      gameManager.startGame(gameId);
      
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = gameManager.makeMove(gameId, 'unknown_player', move);
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
    });

    test('should handle game ID collision', () => {
      // Mock the ID generation to force collision
      const originalGenerateId = gameManager.generateGameId;
      gameManager.generateGameId = () => 'SAME_ID';
      
      const gameId1 = gameManager.createGame('player1');
      const gameId2 = gameManager.createGame('player2');
      
      // Should generate different IDs even with collision
      expect(gameId1).not.toBe(gameId2);
      
      // Restore original function
      gameManager.generateGameId = originalGenerateId;
    });
  });

  describe('Configuration and Settings', () => {
    test('should test updateSettings function', () => {
      const newSettings = {
        maxGamesPerPlayer: 5,
        gameTimeout: 3600000,
        cleanupInterval: 300000
      };
      
      gameManager.updateSettings(newSettings);
      expect(gameManager.settings.maxGamesPerPlayer).toBe(5);
    });

    test('should test getSettings function', () => {
      const settings = gameManager.getSettings();
      expect(settings).toHaveProperty('maxGamesPerPlayer');
      expect(settings).toHaveProperty('gameTimeout');
      expect(settings).toHaveProperty('cleanupInterval');
    });

    test('should test resetSettings function', () => {
      gameManager.updateSettings({ maxGamesPerPlayer: 10 });
      gameManager.resetSettings();
      
      const settings = gameManager.getSettings();
      expect(settings.maxGamesPerPlayer).not.toBe(10);
    });
  });
});