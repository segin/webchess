const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const GameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const gameManager = new GameManager();

app.use(express.static(path.join(__dirname, '../../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('host-game', () => {
    const gameId = gameManager.createGame(socket.id);
    socket.join(gameId);
    socket.emit('game-created', { gameId });
  });

  socket.on('join-game', (data) => {
    const { gameId } = data;
    const result = gameManager.joinGame(gameId, socket.id);
    
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
    const { gameId, move } = data;
    const result = gameManager.makeMove(gameId, socket.id, move);
    
    if (result.success) {
      io.to(gameId).emit('move-made', {
        move,
        gameState: result.gameState,
        nextTurn: result.nextTurn
      });
      
      if (result.gameState.status !== 'active') {
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
      socket.emit('move-error', { message: result.message });
    }
  });

  socket.on('resign', (data) => {
    const { gameId } = data;
    const result = gameManager.resignGame(gameId, socket.id);
    
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
    const { gameId, message } = data;
    
    // Basic validation
    if (!gameId || !message || typeof message !== 'string') {
      return;
    }
    
    // Add message using GameManager
    const result = gameManager.addChatMessage(gameId, socket.id, message);
    
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
    const { gameId } = data;
    
    if (!gameId) {
      return;
    }
    
    const result = gameManager.getChatMessages(gameId, socket.id);
    
    if (result.success) {
      socket.emit('chat-history', {
        gameId: gameId,
        messages: result.messages
      });
    }
  });

  socket.on('validate-session', (data) => {
    const { gameId } = data;
    
    if (!gameId) {
      socket.emit('session-validation', { valid: false });
      return;
    }
    
    const game = gameManager.games.get(gameId);
    const isValid = game && 
                   game.status === 'active' && 
                   (game.host === socket.id || game.guest === socket.id);
    
    socket.emit('session-validation', { 
      valid: isValid,
      gameId: gameId,
      gameStatus: game ? game.status : null
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameManager.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, HOST, () => {
  console.log(`WebChess server running on ${HOST}:${PORT}`);
});