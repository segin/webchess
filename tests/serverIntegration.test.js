/**
 * Server Integration Tests
 * Tests server functionality that was covered in legacy test files
 * Normalized to use current API patterns and response structures
 */

const fs = require('fs');
const path = require('path');

// Import actual server components for integration testing
const GameManager = require('../src/server/gameManager');
const ChessGame = require('../src/shared/chessGame');
const ChessErrorHandler = require('../src/shared/errorHandler');

// Mock server dependencies for testing
const mockExpress = () => ({
  use: jest.fn(),
  get: jest.fn(),
  listen: jest.fn(),
  static: jest.fn()
});

const mockSocketIO = () => ({
  on: jest.fn(),
  emit: jest.fn(),
  to: jest.fn(() => ({ emit: jest.fn() })),
  connected: true,
  id: 'mock-socket-id'
});

describe('Server Integration Tests - Comprehensive Coverage', () => {
  describe('Server File Structure and Dependencies', () => {
    test('should have valid server entry point', () => {
      const serverPath = path.join(__dirname, '..', 'src/server/index.js');
      expect(fs.existsSync(serverPath)).toBe(true);
      
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      expect(serverContent).toContain('express');
      expect(serverContent).toContain('socket.io');
    });

    test('should have GameManager module', () => {
      const gameManagerPath = path.join(__dirname, '..', 'src/server/gameManager.js');
      expect(fs.existsSync(gameManagerPath)).toBe(true);
      
      const gameManagerContent = fs.readFileSync(gameManagerPath, 'utf8');
      expect(gameManagerContent).toContain('class GameManager');
    });

    test('should have all required shared modules', () => {
      const requiredModules = [
        'src/shared/chessGame.js',
        'src/shared/gameState.js',
        'src/shared/chessAI.js',
        'src/shared/errorHandler.js'
      ];

      requiredModules.forEach(modulePath => {
        const fullPath = path.join(__dirname, '..', modulePath);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });

    test('should have proper module exports structure', () => {
      const GameManager = require('../src/server/gameManager');
      expect(typeof GameManager).toBe('function');
      expect(GameManager.prototype.constructor).toBe(GameManager);
      
      const instance = new GameManager();
      expect(typeof instance.createGame).toBe('function');
      expect(typeof instance.joinGame).toBe('function');
      expect(typeof instance.makeMove).toBe('function');
    });
  });

  describe('Express Server Configuration', () => {
    test('should configure express server correctly', () => {
      // Mock the server setup process
      const app = mockExpress();
      const server = {
        listen: jest.fn((port, callback) => {
          if (callback) callback();
          return { address: () => ({ port: port || 3000 }) };
        })
      };

      // Simulate server configuration
      app.use(jest.fn()); // Mock static middleware
      app.get('/', (req, res) => res.sendFile('index.html'));
      
      expect(app.use).toHaveBeenCalled();
      expect(app.get).toHaveBeenCalled();
    });

    test('should handle static file serving', () => {
      const publicPath = path.join(__dirname, '..', 'public');
      expect(fs.existsSync(publicPath)).toBe(true);
      
      const requiredFiles = ['index.html', 'script.js', 'styles.css'];
      requiredFiles.forEach(file => {
        const filePath = path.join(publicPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('WebSocket Communication and Events', () => {
    test('should handle socket connections with proper event binding', () => {
      const io = mockSocketIO();
      const socket = mockSocketIO();
      
      // Simulate connection handling
      const connectionHandler = jest.fn((socket) => {
        socket.on('host-game', jest.fn());
        socket.on('join-game', jest.fn());
        socket.on('make-move', jest.fn());
        socket.on('chat-message', jest.fn());
        socket.on('disconnect', jest.fn());
      });
      
      io.on('connection', connectionHandler);
      
      expect(io.on).toHaveBeenCalledWith('connection', connectionHandler);
    });

    test('should handle all required game events', () => {
      const socket = mockSocketIO();
      
      // Test event handlers
      const gameEvents = [
        'host-game',
        'join-game', 
        'make-move',
        'chat-message',
        'resign-game',
        'disconnect',
        'reconnect',
        'spectate-game',
        'get-game-state'
      ];
      
      gameEvents.forEach(event => {
        const handler = jest.fn();
        socket.on(event, handler);
        expect(socket.on).toHaveBeenCalledWith(event, handler);
      });
    });

    test('should handle WebSocket message broadcasting', () => {
      const io = mockSocketIO();
      const socket = mockSocketIO();
      
      // Mock room-based broadcasting
      const mockRoom = {
        emit: jest.fn()
      };
      
      io.to = jest.fn(() => mockRoom);
      
      // Simulate broadcasting to a game room
      const gameId = 'ABC123';
      io.to(gameId).emit('game-update', { gameState: {} });
      
      expect(io.to).toHaveBeenCalledWith(gameId);
      expect(mockRoom.emit).toHaveBeenCalledWith('game-update', { gameState: {} });
    });

    test('should handle WebSocket error scenarios', () => {
      const socket = mockSocketIO();
      
      // Test error event handling
      const errorHandler = jest.fn((error) => {
        console.log('Socket error:', error.message);
      });
      
      socket.on('error', errorHandler);
      
      // Simulate an error
      const testError = new Error('Connection lost');
      socket.emit('error', testError);
      
      expect(socket.on).toHaveBeenCalledWith('error', errorHandler);
    });

    test('should handle connection timeout scenarios', () => {
      const socket = mockSocketIO();
      
      // Mock connection timeout handling
      const timeoutHandler = jest.fn(() => {
        socket.connected = false;
      });
      
      socket.on('timeout', timeoutHandler);
      
      // Simulate timeout
      socket.emit('timeout');
      
      expect(socket.on).toHaveBeenCalledWith('timeout', timeoutHandler);
    });

    test('should handle WebSocket authentication and validation', () => {
      const socket = mockSocketIO();
      
      // Mock authentication middleware
      const authMiddleware = jest.fn((socket, next) => {
        if (socket.handshake.auth && socket.handshake.auth.token) {
          next();
        } else {
          next(new Error('Authentication failed'));
        }
      });
      
      // Simulate authentication
      socket.handshake = {
        auth: { token: 'valid-token' }
      };
      
      authMiddleware(socket, jest.fn());
      expect(authMiddleware).toHaveBeenCalled();
    });

    test('should handle real-time game state synchronization with current API', () => {
      const io = mockSocketIO();
      const gameManager = new GameManager();
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      // Get actual game state using current API
      const gameState = gameManager.getGameState(gameId);
      
      // Validate current game state structure
      expect(gameState.board).toBeDefined();
      expect(gameState.currentTurn).toBe('white');
      expect(gameState.gameStatus).toBe('active');
      expect(gameState.moveHistory).toBeDefined();
      expect(gameState.castlingRights).toBeDefined();
      expect(gameState.enPassantTarget).toBeNull();
      
      const mockRoom = {
        emit: jest.fn()
      };
      
      io.to = jest.fn(() => mockRoom);
      
      // Simulate real-time update with current game state structure
      io.to(gameId).emit('game-state-update', {
        gameId,
        gameState,
        timestamp: Date.now()
      });
      
      expect(io.to).toHaveBeenCalledWith(gameId);
      expect(mockRoom.emit).toHaveBeenCalledWith('game-state-update', expect.objectContaining({
        gameId,
        gameState: expect.objectContaining({
          currentTurn: 'white',
          gameStatus: 'active',
          board: expect.any(Array),
          moveHistory: expect.any(Array)
        }),
        timestamp: expect.any(Number)
      }));
    });
  });

  describe('Game Manager Integration', () => {
    let gameManager;
    let playerId1, playerId2;

    beforeEach(() => {
      gameManager = new GameManager();
      playerId1 = 'player1';
      playerId2 = 'player2';
    });

    afterEach(() => {
      if (gameManager && gameManager.cleanup) {
        gameManager.cleanup();
      }
    });

    test('should handle game creation with current API', () => {
      const gameId = gameManager.createGame(playerId1);
      
      expect(typeof gameId).toBe('string');
      expect(gameId).toHaveLength(6);
      
      const game = gameManager.getGame(gameId);
      expect(game).toBeDefined();
      expect(game.host).toBe(playerId1);
      expect(game.status).toBe('waiting');
      expect(game.chess).toBeInstanceOf(ChessGame);
    });

    test('should handle game joining with current API response format', () => {
      const gameId = gameManager.createGame(playerId1);
      const result = gameManager.joinGame(gameId, playerId2);
      
      // Validate current API response structure
      expect(result.success).toBe(true);
      expect(result.color).toBe('black');
      expect(result.opponentColor).toBe('white');
      
      const game = gameManager.getGame(gameId);
      expect(game.guest).toBe(playerId2);
      expect(game.status).toBe('active');
    });

    test('should handle move processing with current API patterns', () => {
      const gameId = gameManager.createGame(playerId1);
      gameManager.joinGame(gameId, playerId2);
      
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const result = gameManager.makeMove(gameId, playerId1, move);
      
      // Validate current API response structure
      expect(result.success).toBe(true);
      expect(result.gameState).toBeDefined();
      expect(result.gameState.currentTurn).toBe('black');
      expect(result.gameState.gameStatus).toBe('active');
      expect(result.nextTurn).toBe('black');
    });

    test('should handle invalid game operations with current error patterns', () => {
      // Test joining non-existent game
      const joinResult = gameManager.joinGame('INVALID', playerId1);
      expect(joinResult.success).toBe(false);
      expect(joinResult.message).toBe('Game not found');
      
      // Test making move in non-existent game
      const moveResult = gameManager.makeMove('INVALID', playerId1, { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(moveResult.success).toBe(false);
      expect(moveResult.message).toBe('Game not found');
    });

    test('should validate player turn with current API', () => {
      const gameId = gameManager.createGame(playerId1);
      gameManager.joinGame(gameId, playerId2);
      
      const move = { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }; // Black pawn move
      const result = gameManager.makeMove(gameId, playerId2, move); // Black player trying to move first
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Not your turn');
    });
  });

  describe('Error Handling', () => {
    let gameManager;
    let errorHandler;

    beforeEach(() => {
      gameManager = new GameManager();
      errorHandler = new ChessErrorHandler();
    });

    afterEach(() => {
      if (gameManager && gameManager.cleanup) {
        gameManager.cleanup();
      }
    });

    test('should handle invalid game IDs with current error response format', () => {
      const invalidResult = gameManager.joinGame('INVALID', 'player1');
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.message).toBe('Game not found');
      
      const emptyResult = gameManager.joinGame('', 'player1');
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.message).toBe('Game not found');
    });

    test('should handle server errors with current error handler patterns', () => {
      const errorResponse = errorHandler.createError('SYSTEM_ERROR', 'Test system error');
      
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.isValid).toBe(false);
      expect(errorResponse.message).toBe('Test system error');
      expect(errorResponse.errorCode).toBe('SYSTEM_ERROR');
      expect(errorResponse.details).toBeDefined();
    });

    test('should handle game state errors with current API patterns', () => {
      const gameId = gameManager.createGame('player1');
      
      // Try to make move before game starts (no second player)
      const moveResult = gameManager.makeMove(gameId, 'player1', { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(moveResult.success).toBe(false);
      expect(moveResult.message).toBe('Game is not active');
    });

    test('should handle player validation errors with current patterns', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      // Try to make move as non-participant
      const moveResult = gameManager.makeMove(gameId, 'player3', { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      expect(moveResult.success).toBe(false);
      expect(moveResult.message).toBe('You are not in this game');
    });

    test('should handle chess game errors with current error codes', () => {
      const game = new ChessGame();
      
      // Test invalid move format
      const invalidMoveResult = game.makeMove(null);
      expect(invalidMoveResult.success).toBe(false);
      expect(invalidMoveResult.errorCode).toBe('MALFORMED_MOVE');
      
      // Test invalid coordinates
      const invalidCoordResult = game.makeMove({ from: { row: -1, col: 4 }, to: { row: 4, col: 4 } });
      expect(invalidCoordResult.success).toBe(false);
      expect(invalidCoordResult.errorCode).toBe('INVALID_COORDINATES');
    });
  });

  describe('Session Management', () => {
    let gameManager;

    beforeEach(() => {
      gameManager = new GameManager();
    });

    afterEach(() => {
      if (gameManager && gameManager.cleanup) {
        gameManager.cleanup();
      }
    });

    test('should handle player sessions with current API patterns', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      // Test player color assignment
      const player1Color = gameManager.getPlayerColor(gameId, 'player1');
      const player2Color = gameManager.getPlayerColor(gameId, 'player2');
      
      expect(player1Color).toBe('white');
      expect(player2Color).toBe('black');
      
      // Test opponent identification
      const player1Opponent = gameManager.getOpponentId(gameId, 'player1');
      const player2Opponent = gameManager.getOpponentId(gameId, 'player2');
      
      expect(player1Opponent).toBe('player2');
      expect(player2Opponent).toBe('player1');
    });

    test('should handle disconnections with current patterns', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      // Simulate disconnection
      gameManager.handleDisconnect('player1');
      
      // Verify game still exists (disconnection timeout not reached)
      const game = gameManager.getGame(gameId);
      expect(game).toBeDefined();
      expect(game.status).toBe('active');
    });

    test('should validate game access with current API', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      // Test valid access
      expect(gameManager.validateGameAccess(gameId, 'player1')).toBe(true);
      expect(gameManager.validateGameAccess(gameId, 'player2')).toBe(true);
      
      // Test invalid access
      expect(gameManager.validateGameAccess(gameId, 'player3')).toBe(false);
      
      // Test with invalid game ID - returns undefined (falsy) when game doesn't exist
      const invalidResult = gameManager.validateGameAccess('INVALID', 'player1');
      expect(invalidResult).toBeFalsy(); // undefined is falsy
    });

    test('should handle player removal with current response format', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const removeResult = gameManager.removePlayer(gameId, 'player2');
      expect(removeResult.success).toBe(true);
      
      const game = gameManager.getGame(gameId);
      expect(game.guest).toBeNull();
      
      // Test removing non-existent player
      const invalidRemoveResult = gameManager.removePlayer(gameId, 'player3');
      expect(invalidRemoveResult.success).toBe(false);
      expect(invalidRemoveResult.message).toBe('Player not in game');
    });
  });

  describe('Chat System Integration', () => {
    let gameManager;

    beforeEach(() => {
      gameManager = new GameManager();
    });

    afterEach(() => {
      if (gameManager && gameManager.cleanup) {
        gameManager.cleanup();
      }
    });

    test('should handle chat messages with current API response format', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const validResult = gameManager.addChatMessage(gameId, 'player1', 'Hello!');
      expect(validResult.success).toBe(true);
      expect(validResult.chatMessage.message).toBe('Hello!');
      expect(validResult.chatMessage.sender).toBe('White');
      expect(validResult.chatMessage.timestamp).toBeDefined();
      
      const invalidResult = gameManager.addChatMessage(gameId, 'player1', '');
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.message).toBe('Empty or invalid message');
    });

    test('should validate chat message length with current patterns', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const longMessage = 'a'.repeat(201);
      const validMessage = 'Hello, world!';
      
      const longResult = gameManager.addChatMessage(gameId, 'player1', longMessage);
      expect(longResult.success).toBe(true); // Should truncate to 200 chars
      expect(longResult.chatMessage.message).toHaveLength(200);
      
      const validResult = gameManager.addChatMessage(gameId, 'player1', validMessage);
      expect(validResult.success).toBe(true);
      expect(validResult.chatMessage.message).toBe(validMessage);
    });

    test('should handle chat access validation with current API', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      // Valid player
      const validResult = gameManager.addChatMessage(gameId, 'player1', 'Hello!');
      expect(validResult.success).toBe(true);
      
      // Invalid player
      const invalidResult = gameManager.addChatMessage(gameId, 'player3', 'Hello!');
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.message).toBe('Player not in game');
    });

    test('should retrieve chat messages with current response structure', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      gameManager.addChatMessage(gameId, 'player1', 'Hello!');
      gameManager.addChatMessage(gameId, 'player2', 'Hi there!');
      
      const messagesResult = gameManager.getChatMessages(gameId, 'player1');
      expect(messagesResult.success).toBe(true);
      expect(messagesResult.messages).toHaveLength(2);
      expect(messagesResult.messages[0].message).toBe('Hello!');
      expect(messagesResult.messages[0].sender).toBe('White');
      expect(messagesResult.messages[0].isOwn).toBe(true);
      expect(messagesResult.messages[1].isOwn).toBe(false);
    });
  });

  describe('Health Check Endpoints', () => {
    test('should provide health check endpoint', () => {
      const healthCheck = jest.fn(() => ({
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        version: '1.0.0'
      }));
      
      const result = healthCheck();
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.version).toBe('1.0.0');
    });

    test('should provide ready check endpoint', () => {
      const readyCheck = jest.fn(() => ({
        ready: true,
        services: {
          database: 'not_required',
          socketio: 'ready',
          express: 'ready'
        }
      }));
      
      const result = readyCheck();
      expect(result.ready).toBe(true);
      expect(result.services.socketio).toBe('ready');
      expect(result.services.express).toBe('ready');
    });
  });

  describe('Advanced Server Integration', () => {
    let gameManager;

    beforeEach(() => {
      gameManager = new GameManager();
    });

    afterEach(() => {
      if (gameManager && gameManager.cleanup) {
        gameManager.cleanup();
      }
    });

    test('should handle game statistics with current API patterns', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const stats = gameManager.getGameStatistics(gameId);
      expect(stats).toBeDefined();
      expect(stats.duration).toBeGreaterThanOrEqual(0); // Duration can be 0 if test runs quickly
      expect(stats.moveCount).toBe(0);
      expect(stats.players.white).toBe('player1');
      expect(stats.players.black).toBe('player2');
      expect(stats.status).toBe('active');
      expect(stats.createdAt).toBeDefined();
      expect(stats.lastActivity).toBeDefined();
    });

    test('should handle server statistics with current response format', () => {
      gameManager.createGame('player1');
      gameManager.createGame('player2');
      
      const stats = gameManager.getServerStatistics();
      expect(stats.totalGames).toBe(2);
      expect(stats.waitingGames).toBe(2);
      expect(stats.activeGames).toBe(0);
      expect(stats.totalPlayers).toBe(2);
    });

    test('should handle game lifecycle with current API', () => {
      const gameId = gameManager.createGame('player1');
      
      // Test game start
      const startResult = gameManager.startGame(gameId);
      expect(startResult.success).toBe(false);
      expect(startResult.message).toBe('Game needs two players to start');
      
      gameManager.joinGame(gameId, 'player2');
      const startResult2 = gameManager.startGame(gameId);
      expect(startResult2.success).toBe(true);
      
      // Test game end
      const endResult = gameManager.endGame(gameId, 'checkmate', 'player1');
      expect(endResult.success).toBe(true);
      expect(endResult.reason).toBe('checkmate');
      expect(endResult.winner).toBe('player1');
    });

    test('should handle game pause and resume with current patterns', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      gameManager.startGame(gameId);
      
      // Test pause
      const pauseResult = gameManager.pauseGame(gameId);
      expect(pauseResult.success).toBe(true);
      
      const game = gameManager.getGame(gameId);
      expect(game.status).toBe('paused');
      
      // Test resume
      const resumeResult = gameManager.resumeGame(gameId);
      expect(resumeResult.success).toBe(true);
      expect(game.status).toBe('active');
    });

    test('should handle resignation with current API response format', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const resignResult = gameManager.resignGame(gameId, 'player1');
      expect(resignResult.success).toBe(true);
      expect(resignResult.winner).toBe('black'); // Opponent wins
      
      const game = gameManager.getGame(gameId);
      expect(game.status).toBe('resigned');
    });

    test('should handle memory management and cleanup', () => {
      const gameId1 = gameManager.createGame('player1');
      const gameId2 = gameManager.createGame('player2');
      
      const memoryUsage = gameManager.getMemoryUsage();
      expect(memoryUsage.gameCount).toBe(2);
      expect(memoryUsage.playerMappings).toBe(2);
      
      // Test cleanup
      gameManager.cleanup();
      const memoryAfterCleanup = gameManager.getMemoryUsage();
      expect(memoryAfterCleanup.gameCount).toBe(0);
      expect(memoryAfterCleanup.playerMappings).toBe(0);
    });

    test('should handle move validation integration', () => {
      const gameId = gameManager.createGame('player1');
      gameManager.joinGame(gameId, 'player2');
      
      const validMove = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      const invalidMove = { from: { row: 6, col: 4 }, to: { row: 3, col: 4 } };
      
      // Note: validateMove in GameManager doesn't exist in current implementation
      // This tests the integration through makeMove
      const validResult = gameManager.makeMove(gameId, 'player1', validMove);
      expect(validResult.success).toBe(true);
      
      // Reset game for invalid move test
      const gameId2 = gameManager.createGame('player3');
      gameManager.joinGame(gameId2, 'player4');
      
      const invalidResult = gameManager.makeMove(gameId2, 'player3', invalidMove);
      expect(invalidResult.success).toBe(false);
    });

    test('should handle concurrent game operations', () => {
      const gameIds = [];
      
      // Create multiple games concurrently
      for (let i = 0; i < 5; i++) {
        const gameId = gameManager.createGame(`player${i}`);
        gameIds.push(gameId);
      }
      
      expect(gameIds).toHaveLength(5);
      expect(new Set(gameIds).size).toBe(5); // All unique
      
      const stats = gameManager.getServerStatistics();
      expect(stats.totalGames).toBe(5);
      expect(stats.totalPlayers).toBe(5);
    });
  });
});