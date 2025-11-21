/**
 * Complete GameManager Tests
 * Comprehensive coverage for all GameManager functionality
 */

const GameManager = require('../src/server/gameManager');
const ChessGame = require('../src/shared/chessGame');

describe('GameManager - Complete Coverage', () => {
  let gameManager;
  let player1, player2, player3;

  beforeEach(() => {
    gameManager = new GameManager();
    player1 = 'player1-id';
    player2 = 'player2-id';
    player3 = 'player3-id';
  });

  afterEach(() => {
    if (gameManager && gameManager.cleanup) {
      gameManager.cleanup();
    }
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with empty collections', () => {
      expect(gameManager.games).toBeInstanceOf(Map);
      expect(gameManager.playerToGame).toBeInstanceOf(Map);
      expect(gameManager.disconnectedPlayers).toBeInstanceOf(Map);
      expect(gameManager.disconnectTimeouts).toBeInstanceOf(Map);
      expect(gameManager.games.size).toBe(0);
    });
  });

  describe('generateGameId', () => {
    test('should generate 6-character game ID', () => {
      const gameId = gameManager.generateGameId();
      expect(gameId).toHaveLength(6);
      expect(gameId).toMatch(/^[A-Z0-9]{6}$/);
    });

    test('should generate unique game IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(gameManager.generateGameId());
      }
      expect(ids.size).toBeGreaterThan(90);
    });
  });

  describe('createGame', () => {
    test('should create new game with unique ID', () => {
      const gameId = gameManager.createGame(player1);
      expect(gameId).toBeDefined();
      expect(gameId).toHaveLength(6);
      expect(gameManager.games.has(gameId)).toBe(true);
    });

    test('should set host player correctly', () => {
      const gameId = gameManager.createGame(player1);
      const game = gameManager.games.get(gameId);
      expect(game.host).toBe(player1);
      expect(game.guest).toBeNull();
    });

    test('should initialize game with correct properties', () => {
      const gameId = gameManager.createGame(player1);
      const game = gameManager.games.get(gameId);
      
      expect(game.id).toBe(gameId);
      expect(game.chess).toBeInstanceOf(ChessGame);
      expect(game.status).toBe('waiting');
      expect(game.createdAt).toBeDefined();
      expect(game.lastActivity).toBeDefined();
      expect(game.chatMessages).toEqual([]);
    });

    test('should map player to game', () => {
      const gameId = gameManager.createGame(player1);
      expect(gameManager.playerToGame.get(player1)).toBe(gameId);
    });

    test('should avoid duplicate game IDs', () => {
      const gameId1 = gameManager.createGame(player1);
      const gameId2 = gameManager.createGame(player2);
      expect(gameId1).not.toBe(gameId2);
    });
  });

  describe('joinGame', () => {
    test('should allow player to join waiting game', () => {
      const gameId = gameManager.createGame(player1);
      const result = gameManager.joinGame(gameId, player2);
      
      expect(result.success).toBe(true);
      expect(result.color).toBe('black');
      expect(result.opponentColor).toBe('white');
    });

    test('should handle case-insensitive game ID', () => {
      const gameId = gameManager.createGame(player1);
      const result = gameManager.joinGame(gameId.toLowerCase(), player2);
      expect(result.success).toBe(true);
    });

    test('should reject joining non-existent game', () => {
      const result = gameManager.joinGame('NOTEXIST', player2);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game not found');
    });

    test('should reject joining full game', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      const result = gameManager.joinGame(gameId, player3);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game is full');
    });

    test('should reject host joining own game', () => {
      const gameId = gameManager.createGame(player1);
      const result = gameManager.joinGame(gameId, player1);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot join your own game');
    });

    test('should update game status to active', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      const game = gameManager.games.get(gameId);
      
      expect(game.status).toBe('active');
      expect(game.guest).toBe(player2);
    });

    test('should update lastActivity timestamp', () => {
      const gameId = gameManager.createGame(player1);
      const beforeJoin = Date.now();
      gameManager.joinGame(gameId, player2);
      const game = gameManager.games.get(gameId);
      
      expect(game.lastActivity).toBeGreaterThanOrEqual(beforeJoin);
    });
  });

  describe('makeMove', () => {
    test('should allow valid move by white player', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = gameManager.makeMove(gameId, player1, move);
      
      expect(result.success).toBe(true);
      expect(result.gameState).toBeDefined();
      expect(result.nextTurn).toBe('black');
    });

    test('should reject move in non-existent game', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = gameManager.makeMove('NOTEXIST', player1, move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game not found');
    });

    test('should reject move in non-active game', () => {
      const gameId = gameManager.createGame(player1);
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = gameManager.makeMove(gameId, player1, move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game is not active');
    });

    test('should reject move by non-participant', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = gameManager.makeMove(gameId, player3, move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('You are not in this game');
    });

    test('should reject move when not player turn', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const move = { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } };
      const result = gameManager.makeMove(gameId, player2, move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Not your turn');
    });

    test('should reject invalid chess move', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const move = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } };
      const result = gameManager.makeMove(gameId, player1, move);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    test('should update lastActivity on successful move', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const beforeMove = Date.now();
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      gameManager.makeMove(gameId, player1, move);
      
      const game = gameManager.games.get(gameId);
      expect(game.lastActivity).toBeGreaterThanOrEqual(beforeMove);
    });

    test('should handle black player move correctly', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      gameManager.makeMove(gameId, player1, { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      const result = gameManager.makeMove(gameId, player2, { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } });
      
      expect(result.success).toBe(true);
      expect(result.nextTurn).toBe('white');
    });
  });

  describe('resignGame', () => {
    test('should allow host to resign', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.resignGame(gameId, player1);
      
      expect(result.success).toBe(true);
      expect(result.winner).toBe('black');
    });

    test('should allow guest to resign', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.resignGame(gameId, player2);
      
      expect(result.success).toBe(true);
      expect(result.winner).toBe('white');
    });

    test('should reject resign in non-existent game', () => {
      const result = gameManager.resignGame('NOTEXIST', player1);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game not found');
    });

    test('should reject resign by non-participant', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.resignGame(gameId, player3);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('You are not in this game');
    });

    test('should update game status to resigned', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      gameManager.resignGame(gameId, player1);
      const game = gameManager.games.get(gameId);
      
      expect(game.status).toBe('resigned');
    });
  });

  describe('getGameState', () => {
    test('should return game state for existing game', () => {
      const gameId = gameManager.createGame(player1);
      const state = gameManager.getGameState(gameId);
      
      expect(state).toBeDefined();
      expect(state.board).toBeDefined();
      expect(state.currentTurn).toBe('white');
    });

    test('should return null for non-existent game', () => {
      const state = gameManager.getGameState('NOTEXIST');
      expect(state).toBeNull();
    });
  });

  describe('handleDisconnect', () => {
    test('should track disconnected player in active game', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      gameManager.handleDisconnect(player1);
      
      expect(gameManager.disconnectedPlayers.has(player1)).toBe(true);
      const info = gameManager.disconnectedPlayers.get(player1);
      expect(info.gameId).toBe(gameId);
      expect(info.disconnectedAt).toBeDefined();
    });

    test('should set timeout for disconnected player', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      gameManager.handleDisconnect(player1);
      
      expect(gameManager.disconnectTimeouts.has(player1)).toBe(true);
    });

    test('should not track disconnect for player not in game', () => {
      gameManager.handleDisconnect(player3);
      expect(gameManager.disconnectedPlayers.has(player3)).toBe(false);
    });

    test('should not track disconnect for waiting game', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.handleDisconnect(player1);
      expect(gameManager.disconnectedPlayers.has(player1)).toBe(false);
    });
  });

  describe('checkDisconnectedPlayer', () => {
    test('should abandon game after disconnect timeout', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      gameManager.disconnectedPlayers.set(player1, {
        gameId,
        disconnectedAt: Date.now()
      });
      
      gameManager.checkDisconnectedPlayer(player1);
      
      expect(gameManager.games.has(gameId)).toBe(false);
      expect(gameManager.disconnectedPlayers.has(player1)).toBe(false);
    });

    test('should clean up player mappings', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      gameManager.disconnectedPlayers.set(player1, {
        gameId,
        disconnectedAt: Date.now()
      });
      
      gameManager.checkDisconnectedPlayer(player1);
      
      expect(gameManager.playerToGame.has(player1)).toBe(false);
      expect(gameManager.playerToGame.has(player2)).toBe(false);
    });

    test('should handle non-existent disconnected player', () => {
      expect(() => {
        gameManager.checkDisconnectedPlayer('nonexistent');
      }).not.toThrow();
    });

    test('should clean up chat messages on abandon', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      gameManager.addChatMessage(gameId, player1, 'test message');
      
      gameManager.disconnectedPlayers.set(player1, {
        gameId,
        disconnectedAt: Date.now()
      });
      
      gameManager.checkDisconnectedPlayer(player1);
      expect(gameManager.games.has(gameId)).toBe(false);
    });
  });

  describe('addChatMessage', () => {
    test('should add chat message successfully', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.addChatMessage(gameId, player1, 'Hello!');
      
      expect(result.success).toBe(true);
      expect(result.chatMessage.message).toBe('Hello!');
      expect(result.chatMessage.sender).toBe('White');
      expect(result.chatMessage.timestamp).toBeDefined();
    });

    test('should identify guest player as Black', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.addChatMessage(gameId, player2, 'Hi!');
      
      expect(result.success).toBe(true);
      expect(result.chatMessage.sender).toBe('Black');
    });

    test('should reject message from non-participant', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.addChatMessage(gameId, player3, 'Hello!');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Player not in game');
    });

    test('should reject message in non-existent game', () => {
      const result = gameManager.addChatMessage('NOTEXIST', player1, 'Hello!');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Player not in game');
    });

    test('should sanitize and trim message', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.addChatMessage(gameId, player1, '  Hello!  ');
      
      expect(result.success).toBe(true);
      expect(result.chatMessage.message).toBe('Hello!');
    });

    test('should reject empty message', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.addChatMessage(gameId, player1, '   ');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Empty message');
    });

    test('should truncate long messages to 200 characters', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const longMessage = 'a'.repeat(300);
      const result = gameManager.addChatMessage(gameId, player1, longMessage);
      
      expect(result.success).toBe(true);
      expect(result.chatMessage.message.length).toBe(200);
    });

    test('should limit chat history to 100 messages', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      for (let i = 0; i < 105; i++) {
        gameManager.addChatMessage(gameId, player1, `Message ${i}`);
      }
      
      const game = gameManager.games.get(gameId);
      expect(game.chatMessages.length).toBe(100);
    });

    test('should update lastActivity on message', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const beforeMessage = Date.now();
      gameManager.addChatMessage(gameId, player1, 'Hello!');
      
      const game = gameManager.games.get(gameId);
      expect(game.lastActivity).toBeGreaterThanOrEqual(beforeMessage);
    });
  });

  describe('getChatMessages', () => {
    test('should return chat messages for participant', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      gameManager.addChatMessage(gameId, player1, 'Hello!');
      gameManager.addChatMessage(gameId, player2, 'Hi!');
      
      const result = gameManager.getChatMessages(gameId, player1);
      
      expect(result.success).toBe(true);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].message).toBe('Hello!');
      expect(result.messages[0].isOwn).toBe(true);
      expect(result.messages[1].isOwn).toBe(false);
    });

    test('should mark own messages correctly', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      gameManager.addChatMessage(gameId, player1, 'My message');
      const result = gameManager.getChatMessages(gameId, player2);
      
      expect(result.messages[0].isOwn).toBe(false);
    });

    test('should reject request from non-participant', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.getChatMessages(gameId, player3);
      
      expect(result.success).toBe(false);
      expect(result.messages).toEqual([]);
    });

    test('should reject request for non-existent game', () => {
      const result = gameManager.getChatMessages('NOTEXIST', player1);
      
      expect(result.success).toBe(false);
      expect(result.messages).toEqual([]);
    });
  });

  describe('cleanupGameChat', () => {
    test('should clear chat messages for existing game', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      gameManager.addChatMessage(gameId, player1, 'Hello!');
      gameManager.cleanupGameChat(gameId);
      
      const game = gameManager.games.get(gameId);
      expect(game.chatMessages).toEqual([]);
    });

    test('should handle cleanup for non-existent game', () => {
      expect(() => {
        gameManager.cleanupGameChat('NOTEXIST');
      }).not.toThrow();
    });
  });

  describe('getActiveGameCount', () => {
    test('should return 0 for no games', () => {
      expect(gameManager.getActiveGameCount()).toBe(0);
    });

    test('should return correct count', () => {
      gameManager.createGame(player1);
      gameManager.createGame(player2);
      expect(gameManager.getActiveGameCount()).toBe(2);
    });
  });

  describe('getStats', () => {
    test('should return correct statistics', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const stats = gameManager.getStats();
      
      expect(stats.activeGames).toBe(1);
      expect(stats.activePlayers).toBe(2);
      expect(stats.disconnectedPlayers).toBe(0);
    });

    test('should track disconnected players in stats', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      gameManager.handleDisconnect(player1);
      
      const stats = gameManager.getStats();
      expect(stats.disconnectedPlayers).toBe(1);
    });
  });

  describe('getGame', () => {
    test('should return game object for existing game', () => {
      const gameId = gameManager.createGame(player1);
      const game = gameManager.getGame(gameId);
      
      expect(game).toBeDefined();
      expect(game.id).toBe(gameId);
      expect(game.host).toBe(player1);
    });

    test('should return null for non-existent game', () => {
      const game = gameManager.getGame('NOTEXIST');
      expect(game).toBeNull();
    });
  });

  describe('removeGame', () => {
    test('should remove existing game', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.removeGame(gameId);
      
      expect(result).toBe(true);
      expect(gameManager.games.has(gameId)).toBe(false);
      expect(gameManager.playerToGame.has(player1)).toBe(false);
      expect(gameManager.playerToGame.has(player2)).toBe(false);
    });

    test('should return false for non-existent game', () => {
      const result = gameManager.removeGame('NOTEXIST');
      expect(result).toBe(false);
    });

    test('should handle game with only host', () => {
      const gameId = gameManager.createGame(player1);
      const result = gameManager.removeGame(gameId);
      
      expect(result).toBe(true);
      expect(gameManager.playerToGame.has(player1)).toBe(false);
    });
  });

  describe('validateGameAccess', () => {
    test('should validate host access', () => {
      const gameId = gameManager.createGame(player1);
      expect(gameManager.validateGameAccess(gameId, player1)).toBe(true);
    });

    test('should validate guest access', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      expect(gameManager.validateGameAccess(gameId, player2)).toBe(true);
    });

    test('should reject non-participant', () => {
      const gameId = gameManager.createGame(player1);
      expect(gameManager.validateGameAccess(gameId, player3)).toBe(false);
    });

    test('should reject non-existent game', () => {
      expect(gameManager.validateGameAccess('NOTEXIST', player1)).toBeFalsy();
    });
  });

  describe('isPlayerTurn', () => {
    test('should return true for white player on white turn', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      expect(gameManager.isPlayerTurn(gameId, player1)).toBe(true);
    });

    test('should return false for black player on white turn', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      expect(gameManager.isPlayerTurn(gameId, player2)).toBe(false);
    });

    test('should return false for non-existent game', () => {
      expect(gameManager.isPlayerTurn('NOTEXIST', player1)).toBe(false);
    });
  });

  describe('removePlayer', () => {
    test('should remove host and promote guest', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.removePlayer(gameId, player1);
      
      expect(result.success).toBe(true);
      const game = gameManager.games.get(gameId);
      expect(game.host).toBe(player2);
      expect(game.guest).toBeNull();
    });

    test('should remove guest player', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.removePlayer(gameId, player2);
      
      expect(result.success).toBe(true);
      const game = gameManager.games.get(gameId);
      expect(game.guest).toBeNull();
    });

    test('should remove game if no players left', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.removePlayer(gameId, player1);
      
      expect(gameManager.games.has(gameId)).toBe(false);
    });

    test('should reject removing from non-existent game', () => {
      const result = gameManager.removePlayer('NOTEXIST', player1);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game not found');
    });

    test('should reject removing non-participant', () => {
      const gameId = gameManager.createGame(player1);
      const result = gameManager.removePlayer(gameId, player3);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Player not in game');
    });
  });

  describe('getPlayerColor', () => {
    test('should return white for host', () => {
      const gameId = gameManager.createGame(player1);
      expect(gameManager.getPlayerColor(gameId, player1)).toBe('white');
    });

    test('should return black for guest', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      expect(gameManager.getPlayerColor(gameId, player2)).toBe('black');
    });

    test('should return null for non-participant', () => {
      const gameId = gameManager.createGame(player1);
      expect(gameManager.getPlayerColor(gameId, player3)).toBeNull();
    });

    test('should return null for non-existent game', () => {
      expect(gameManager.getPlayerColor('NOTEXIST', player1)).toBeNull();
    });
  });

  describe('getOpponentId', () => {
    test('should return guest for host', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      expect(gameManager.getOpponentId(gameId, player1)).toBe(player2);
    });

    test('should return host for guest', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      expect(gameManager.getOpponentId(gameId, player2)).toBe(player1);
    });

    test('should return null for non-participant', () => {
      const gameId = gameManager.createGame(player1);
      expect(gameManager.getOpponentId(gameId, player3)).toBeNull();
    });

    test('should return null for non-existent game', () => {
      expect(gameManager.getOpponentId('NOTEXIST', player1)).toBeNull();
    });
  });

  describe('isGameFull', () => {
    test('should return falsy for game with only host', () => {
      const gameId = gameManager.createGame(player1);
      expect(gameManager.isGameFull(gameId)).toBeFalsy();
    });

    test('should return truthy for game with both players', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      expect(gameManager.isGameFull(gameId)).toBeTruthy();
    });

    test('should return falsy for non-existent game', () => {
      expect(gameManager.isGameFull('NOTEXIST')).toBeFalsy();
    });
  });

  describe('startGame', () => {
    test('should start game with two players', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.startGame(gameId);
      
      expect(result.success).toBe(true);
      const game = gameManager.games.get(gameId);
      expect(game.status).toBe('active');
    });

    test('should reject starting non-existent game', () => {
      const result = gameManager.startGame('NOTEXIST');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game not found');
    });

    test('should reject starting game without two players', () => {
      const gameId = gameManager.createGame(player1);
      const result = gameManager.startGame(gameId);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game needs two players to start');
    });
  });

  describe('endGame', () => {
    test('should end game with reason and winner', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.endGame(gameId, 'checkmate', player1);
      
      expect(result.success).toBe(true);
      expect(result.reason).toBe('checkmate');
      expect(result.winner).toBe(player1);
      
      const game = gameManager.games.get(gameId);
      expect(game.status).toBe('finished');
      expect(game.endReason).toBe('checkmate');
      expect(game.winner).toBe(player1);
      expect(game.endTime).toBeDefined();
    });

    test('should end game without winner', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.endGame(gameId, 'stalemate');
      
      expect(result.success).toBe(true);
      expect(result.winner).toBeNull();
    });

    test('should reject ending non-existent game', () => {
      const result = gameManager.endGame('NOTEXIST', 'checkmate');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game not found');
    });
  });

  describe('pauseGame', () => {
    test('should pause active game', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.pauseGame(gameId);
      
      expect(result.success).toBe(true);
      const game = gameManager.games.get(gameId);
      expect(game.status).toBe('paused');
      expect(game.pausedAt).toBeDefined();
    });

    test('should reject pausing non-existent game', () => {
      const result = gameManager.pauseGame('NOTEXIST');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game not found');
    });

    test('should reject pausing non-active game', () => {
      const gameId = gameManager.createGame(player1);
      const result = gameManager.pauseGame(gameId);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game is not active');
    });
  });

  describe('resumeGame', () => {
    test('should resume paused game', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      gameManager.pauseGame(gameId);
      
      const result = gameManager.resumeGame(gameId);
      
      expect(result.success).toBe(true);
      const game = gameManager.games.get(gameId);
      expect(game.status).toBe('active');
      expect(game.resumedAt).toBeDefined();
    });

    test('should reject resuming non-existent game', () => {
      const result = gameManager.resumeGame('NOTEXIST');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game not found');
    });

    test('should reject resuming non-paused game', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const result = gameManager.resumeGame(gameId);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game is not paused');
    });
  });

  describe('validateMove', () => {
    test('should validate correct move', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = gameManager.validateMove(gameId, player1, move);
      
      expect(result).toBe(true);
    });

    test('should reject move in non-existent game', () => {
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = gameManager.validateMove('NOTEXIST', player1, move);
      
      expect(result).toBe(false);
    });

    test('should reject move by non-participant', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
      const result = gameManager.validateMove(gameId, player3, move);
      
      expect(result).toBe(false);
    });

    test('should reject move when not player turn', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const move = { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } };
      const result = gameManager.validateMove(gameId, player2, move);
      
      expect(result).toBe(false);
    });
  });

  describe('getMoveHistory', () => {
    test('should return move history', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      gameManager.makeMove(gameId, player1, { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      
      const history = gameManager.getMoveHistory(gameId);
      expect(history).toHaveLength(1);
    });

    test('should return empty array for non-existent game', () => {
      const history = gameManager.getMoveHistory('NOTEXIST');
      expect(history).toEqual([]);
    });
  });

  describe('undoMove', () => {
    test('should return not implemented', () => {
      const gameId = gameManager.createGame(player1);
      const result = gameManager.undoMove(gameId);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Undo not implemented');
    });

    test('should handle non-existent game', () => {
      const result = gameManager.undoMove('NOTEXIST');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game not found');
    });
  });

  describe('findGamesByPlayer', () => {
    test('should find games where player is host', () => {
      const gameId1 = gameManager.createGame(player1);
      const gameId2 = gameManager.createGame(player2);
      
      const games = gameManager.findGamesByPlayer(player1);
      expect(games).toContain(gameId1);
      expect(games).not.toContain(gameId2);
    });

    test('should find games where player is guest', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const games = gameManager.findGamesByPlayer(player2);
      expect(games).toContain(gameId);
    });

    test('should return empty array for player not in any game', () => {
      gameManager.createGame(player1);
      const games = gameManager.findGamesByPlayer(player3);
      expect(games).toEqual([]);
    });
  });

  describe('getGamesByStatus', () => {
    test('should return games with specified status', () => {
      const gameId1 = gameManager.createGame(player1);
      const gameId2 = gameManager.createGame(player2);
      gameManager.joinGame(gameId2, player3);
      
      const waitingGames = gameManager.getGamesByStatus('waiting');
      const activeGames = gameManager.getGamesByStatus('active');
      
      expect(waitingGames).toContain(gameId1);
      expect(activeGames).toContain(gameId2);
    });

    test('should return empty array for status with no games', () => {
      const games = gameManager.getGamesByStatus('finished');
      expect(games).toEqual([]);
    });
  });

  describe('getAvailableGames', () => {
    test('should return waiting games', () => {
      const gameId = gameManager.createGame(player1);
      const available = gameManager.getAvailableGames();
      
      expect(available).toHaveLength(1);
      expect(available[0].gameId).toBe(gameId);
      expect(available[0].host).toBe(player1);
      expect(available[0].createdAt).toBeDefined();
    });

    test('should not return full games', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const available = gameManager.getAvailableGames();
      expect(available).toHaveLength(0);
    });

    test('should not return active games', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      
      const available = gameManager.getAvailableGames();
      expect(available).toHaveLength(0);
    });
  });

  describe('getGameStatistics', () => {
    test('should return game statistics', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      gameManager.makeMove(gameId, player1, { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } });
      
      const stats = gameManager.getGameStatistics(gameId);
      
      expect(stats).toBeDefined();
      expect(stats.duration).toBeGreaterThan(0);
      expect(stats.moveCount).toBe(1);
      expect(stats.players.white).toBe(player1);
      expect(stats.players.black).toBe(player2);
      expect(stats.status).toBe('active');
      expect(stats.createdAt).toBeDefined();
      expect(stats.lastActivity).toBeDefined();
    });

    test('should return null for non-existent game', () => {
      const stats = gameManager.getGameStatistics('NOTEXIST');
      expect(stats).toBeNull();
    });
  });

  describe('getPlayerStatistics', () => {
    test('should return player statistics', () => {
      const gameId1 = gameManager.createGame(player1);
      gameManager.joinGame(gameId1, player2);
      gameManager.endGame(gameId1, 'checkmate', player1);
      
      const gameId2 = gameManager.createGame(player1);
      gameManager.joinGame(gameId2, player3);
      gameManager.endGame(gameId2, 'checkmate', player3);
      
      const stats = gameManager.getPlayerStatistics(player1);
      
      expect(stats.gamesPlayed).toBe(2);
      expect(stats.wins).toBe(1);
      expect(stats.losses).toBe(1);
      expect(stats.draws).toBe(0);
      expect(stats.winRate).toBe(0.5);
    });

    test('should handle player with no games', () => {
      const stats = gameManager.getPlayerStatistics(player1);
      
      expect(stats.gamesPlayed).toBe(0);
      expect(stats.wins).toBe(0);
      expect(stats.losses).toBe(0);
      expect(stats.draws).toBe(0);
      expect(stats.winRate).toBe(0);
    });

    test('should count draws correctly', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      gameManager.endGame(gameId, 'stalemate', null);
      
      const stats = gameManager.getPlayerStatistics(player1);
      expect(stats.draws).toBe(1);
    });
  });

  describe('getServerStatistics', () => {
    test('should return comprehensive server statistics', () => {
      const gameId1 = gameManager.createGame(player1);
      const gameId2 = gameManager.createGame(player2);
      gameManager.joinGame(gameId2, player3);
      gameManager.endGame(gameId2, 'checkmate', player2);
      
      const stats = gameManager.getServerStatistics();
      
      expect(stats.totalGames).toBe(2);
      expect(stats.waitingGames).toBe(1);
      expect(stats.finishedGames).toBe(1);
      expect(stats.totalPlayers).toBe(3);
      expect(stats.disconnectedPlayers).toBe(0);
    });
  });

  describe('cleanupInactiveGames', () => {
    test('should remove inactive games', () => {
      const gameId = gameManager.createGame(player1);
      const game = gameManager.games.get(gameId);
      game.lastActivity = Date.now() - (3 * 60 * 60 * 1000); // 3 hours ago
      
      const cleaned = gameManager.cleanupInactiveGames();
      
      expect(cleaned).toBe(1);
      expect(gameManager.games.has(gameId)).toBe(false);
    });

    test('should not remove active games', () => {
      const gameId = gameManager.createGame(player1);
      const cleaned = gameManager.cleanupInactiveGames();
      
      expect(cleaned).toBe(0);
      expect(gameManager.games.has(gameId)).toBe(true);
    });

    test('should use custom max age', () => {
      const gameId = gameManager.createGame(player1);
      const game = gameManager.games.get(gameId);
      game.lastActivity = Date.now() - 1000; // 1 second ago
      
      const cleaned = gameManager.cleanupInactiveGames(500); // 500ms max age
      
      expect(cleaned).toBe(1);
    });
  });

  describe('cleanup', () => {
    test('should clear all data', () => {
      gameManager.createGame(player1);
      gameManager.createGame(player2);
      
      gameManager.cleanup();
      
      expect(gameManager.games.size).toBe(0);
      expect(gameManager.playerToGame.size).toBe(0);
      expect(gameManager.disconnectedPlayers.size).toBe(0);
    });

    test('should clear all timeouts', () => {
      const gameId = gameManager.createGame(player1);
      gameManager.joinGame(gameId, player2);
      gameManager.handleDisconnect(player1);
      
      expect(gameManager.disconnectTimeouts.size).toBe(1);
      
      gameManager.cleanup();
      
      expect(gameManager.disconnectTimeouts.size).toBe(0);
    });
  });

  describe('getMemoryUsage', () => {
    test('should return memory usage information', () => {
      gameManager.createGame(player1);
      gameManager.createGame(player2);
      
      const usage = gameManager.getMemoryUsage();
      
      expect(usage.gameCount).toBe(2);
      expect(usage.playerMappings).toBe(2);
      expect(usage.disconnectedCount).toBe(0);
      expect(usage.estimatedMemory).toBeGreaterThan(0);
    });
  });

  describe('Event Handlers', () => {
    test('should add event handler', () => {
      const handler = jest.fn();
      gameManager.addEventHandler('test-event', handler);
      
      expect(gameManager.eventHandlers['test-event']).toContain(handler);
    });

    test('should emit event to handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      gameManager.addEventHandler('test-event', handler1);
      gameManager.addEventHandler('test-event', handler2);
      
      gameManager.emitEvent('test-event', { data: 'test' });
      
      expect(handler1).toHaveBeenCalledWith({ data: 'test' });
      expect(handler2).toHaveBeenCalledWith({ data: 'test' });
    });

    test('should remove event handler', () => {
      const handler = jest.fn();
      gameManager.addEventHandler('test-event', handler);
      gameManager.removeEventHandler('test-event', handler);
      
      gameManager.emitEvent('test-event', {});
      
      expect(handler).not.toHaveBeenCalled();
    });

    test('should handle emit with no handlers', () => {
      expect(() => {
        gameManager.emitEvent('non-existent-event', {});
      }).not.toThrow();
    });

    test('should handle handler errors gracefully', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const goodHandler = jest.fn();
      
      gameManager.addEventHandler('test-event', errorHandler);
      gameManager.addEventHandler('test-event', goodHandler);
      
      expect(() => {
        gameManager.emitEvent('test-event', {});
      }).not.toThrow();
      
      expect(goodHandler).toHaveBeenCalled();
    });

    test('should handle removing non-existent handler', () => {
      const handler = jest.fn();
      expect(() => {
        gameManager.removeEventHandler('non-existent', handler);
      }).not.toThrow();
    });
  });

  describe('Settings Management', () => {
    test('should initialize default settings', () => {
      const settings = gameManager.getSettings();
      
      expect(settings.maxGamesPerPlayer).toBe(3);
      expect(settings.gameTimeout).toBe(30 * 60 * 1000);
      expect(settings.cleanupInterval).toBe(5 * 60 * 1000);
    });

    test('should update settings', () => {
      gameManager.updateSettings({ maxGamesPerPlayer: 5 });
      const settings = gameManager.getSettings();
      
      expect(settings.maxGamesPerPlayer).toBe(5);
      expect(settings.gameTimeout).toBe(30 * 60 * 1000);
    });

    test('should reset settings to defaults', () => {
      gameManager.updateSettings({ maxGamesPerPlayer: 10 });
      gameManager.resetSettings();
      const settings = gameManager.getSettings();
      
      expect(settings.maxGamesPerPlayer).toBe(3);
    });

    test('should preserve existing settings when updating', () => {
      gameManager.updateSettings({ maxGamesPerPlayer: 5 });
      gameManager.updateSettings({ gameTimeout: 60000 });
      const settings = gameManager.getSettings();
      
      expect(settings.maxGamesPerPlayer).toBe(5);
      expect(settings.gameTimeout).toBe(60000);
    });
  });
});
