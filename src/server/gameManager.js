// Use crypto.randomUUID() for Node.js 14.17+ instead of uuid package
const { randomUUID } = require('crypto');
const ChessGame = require('../shared/chessGame');

class GameManager {
  constructor() {
    this.games = new Map();
    this.gamesByStatus = new Map();
    this.playerToGame = new Map();
    this.playerGames = new Map(); // Index: playerId -> Set<gameId>
    this.disconnectedPlayers = new Map();
    this.disconnectTimeouts = new Map(); // Track timeouts for cleanup
  }

  _addGameToPlayer(playerId, gameId) {
    if (!this.playerGames.has(playerId)) {
      this.playerGames.set(playerId, new Set());
    }
    this.playerGames.get(playerId).add(gameId);
  }

  _removeGameFromPlayer(playerId, gameId) {
    if (this.playerGames.has(playerId)) {
      const games = this.playerGames.get(playerId);
      games.delete(gameId);
      if (games.size === 0) {
        this.playerGames.delete(playerId);
      }
    }
  }

  generateGameId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  createGame(playerId) {
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
    this._addToStatusIndex('waiting', gameId);
    this.playerToGame.set(playerId, gameId);
    this._addGameToPlayer(playerId, gameId);
    
    return gameId;
  }

  joinGame(gameId, playerId) {
    const game = this.games.get(gameId.toUpperCase());
    
    if (!game) {
      return { success: false, message: 'Game not found' };
    }

    if (game.guest) {
      return { success: false, message: 'Game is full' };
    }

    if (game.host === playerId) {
      return { success: false, message: 'Cannot join your own game' };
    }

    const oldStatus = game.status;
    game.guest = playerId;
    game.status = 'active';
    this._updateStatusIndex(game.id, oldStatus, 'active');
    game.lastActivity = Date.now();
    
    this.playerToGame.set(playerId, gameId);
    this._addGameToPlayer(playerId, gameId);

    return {
      success: true,
      color: 'black',
      opponentColor: 'white'
    };
  }

  makeMove(gameId, playerId, move) {
    const game = this.games.get(gameId);
    
    if (!game) {
      return { success: false, message: 'Game not found' };
    }

    if (game.status !== 'active') {
      return { success: false, message: 'Game is not active' };
    }

    const isHost = game.host === playerId;
    const isGuest = game.guest === playerId;
    
    if (!isHost && !isGuest) {
      return { success: false, message: 'You are not in this game' };
    }

    const playerColor = isHost ? 'white' : 'black';
    
    if (game.chess.currentTurn !== playerColor) {
      return { success: false, message: 'Not your turn' };
    }

    const result = game.chess.makeMove(move);
    
    if (!result.success) {
      return { success: false, message: result.message };
    }

    game.lastActivity = Date.now();

    return {
      success: true,
      gameState: game.chess.getGameState(),
      nextTurn: game.chess.currentTurn
    };
  }

  resignGame(gameId, playerId) {
    const game = this.games.get(gameId);
    
    if (!game) {
      return { success: false, message: 'Game not found' };
    }

    const isHost = game.host === playerId;
    const isGuest = game.guest === playerId;
    
    if (!isHost && !isGuest) {
      return { success: false, message: 'You are not in this game' };
    }

    const oldStatus = game.status;
    game.status = 'resigned';
    this._updateStatusIndex(game.id, oldStatus, 'resigned');
    const winner = isHost ? 'black' : 'white';
    
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
    const gameId = this.playerToGame.get(playerId);
    if (gameId) {
      const game = this.games.get(gameId);
      if (game && game.status === 'active') {
        this.disconnectedPlayers.set(playerId, {
          gameId,
          disconnectedAt: Date.now()
        });
        
        const timeoutId = setTimeout(() => {
          this.checkDisconnectedPlayer(playerId);
        }, 15 * 60 * 1000); // 15 minutes
        
        // Store timeout reference for cleanup
        this.disconnectTimeouts.set(playerId, timeoutId);
      }
    }
  }

  checkDisconnectedPlayer(playerId) {
    const disconnectedInfo = this.disconnectedPlayers.get(playerId);
    if (disconnectedInfo) {
      this.disconnectedPlayers.delete(playerId);
      // Clean up timeout reference
      this.disconnectTimeouts.delete(playerId);
      
      const game = this.games.get(disconnectedInfo.gameId);
      if (game && game.status === 'active') {
        const oldStatus = game.status;
        game.status = 'abandoned';
        this._removeFromStatusIndex(oldStatus, game.id);
        // Clean up chat messages
        game.chatMessages = [];
        this.games.delete(disconnectedInfo.gameId);
        this.playerToGame.delete(game.host);
        this.playerToGame.delete(game.guest);
      }
    }
  }

