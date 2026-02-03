/**
 * Tests for GameManager index consistency.
 * Verifies that the secondary index (playerGames) is correctly maintained
 * during game creation, joining, removal, and player removal.
 */
const GameManager = require('../src/server/gameManager');

describe('GameManager - Index Consistency', () => {
    let gameManager;

    beforeEach(() => {
        gameManager = new GameManager();
    });

    afterEach(() => {
        gameManager.cleanup();
    });

    test('should maintain index on createGame', () => {
        const playerId = 'host1';
        const gameId = gameManager.createGame(playerId);

        expect(gameManager.playerGames.get(playerId).has(gameId)).toBe(true);
        expect(gameManager.findGamesByPlayer(playerId)).toContain(gameId);
    });

    test('should maintain index on joinGame', () => {
        const hostId = 'host1';
        const guestId = 'guest1';
        const gameId = gameManager.createGame(hostId);
        gameManager.joinGame(gameId, guestId);

        expect(gameManager.playerGames.get(guestId).has(gameId)).toBe(true);
        expect(gameManager.findGamesByPlayer(guestId)).toContain(gameId);
    });

    test('should maintain index on removeGame', () => {
        const hostId = 'host1';
        const guestId = 'guest1';
        const gameId = gameManager.createGame(hostId);
        gameManager.joinGame(gameId, guestId);

        gameManager.removeGame(gameId);

        expect(gameManager.playerGames.has(hostId)).toBe(false); // Should be removed if empty
        expect(gameManager.playerGames.has(guestId)).toBe(false);
        expect(gameManager.findGamesByPlayer(hostId)).toHaveLength(0);
    });

    test('should maintain index on removePlayer', () => {
        const hostId = 'host1';
        const guestId = 'guest1';
        const gameId = gameManager.createGame(hostId);
        gameManager.joinGame(gameId, guestId);

        // Remove guest
        gameManager.removePlayer(gameId, guestId);
        expect(gameManager.playerGames.has(guestId)).toBe(false);
        expect(gameManager.findGamesByPlayer(guestId)).toHaveLength(0);

        // Host still there
        expect(gameManager.playerGames.get(hostId).has(gameId)).toBe(true);
    });

    test('should maintain index when host leaves and guest promoted', () => {
        const hostId = 'host1';
        const guestId = 'guest1';
        const gameId = gameManager.createGame(hostId);
        gameManager.joinGame(gameId, guestId);

        // Remove host
        gameManager.removePlayer(gameId, hostId);

        // Host removed from index
        expect(gameManager.playerGames.has(hostId)).toBe(false);

        // Guest (now host) still in index
        expect(gameManager.playerGames.get(guestId).has(gameId)).toBe(true);
        const game = gameManager.getGame(gameId);
        expect(game.host).toBe(guestId);
    });

    test('should maintain index on checkDisconnectedPlayer', () => {
        const hostId = 'host1';
        const gameId = gameManager.createGame(hostId);
        gameManager.joinGame(gameId, 'guest1'); // Make it active

        gameManager.handleDisconnect(hostId);
        // Normally checkDisconnectedPlayer is called by timeout, we call manually
        gameManager.checkDisconnectedPlayer(hostId);

        expect(gameManager.games.has(gameId)).toBe(false);
        expect(gameManager.playerGames.has(hostId)).toBe(false);
    });

    test('should handle multiple games for one player', () => {
        const playerId = 'multi_player';
        const game1 = gameManager.createGame(playerId);
        const game2 = gameManager.createGame('other_host');
        gameManager.joinGame(game2, playerId);

        expect(gameManager.playerGames.get(playerId).size).toBe(2);
        expect(gameManager.findGamesByPlayer(playerId)).toHaveLength(2);

        // Remove one game
        gameManager.removeGame(game1);
        expect(gameManager.playerGames.get(playerId).size).toBe(1);
        expect(gameManager.playerGames.get(playerId).has(game2)).toBe(true);
    });

    test('should cleanup correctly', () => {
         const playerId = 'player1';
         gameManager.createGame(playerId);
         gameManager.cleanup();
         expect(gameManager.playerGames.size).toBe(0);
    });
});
