const GameManager = require('../src/server/gameManager');

describe('GameManager', () => {
  let gameManager;

  beforeEach(() => {
    gameManager = new GameManager();
  });

  afterEach(() => {
    // Clean up any timers and resources to prevent worker process warnings
    if (gameManager && gameManager.cleanup) {
      gameManager.cleanup();
    }
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

    test('should update last activity on valid move', async () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const game = gameManager.games.get(gameId);
      const originalActivity = game.lastActivity;
      
      // Wait a small amount to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = gameManager.makeMove(gameId, hostId, {
        from: { row: 6, col: 4 },
        to: { row: 5, col: 4 }
      });
      
      expect(result.success).toBe(true);
      expect(game.lastActivity).toBeGreaterThan(originalActivity);
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

  describe('Comprehensive Disconnection and Session Management', () => {
    test('should track disconnected players with detailed information', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const disconnectTime = Date.now();
      gameManager.handleDisconnect(hostId);
      
      expect(gameManager.disconnectedPlayers.has(hostId)).toBe(true);
      const disconnectedInfo = gameManager.disconnectedPlayers.get(hostId);
      expect(disconnectedInfo.gameId).toBe(gameId);
      expect(disconnectedInfo.disconnectedAt).toBeGreaterThanOrEqual(disconnectTime);
    });

    test('should not track disconnection if game not active', () => {
      const hostId = 'host';
      const gameId = gameManager.createGame(hostId);
      
      gameManager.handleDisconnect(hostId);
      
      expect(gameManager.disconnectedPlayers.has(hostId)).toBe(false);
    });

    test('should clean up abandoned games after timeout', () => {
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

    test('should handle multiple simultaneous disconnections', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      // Both players disconnect
      gameManager.handleDisconnect(hostId);
      gameManager.handleDisconnect(guestId);
      
      expect(gameManager.disconnectedPlayers.has(hostId)).toBe(true);
      expect(gameManager.disconnectedPlayers.has(guestId)).toBe(true);
      
      // Cleanup should handle both
      gameManager.checkDisconnectedPlayer(hostId);
      gameManager.checkDisconnectedPlayer(guestId);
      
      expect(gameManager.games.has(gameId)).toBe(false);
    });

    test('should handle reconnection scenarios', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      // Player disconnects
      gameManager.handleDisconnect(hostId);
      expect(gameManager.disconnectedPlayers.has(hostId)).toBe(true);
      
      // Player reconnects (simulated by removing from disconnected list)
      gameManager.disconnectedPlayers.delete(hostId);
      
      // Game should still exist
      expect(gameManager.games.has(gameId)).toBe(true);
      expect(gameManager.playerToGame.has(hostId)).toBe(true);
    });

    test('should handle disconnection during different game states', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      
      // Test disconnection during waiting state
      gameManager.handleDisconnect(hostId);
      expect(gameManager.disconnectedPlayers.has(hostId)).toBe(false);
      
      // Join game to make it active
      gameManager.joinGame(gameId, guestId);
      
      // Test disconnection during active state
      gameManager.handleDisconnect(hostId);
      expect(gameManager.disconnectedPlayers.has(hostId)).toBe(true);
    });

    test('should maintain session persistence across disconnections', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      // Make some moves
      gameManager.makeMove(gameId, hostId, {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 }
      });
      
      const gameStateBefore = gameManager.getGameState(gameId);
      
      // Player disconnects and reconnects quickly
      gameManager.handleDisconnect(hostId);
      gameManager.disconnectedPlayers.delete(hostId); // Simulate reconnection
      
      const gameStateAfter = gameManager.getGameState(gameId);
      
      // Game state should be preserved
      expect(gameStateAfter.moveHistory.length).toBe(gameStateBefore.moveHistory.length);
      expect(gameStateAfter.currentTurn).toBe(gameStateBefore.currentTurn);
    });

    test('should handle edge cases in disconnection tracking', () => {
      // Test disconnection of non-existent player
      gameManager.handleDisconnect('nonexistent');
      expect(gameManager.disconnectedPlayers.has('nonexistent')).toBe(false);
      
      // Test checking non-existent disconnected player
      gameManager.checkDisconnectedPlayer('nonexistent');
      // Should not throw error
      
      // Test multiple disconnections of same player
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      gameManager.handleDisconnect(hostId);
      gameManager.handleDisconnect(hostId); // Second disconnection
      
      expect(gameManager.disconnectedPlayers.has(hostId)).toBe(true);
      expect(gameManager.disconnectedPlayers.size).toBe(1);
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

  describe('Comprehensive Chat System Integration', () => {
    test('should handle chat messages with proper validation', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const result = gameManager.addChatMessage(gameId, hostId, 'Hello, good game!');
      
      expect(result.success).toBe(true);
      expect(result.chatMessage.message).toBe('Hello, good game!');
      expect(result.chatMessage.sender).toBe('White');
      expect(result.chatMessage.timestamp).toBeDefined();
    });

    test('should handle chat message length limits', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      // Test long message truncation
      const longMessage = 'a'.repeat(250);
      const result = gameManager.addChatMessage(gameId, hostId, longMessage);
      
      expect(result.success).toBe(true);
      expect(result.chatMessage.message.length).toBe(200);
    });

    test('should reject empty chat messages', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const result = gameManager.addChatMessage(gameId, hostId, '   ');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Empty message');
    });

    test('should maintain chat history with proper limits', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      // Add many messages to test limit
      for (let i = 0; i < 105; i++) {
        gameManager.addChatMessage(gameId, hostId, `Message ${i}`);
      }
      
      const game = gameManager.games.get(gameId);
      expect(game.chatMessages.length).toBe(100); // Should be limited to 100
      
      // Should keep the most recent messages
      expect(game.chatMessages[0].message).toBe('Message 5');
      expect(game.chatMessages[99].message).toBe('Message 104');
    });

    test('should retrieve chat messages with proper formatting', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      gameManager.addChatMessage(gameId, hostId, 'Host message');
      gameManager.addChatMessage(gameId, guestId, 'Guest message');
      
      const hostMessages = gameManager.getChatMessages(gameId, hostId);
      expect(hostMessages.success).toBe(true);
      expect(hostMessages.messages.length).toBe(2);
      
      // Check message ownership
      expect(hostMessages.messages[0].isOwn).toBe(true);
      expect(hostMessages.messages[1].isOwn).toBe(false);
    });

    test('should handle chat cleanup on game end', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      gameManager.addChatMessage(gameId, hostId, 'Test message');
      
      const game = gameManager.games.get(gameId);
      expect(game.chatMessages.length).toBe(1);
      
      gameManager.cleanupGameChat(gameId);
      expect(game.chatMessages.length).toBe(0);
    });

    test('should reject chat from non-participants', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const outsiderId = 'outsider';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const result = gameManager.addChatMessage(gameId, outsiderId, 'Unauthorized message');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Player not in game');
    });
  });

  describe('Game State Synchronization and Spectating', () => {
    test('should provide consistent game state for all participants', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      // Make a move
      gameManager.makeMove(gameId, hostId, {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 }
      });
      
      const gameState = gameManager.getGameState(gameId);
      
      expect(gameState.moveHistory.length).toBe(1);
      expect(gameState.currentTurn).toBe('black');
      expect(gameState.board).toBeDefined();
    });

    test('should handle spectator access to game state', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      // Spectator should be able to view game state
      const gameState = gameManager.getGameState(gameId);
      expect(gameState).toBeDefined();
      expect(gameState.board).toBeDefined();
      expect(gameState.currentTurn).toBeDefined();
    });

    test('should maintain game state consistency across moves', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const moves = [
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // White e4
        { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // Black e5
        { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }  // White Nf3
      ];
      
      moves.forEach((move, index) => {
        const playerId = index % 2 === 0 ? hostId : guestId;
        const result = gameManager.makeMove(gameId, playerId, move);
        expect(result.success).toBe(true);
        
        const gameState = gameManager.getGameState(gameId);
        expect(gameState.moveHistory.length).toBe(index + 1);
      });
    });

    test('should handle game state updates with proper timestamps', async () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const game = gameManager.games.get(gameId);
      const initialActivity = game.lastActivity;
      
      // Wait a moment then make a move
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = gameManager.makeMove(gameId, hostId, {
        from: { row: 6, col: 4 },
        to: { row: 4, col: 4 }
      });
      
      expect(result.success).toBe(true);
      expect(game.lastActivity).toBeGreaterThan(initialActivity);
    });

    test('should provide game statistics and metadata', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const stats = gameManager.getStats();
      
      expect(stats.activeGames).toBe(1);
      expect(stats.activePlayers).toBe(2);
      expect(stats.disconnectedPlayers).toBe(0);
    });

    test('should handle multiple concurrent games with state isolation', () => {
      const game1Host = 'host1';
      const game1Guest = 'guest1';
      const game2Host = 'host2';
      const game2Guest = 'guest2';
      
      const gameId1 = gameManager.createGame(game1Host);
      const gameId2 = gameManager.createGame(game2Host);
      
      gameManager.joinGame(gameId1, game1Guest);
      gameManager.joinGame(gameId2, game2Guest);
      
      // Make different moves in each game
      gameManager.makeMove(gameId1, game1Host, {
        from: { row: 6, col: 4 }, to: { row: 4, col: 4 }
      });
      
      gameManager.makeMove(gameId2, game2Host, {
        from: { row: 6, col: 3 }, to: { row: 4, col: 3 }
      });
      
      const state1 = gameManager.getGameState(gameId1);
      const state2 = gameManager.getGameState(gameId2);
      
      // States should be different
      expect(state1.moveHistory[0].from.col).toBe(4);
      expect(state2.moveHistory[0].from.col).toBe(3);
    });
  });

  describe('Advanced Multiplayer Scenarios', () => {
    test('should handle rapid move sequences', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      const rapidMoves = [
        { player: hostId, move: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } } },
        { player: guestId, move: { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } } },
        { player: hostId, move: { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } } },
        { player: guestId, move: { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } } }
      ];
      
      rapidMoves.forEach((moveData, index) => {
        const result = gameManager.makeMove(gameId, moveData.player, moveData.move);
        expect(result.success).toBe(true);
        
        const gameState = gameManager.getGameState(gameId);
        expect(gameState.moveHistory.length).toBe(index + 1);
      });
    });

    test('should handle game completion scenarios', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      // Test resignation
      const resignResult = gameManager.resignGame(gameId, hostId);
      expect(resignResult.success).toBe(true);
      expect(resignResult.winner).toBe('black');
      
      const game = gameManager.games.get(gameId);
      expect(game.status).toBe('resigned');
    });

    test('should handle concurrent chat and moves', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      // Interleave moves and chat
      gameManager.makeMove(gameId, hostId, {
        from: { row: 6, col: 4 }, to: { row: 4, col: 4 }
      });
      
      gameManager.addChatMessage(gameId, hostId, 'Good opening!');
      
      gameManager.makeMove(gameId, guestId, {
        from: { row: 1, col: 4 }, to: { row: 3, col: 4 }
      });
      
      gameManager.addChatMessage(gameId, guestId, 'Thanks, you too!');
      
      const gameState = gameManager.getGameState(gameId);
      const chatMessages = gameManager.getChatMessages(gameId, hostId);
      
      expect(gameState.moveHistory.length).toBe(2);
      expect(chatMessages.messages.length).toBe(2);
    });

    test('should handle player reconnection with state preservation', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      // Make some moves and chat
      gameManager.makeMove(gameId, hostId, {
        from: { row: 6, col: 4 }, to: { row: 4, col: 4 }
      });
      
      gameManager.addChatMessage(gameId, hostId, 'Test message');
      
      // Simulate disconnection and reconnection
      gameManager.handleDisconnect(hostId);
      gameManager.disconnectedPlayers.delete(hostId); // Simulate reconnection
      
      // State should be preserved
      const gameState = gameManager.getGameState(gameId);
      const chatMessages = gameManager.getChatMessages(gameId, hostId);
      
      expect(gameState.moveHistory.length).toBe(1);
      expect(chatMessages.messages.length).toBe(1);
    });

    test('should handle edge cases in multiplayer scenarios', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      // Test invalid move attempts
      const invalidResult = gameManager.makeMove(gameId, hostId, {
        from: { row: 0, col: 0 }, to: { row: 7, col: 7 }
      });
      expect(invalidResult.success).toBe(false);
      
      // Test move by wrong player
      const wrongPlayerResult = gameManager.makeMove(gameId, guestId, {
        from: { row: 6, col: 4 }, to: { row: 4, col: 4 }
      });
      expect(wrongPlayerResult.success).toBe(false);
      
      // Game state should remain unchanged
      const gameState = gameManager.getGameState(gameId);
      expect(gameState.moveHistory.length).toBe(0);
    });
  });

  describe('Player-to-Game Mapping and Session Management', () => {
    test('should track player to game mapping accurately', () => {
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

    test('should clean up player mappings on game end', () => {
      const hostId = 'host';
      const guestId = 'guest';
      const gameId = gameManager.createGame(hostId);
      gameManager.joinGame(gameId, guestId);
      
      // Simulate game cleanup
      gameManager.handleDisconnect(hostId);
      gameManager.checkDisconnectedPlayer(hostId);
      
      expect(gameManager.playerToGame.has(hostId)).toBe(false);
      expect(gameManager.playerToGame.has(guestId)).toBe(false);
    });

    test('should handle multiple games per manager instance', () => {
      const players = ['p1', 'p2', 'p3', 'p4'];
      const gameIds = [];
      
      // Create multiple games
      gameIds.push(gameManager.createGame(players[0]));
      gameIds.push(gameManager.createGame(players[2]));
      
      // Join games
      gameManager.joinGame(gameIds[0], players[1]);
      gameManager.joinGame(gameIds[1], players[3]);
      
      // Verify mappings
      expect(gameManager.playerToGame.get(players[0])).toBe(gameIds[0]);
      expect(gameManager.playerToGame.get(players[1])).toBe(gameIds[0]);
      expect(gameManager.playerToGame.get(players[2])).toBe(gameIds[1]);
      expect(gameManager.playerToGame.get(players[3])).toBe(gameIds[1]);
      
      // Verify game count
      expect(gameManager.getActiveGameCount()).toBe(2);
    });
  });
});