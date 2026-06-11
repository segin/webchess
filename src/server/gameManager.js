const {
  randomUUID,
  randomBytes
} = require('crypto');
const ChessGame = require('../shared/chessGame');
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function (m) {
    switch (m) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#039;';
      default:
        return m;
    }
  });
}
class GameManager {
  constructor() {
    this.games = new Map();
    this.gamesByStatus = new Map();
    this.playerToGame = new Map();
    this.playerGames = new Map(); // Index: playerId -> Set<gameId>
    this.disconnectedPlayers = new Map();
    this.disconnectTimeouts = new Map(); // Track timeouts for cleanup
    this.playerGameCounts = new Map(); // Track game counts for rate limiting
    this.playerConnections = new Map(); // Track active socket connections per sessionToken
    this.playerStats = new Map(); // Optimization: Pre-calculated player statistics
    this.availableGamesCache = new Map(); // Optimization: Fast lookup for available games
    this.activityList = new Set(); // Optimization: Track game activity for efficient cleanup

    this.settings = {
      maxGamesPerPlayer: 3,
      maxTotalGames: 1000,
      gameTimeout: 30 * 60 * 1000,
      cleanupInterval: 5 * 60 * 1000
    };

    // Optional notification hook set by the server: called with
    // ({ gameId, winner }) when a game is abandoned after the
    // disconnect grace period expires.
    this.onGameAbandoned = null;
  }
  addConnection(playerId) {
    const count = this.playerConnections.get(playerId) || 0;
    this.playerConnections.set(playerId, count + 1);
    // True when this connection cancels a pending disconnect grace period
    return this.handleReconnect(playerId);
  }
  removeConnection(playerId) {
    const count = this.playerConnections.get(playerId) || 0;
    if (count <= 1) {
      this.playerConnections.delete(playerId);
      this.handleDisconnect(playerId);
      return true; // Player has no remaining connections
    }
    this.playerConnections.set(playerId, count - 1);
    return false;
  }
  generateGameId() {
    // Use cryptographically secure random bytes instead of Math.random()
    return randomBytes(3).toString('hex').toUpperCase();
  }
  createGame(playerId) {
    // Global cap bounds server memory regardless of how many identities
    // a client mints
    if (this.games.size >= this.settings.maxTotalGames) {
      return null;
    }
    // Rate limit: Check if player has reached game limit
    const currentCount = this.playerGameCounts.get(playerId) || 0;
    if (currentCount >= this.settings.maxGamesPerPlayer) {
      return null;
    }
    let gameId;
    do {
      gameId = this.generateGameId();
    } while (this.games.has(gameId));
    const game = {
      id: gameId,
      host: playerId,
      guest: null,
      chess: new ChessGame(),
      status: 'waiting',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      chatMessages: []
    };
    this.games.set(gameId, game);
    this.activityList.add(gameId);
    this._addToStatusIndex('waiting', gameId);
    this.playerToGame.set(playerId, gameId);
    this._addGameToPlayer(playerId, gameId);
    this.playerGameCounts.set(playerId, currentCount + 1);
    return gameId;
  }

  /**
   * Add game to player's list of games
   * @param {string} playerId - Player ID
   * @param {string} gameId - Game ID
   * @private
   */
  _addGameToPlayer(playerId, gameId) {
    if (!this.playerGames.has(playerId)) {
      this.playerGames.set(playerId, new Set());
    }
    this.playerGames.get(playerId).add(gameId);
  }

