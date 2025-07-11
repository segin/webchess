const { v4: uuidv4 } = require('uuid');
const ChessGame = require('../shared/chessGame');

class GameManager {
  constructor() {
    this.games = new Map();
    this.playerToGame = new Map();
    this.disconnectedPlayers = new Map();
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
    this.playerToGame.set(playerId, gameId);
    
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

    game.guest = playerId;
    game.status = 'active';
    game.lastActivity = Date.now();
    
    this.playerToGame.set(playerId, gameId);

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

    game.status = 'resigned';
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
        
        setTimeout(() => {
          this.checkDisconnectedPlayer(playerId);
        }, 15 * 60 * 1000); // 15 minutes
      }
    }
  }

  checkDisconnectedPlayer(playerId) {
    const disconnectedInfo = this.disconnectedPlayers.get(playerId);
    if (disconnectedInfo) {
      this.disconnectedPlayers.delete(playerId);
      
      const game = this.games.get(disconnectedInfo.gameId);
      if (game && game.status === 'active') {
        game.status = 'abandoned';
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
      id: Date.now() + Math.random(), // Simple unique ID
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
}

module.exports = GameManager;