const GameManager = require('../../src/server/gameManager');
const ChessGame = require('../../src/shared/chessGame');

// Mock ChessGame if needed, or use real one
// We can use the real one as it is required by GameManager

describe('GameManager Player Statistics Optimization', () => {
  let gameManager;
  const player1 = 'player1';
  const player2 = 'player2';
  beforeEach(() => {
    gameManager = new GameManager();
    // Bypass rate limiting
    gameManager.MAX_GAMES_PER_PLAYER = 100;
  });
  afterEach(() => {
    gameManager.cleanup();
  });
  test('should track wins and losses correctly', () => {
    const gameId = gameManager.createGame(player1);
    gameManager.joinGame(gameId, player2);

    // Initial stats
    let stats1 = gameManager.getPlayerStatistics(player1);
    let stats2 = gameManager.getPlayerStatistics(player2);
    expect(stats1.gamesPlayed).toBe(1);
    expect(stats1.wins).toBe(0);
    expect(stats2.gamesPlayed).toBe(1);
    expect(stats2.wins).toBe(0);

    // Player 1 wins
    gameManager.endGame(gameId, 'checkmate', player1);
    stats1 = gameManager.getPlayerStatistics(player1);
    stats2 = gameManager.getPlayerStatistics(player2);
    expect(stats1.wins).toBe(1);
    expect(stats1.losses).toBe(0);
    expect(stats2.wins).toBe(0);
    expect(stats2.losses).toBe(1);
  });
  test('should track draws correctly', () => {
    const gameId = gameManager.createGame(player1);
    gameManager.joinGame(gameId, player2);
    gameManager.endGame(gameId, 'stalemate', null);
    const stats1 = gameManager.getPlayerStatistics(player1);
    const stats2 = gameManager.getPlayerStatistics(player2);
    expect(stats1.draws).toBe(1);
    expect(stats2.draws).toBe(1);
  });
  test('should update stats when game is removed', () => {
    const gameId = gameManager.createGame(player1);
    gameManager.joinGame(gameId, player2);
    gameManager.endGame(gameId, 'checkmate', player1);

    // Verify stats before removal
    expect(gameManager.getPlayerStatistics(player1).wins).toBe(1);

    // Remove game
    gameManager.removeGame(gameId);

    // Stats should be reverted (assuming stats reflect CURRENT games)
    const stats1 = gameManager.getPlayerStatistics(player1);
    expect(stats1.gamesPlayed).toBe(0);
    expect(stats1.wins).toBe(0);
  });
  test('should update stats when player is removed from finished game', () => {
    const gameId = gameManager.createGame(player1);
    gameManager.joinGame(gameId, player2);
    gameManager.endGame(gameId, 'checkmate', player1);
    expect(gameManager.getPlayerStatistics(player1).wins).toBe(1);

    // Remove player1
    gameManager.removePlayer(gameId, player1);
    const stats1 = gameManager.getPlayerStatistics(player1);
    // Player is removed from game, so gamesPlayed decrements
    expect(stats1.gamesPlayed).toBe(0);
    // Win should be removed too
    expect(stats1.wins).toBe(0);
  });
  test('should handle concurrent updates correctly', () => {
    // Multiple games
    const g1 = gameManager.createGame(player1);
    gameManager.joinGame(g1, player2);
    const g2 = gameManager.createGame(player1);
    gameManager.joinGame(g2, player2);
    gameManager.endGame(g1, 'checkmate', player1); // P1 win
    gameManager.endGame(g2, 'checkmate', player2); // P2 win

    let s1 = gameManager.getPlayerStatistics(player1);
    expect(s1.wins).toBe(1);
    expect(s1.losses).toBe(1);
    gameManager.removeGame(g1);
    s1 = gameManager.getPlayerStatistics(player1);
    expect(s1.wins).toBe(0);
    expect(s1.losses).toBe(1);
  });
  test('should not double-decrement stats when removing player then game', () => {
    const gameId = gameManager.createGame(player1);
    gameManager.joinGame(gameId, player2);
    gameManager.endGame(gameId, 'checkmate', player1); // P1 wins

    expect(gameManager.getPlayerStatistics(player1).wins).toBe(1);

    // Remove player 1
    gameManager.removePlayer(gameId, player1);
    expect(gameManager.getPlayerStatistics(player1).wins).toBe(0);

    // Remove game (should not decrement P1 again)
    gameManager.removeGame(gameId);
    expect(gameManager.getPlayerStatistics(player1).wins).toBe(0);
  });
});