  /**
   * Remove game from player's list of games
   * @param {string} playerId - Player ID
   * @param {string} gameId - Game ID
   * @private
   */
  _removeGameFromPlayer(playerId, gameId) {
    if (this.playerGames.has(playerId)) {
      const games = this.playerGames.get(playerId);
      games.delete(gameId);
      if (games.size === 0) {
        this.playerGames.delete(playerId);
      }
    }
  }
  _removePlayerGame(playerId, gameId) {
    this._removeGameFromPlayer(playerId, gameId);
  }
  joinGame(gameId, playerId) {
    if (!gameId || typeof gameId !== 'string') {
      return {
        success: false,
        message: 'Game not found'
      };
    }
    const normalizedId = gameId.toUpperCase();
    const game = this.games.get(normalizedId);
    if (!game) {
      return {
        success: false,
        message: 'Game not found'
      };
    }
    // Returning players resume their seat instead of being rejected
    if (game.guest === playerId) {
      return {
        success: true,
        color: 'black',
        opponentColor: 'white',
        rejoined: true
      };
    }
    if (game.host === playerId && game.status === 'active') {
      return {
        success: true,
        color: 'white',
        opponentColor: 'black',
        rejoined: true
      };
    }
    if (game.guest) {
      return {
        success: false,
        message: 'Game is full'
      };
    }
    if (game.host === playerId) {
      return {
        success: false,
        message: 'Cannot join your own game'
      };
    }
    if (game.status !== 'waiting') {
      return {
        success: false,
        message: 'Game is not joinable'
      };
    }
    const oldStatus = game.status;
    game.guest = playerId;
    game.status = 'active';
    this._updateStatusIndex(game.id, oldStatus, 'active');
    this._markGameActive(normalizedId);
    this.playerToGame.set(playerId, normalizedId);
    this._addGameToPlayer(playerId, normalizedId);
    return {
      success: true,
      color: 'black',
      opponentColor: 'white'
    };
  }
  makeMove(gameId, playerId, move) {
    const game = this.games.get(gameId);
    if (!game) {
      return {
        success: false,
        message: 'Game not found'
      };
    }
    if (game.status !== 'active') {
      return {
        success: false,
        message: 'Game is not active'
      };
    }
    const isHost = game.host === playerId;
    const isGuest = game.guest === playerId;
    if (!isHost && !isGuest) {
      return {
        success: false,
        message: 'You are not in this game'
      };
    }
    const playerColor = isHost ? 'white' : 'black';
    if (game.chess.currentTurn !== playerColor) {
      return {
        success: false,
        message: 'Not your turn'
      };
    }
    const result = game.chess.makeMove(move);
    if (!result.success) {
      return {
        success: false,
        message: result.message,
        errorCode: result.errorCode || (result.data && result.data.errorCode)
      };
    }
    this._markGameActive(gameId);

    // Propagate engine game-over states to the session so finished games
    // stop accepting moves/resignations and release the players' slots
    const engineStatus = game.chess.gameStatus;
    if (engineStatus !== 'active' && engineStatus !== 'check') {
      const oldStatus = game.status;
      game.status = 'finished';
      game.endReason = engineStatus;
      // Stats bookkeeping expects the winner as a player ID, not a color
      game.winner = game.chess.winner === 'white' ? game.host :
        (game.chess.winner === 'black' ? game.guest : null);
      game.endTime = Date.now();
      this._updateStatusIndex(gameId, oldStatus, 'finished');
      this._updateStatsForGame(game, 1);
      this._releaseGameSlot(game);
    }

    return {
      success: true,
      gameState: game.chess.getGameState(),
      nextTurn: game.chess.currentTurn
    };
  }

