const GameManager = require('../src/server/gameManager');

describe('GameManager - Comprehensive Coverage', () => {
    let gameManager;

    beforeEach(() => {
        gameManager = new GameManager();
    });

    afterEach(() => {
        if (gameManager && gameManager.cleanup) {
            gameManager.cleanup();
        }
    });

    describe('Core Game Management', () => {
        test('should generate unique game IDs', () => {
            const gameId = gameManager.generateGameId();
            expect(gameId).toHaveLength(6);
            expect(gameId).toMatch(/^[A-Z0-9]{6}$/);
        });

        test('should create game with proper initialization', () => {
            const playerId = 'player1';
            const gameId = gameManager.createGame(playerId);

            const game = gameManager.getGame(gameId);
            expect(game).toBeTruthy();
            expect(game.id).toBe(gameId);
            expect(game.host).toBe(playerId);
            expect(game.guest).toBe(null);
            expect(game.status).toBe('waiting');
            expect(game.chess).toBeDefined();
            expect(game.createdAt).toBeDefined();
            expect(game.lastActivity).toBeDefined();
            expect(game.chatMessages).toEqual([]);
        });

        test('should handle game joining with all scenarios', () => {
            const hostId = 'host';
            const guestId = 'guest';
            const gameId = gameManager.createGame(hostId);

            // Successful join
            const result = gameManager.joinGame(gameId, guestId);
            expect(result.success).toBe(true);
            expect(result.color).toBe('black');
            expect(result.opponentColor).toBe('white');

            // Game should be active now
            const game = gameManager.getGame(gameId);
            expect(game.status).toBe('active');
            expect(game.guest).toBe(guestId);
        });

        test('should handle case insensitive game IDs', () => {
            const hostId = 'host';
            const guestId = 'guest';
            const gameId = gameManager.createGame(hostId);

            const result = gameManager.joinGame(gameId.toLowerCase(), guestId);
            expect(result.success).toBe(true);
        });

        test('should reject invalid join attempts', () => {
            const hostId = 'host';
            const guestId = 'guest';
            const thirdId = 'third';
            const gameId = gameManager.createGame(hostId);

            // Try host joining own game (before guest joins)
            const selfResult = gameManager.joinGame(gameId, hostId);
            expect(selfResult.success).toBe(false);
            expect(selfResult.message).toBe('Cannot join your own game');

            // Join successfully first
            gameManager.joinGame(gameId, guestId);

            // Try to join full game
            const fullResult = gameManager.joinGame(gameId, thirdId);
            expect(fullResult.success).toBe(false);
            expect(fullResult.message).toBe('Game is full');

            // Try joining non-existent game
            const nonExistentResult = gameManager.joinGame('INVALID', 'player');
            expect(nonExistentResult.success).toBe(false);
            expect(nonExistentResult.message).toBe('Game not found');
        });
    });

    describe('Move Processing', () => {
        let hostId, guestId, gameId;

        beforeEach(() => {
            hostId = 'host';
            guestId = 'guest';
            gameId = gameManager.createGame(hostId);
            gameManager.joinGame(gameId, guestId);
        });

        test('should process valid moves correctly', () => {
            const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
            const result = gameManager.makeMove(gameId, hostId, move);

            expect(result.success).toBe(true);
            expect(result.gameState).toBeDefined();
            expect(result.nextTurn).toBe('black');

            const game = gameManager.getGame(gameId);
            expect(game.lastActivity).toBeDefined();
        });

        test('should reject invalid move scenarios', () => {
            // Non-existent game
            const nonExistentResult = gameManager.makeMove('INVALID', hostId, {
                from: { row: 6, col: 4 }, to: { row: 4, col: 4 }
            });
            expect(nonExistentResult.success).toBe(false);
            expect(nonExistentResult.message).toBe('Game not found');

            // Non-participant
            const outsiderResult = gameManager.makeMove(gameId, 'outsider', {
                from: { row: 6, col: 4 }, to: { row: 4, col: 4 }
            });
            expect(outsiderResult.success).toBe(false);
            expect(outsiderResult.message).toBe('You are not in this game');

            // Wrong turn
            const wrongTurnResult = gameManager.makeMove(gameId, guestId, {
                from: { row: 1, col: 4 }, to: { row: 3, col: 4 }
            });
            expect(wrongTurnResult.success).toBe(false);
            expect(wrongTurnResult.message).toBe('Not your turn');
        });

        test('should handle inactive game moves', () => {
            const waitingGameId = gameManager.createGame('waiting_host');
            const result = gameManager.makeMove(waitingGameId, 'waiting_host', {
                from: { row: 6, col: 4 }, to: { row: 4, col: 4 }
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe('Game is not active');
        });

        test('should handle invalid chess moves', () => {
            // Try an invalid chess move (moving to same square)
            const result = gameManager.makeMove(gameId, hostId, {
                from: { row: 6, col: 4 },
                to: { row: 6, col: 4 }
            });

            expect(result.success).toBe(false);
            expect(result.message).toBeDefined(); // Should have an error message from chess engine
        });
    });

    describe('Game Resignation', () => {
        let hostId, guestId, gameId;

        beforeEach(() => {
            hostId = 'host';
            guestId = 'guest';
            gameId = gameManager.createGame(hostId);
            gameManager.joinGame(gameId, guestId);
        });

        test('should handle host resignation', () => {
            const result = gameManager.resignGame(gameId, hostId);

            expect(result.success).toBe(true);
            expect(result.winner).toBe('black');

            const game = gameManager.getGame(gameId);
            expect(game.status).toBe('resigned');
        });

        test('should handle guest resignation', () => {
            const result = gameManager.resignGame(gameId, guestId);

            expect(result.success).toBe(true);
            expect(result.winner).toBe('white');

            const game = gameManager.getGame(gameId);
            expect(game.status).toBe('resigned');
        });

        test('should reject invalid resignations', () => {
            // Non-existent game
            const nonExistentResult = gameManager.resignGame('INVALID', hostId);
            expect(nonExistentResult.success).toBe(false);
            expect(nonExistentResult.message).toBe('Game not found');

            // Non-participant
            const outsiderResult = gameManager.resignGame(gameId, 'outsider');
            expect(outsiderResult.success).toBe(false);
            expect(outsiderResult.message).toBe('You are not in this game');
        });
    });

    describe('Chat System', () => {
        let hostId, guestId, gameId;

        beforeEach(() => {
            hostId = 'host';
            guestId = 'guest';
            gameId = gameManager.createGame(hostId);
            gameManager.joinGame(gameId, guestId);
        });

        test('should add chat messages correctly', () => {
            const message = 'Hello, good game!';
            const result = gameManager.addChatMessage(gameId, hostId, message);

            expect(result.success).toBe(true);
            expect(result.chatMessage.message).toBe(message);
            expect(result.chatMessage.sender).toBe('White');
            expect(result.chatMessage.timestamp).toBeDefined();

            const game = gameManager.getGame(gameId);
            expect(game.chatMessages).toHaveLength(1);
            expect(game.lastActivity).toBeDefined();
        });

        test('should handle message validation', () => {
            // Empty message
            const emptyResult = gameManager.addChatMessage(gameId, hostId, '   ');
            expect(emptyResult.success).toBe(false);
            expect(emptyResult.message).toBe('Empty message');

            // Long message truncation
            const longMessage = 'a'.repeat(250);
            const longResult = gameManager.addChatMessage(gameId, hostId, longMessage);
            expect(longResult.success).toBe(true);
            expect(longResult.chatMessage.message).toHaveLength(200);
        });

        test('should reject unauthorized chat', () => {
            // Non-existent game
            const nonExistentResult = gameManager.addChatMessage('INVALID', hostId, 'test');
            expect(nonExistentResult.success).toBe(false);
            expect(nonExistentResult.message).toBe('Player not in game');

            // Non-participant
            const outsiderResult = gameManager.addChatMessage(gameId, 'outsider', 'test');
            expect(outsiderResult.success).toBe(false);
            expect(outsiderResult.message).toBe('Player not in game');
        });

        test('should retrieve chat messages correctly', () => {
            gameManager.addChatMessage(gameId, hostId, 'Host message');
            gameManager.addChatMessage(gameId, guestId, 'Guest message');

            const hostMessages = gameManager.getChatMessages(gameId, hostId);
            expect(hostMessages.success).toBe(true);
            expect(hostMessages.messages).toHaveLength(2);
            expect(hostMessages.messages[0].isOwn).toBe(true);
            expect(hostMessages.messages[1].isOwn).toBe(false);

            const guestMessages = gameManager.getChatMessages(gameId, guestId);
            expect(guestMessages.success).toBe(true);
            expect(guestMessages.messages[0].isOwn).toBe(false);
            expect(guestMessages.messages[1].isOwn).toBe(true);
        });

        test('should handle chat message limits', () => {
            // Add many messages
            for (let i = 0; i < 105; i++) {
                gameManager.addChatMessage(gameId, hostId, `Message ${i}`);
            }

            const game = gameManager.getGame(gameId);
            expect(game.chatMessages).toHaveLength(100);

            // Should keep most recent messages
            expect(game.chatMessages[0].message).toBe('Message 5');
            expect(game.chatMessages[99].message).toBe('Message 104');
        });

        test('should clean up chat messages', () => {
            gameManager.addChatMessage(gameId, hostId, 'Test message');

            const game = gameManager.getGame(gameId);
            expect(game.chatMessages).toHaveLength(1);

            gameManager.cleanupGameChat(gameId);
            expect(game.chatMessages).toHaveLength(0);
        });

        test('should handle invalid chat retrieval', () => {
            // Non-existent game
            const nonExistentResult = gameManager.getChatMessages('INVALID', hostId);
            expect(nonExistentResult.success).toBe(false);
            expect(nonExistentResult.messages).toEqual([]);

            // Non-participant
            const outsiderResult = gameManager.getChatMessages(gameId, 'outsider');
            expect(outsiderResult.success).toBe(false);
            expect(outsiderResult.messages).toEqual([]);
        });
    });

    describe('Disconnection Handling', () => {
        let hostId, guestId, gameId;

        beforeEach(() => {
            hostId = 'host';
            guestId = 'guest';
            gameId = gameManager.createGame(hostId);
            gameManager.joinGame(gameId, guestId);
        });

        test('should track disconnected players', () => {
            const beforeDisconnect = Date.now();
            gameManager.handleDisconnect(hostId);

            expect(gameManager.disconnectedPlayers.has(hostId)).toBe(true);
            const disconnectedInfo = gameManager.disconnectedPlayers.get(hostId);
            expect(disconnectedInfo.gameId).toBe(gameId);
            expect(disconnectedInfo.disconnectedAt).toBeGreaterThanOrEqual(beforeDisconnect);
        });

        test('should not track disconnection for inactive games', () => {
            const waitingGameId = gameManager.createGame('waiting_host');
            gameManager.handleDisconnect('waiting_host');

            expect(gameManager.disconnectedPlayers.has('waiting_host')).toBe(false);
        });

        test('should clean up abandoned games', () => {
            gameManager.handleDisconnect(hostId);
            gameManager.checkDisconnectedPlayer(hostId);

            expect(gameManager.games.has(gameId)).toBe(false);
            expect(gameManager.playerToGame.has(hostId)).toBe(false);
            expect(gameManager.playerToGame.has(guestId)).toBe(false);
            expect(gameManager.disconnectedPlayers.has(hostId)).toBe(false);
        });

        test('should handle non-existent disconnected player', () => {
            // Should not throw error
            gameManager.checkDisconnectedPlayer('nonexistent');
            expect(gameManager.disconnectedPlayers.has('nonexistent')).toBe(false);
        });

        test('should handle disconnection timeout callback', (done) => {
            // Mock setTimeout to test the callback immediately
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = (callback, delay) => {
                // Execute callback immediately for testing
                callback();
                return 1; // Return a timer ID
            };

            gameManager.handleDisconnect(hostId);

            // The callback should have executed and cleaned up the game
            setTimeout(() => {
                expect(gameManager.games.has(gameId)).toBe(false);
                global.setTimeout = originalSetTimeout; // Restore original
                done();
            }, 10);
        });
    });

    describe('Utility Methods', () => {
        test('should get game state correctly', () => {
            const hostId = 'host';
            const gameId = gameManager.createGame(hostId);

            const gameState = gameManager.getGameState(gameId);
            expect(gameState).toBeDefined();
            expect(gameState.board).toBeDefined();
            expect(gameState.currentTurn).toBe('white');

            // Non-existent game
            const nullState = gameManager.getGameState('INVALID');
            expect(nullState).toBe(null);
        });

        test('should get active game count', () => {
            expect(gameManager.getActiveGameCount()).toBe(0);

            gameManager.createGame('host1');
            expect(gameManager.getActiveGameCount()).toBe(1);

            gameManager.createGame('host2');
            expect(gameManager.getActiveGameCount()).toBe(2);
        });

        test('should get comprehensive stats', () => {
            const hostId = 'host';
            const guestId = 'guest';
            const gameId = gameManager.createGame(hostId);
            gameManager.joinGame(gameId, guestId);

            const stats = gameManager.getStats();
            expect(stats.activeGames).toBe(1);
            expect(stats.activePlayers).toBe(2);
            expect(stats.disconnectedPlayers).toBe(0);
        });
    });

    describe('Extended Game Management Methods', () => {
        let hostId, guestId, gameId;

        beforeEach(() => {
            hostId = 'host';
            guestId = 'guest';
            gameId = gameManager.createGame(hostId);
            gameManager.joinGame(gameId, guestId);
        });

        test('should validate game access', () => {
            expect(gameManager.validateGameAccess(gameId, hostId)).toBe(true);
            expect(gameManager.validateGameAccess(gameId, guestId)).toBe(true);
            expect(gameManager.validateGameAccess(gameId, 'outsider')).toBe(false);
            expect(gameManager.validateGameAccess('INVALID', hostId)).toBeFalsy();
        });

        test('should check player turn', () => {
            expect(gameManager.isPlayerTurn(gameId, hostId)).toBe(true);
            expect(gameManager.isPlayerTurn(gameId, guestId)).toBe(false);
            expect(gameManager.isPlayerTurn('INVALID', hostId)).toBe(false);
        });

        test('should get player color', () => {
            expect(gameManager.getPlayerColor(gameId, hostId)).toBe('white');
            expect(gameManager.getPlayerColor(gameId, guestId)).toBe('black');
            expect(gameManager.getPlayerColor(gameId, 'outsider')).toBe(null);
            expect(gameManager.getPlayerColor('INVALID', hostId)).toBe(null);
        });

        test('should get opponent ID', () => {
            expect(gameManager.getOpponentId(gameId, hostId)).toBe(guestId);
            expect(gameManager.getOpponentId(gameId, guestId)).toBe(hostId);
            expect(gameManager.getOpponentId(gameId, 'outsider')).toBe(null);
            expect(gameManager.getOpponentId('INVALID', hostId)).toBe(null);
        });

        test('should check if game is full', () => {
            expect(gameManager.isGameFull(gameId)).toBeTruthy(); // Game has both host and guest

            const waitingGameId = gameManager.createGame('waiting_host');
            expect(gameManager.isGameFull(waitingGameId)).toBeFalsy();
            expect(gameManager.isGameFull('INVALID')).toBeFalsy();
        });

        test('should remove game correctly', () => {
            expect(gameManager.removeGame(gameId)).toBe(true);
            expect(gameManager.games.has(gameId)).toBe(false);
            expect(gameManager.playerToGame.has(hostId)).toBe(false);
            expect(gameManager.playerToGame.has(guestId)).toBe(false);

            expect(gameManager.removeGame('INVALID')).toBe(false);
        });

        test('should remove players from game', () => {
            // Remove guest
            const guestRemoval = gameManager.removePlayer(gameId, guestId);
            expect(guestRemoval.success).toBe(true);

            const game = gameManager.getGame(gameId);
            expect(game.guest).toBe(null);
            expect(gameManager.playerToGame.has(guestId)).toBe(false);

            // Remove host (should promote guest if exists, but guest was removed)
            const hostRemoval = gameManager.removePlayer(gameId, hostId);
            expect(hostRemoval.success).toBe(true);
            expect(gameManager.games.has(gameId)).toBe(false); // Game should be removed
        });

        test('should handle player promotion when host leaves', () => {
            const newGameId = gameManager.createGame('host2');
            gameManager.joinGame(newGameId, 'guest2');

            // Remove host
            const result = gameManager.removePlayer(newGameId, 'host2');
            expect(result.success).toBe(true);

            const game = gameManager.getGame(newGameId);
            expect(game.host).toBe('guest2');
            expect(game.guest).toBe(null);
        });

        test('should handle invalid player removal', () => {
            const invalidGameResult = gameManager.removePlayer('INVALID', hostId);
            expect(invalidGameResult.success).toBe(false);
            expect(invalidGameResult.message).toBe('Game not found');

            const invalidPlayerResult = gameManager.removePlayer(gameId, 'outsider');
            expect(invalidPlayerResult.success).toBe(false);
            expect(invalidPlayerResult.message).toBe('Player not in game');
        });
    });

    describe('Game State Management', () => {
        let hostId, guestId, gameId;

        beforeEach(() => {
            hostId = 'host';
            guestId = 'guest';
            gameId = gameManager.createGame(hostId);
            gameManager.joinGame(gameId, guestId);
        });

        test('should start game correctly', () => {
            const newGameId = gameManager.createGame('host2');
            gameManager.joinGame(newGameId, 'guest2');

            const result = gameManager.startGame(newGameId);
            expect(result.success).toBe(true);

            const game = gameManager.getGame(newGameId);
            expect(game.status).toBe('active');
        });

        test('should handle invalid game start', () => {
            const invalidResult = gameManager.startGame('INVALID');
            expect(invalidResult.success).toBe(false);
            expect(invalidResult.message).toBe('Game not found');

            const waitingGameId = gameManager.createGame('waiting_host');
            const incompleteResult = gameManager.startGame(waitingGameId);
            expect(incompleteResult.success).toBe(false);
            expect(incompleteResult.message).toBe('Game needs two players to start');
        });

        test('should end game correctly', () => {
            const result = gameManager.endGame(gameId, 'checkmate', hostId);
            expect(result.success).toBe(true);
            expect(result.reason).toBe('checkmate');
            expect(result.winner).toBe(hostId);

            const game = gameManager.getGame(gameId);
            expect(game.status).toBe('finished');
            expect(game.endReason).toBe('checkmate');
            expect(game.winner).toBe(hostId);
            expect(game.endTime).toBeDefined();
        });

        test('should handle invalid game end', () => {
            const result = gameManager.endGame('INVALID', 'checkmate');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Game not found');
        });

        test('should pause and resume game', () => {
            const pauseResult = gameManager.pauseGame(gameId);
            expect(pauseResult.success).toBe(true);

            const game = gameManager.getGame(gameId);
            expect(game.status).toBe('paused');
            expect(game.pausedAt).toBeDefined();

            const resumeResult = gameManager.resumeGame(gameId);
            expect(resumeResult.success).toBe(true);
            expect(game.status).toBe('active');
            expect(game.resumedAt).toBeDefined();
        });

        test('should handle invalid pause/resume', () => {
            // Invalid game
            const invalidPause = gameManager.pauseGame('INVALID');
            expect(invalidPause.success).toBe(false);
            expect(invalidPause.message).toBe('Game not found');

            // Resume non-paused game
            const invalidResume = gameManager.resumeGame(gameId);
            expect(invalidResume.success).toBe(false);
            expect(invalidResume.message).toBe('Game is not paused');
        });

        test('should handle pause of non-active game', () => {
            // End the game first
            gameManager.endGame(gameId, 'checkmate', hostId);

            const result = gameManager.pauseGame(gameId);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Game is not active');
        });

        test('should handle resume of non-paused game', () => {
            // Try to resume without pausing first
            const result = gameManager.resumeGame(gameId);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Game is not paused');
        });

        test('should handle resume of non-existent game', () => {
            const result = gameManager.resumeGame('INVALID');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Game not found');
        });
    });

    describe('Advanced Query Methods', () => {
        test('should find games by player', () => {
            const hostId = 'host';
            const guestId = 'guest';
            const gameId1 = gameManager.createGame(hostId);
            const gameId2 = gameManager.createGame('other_host');
            gameManager.joinGame(gameId1, guestId);
            gameManager.joinGame(gameId2, hostId);

            const hostGames = gameManager.findGamesByPlayer(hostId);
            expect(hostGames).toHaveLength(2);
            expect(hostGames).toContain(gameId1);
            expect(hostGames).toContain(gameId2);

            const guestGames = gameManager.findGamesByPlayer(guestId);
            expect(guestGames).toHaveLength(1);
            expect(guestGames).toContain(gameId1);
        });

        test('should get games by status', () => {
            const gameId1 = gameManager.createGame('host1');
            const gameId2 = gameManager.createGame('host2');
            gameManager.joinGame(gameId1, 'guest1');

            const activeGames = gameManager.getGamesByStatus('active');
            expect(activeGames).toHaveLength(1);
            expect(activeGames).toContain(gameId1);

            const waitingGames = gameManager.getGamesByStatus('waiting');
            expect(waitingGames).toHaveLength(1);
            expect(waitingGames).toContain(gameId2);
        });

        test('should get available games', () => {
            const gameId1 = gameManager.createGame('host1');
            const gameId2 = gameManager.createGame('host2');
            gameManager.joinGame(gameId1, 'guest1'); // This game becomes active

            const availableGames = gameManager.getAvailableGames();
            expect(availableGames).toHaveLength(1);
            expect(availableGames[0].gameId).toBe(gameId2);
            expect(availableGames[0].host).toBe('host2');
            expect(availableGames[0].createdAt).toBeDefined();
        });

        test('should get move history', () => {
            const hostId = 'host';
            const guestId = 'guest';
            const gameId = gameManager.createGame(hostId);
            gameManager.joinGame(gameId, guestId);

            // Make a move
            gameManager.makeMove(gameId, hostId, {
                from: { row: 6, col: 4 }, to: { row: 4, col: 4 }
            });

            const history = gameManager.getMoveHistory(gameId);
            expect(history).toHaveLength(1);
            expect(history[0].from).toEqual({ row: 6, col: 4 });
            expect(history[0].to).toEqual({ row: 4, col: 4 });

            // Non-existent game
            const emptyHistory = gameManager.getMoveHistory('INVALID');
            expect(emptyHistory).toEqual([]);
        });

        test('should handle undo move (not implemented)', () => {
            const hostId = 'host';
            const guestId = 'guest';
            const gameId = gameManager.createGame(hostId);
            gameManager.joinGame(gameId, guestId);

            const result = gameManager.undoMove(gameId);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Undo not implemented');

            const invalidResult = gameManager.undoMove('INVALID');
            expect(invalidResult.success).toBe(false);
            expect(invalidResult.message).toBe('Game not found');
        });
    });

    describe('Statistics and Analytics', () => {
        test('should get game statistics', () => {
            const hostId = 'host';
            const guestId = 'guest';
            const gameId = gameManager.createGame(hostId);
            gameManager.joinGame(gameId, guestId);

            // Make a move
            gameManager.makeMove(gameId, hostId, {
                from: { row: 6, col: 4 }, to: { row: 4, col: 4 }
            });

            const stats = gameManager.getGameStatistics(gameId);
            expect(stats).toBeDefined();
            // Use toBeGreaterThanOrEqual as duration can be 0 in extremely fast execution environments
            expect(stats.duration).toBeGreaterThanOrEqual(0);
            expect(stats.moveCount).toBe(1);
            expect(stats.players.white).toBe(hostId);
            expect(stats.players.black).toBe(guestId);
            expect(stats.status).toBe('active');
            expect(stats.createdAt).toBeDefined();
            expect(stats.lastActivity).toBeDefined();

            // Non-existent game
            const nullStats = gameManager.getGameStatistics('INVALID');
            expect(nullStats).toBe(null);
        });

        test('should get player statistics', () => {
            const playerId = 'player1';
            const gameId1 = gameManager.createGame(playerId);
            const gameId2 = gameManager.createGame('other_host');
            const gameId3 = gameManager.createGame(playerId);

            gameManager.joinGame(gameId1, 'opponent1');
            gameManager.joinGame(gameId2, playerId);
            gameManager.joinGame(gameId3, 'opponent3');

            // End one game with player winning
            gameManager.endGame(gameId1, 'checkmate', playerId);

            // End another game with player losing
            gameManager.endGame(gameId2, 'checkmate', 'other_host');

            // End third game as draw (no winner)
            gameManager.endGame(gameId3, 'stalemate', null);

            const stats = gameManager.getPlayerStatistics(playerId);
            expect(stats.gamesPlayed).toBe(3);
            expect(stats.wins).toBe(1);
            expect(stats.losses).toBe(1);
            expect(stats.draws).toBe(1);
            expect(stats.winRate).toBe(1 / 3);
        });

        test('should get server statistics', () => {
            const gameId1 = gameManager.createGame('host1');
            const gameId2 = gameManager.createGame('host2');
            gameManager.joinGame(gameId1, 'guest1');
            gameManager.joinGame(gameId2, 'guest2'); // Make game2 active
            gameManager.endGame(gameId1, 'checkmate', 'host1');

            gameManager.handleDisconnect('host2'); // Now host2 is in an active game

            const stats = gameManager.getServerStatistics();
            expect(stats.totalGames).toBe(2);
            expect(stats.activeGames).toBe(1);
            expect(stats.waitingGames).toBe(0);
            expect(stats.finishedGames).toBe(1);
            expect(stats.totalPlayers).toBe(4); // host1, guest1, host2, guest2
            expect(stats.disconnectedPlayers).toBe(1);
        });

        test('should get memory usage information', () => {
            gameManager.createGame('host1');
            gameManager.createGame('host2');

            const memoryUsage = gameManager.getMemoryUsage();
            expect(memoryUsage.gameCount).toBe(2);
            expect(memoryUsage.playerMappings).toBe(2);
            expect(memoryUsage.disconnectedCount).toBe(0);
            expect(memoryUsage.estimatedMemory).toBeGreaterThan(0);
        });
    });

    describe('Cleanup and Maintenance', () => {
        test('should clean up inactive games', async () => {
            const gameId1 = gameManager.createGame('host1');
            const gameId2 = gameManager.createGame('host2');

            // Manually set old lastActivity for one game
            const game1 = gameManager.getGame(gameId1);
            game1.lastActivity = Date.now() - (3 * 60 * 60 * 1000); // 3 hours ago

            const cleaned = gameManager.cleanupInactiveGames(2 * 60 * 60 * 1000); // 2 hour threshold
            expect(cleaned).toBe(1);
            expect(gameManager.games.has(gameId1)).toBe(false);
            expect(gameManager.games.has(gameId2)).toBe(true);
        });

        test('should cleanup all data', () => {
            gameManager.createGame('host1');
            gameManager.createGame('host2');
            gameManager.handleDisconnect('host1');

            expect(gameManager.games.size).toBeGreaterThan(0);
            expect(gameManager.playerToGame.size).toBeGreaterThan(0);

            gameManager.cleanup();

            expect(gameManager.games.size).toBe(0);
            expect(gameManager.playerToGame.size).toBe(0);
            expect(gameManager.disconnectedPlayers.size).toBe(0);
        });
    });

    describe('Event System', () => {
        test('should add and remove event handlers', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();

            gameManager.addEventHandler('test-event', handler1);
            gameManager.addEventHandler('test-event', handler2);

            gameManager.emitEvent('test-event', { data: 'test' });

            expect(handler1).toHaveBeenCalledWith({ data: 'test' });
            expect(handler2).toHaveBeenCalledWith({ data: 'test' });

            gameManager.removeEventHandler('test-event', handler1);
            gameManager.emitEvent('test-event', { data: 'test2' });

            expect(handler1).toHaveBeenCalledTimes(1);
            expect(handler2).toHaveBeenCalledTimes(2);
        });

        test('should handle event errors gracefully', () => {
            const errorHandler = jest.fn(() => {
                throw new Error('Handler error');
            });
            const goodHandler = jest.fn();

            gameManager.addEventHandler('test-event', errorHandler);
            gameManager.addEventHandler('test-event', goodHandler);

            // Should not throw
            gameManager.emitEvent('test-event', { data: 'test' });

            expect(errorHandler).toHaveBeenCalled();
            expect(goodHandler).toHaveBeenCalled();
        });

        test('should handle non-existent events', () => {
            // Should not throw
            gameManager.emitEvent('non-existent-event', { data: 'test' });
            gameManager.removeEventHandler('non-existent-event', jest.fn());
        });
    });

    describe('Settings Management', () => {
        test('should update and get settings', () => {
            const newSettings = {
                maxGamesPerPlayer: 5,
                gameTimeout: 60 * 60 * 1000
            };

            gameManager.updateSettings(newSettings);
            const settings = gameManager.getSettings();

            expect(settings.maxGamesPerPlayer).toBe(5);
            expect(settings.gameTimeout).toBe(60 * 60 * 1000);
            expect(settings.cleanupInterval).toBeDefined(); // Should have default
        });

        test('should reset settings to defaults', () => {
            gameManager.updateSettings({ maxGamesPerPlayer: 10 });
            gameManager.resetSettings();

            const settings = gameManager.getSettings();
            expect(settings.maxGamesPerPlayer).toBe(3);
            expect(settings.gameTimeout).toBe(30 * 60 * 1000);
            expect(settings.cleanupInterval).toBe(5 * 60 * 1000);
        });

        test('should initialize default settings', () => {
            const settings = gameManager.getSettings();
            expect(settings).toBeDefined();
            expect(settings.maxGamesPerPlayer).toBeDefined();
            expect(settings.gameTimeout).toBeDefined();
            expect(settings.cleanupInterval).toBeDefined();
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle multiple disconnections of same player', () => {
            const hostId = 'host';
            const guestId = 'guest';
            const gameId = gameManager.createGame(hostId);
            gameManager.joinGame(gameId, guestId);

            gameManager.handleDisconnect(hostId);
            gameManager.handleDisconnect(hostId); // Second disconnection

            expect(gameManager.disconnectedPlayers.has(hostId)).toBe(true);
            expect(gameManager.disconnectedPlayers.size).toBe(1);
        });

        test('should handle disconnection of non-existent player', () => {
            // Should not throw
            gameManager.handleDisconnect('nonexistent');
            expect(gameManager.disconnectedPlayers.has('nonexistent')).toBe(false);
        });

        test('should validate move correctly', () => {
            const hostId = 'host';
            const guestId = 'guest';
            const gameId = gameManager.createGame(hostId);
            gameManager.joinGame(gameId, guestId);

            // Valid move
            const validMove = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
            expect(gameManager.validateMove(gameId, hostId, validMove)).toBe(true);

            // Invalid scenarios
            expect(gameManager.validateMove('INVALID', hostId, validMove)).toBe(false);
            expect(gameManager.validateMove(gameId, 'outsider', validMove)).toBe(false);
            expect(gameManager.validateMove(gameId, guestId, validMove)).toBe(false); // Wrong turn
        });

        test('should handle edge cases in chat cleanup', () => {
            // Non-existent game
            gameManager.cleanupGameChat('INVALID'); // Should not throw

            // Game with no chat
            const gameId = gameManager.createGame('host');
            gameManager.cleanupGameChat(gameId); // Should not throw
        });
    });
});