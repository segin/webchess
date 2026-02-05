const GameManager = require('../src/server/gameManager');
const ChessGame = require('../src/shared/chessGame');

describe('Server Components - Under-Tested Functions Coverage', () => {
  let gameManager;

  beforeEach(() => {
    gameManager = new GameManager();
  });

  afterEach(() => {
    // Clean up any active games
    try {
      gameManager.cleanup();
    } catch (error) {
      // Ignore cleanup errors
    }
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
      expect(result).toHaveProperty('color');
      expect(result.color).toBe('black');
      expect(result).toHaveProperty('opponentColor');
      expect(result.opponentColor).toBe('white');
    });

    test('should test getGame function', () => {
      const gameId = gameManager.createGame('player1');
      const game = gameManager.getGame(gameId);
      
      expect(game).toBeDefined();
      expect(game).toHaveProperty('id');
      expect(game.id).toBe(gameId);
      expect(game).toHaveProperty('host');
      expect(game.host).toBe('player1');
      expect(game).toHaveProperty('status');
      expect(game.status).toBe('waiting');
    });

    test('should test removeGame function', () => {
      const gameId = gameManager.createGame('player1');
      expect(gameManager.games.has(gameId)).toBe(true);
      
      const removed = gameManager.removeGame(gameId);
      expect(removed).toBe(true);
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
      expect(gameState).toHaveProperty('moveHistory');
      expect(gameState).toHaveProperty('castlingRights');
      expect(gameState).toHaveProperty('enPassantTarget');
    });

    test('should test makeMove function updates game state', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = gameManager.makeMove(gameId, 'player1', move);
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('gameState');
      expect(result.gameState).toHaveProperty('currentTurn');
      expect(result.gameState.currentTurn).toBe('black');
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
      
      // White (host) moves first
      expect(gameManager.isPlayerTurn(gameId, 'player1')).toBe(true);
      expect(gameManager.isPlayerTurn(gameId, 'player2')).toBe(false);
      
      // After white moves, it should be black's turn
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      gameManager.makeMove(gameId, 'player1', move);
      
      expect(gameManager.isPlayerTurn(gameId, 'player1')).toBe(false);
      expect(gameManager.isPlayerTurn(gameId, 'player2')).toBe(true);
    });
  });

  describe('Player Management', () => {
    test('should test player assignment in game creation and joining', () => {
      const gameId = gameManager.createGame('player1');
      const game = gameManager.getGame(gameId);
      
      expect(game.host).toBe('player1');
      expect(game.guest).toBeNull();
      
      const joinResult = gameManager.joinGame(gameId, 'player2');
      expect(joinResult.success).toBe(true);
      expect(game.guest).toBe('player2');
    });

    test('should test removePlayer function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const result = gameManager.removePlayer(gameId, 'player1');
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      
      const game = gameManager.getGame(gameId);
      expect(game.host).toBe('player2'); // Guest promoted to host
      expect(game.guest).toBeNull();
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
      expect(gameManager.getOpponentId(gameId, 'unknown')).toBeNull();
    });

    test('should test isGameFull function', () => {
      const gameId = gameManager.createGame('player1');
      expect(gameManager.isGameFull(gameId)).toBeFalsy(); // Game has only host, no guest
      
      gameManager.joinGame(gameId, 'player2');
      expect(gameManager.isGameFull(gameId)).toBeTruthy(); // Game has both host and guest
      
      // Test with non-existent game
      expect(gameManager.isGameFull('nonexistent')).toBeFalsy();
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
      expect(result).toHaveProperty('reason');
      expect(result.reason).toBe('checkmate');
      expect(result).toHaveProperty('winner');
      expect(result.winner).toBe('player1');
      
      const game = gameManager.getGame(gameId);
      expect(game.status).toBe('finished');
      expect(game.endReason).toBe('checkmate');
      expect(game.winner).toBe('player1');
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
      expect(game).toHaveProperty('pausedAt');
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
      expect(game).toHaveProperty('resumedAt');
    });
  });

  describe('Move Handling', () => {
    test('should test makeMove function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = gameManager.makeMove(gameId, 'player1', move);
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('gameState');
      expect(result).toHaveProperty('nextTurn');
      expect(result.nextTurn).toBe('black');
    });

    test('should test validateMove function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const validMove = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      
      // Note: validateMove in GameManager actually makes the move to test validity
      // This is a limitation of the current implementation
      expect(gameManager.validateMove(gameId, 'player1', validMove)).toBe(true);
      
      // Test invalid move on a fresh game
      const gameId2 = gameManager.createGame('player3');
      gameManager.joinGame(gameId2, 'player4');
      const invalidMove = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } }; // Invalid pawn move
      expect(gameManager.validateMove(gameId2, 'player3', invalidMove)).toBe(false);
      
      // Test validation with wrong player
      const gameId3 = gameManager.createGame('player5');
      gameManager.joinGame(gameId3, 'player6');
      expect(gameManager.validateMove(gameId3, 'unknown_player', validMove)).toBe(false);
    });

    test('should test getMoveHistory function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      gameManager.makeMove(gameId, 'player1', move);
      
      const history = gameManager.getMoveHistory(gameId);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(1);
    });

    test('should test undoMove function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      gameManager.makeMove(gameId, 'player1', move);
      
      const result = gameManager.undoMove(gameId);
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false); // Undo is not implemented
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('You are not in this game');
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
      
      expect(activeGames instanceof Set).toBe(true);
      expect(waitingGames instanceof Set).toBe(true);
      expect(activeGames.size).toBe(1);
      expect(waitingGames.size).toBe(1);
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
      
      const stats = gameManager.getGameStatistics(gameId);
      expect(stats).toHaveProperty('duration');
      expect(stats).toHaveProperty('moveCount');
      expect(stats).toHaveProperty('players');
      expect(stats).toHaveProperty('status');
      expect(stats).toHaveProperty('createdAt');
      expect(stats).toHaveProperty('lastActivity');
      expect(stats.players).toHaveProperty('white');
      expect(stats.players).toHaveProperty('black');
      expect(stats.players.white).toBe('player1');
      expect(stats.players.black).toBe('player2');
    });

    test('should test getPlayerStatistics function', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const stats = gameManager.getPlayerStatistics('player1');
      expect(stats).toHaveProperty('gamesPlayed');
      expect(stats).toHaveProperty('wins');
      expect(stats).toHaveProperty('losses');
      expect(stats).toHaveProperty('draws');
      expect(stats).toHaveProperty('winRate');
      expect(typeof stats.gamesPlayed).toBe('number');
      expect(typeof stats.wins).toBe('number');
      expect(typeof stats.losses).toBe('number');
      expect(typeof stats.draws).toBe('number');
      expect(typeof stats.winRate).toBe('number');
    });

    test('should test getServerStatistics function', () => {
      gameManager.createGame('player1');
      gameManager.createGame('player2');
      
      const stats = gameManager.getServerStatistics();
      expect(stats).toHaveProperty('totalGames');
      expect(stats).toHaveProperty('activeGames');
      expect(stats).toHaveProperty('waitingGames');
      expect(stats).toHaveProperty('finishedGames');
      expect(stats).toHaveProperty('totalPlayers');
      expect(stats).toHaveProperty('disconnectedPlayers');
      expect(stats.totalGames).toBe(2);
      expect(stats.totalPlayers).toBe(2);
    });
  });

  describe('Cleanup and Maintenance', () => {
    test('should test cleanupInactiveGames function', () => {
      const gameId = gameManager.createGame('player1');
      const game = gameManager.getGame(gameId);
      
      // Simulate old game (older than default 2 hours)
      game.lastActivity = Date.now() - (3 * 60 * 60 * 1000); // 3 hours ago
      
      const cleaned = gameManager.cleanupInactiveGames();
      expect(typeof cleaned).toBe('number');
      expect(cleaned).toBeGreaterThanOrEqual(1); // Should clean up at least the old game
      expect(gameManager.games.has(gameId)).toBe(false); // Game should be removed
    });

    test('should test cleanup function', () => {
      gameManager.createGame('player1');
      gameManager.createGame('player2');
      
      expect(gameManager.getActiveGameCount()).toBeGreaterThan(0);
      
      gameManager.cleanup();
      expect(gameManager.getActiveGameCount()).toBe(0);
      expect(gameManager.playerToGame.size).toBe(0);
      expect(gameManager.disconnectedPlayers.size).toBe(0);
    });

    test('should test getMemoryUsage function', () => {
      gameManager.createGame('player1');
      gameManager.createGame('player2');
      
      const usage = gameManager.getMemoryUsage();
      expect(usage).toHaveProperty('gameCount');
      expect(usage).toHaveProperty('playerMappings');
      expect(usage).toHaveProperty('disconnectedCount');
      expect(usage).toHaveProperty('estimatedMemory');
      expect(usage.gameCount).toBe(2);
      expect(usage.playerMappings).toBe(2);
      expect(typeof usage.estimatedMemory).toBe('number');
    });

    test('should test cleanupInactiveGames with custom age', () => {
      const gameId1 = gameManager.createGame('player1');
      const gameId2 = gameManager.createGame('player2');
      
      const game1 = gameManager.getGame(gameId1);
      const game2 = gameManager.getGame(gameId2);
      
      // Make one game old, keep one recent
      game1.lastActivity = Date.now() - (1 * 60 * 60 * 1000); // 1 hour ago
      game2.lastActivity = Date.now() - (10 * 1000); // 10 seconds ago
      
      const cleaned = gameManager.cleanupInactiveGames(30 * 60 * 1000); // 30 minutes
      expect(cleaned).toBe(1); // Should clean up only the 1-hour old game
      expect(gameManager.games.has(gameId1)).toBe(false);
      expect(gameManager.games.has(gameId2)).toBe(true);
    });
  });

  describe('Event Handling', () => {
    test('should test addEventHandler function', () => {
      let eventFired = false;
      const handler = () => { eventFired = true; };
      
      gameManager.addEventHandler('gameCreated', handler);
      gameManager.emitEvent('gameCreated', { gameId: 'test' });
      
      expect(eventFired).toBe(true);
    });

    test('should test removeEventHandler function', () => {
      let eventFired = false;
      const handler = () => { eventFired = true; };
      
      gameManager.addEventHandler('gameCreated', handler);
      gameManager.removeEventHandler('gameCreated', handler);
      gameManager.emitEvent('gameCreated', { gameId: 'test' });
      
      expect(eventFired).toBe(false);
    });

    test('should test emitEvent function', () => {
      let eventData = null;
      const handler = (data) => { eventData = data; };
      
      gameManager.addEventHandler('testEvent', handler);
      gameManager.emitEvent('testEvent', { test: 'data' });
      
      expect(eventData).toEqual({ test: 'data' });
    });

    test('should test multiple event handlers', () => {
      let handler1Called = false;
      let handler2Called = false;
      
      const handler1 = () => { handler1Called = true; };
      const handler2 = () => { handler2Called = true; };
      
      gameManager.addEventHandler('multiTest', handler1);
      gameManager.addEventHandler('multiTest', handler2);
      gameManager.emitEvent('multiTest', {});
      
      expect(handler1Called).toBe(true);
      expect(handler2Called).toBe(true);
    });

    test('should handle event handler errors gracefully', () => {
      const errorHandler = () => { throw new Error('Test error'); };
      const normalHandler = jest.fn();
      
      gameManager.addEventHandler('errorTest', errorHandler);
      gameManager.addEventHandler('errorTest', normalHandler);
      
      // Should not throw and should still call other handlers
      expect(() => {
        gameManager.emitEvent('errorTest', {});
      }).not.toThrow();
      
      expect(normalHandler).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid game ID', () => {
      const result = gameManager.joinGame('invalid_id', 'player1');
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Game not found');
    });

    test('should handle duplicate player join', () => {
      const gameId = gameManager.createGame('player1');
      const result = gameManager.joinGame(gameId, 'player1');
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Cannot join your own game');
    });

    test('should handle move on non-existent game', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = gameManager.makeMove('invalid_id', 'player1', move);
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Game not found');
    });

    test('should handle move by non-participant', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = gameManager.makeMove(gameId, 'unknown_player', move);
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('You are not in this game');
    });

    test('should handle game ID collision', () => {
      // Mock the ID generation to simulate collision then unique ID
      const originalGenerateId = gameManager.generateGameId;
      let callCount = 0;
      gameManager.generateGameId = () => {
        callCount++;
        if (callCount === 1) return 'COLLISION_ID';
        if (callCount === 2) return 'COLLISION_ID'; // First collision
        return 'UNIQUE_ID_' + callCount; // Then unique IDs
      };
      
      const gameId1 = gameManager.createGame('player1');
      const gameId2 = gameManager.createGame('player2');
      
      // Should generate different IDs even with initial collision
      expect(gameId1).not.toBe(gameId2);
      expect(gameId1).toBe('COLLISION_ID');
      expect(gameId2).toBe('UNIQUE_ID_3');
      
      // Restore original function
      gameManager.generateGameId = originalGenerateId;
    });

    test('should handle joining full game', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const result = gameManager.joinGame(gameId, 'player3');
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Game is full');
    });

    test('should handle move when not player turn', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const move = { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } };
      const result = gameManager.makeMove(gameId, 'player2', move); // Black tries to move first
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Not your turn');
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
      const settings = gameManager.getSettings();
      expect(settings.maxGamesPerPlayer).toBe(5);
      expect(settings.gameTimeout).toBe(3600000);
      expect(settings.cleanupInterval).toBe(300000);
    });

    test('should test getSettings function', () => {
      const settings = gameManager.getSettings();
      expect(settings).toHaveProperty('maxGamesPerPlayer');
      expect(settings).toHaveProperty('gameTimeout');
      expect(settings).toHaveProperty('cleanupInterval');
      expect(typeof settings.maxGamesPerPlayer).toBe('number');
      expect(typeof settings.gameTimeout).toBe('number');
      expect(typeof settings.cleanupInterval).toBe('number');
    });

    test('should test resetSettings function', () => {
      gameManager.updateSettings({ maxGamesPerPlayer: 10 });
      gameManager.resetSettings();
      
      const settings = gameManager.getSettings();
      expect(settings.maxGamesPerPlayer).toBe(3); // Default value
      expect(settings.gameTimeout).toBe(30 * 60 * 1000); // Default 30 minutes
      expect(settings.cleanupInterval).toBe(5 * 60 * 1000); // Default 5 minutes
    });

    test('should test settings persistence', () => {
      const customSettings = {
        maxGamesPerPlayer: 7,
        gameTimeout: 1800000, // 30 minutes
        cleanupInterval: 600000 // 10 minutes
      };
      
      gameManager.updateSettings(customSettings);
      const retrievedSettings = gameManager.getSettings();
      
      expect(retrievedSettings.maxGamesPerPlayer).toBe(7);
      expect(retrievedSettings.gameTimeout).toBe(1800000);
      expect(retrievedSettings.cleanupInterval).toBe(600000);
    });
  });
});