  /**
   * Release the host's game-count slot for a game exactly once,
   * no matter how many end/cleanup paths run for it.
   * @param {Object} game - Game object
   * @private
   */
  _releaseGameSlot(game) {
    if (game.slotReleased) return;
    game.slotReleased = true;
    const currentCount = this.playerGameCounts.get(game.host) || 0;
    if (currentCount > 1) {
      this.playerGameCounts.set(game.host, currentCount - 1);
    } else {
      this.playerGameCounts.delete(game.host);
    }
  }
  resignGame(gameId, playerId) {
    const game = this.games.get(gameId);
    if (!game) {
      return {
        success: false,
        message: 'Game not found'
      };
    }
    const isHost = game.host === playerId;
    const isGuest = game.guest === playerId;
    if (!isHost && !isGuest) {
      return {
        success: false,
        message: 'You are not in this game'
      };
    }
    if (game.status !== 'active' && game.status !== 'waiting') {
      return {
        success: false,
        message: 'Game is already over'
      };
    }
    const wasWaiting = game.status === 'waiting';
    const oldStatus = game.status;
    game.status = 'resigned';
    this._updateStatusIndex(game.id, oldStatus, 'resigned');
    this._releaseGameSlot(game);
    // Resigning a game nobody joined just cancels it - there is no winner
    const winner = wasWaiting ? null : (isHost ? 'black' : 'white');
    return {
      success: true,
      winner
    };
  }
  getGameState(gameId) {
    const game = this.games.get(gameId);
    return game ? game.chess.getGameState() : null;
  }
  handleDisconnect(playerId) {
    // Track every game the player is part of, not just the most recent one:
    // active games get the 15-minute abandonment grace period, and waiting
    // games (a host who left before anyone joined) are cleaned up too.
    const gameIds = [...(this.playerGames.get(playerId) || [])].filter(gameId => {
      const game = this.games.get(gameId);
      return game && (game.status === 'active' || game.status === 'waiting');
    });

    if (gameIds.length > 0) {
      this.disconnectedPlayers.set(playerId, {
        gameIds,
        // Kept for backward compatibility with older callers/tests
        gameId: gameIds[0],
        disconnectedAt: Date.now()
      });
      const timeoutId = setTimeout(() => {
        this.checkDisconnectedPlayer(playerId);
      }, 15 * 60 * 1000); // 15 minutes

      // Store timeout reference for cleanup
      this.disconnectTimeouts.set(playerId, timeoutId);
    }
  }
  handleReconnect(playerId) {
    if (this.disconnectedPlayers.has(playerId)) {
      this.disconnectedPlayers.delete(playerId);
      const timeoutId = this.disconnectTimeouts.get(playerId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.disconnectTimeouts.delete(playerId);
      }
      return true;
    }
    return false;
  }
  checkDisconnectedPlayer(playerId) {
    const disconnectedInfo = this.disconnectedPlayers.get(playerId);
    if (!disconnectedInfo) return;

    this.disconnectedPlayers.delete(playerId);
    // Clean up timeout reference
    this.disconnectTimeouts.delete(playerId);

    const gameIds = disconnectedInfo.gameIds || [disconnectedInfo.gameId];
    for (const gameId of gameIds) {
      const game = this.games.get(gameId);
      if (!game) continue;
      // The player may have rejoined a different connection mid-grace-period
      if (game.host !== playerId && game.guest !== playerId) continue;

      if (game.status === 'active') {
        // The remaining player wins by abandonment; tell the server so the
        // opponent is notified instead of being silently stranded
        const winner = game.host === playerId ? 'black' : 'white';
        this._removeFromStatusIndex('active', gameId);
        game.status = 'abandoned';
        if (typeof this.onGameAbandoned === 'function') {
          this.onGameAbandoned({ gameId, winner });
        }
        this._releaseGameSlot(game);
        this._deleteGame(game);
      } else if (game.status === 'waiting') {
        // Nobody is waiting on this game anymore - drop it
        this._releaseGameSlot(game);
        this._removeFromStatusIndex('waiting', gameId);
        this._deleteGame(game);
      }
    }
  }

  /**
   * Remove a game's storage and player mappings (status index and slot
   * bookkeeping must already be handled by the caller).
   * @param {Object} game - Game object
   * @private
   */
  _deleteGame(game) {
    game.chatMessages = [];
    this._removePlayerGame(game.host, game.id);
    if (game.guest) {
      this._removePlayerGame(game.guest, game.id);
    }
    if (this.playerToGame.get(game.host) === game.id) {
      this.playerToGame.delete(game.host);
    }
    if (game.guest && this.playerToGame.get(game.guest) === game.id) {
      this.playerToGame.delete(game.guest);
    }
    this.activityList.delete(game.id);
    this.games.delete(game.id);
  }
  addChatMessage(gameId, playerId, message) {
    const game = this.games.get(gameId);
    if (!game || game.host !== playerId && game.guest !== playerId) {
      return {
        success: false,
        message: 'Player not in game'
      };
    }

    // Sanitize and validate message
    const sanitizedMessage = escapeHTML(message.trim().substring(0, 200));
    if (!sanitizedMessage) {
      return {
        success: false,
        message: 'Empty or invalid message'
      };
    }
    const isHost = game.host === playerId;
    const senderColor = isHost ? 'White' : 'Black';
    const chatMessage = {
      id: randomUUID(),
      message: sanitizedMessage,
      sender: senderColor,
      playerId: playerId,
      timestamp: Date.now()
    };
    game.chatMessages.push(chatMessage);
    this._markGameActive(gameId);

    // Limit chat history to 100 messages
    if (game.chatMessages.length > 100) {
      game.chatMessages.splice(0, game.chatMessages.length - 100);
    }
    return {
      success: true,
      chatMessage: {
        message: sanitizedMessage,
        sender: senderColor,
        timestamp: chatMessage.timestamp
      }
    };
  }
  getChatMessages(gameId, playerId) {
    const game = this.games.get(gameId);
    if (!game || game.host !== playerId && game.guest !== playerId) {
      return {
        success: false,
        messages: []
      };
    }
    const messages = game.chatMessages.map(msg => ({
      message: msg.message,
      sender: msg.sender,
      isOwn: msg.playerId === playerId,
      timestamp: msg.timestamp
    }));
    return {
      success: true,
      messages
    };
  }
  cleanupGameChat(gameId) {
    const game = this.games.get(gameId);
    if (game) {
      game.chatMessages = [];
    }
  }
  getActiveGameCount() {
    return (this.gamesByStatus.get('active')?.size || 0) +
           (this.gamesByStatus.get('waiting')?.size || 0);
  }
  getStats() {
    return {
      activeGames: this.games.size,
      activePlayers: this.playerToGame.size,
      disconnectedPlayers: this.disconnectedPlayers.size
    };
  }

