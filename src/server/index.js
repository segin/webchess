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
    }
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