  addChatMessage(gameId, playerId, message) {
    const game = this.games.get(gameId);
    if (!game || (game.host !== playerId && game.guest !== playerId)) {
      return { success: false, message: 'Player not in game' };
    }

    // Sanitize and validate message
    const sanitizedMessage = message.trim().substring(0, 200);
    if (!sanitizedMessage) {
      return { success: false, message: 'Empty message' };
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
    game.lastActivity = Date.now();

    // Limit chat history to 100 messages
    if (game.chatMessages.length > 100) {
      game.chatMessages = game.chatMessages.slice(-100);
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
    if (!game || (game.host !== playerId && game.guest !== playerId)) {
      return { success: false, messages: [] };
    }

    const messages = game.chatMessages.map(msg => ({
      message: msg.message,
      sender: msg.sender,
      isOwn: msg.playerId === playerId,
      timestamp: msg.timestamp
    }));

    return { success: true, messages };
  }

  cleanupGameChat(gameId) {
    const game = this.games.get(gameId);
    if (game) {
      game.chatMessages = [];
    }
  }

  getActiveGameCount() {
    return this.games.size;
  }

  getStats() {
    return {
      activeGames: this.games.size,
      activePlayers: this.playerToGame.size,
      disconnectedPlayers: this.disconnectedPlayers.size,
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
      // Clean up player mappings
      this.playerToGame.delete(game.host);
      this._removeGameFromPlayer(game.host, gameId);

      if (game.guest) {
        this.playerToGame.delete(game.guest);
        this._removeGameFromPlayer(game.guest, gameId);
      }
      
      // Remove from status index
      this._removeFromStatusIndex(game.status, gameId);

      // Remove the game
      this.games.delete(gameId);
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
      return { success: false, message: 'Game not found' };
    }

    if (game.host === playerId) {
      game.host = null;
      this.playerToGame.delete(playerId);
      this._removeGameFromPlayer(playerId, gameId);
      
      // If guest exists, promote to host
      if (game.guest) {
        game.host = game.guest;
        game.guest = null;
      }
    } else if (game.guest === playerId) {
      game.guest = null;
      this.playerToGame.delete(playerId);
      this._removeGameFromPlayer(playerId, gameId);
    } else {
      return { success: false, message: 'Player not in game' };
    }

    // If no players left, remove the game
    if (!game.host && !game.guest) {
      this.removeGame(gameId);
    }

    return { success: true };
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
      return { success: false, message: 'Game not found' };
    }

    if (!this.isGameFull(gameId)) {
      return { success: false, message: 'Game needs two players to start' };
    }

    const oldStatus = game.status;
    game.status = 'active';
    this._updateStatusIndex(gameId, oldStatus, 'active');
    game.lastActivity = Date.now();

    return { success: true };
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
      return { success: false, message: 'Game not found' };
    }

    const oldStatus = game.status;
    game.status = 'finished';
    this._updateStatusIndex(gameId, oldStatus, 'finished');
    game.endReason = reason;
    game.winner = winner;
    game.endTime = Date.now();

    return { success: true, reason, winner };
  }