  // Additional functions for comprehensive testing

  /**
   * Get a game by ID
   * @param {string} gameId - Game ID
   * @returns {Object|null} Game object or null if not found
   */
  getGame(gameId) {
    return this.games.get(gameId) || null;
  }

  /**
   * Remove a game
   * @param {string} gameId - Game ID to remove
   * @returns {boolean} True if game was removed
   */
  removeGame(gameId) {
    const game = this.games.get(gameId);
    if (game) {
      // Update stats if game was finished
      this._updateStatsForGame(game, -1);

      // Remove from status index
      this._removeFromStatusIndex(game.status, gameId);

      // Release the host's slot (no-op if an end-of-game path already did)
      this._releaseGameSlot(game);

      // Remove storage and player mappings
      this._deleteGame(game);
      return true;
    }
    return false;
  }

  /**
   * Validate if a player has access to a game
   * @param {string} gameId - Game ID
   * @param {string} playerId - Player ID
   * @returns {boolean} True if player has access
   */
  validateGameAccess(gameId, playerId) {
    const game = this.games.get(gameId);
    return game && (game.host === playerId || game.guest === playerId);
  }

  /**
   * Check if it's a player's turn
   * @param {string} gameId - Game ID
   * @param {string} playerId - Player ID
   * @returns {boolean} True if it's the player's turn
   */
  isPlayerTurn(gameId, playerId) {
    const game = this.games.get(gameId);
    if (!game || !game.chess) return false;
    const playerColor = game.host === playerId ? 'white' : 'black';
    return game.chess.currentTurn === playerColor;
  }

  /**
   * Remove a player from a game
   * @param {string} gameId - Game ID
   * @param {string} playerId - Player ID to remove
   * @returns {Object} Result object
   */
  removePlayer(gameId, playerId) {
    const game = this.games.get(gameId);
    if (!game) {
      return {
        success: false,
        message: 'Game not found'
      };
    }

    // Helper to decrement stats if needed
    const decrementStats = () => {
      if (game.status === 'finished') {
        let result = null;
        if (game.winner === playerId) result = 'win';else if (game.winner && game.winner !== playerId) result = 'loss';else if (!game.winner) result = 'draw';
        if (result) this._updatePlayerStats(playerId, result, -1);
      }
    };
    if (game.host === playerId) {
      decrementStats();
      game.host = null;
      this.playerToGame.delete(playerId);
      this._removeGameFromPlayer(playerId, gameId);

      // If guest exists, promote to host
      if (game.guest) {
        game.host = game.guest;
        game.guest = null;

        // If game is in waiting status, update cache with new host
        if (game.status === 'waiting') {
          this.availableGamesCache.set(gameId, {
            gameId,
            host: game.host,
            createdAt: game.createdAt
          });
        }
      }
    } else if (game.guest === playerId) {
      decrementStats();
      game.guest = null;

      // If game is in waiting status and guest leaves, it becomes available again
      if (game.status === 'waiting') {
        this.availableGamesCache.set(gameId, {
          gameId,
          host: game.host,
          createdAt: game.createdAt
        });
      }
      this.playerToGame.delete(playerId);
      this._removeGameFromPlayer(playerId, gameId);
    } else {
      return {
        success: false,
        message: 'Player not in game'
      };
    }

    // If no players left, remove the game
    if (!game.host && !game.guest) {
      this.removeGame(gameId);
    }
    return {
      success: true
    };
  }

