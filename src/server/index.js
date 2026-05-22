const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const GameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const gameManager = new GameManager();

// Session middleware for Socket.IO
io.use((socket, next) => {
  const { token } = socket.handshake.auth;
  // Use existing token or generate a new one
  socket.sessionToken = token || require('crypto').randomUUID();
  next();
});

// Serve static files with cache headers
app.use(express.static(path.join(__dirname, '../../public'), {
  setHeaders: (res, path) => {
    // Set cache headers for different file types
    if (path.endsWith('.html')) {
      // Don't cache HTML files
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (path.endsWith('.css') || path.endsWith('.js')) {
      // Cache CSS and JS files but allow revalidation
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../../package.json').version,
    memory: process.memoryUsage(),
    activeGames: gameManager.getActiveGameCount ? gameManager.getActiveGameCount() : 0,
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json(health);
});

// Readiness check endpoint  
app.get('/ready', (req, res) => {
  // Add any readiness checks here (database connections, etc.)
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json({ status: 'ready' });
});

app.get('/', (req, res) => {
  // Set cache headers for the main HTML file
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Simple per-socket rate limiter: max `limit` events per `windowMs`
function createRateLimiter(limit, windowMs) {
  return function checkRate(socket, eventName) {
    if (!socket._rateLimits) socket._rateLimits = {};
    const now = Date.now();
    const key = eventName;
    if (!socket._rateLimits[key]) socket._rateLimits[key] = [];
    socket._rateLimits[key] = socket._rateLimits[key].filter(t => now - t < windowMs);
    if (socket._rateLimits[key].length >= limit) return false;
    socket._rateLimits[key].push(now);
    return true;
  };
}

const moveRateLimit = createRateLimiter(30, 10000);    // 30 moves per 10s
const chatRateLimit = createRateLimiter(10, 5000);     // 10 messages per 5s
const actionRateLimit = createRateLimiter(5, 5000);    // 5 actions per 5s

io.on('connection', (socket) => {
  console.log('User connected:', socket.sessionToken);

  // Handle player reconnection and connection counting
  gameManager.addConnection(socket.sessionToken);

  // Send the session token back to the client for persistence
  socket.emit('session-token', { token: socket.sessionToken });

  socket.on('host-game', () => {
    if (!actionRateLimit(socket, 'host-game')) return;
    const gameId = gameManager.createGame(socket.sessionToken);
    if (!gameId) {
      socket.emit('host-error', { message: 'Game limit reached. Please finish existing games.' });
      return;
    }
    socket.join(gameId);
    socket.emit('game-created', { gameId });
  });

  socket.on('join-game', (data) => {
    if (!data || typeof data !== 'object') return;
    if (!actionRateLimit(socket, 'join-game')) return;
    const gameId = typeof data.gameId === 'string' ? data.gameId.toUpperCase() : null;
    if (!gameId) return;
    const result = gameManager.joinGame(gameId, socket.sessionToken);

    if (result.success) {
      socket.join(gameId);
      socket.emit('game-joined', { gameId, color: result.color });
      socket.to(gameId).emit('opponent-joined', { color: result.opponentColor });

      io.to(gameId).emit('game-start', {
        gameState: gameManager.getGameState(gameId)
      });
    } else {
      socket.emit('join-error', { message: result.message });
    }
  });

  socket.on('make-move', (data) => {
    if (!data || typeof data !== 'object') return;
    if (!moveRateLimit(socket, 'make-move')) return;
    const gameId = typeof data.gameId === 'string' ? data.gameId.toUpperCase() : null;
    const { move } = data;
    if (!gameId || !move) return;
    const result = gameManager.makeMove(gameId, socket.sessionToken, move);

    if (result.success) {
      io.to(gameId).emit('move-made', {
        move,
        gameState: result.gameState,
        nextTurn: result.nextTurn
      });

      if (result.gameState.status !== 'active' && result.gameState.status !== 'check') {
        io.to(gameId).emit('game-end', {
          status: result.gameState.status,
          winner: result.gameState.winner
        });

        // Clean up chat when game ends
        setTimeout(() => {
          gameManager.cleanupGameChat(gameId);
        }, 30000); // Clean up after 30 seconds
      }
    } else {
      socket.emit('move-error', {
        message: result.message,
        errorCode: result.errorCode
      });
    }
  });

  socket.on('resign', (data) => {
    if (!data || typeof data !== 'object') return;
    if (!actionRateLimit(socket, 'resign')) return;
    const gameId = typeof data.gameId === 'string' ? data.gameId.toUpperCase() : null;
    if (!gameId) return;
    const result = gameManager.resignGame(gameId, socket.sessionToken);

    if (result.success) {
      io.to(gameId).emit('game-end', {
        status: 'resigned',
        winner: result.winner
      });

      // Clean up chat when game ends
      setTimeout(() => {
        gameManager.cleanupGameChat(gameId);
      }, 30000); // Clean up after 30 seconds
    }
  });

  socket.on('chat-message', (data) => {
    if (!data || typeof data !== 'object') return;
    if (!chatRateLimit(socket, 'chat-message')) return;
    const gameId = typeof data.gameId === 'string' ? data.gameId.toUpperCase() : null;
    const { message } = data;

    if (!gameId || !message || typeof message !== 'string') {
      return;
    }

    // Add message using GameManager
    const result = gameManager.addChatMessage(gameId, socket.sessionToken, message);

    if (result.success) {
      // Broadcast to the other player (not back to sender)
      socket.to(gameId).emit('chat-message', {
        message: result.chatMessage.message,
        sender: result.chatMessage.sender,
        isOwn: false,
        timestamp: result.chatMessage.timestamp
      });
    }
  });

  socket.on('get-chat-history', (data) => {
    if (!data || typeof data !== 'object') return;
    const gameId = typeof data.gameId === 'string' ? data.gameId.toUpperCase() : null;

    if (!gameId) {
      return;
    }
    
    const result = gameManager.getChatMessages(gameId, socket.sessionToken);
    
    if (result.success) {
      socket.emit('chat-history', {
        gameId: gameId,
        messages: result.messages
      });
    }
  });

  socket.on('validate-session', (data) => {
    if (!data || typeof data !== 'object') {
      socket.emit('session-validation', { valid: false });
      return;
    }
    const gameId = typeof data.gameId === 'string' ? data.gameId.toUpperCase() : null;

    if (!gameId) {
      socket.emit('session-validation', { valid: false });
      return;
    }

    const game = gameManager.games.get(gameId);
    const isValid = !!(game &&
                   (game.status === 'active' || game.status === 'waiting') &&
                   (game.host === socket.sessionToken || game.guest === socket.sessionToken));

    socket.emit('session-validation', {
      valid: isValid,
      gameId: gameId,
      gameStatus: game ? game.status : null
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.sessionToken);
    gameManager.removeConnection(socket.sessionToken);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`WebChess server running on ${HOST}:${PORT}`);
  });
}

module.exports = { app, server, io, gameManager };