  /**
   * Pause a game
   * @param {string} gameId - Game ID
   * @returns {Object} Result object
   */
  pauseGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, message: 'Game not found' };
    }

    if (game.status !== 'active') {
      return { success: false, message: 'Game is not active' };
    }

    const oldStatus = game.status;
    game.status = 'paused';
    this._updateStatusIndex(gameId, oldStatus, 'paused');
    game.pausedAt = Date.now();

    return { success: true };
  }

  /**
   * Resume a paused game
   * @param {string} gameId - Game ID
   * @returns {Object} Result object
   */
  resumeGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, message: 'Game not found' };
    }

    if (game.status !== 'paused') {
      return { success: false, message: 'Game is not paused' };
    }

    const oldStatus = game.status;
    game.status = 'active';
    this._updateStatusIndex(gameId, oldStatus, 'active');
    game.resumedAt = Date.now();

    return { success: true };
  }

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

    const result = game.chess.makeMove(move);
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
  undoMove(gameId, playerId) {
    const game = this.games.get(gameId);
    if (!game || !game.chess) {
      return { success: false, message: 'Game not found' };
    }

    // Validate player access
    if (game.host !== playerId && game.guest !== playerId) {
      return { success: false, message: 'You are not in this game' };
    }

    // Only allow undo for active games (or maybe checkmate/stalemate to revert game end)
    // Assuming we can undo even if game ended to resume it
    if (game.status === 'abandoned' || game.status === 'resigned') {
         return { success: false, message: 'Cannot undo in abandoned or resigned game' };
    }

    const result = game.chess.undoMove();

    if (result.success) {
        // Sync game status if it changed from finished back to active
        if (game.status === 'finished' && result.data && result.data.gameStatus !== 'finished') {
             game.status = result.data.gameStatus;
             game.winner = null;
             game.endReason = null;
             game.endTime = null;
        }
        game.lastActivity = Date.now();
    }

    return result;
  }

  /**
   * Find games by player
   * @param {string} playerId - Player ID
   * @returns {Array} Array of game IDs
   */
  findGamesByPlayer(playerId) {
    if (!this.playerGames.has(playerId)) {
      return [];
    }
    return Array.from(this.playerGames.get(playerId));
  }

  /**
   * Get games by status
   * @param {string} status - Game status
   * @returns {Array} Array of game IDs
   */
  getGamesByStatus(status) {
    if (this.gamesByStatus.has(status)) {
      return Array.from(this.gamesByStatus.get(status));
    }
    return [];
  }

  /**
   * Get available games (waiting for players)
   * @returns {Array} Array of available game objects
   */
  getAvailableGames() {
    const availableGames = [];
    for (const [gameId, game] of this.games) {
      if (game.status === 'waiting' && !game.guest) {
        availableGames.push({
          gameId,
          host: game.host,
          createdAt: game.createdAt
        });
      }
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

    const playerGameIds = this.playerGames.get(playerId);

    if (playerGameIds) {
      for (const gameId of playerGameIds) {
        const game = this.games.get(gameId);
        if (!game) continue;

        gamesPlayed++;
        
        if (game.status === 'finished') {
          if (game.winner === playerId) {
            wins++;
          } else if (game.winner && game.winner !== playerId) {
            losses++;
          } else {
            draws++;
          }
        }
      }
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
    const totalGames = this.games.size;
    const activeGames = this.getGamesByStatus('active').length;
    const waitingGames = this.getGamesByStatus('waiting').length;
    const finishedGames = this.getGamesByStatus('finished').length;
    
    const uniquePlayers = new Set();
    for (const game of this.games.values()) {
      if (game.host) uniquePlayers.add(game.host);
      if (game.guest) uniquePlayers.add(game.guest);
    }

    return {
      totalGames,
      activeGames,
      waitingGames,
      finishedGames,
      totalPlayers: uniquePlayers.size,
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

    for (const [gameId, game] of this.games) {
      if (now - game.lastActivity > maxAge) {
        this.removeGame(gameId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Clean up all games and data
   */
  cleanup() {
    this.games.clear();
    this.playerToGame.clear();
    this.disconnectedPlayers.clear();
  }

  /**
   * Get memory usage information
   * @returns {Object} Memory usage statistics
   */
  getMemoryUsage() {
    const gameCount = this.games.size;
    const playerMappings = this.playerToGame.size;
    const disconnectedCount = this.disconnectedPlayers.size;
    
    // Rough estimation of memory usage
    const estimatedMemory = (gameCount * 1000) + (playerMappings * 100) + (disconnectedCount * 50);

    return {
      gameCount,
      playerMappings,
      disconnectedCount,
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
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  /**
   * Remove event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  removeEventHandler(event, handler) {
    if (!this.eventHandlers || !this.eventHandlers[event]) return;
    
    const index = this.eventHandlers[event].indexOf(handler);
    if (index > -1) {
      this.eventHandlers[event].splice(index, 1);
    }
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
    if (!this.settings) {
      this.settings = {
        maxGamesPerPlayer: 3,
        gameTimeout: 30 * 60 * 1000, // 30 minutes
        cleanupInterval: 5 * 60 * 1000 // 5 minutes
      };
    }
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current settings
   * @returns {Object} Current settings
   */
  getSettings() {
    if (!this.settings) {
      this.updateSettings({});
    }
    return { ...this.settings };
  }

  /**
   * Reset settings to defaults
   */
  resetSettings() {
    this.settings = {
      maxGamesPerPlayer: 3,
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