  /**
   * Get player's color in a game
   * @param {string} gameId - Game ID
   * @param {string} playerId - Player ID
   * @returns {string|null} Player color or null
   */
  getPlayerColor(gameId, playerId) {
    const game = this.games.get(gameId);
    if (!game) return null;
    if (game.host === playerId) return 'white';
    if (game.guest === playerId) return 'black';
    return null;
  }

  /**
   * Get opponent's ID
   * @param {string} gameId - Game ID
   * @param {string} playerId - Player ID
   * @returns {string|null} Opponent ID or null
   */
  getOpponentId(gameId, playerId) {
    const game = this.games.get(gameId);
    if (!game) return null;
    if (game.host === playerId) return game.guest;
    if (game.guest === playerId) return game.host;
    return null;
  }

  /**
   * Check if game is full (has both players)
   * @param {string} gameId - Game ID
   * @returns {boolean} True if game is full
   */
  isGameFull(gameId) {
    const game = this.games.get(gameId);
    return game && game.host && game.guest;
  }

  /**
   * Start a game
   * @param {string} gameId - Game ID
   * @returns {Object} Result object
   */
  startGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      return {
        success: false,
        message: 'Game not found'
      };
    }
    if (!this.isGameFull(gameId)) {
      return {
        success: false,
        message: 'Game needs two players to start'
      };
    }
    const oldStatus = game.status;
    game.status = 'active';
    this._updateStatusIndex(gameId, oldStatus, 'active');
    this._markGameActive(gameId);
    return {
      success: true
    };
  }

  /**
   * End a game
   * @param {string} gameId - Game ID
   * @param {string} reason - End reason (checkmate, stalemate, etc.)
   * @param {string} winner - Winner player ID (optional)
   * @returns {Object} Result object
   */
  endGame(gameId, reason, winner = null) {
    const game = this.games.get(gameId);
    if (!game) {
      return {
        success: false,
        message: 'Game not found'
      };
    }
    const oldStatus = game.status;
    game.status = 'finished';
    this._updateStatusIndex(gameId, oldStatus, 'finished');
    game.endReason = reason;
    game.winner = winner;
    game.endTime = Date.now();
    this._updateStatsForGame(game, 1);
    return {
      success: true,
      reason,
      winner
    };
  }

  /**
   * Pause a game
   * @param {string} gameId - Game ID
   * @returns {Object} Result object
   */

  /**
   * Resume a paused game
   * @param {string} gameId - Game ID
   * @returns {Object} Result object
   */

  /**
   * Validate a move
   * @param {string} gameId - Game ID
   * @param {string} playerId - Player ID
   * @param {Object} move - Move object
   * @returns {boolean} True if move is valid
   */
  validateMove(gameId, playerId, move) {
    const game = this.games.get(gameId);
    if (!game || !game.chess) return false;
    if (!this.validateGameAccess(gameId, playerId)) return false;
    if (!this.isPlayerTurn(gameId, playerId)) return false;
    const result = game.chess.validateMove(move);
    return result.success;
  }

  /**
   * Get move history
   * @param {string} gameId - Game ID
   * @returns {Array} Move history array
   */
  getMoveHistory(gameId) {
    const game = this.games.get(gameId);
    return game && game.chess ? game.chess.moveHistory : [];
  }

  /**
   * Undo last move
   * @param {string} gameId - Game ID
   * @param {string} playerId - Player ID requesting the undo
   * @returns {Object} Result object
   */

  /**
   * Find games by player
   * @param {string} playerId - Player ID
   * @returns {Array} Array of game IDs
   */
  findGamesByPlayer(playerId) {
    if (!this.playerGames.has(playerId)) {
      return [];
    }
    return [...this.playerGames.get(playerId)];
  }

  /**
   * Get games by status
   * @param {string} status - Game status
   * @returns {Set<string>} Set of game IDs
   */
  getGamesByStatus(status) {
    if (this.gamesByStatus.has(status)) {
      return this.gamesByStatus.get(status);
    }
    return new Set();
  }

  /**
   * Get available games (waiting for players)
   * @returns {Array} Array of available game objects
   */
  /**
   * Get available games (waiting for players)
   * @param {number} limit - Maximum number of games to return
   * @returns {Array} Array of available game objects
   */
  getAvailableGames(limit = Infinity) {
    const availableGames = [];
    let count = 0;
    for (const game of this.availableGamesCache.values()) {
      if (count >= limit) break;
      availableGames.push(game);
      count++;
    }
    return availableGames;
  }

  /**
   * Get game statistics
   * @param {string} gameId - Game ID
   * @returns {Object} Game statistics
   */
  getGameStatistics(gameId) {
    const game = this.games.get(gameId);
    if (!game) return null;
    const duration = Date.now() - game.createdAt;
    const moveCount = game.chess ? game.chess.moveHistory.length : 0;
    return {
      duration,
      moveCount,
      players: {
        white: game.host,
        black: game.guest
      },
      status: game.status,
      createdAt: game.createdAt,
      lastActivity: game.lastActivity
    };
  }

  /**
   * Get player statistics
   * @param {string} playerId - Player ID
   * @returns {Object} Player statistics
   */
  getPlayerStatistics(playerId) {
    let gamesPlayed = 0;
    let wins = 0;
    let losses = 0;
    let draws = 0;
    if (this.playerGames.has(playerId)) {
      gamesPlayed = this.playerGames.get(playerId).size;
    }
    if (this.playerStats.has(playerId)) {
      const stats = this.playerStats.get(playerId);
      wins = stats.wins;
      losses = stats.losses;
      draws = stats.draws;
    }
    return {
      gamesPlayed,
      wins,
      losses,
      draws,
      winRate: gamesPlayed > 0 ? wins / gamesPlayed : 0
    };
  }

  /**
   * Get server statistics
   * @returns {Object} Server statistics
   */
  getServerStatistics() {
    return {
      totalGames: this.games.size,
      activeGames: this.gamesByStatus.get('active')?.size || 0,
      waitingGames: this.gamesByStatus.get('waiting')?.size || 0,
      finishedGames: this.gamesByStatus.get('finished')?.size || 0,
      totalPlayers: this.playerGames.size,
      disconnectedPlayers: this.disconnectedPlayers.size
    };
  }

  /**
   * Clean up inactive games
   * @param {number} maxAge - Maximum age in milliseconds (default: 2 hours)
   * @returns {number} Number of games cleaned up
   */
  cleanupInactiveGames(maxAge = 2 * 60 * 60 * 1000) {
    let cleaned = 0;
    const now = Date.now();
    for (const gameId of this.activityList) {
      const game = this.games.get(gameId);

      // Handle stale entries if any (though removeGame handles cleanup)
      if (!game) {
        this.activityList.delete(gameId);
        continue;
      }
      if (now - game.lastActivity > maxAge) {
        this.removeGame(gameId);
        cleaned++;
      } else {
        // Optimization: Set iterates in insertion order. Since we re-insert on activity,
        // the list is ordered by activity time (oldest first).
        // If we find an active game, all subsequent games are also active.
        break;
      }
    }
    return cleaned;
  }

  /**
   * Get memory usage information
   * @returns {Object} Memory usage statistics
   */
  getMemoryUsage() {
    const gameCount = this.games.size;
    const playerMappings = this.playerToGame.size;
    const disconnectedCount = this.disconnectedPlayers.size;
    const playerIndexSize = this.playerGames.size;

    // Rough estimation of memory usage
    const estimatedMemory = gameCount * 1000 + playerMappings * 100 + disconnectedCount * 50 + playerIndexSize * 50;
    return {
      gameCount,
      playerMappings,
      disconnectedCount,
      playerIndexSize,
      estimatedMemory
    };
  }

  /**
   * Add event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  addEventHandler(event, handler) {
    if (!this.eventHandlers) {
      this.eventHandlers = {};
    }
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = new Set();
    }
    this.eventHandlers[event].add(handler);
  }

  /**
   * Remove event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  removeEventHandler(event, handler) {
    if (!this.eventHandlers || !this.eventHandlers[event]) return;
    this.eventHandlers[event].delete(handler);
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitEvent(event, data) {
    if (!this.eventHandlers || !this.eventHandlers[event]) return;
    for (const handler of this.eventHandlers[event]) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    }
  }

  /**
   * Update settings
   * @param {Object} newSettings - New settings
   */
  updateSettings(newSettings) {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
  }

  /**
   * Get current settings
   * @returns {Object} Current settings
   */
  getSettings() {
    return {
      ...this.settings
    };
  }

  /**
   * Reset settings to defaults
   */
  resetSettings() {
    this.settings = {
      maxGamesPerPlayer: 3,
      maxTotalGames: 1000,
      gameTimeout: 30 * 60 * 1000,
      cleanupInterval: 5 * 60 * 1000
    };
  }

  /**
   * Clean up all pending timeouts - essential for test cleanup
   */
  cleanup() {
    // Clear all disconnect timeouts
    for (const [playerId, timeoutId] of this.disconnectTimeouts) {
      clearTimeout(timeoutId);
    }
    this.disconnectTimeouts.clear();

    // Clear all game data
    this.games.clear();
    this.gamesByStatus.clear();
    this.playerToGame.clear();
    this.playerGames.clear();
    this.disconnectedPlayers.clear();
    if (this.playerGameCounts) {
      this.playerGameCounts.clear();
    }
    this.playerStats.clear();
    this.availableGamesCache.clear();
    this.activityList.clear();
  }

  /**
   * Mark game as active and update its position in the activity list
   * @param {string} gameId - Game ID
   * @private
   */
  _markGameActive(gameId) {
    const game = this.games.get(gameId);
    if (game) {
      game.lastActivity = Date.now();
      // Move to end of Set to maintain LRU order (oldest at beginning)
      this.activityList.delete(gameId);
      this.activityList.add(gameId);
    }
  }

  /**
   * Helper to update player statistics
   * @param {string} playerId - Player ID
   * @param {string} result - Result ('win', 'loss', 'draw')
   * @param {number} delta - Change amount (+1 or -1)
   * @private
   */
  _updatePlayerStats(playerId, result, delta) {
    if (!playerId) return;
    if (!this.playerStats.has(playerId)) {
      this.playerStats.set(playerId, {
        wins: 0,
        losses: 0,
        draws: 0
      });
    }
    const stats = this.playerStats.get(playerId);
    if (result === 'win') stats.wins += delta;else if (result === 'loss') stats.losses += delta;else if (result === 'draw') stats.draws += delta;
  }

  /**
   * Helper to update stats when a game ends or is removed
   * @param {Object} game - Game object
   * @param {number} delta - Change amount (+1 for end, -1 for undo/remove)
   * @private
   */
  _updateStatsForGame(game, delta) {
    if (game.status !== 'finished') return;

    // Only update stats for players currently attached to the game
    // (Players removed via removePlayer have already had their stats adjusted)
    const hostId = game.host;
    const guestId = game.guest;
    const winnerId = game.winner;

    // Update Host Stats
    if (hostId) {
      if (winnerId) {
        if (winnerId === hostId) {
          this._updatePlayerStats(hostId, 'win', delta);
        } else {
          this._updatePlayerStats(hostId, 'loss', delta);
        }
      } else {
        // Draw
        this._updatePlayerStats(hostId, 'draw', delta);
      }
    }

    // Update Guest Stats
    if (guestId) {
      if (winnerId) {
        if (winnerId === guestId) {
          this._updatePlayerStats(guestId, 'win', delta);
        } else {
          this._updatePlayerStats(guestId, 'loss', delta);
        }
      } else {
        // Draw
        this._updatePlayerStats(guestId, 'draw', delta);
      }
    }
  }

  /**
   * Helper to add game to status index
   * @private
   */
  _addToStatusIndex(status, gameId) {
    if (!this.gamesByStatus.has(status)) {
      this.gamesByStatus.set(status, new Set());
    }
    this.gamesByStatus.get(status).add(gameId);

    // Maintain available games cache
    if (status === 'waiting') {
      const game = this.games.get(gameId);
      if (game && !game.guest) {
        this.availableGamesCache.set(gameId, {
          gameId,
          host: game.host,
          createdAt: game.createdAt
        });
      }
    }
  }

  /**
   * Helper to remove game from status index
   * @private
   */
  _removeFromStatusIndex(status, gameId) {
    if (this.gamesByStatus.has(status)) {
      const set = this.gamesByStatus.get(status);
      set.delete(gameId);
      if (set.size === 0) {
        this.gamesByStatus.delete(status);
      }
    }

    // Maintain available games cache
    if (status === 'waiting') {
      this.availableGamesCache.delete(gameId);
    }
  }

  /**
   * Helper to update game status in index
   * @private
   */
  _updateStatusIndex(gameId, oldStatus, newStatus) {
    if (oldStatus !== newStatus) {
      this._removeFromStatusIndex(oldStatus, gameId);
      this._addToStatusIndex(newStatus, gameId);
    }
  }
}
module.exports = GameManager;