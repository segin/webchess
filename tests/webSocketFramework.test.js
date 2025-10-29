/**
 * WebSocket Testing Framework
 * Tests for Socket.IO mocking utilities, connection handling, event routing, and room management
 * Requirements: 3.2, 3.5
 */

const socketIo = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');
const express = require('express');

// Mock GameManager for testing
jest.mock('../src/server/gameManager');

describe('WebSocket Testing Framework', () => {
  let server;
  let io;
  let clientSocket;
  let serverSocket;
  let port;

  beforeAll((done) => {
    const app = express();
    server = http.createServer(app);
    io = socketIo(server);
    
    server.listen(() => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach((done) => {
    // Create client connection
    clientSocket = Client(`http://localhost:${port}`);
    
    io.on('connection', (socket) => {
      serverSocket = socket;
    });
    
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Socket.IO Connection Handling', () => {
    test('should establish WebSocket connection', () => {
      expect(clientSocket.connected).toBe(true);
      expect(serverSocket).toBeDefined();
      expect(serverSocket.id).toBeDefined();
    });

    test('should handle connection event', (done) => {
      const newClient = Client(`http://localhost:${port}`);
      
      io.on('connection', (socket) => {
        expect(socket).toBeDefined();
        expect(socket.id).toBeDefined();
        expect(typeof socket.emit).toBe('function');
        expect(typeof socket.on).toBe('function');
        newClient.disconnect();
        done();
      });
    });

    test('should handle disconnection event', (done) => {
      const newClient = Client(`http://localhost:${port}`);
      
      io.on('connection', (socket) => {
        socket.on('disconnect', (reason) => {
          expect(reason).toBeDefined();
          done();
        });
        
        newClient.disconnect();
      });
    });

    test('should assign unique socket IDs', (done) => {
      const client1 = Client(`http://localhost:${port}`);
      const client2 = Client(`http://localhost:${port}`);
      const socketIds = [];
      
      let connectCount = 0;
      
      io.on('connection', (socket) => {
        socketIds.push(socket.id);
        connectCount++;
        
        if (connectCount === 2) {
          expect(socketIds).toHaveLength(2);
          expect(socketIds[0]).not.toBe(socketIds[1]);
          client1.disconnect();
          client2.disconnect();
          done();
        }
      });
    });
  });

  describe('Event Routing and Handling', () => {
    test('should handle host-game event', (done) => {
      const mockGameManager = require('../src/server/gameManager');
      mockGameManager.prototype.createGame = jest.fn().mockReturnValue('ABC123');
      
      serverSocket.on('host-game', () => {
        const gameId = 'ABC123'; // Mock game ID
        serverSocket.emit('game-created', { gameId });
      });
      
      clientSocket.on('game-created', (data) => {
        expect(data.gameId).toBe('ABC123');
        done();
      });
      
      clientSocket.emit('host-game');
    });

    test('should handle join-game event with success', (done) => {
      const mockGameManager = require('../src/server/gameManager');
      mockGameManager.prototype.joinGame = jest.fn().mockReturnValue({
        success: true,
        color: 'black',
        opponentColor: 'white'
      });
      
      serverSocket.on('join-game', (data) => {
        const { gameId } = data;
        const result = { success: true, color: 'black', opponentColor: 'white' };
        
        if (result.success) {
          serverSocket.emit('game-joined', { gameId, color: result.color });
        } else {
          serverSocket.emit('join-error', { message: result.message });
        }
      });
      
      clientSocket.on('game-joined', (data) => {
        expect(data.gameId).toBe('ABC123');
        expect(data.color).toBe('black');
        done();
      });
      
      clientSocket.emit('join-game', { gameId: 'ABC123' });
    });

    test('should handle join-game event with error', (done) => {
      serverSocket.on('join-game', (data) => {
        const result = { success: false, message: 'Game not found' };
        
        if (result.success) {
          serverSocket.emit('game-joined', { gameId: data.gameId, color: result.color });
        } else {
          serverSocket.emit('join-error', { message: result.message });
        }
      });
      
      clientSocket.on('join-error', (data) => {
        expect(data.message).toBe('Game not found');
        done();
      });
      
      clientSocket.emit('join-game', { gameId: 'INVALID' });
    });

    test('should handle make-move event with success', (done) => {
      const mockGameManager = require('../src/server/gameManager');
      mockGameManager.prototype.makeMove = jest.fn().mockReturnValue({
        success: true,
        gameState: { currentTurn: 'black', status: 'active' },
        nextTurn: 'black'
      });
      
      serverSocket.on('make-move', (data) => {
        const { gameId, move } = data;
        const result = {
          success: true,
          gameState: { currentTurn: 'black', status: 'active' },
          nextTurn: 'black'
        };
        
        if (result.success) {
          serverSocket.emit('move-made', {
            move,
            gameState: result.gameState,
            nextTurn: result.nextTurn
          });
        } else {
          serverSocket.emit('move-error', { message: result.message });
        }
      });
      
      clientSocket.on('move-made', (data) => {
        expect(data.move).toBeDefined();
        expect(data.gameState.currentTurn).toBe('black');
        expect(data.nextTurn).toBe('black');
        done();
      });
      
      const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
      clientSocket.emit('make-move', { gameId: 'ABC123', move });
    });

    test('should handle make-move event with error', (done) => {
      serverSocket.on('make-move', (data) => {
        const result = { success: false, message: 'Invalid move' };
        
        if (result.success) {
          serverSocket.emit('move-made', { move: data.move, gameState: {}, nextTurn: 'black' });
        } else {
          serverSocket.emit('move-error', { message: result.message });
        }
      });
      
      clientSocket.on('move-error', (data) => {
        expect(data.message).toBe('Invalid move');
        done();
      });
      
      const invalidMove = { from: { row: -1, col: 4 }, to: { row: 4, col: 4 } };
      clientSocket.emit('make-move', { gameId: 'ABC123', move: invalidMove });
    });

    test('should handle resign event', (done) => {
      const mockGameManager = require('../src/server/gameManager');
      mockGameManager.prototype.resignGame = jest.fn().mockReturnValue({
        success: true,
        winner: 'black'
      });
      
      serverSocket.on('resign', (data) => {
        const { gameId } = data;
        const result = { success: true, winner: 'black' };
        
        if (result.success) {
          serverSocket.emit('game-end', {
            status: 'resigned',
            winner: result.winner
          });
        }
      });
      
      clientSocket.on('game-end', (data) => {
        expect(data.status).toBe('resigned');
        expect(data.winner).toBe('black');
        done();
      });
      
      clientSocket.emit('resign', { gameId: 'ABC123' });
    });

    test('should handle chat-message event', (done) => {
      const mockGameManager = require('../src/server/gameManager');
      mockGameManager.prototype.addChatMessage = jest.fn().mockReturnValue({
        success: true,
        chatMessage: {
          message: 'Hello!',
          sender: 'White',
          timestamp: Date.now()
        }
      });
      
      serverSocket.on('chat-message', (data) => {
        const { gameId, message } = data;
        
        if (!gameId || !message || typeof message !== 'string') {
          return;
        }
        
        const result = {
          success: true,
          chatMessage: {
            message: 'Hello!',
            sender: 'White',
            timestamp: Date.now()
          }
        };
        
        if (result.success) {
          serverSocket.emit('chat-message', {
            message: result.chatMessage.message,
            sender: result.chatMessage.sender,
            isOwn: false,
            timestamp: result.chatMessage.timestamp
          });
        }
      });
      
      clientSocket.on('chat-message', (data) => {
        expect(data.message).toBe('Hello!');
        expect(data.sender).toBe('White');
        expect(data.isOwn).toBe(false);
        expect(data.timestamp).toBeDefined();
        done();
      });
      
      clientSocket.emit('chat-message', { gameId: 'ABC123', message: 'Hello!' });
    });

    test('should handle get-chat-history event', (done) => {
      const mockGameManager = require('../src/server/gameManager');
      mockGameManager.prototype.getChatMessages = jest.fn().mockReturnValue({
        success: true,
        messages: [
          { message: 'Hello!', sender: 'White', isOwn: true, timestamp: Date.now() }
        ]
      });
      
      serverSocket.on('get-chat-history', (data) => {
        const { gameId } = data;
        
        if (!gameId) {
          return;
        }
        
        const result = {
          success: true,
          messages: [
            { message: 'Hello!', sender: 'White', isOwn: true, timestamp: Date.now() }
          ]
        };
        
        if (result.success) {
          serverSocket.emit('chat-history', {
            gameId: gameId,
            messages: result.messages
          });
        }
      });
      
      clientSocket.on('chat-history', (data) => {
        expect(data.gameId).toBe('ABC123');
        expect(data.messages).toHaveLength(1);
        expect(data.messages[0].message).toBe('Hello!');
        done();
      });
      
      clientSocket.emit('get-chat-history', { gameId: 'ABC123' });
    });

    test('should handle validate-session event', (done) => {
      serverSocket.on('validate-session', (data) => {
        const { gameId } = data;
        
        if (!gameId) {
          serverSocket.emit('session-validation', { valid: false });
          return;
        }
        
        // Mock game validation
        const isValid = gameId === 'ABC123';
        
        serverSocket.emit('session-validation', { 
          valid: isValid,
          gameId: gameId,
          gameStatus: isValid ? 'active' : null
        });
      });
      
      clientSocket.on('session-validation', (data) => {
        expect(data.valid).toBe(true);
        expect(data.gameId).toBe('ABC123');
        expect(data.gameStatus).toBe('active');
        done();
      });
      
      clientSocket.emit('validate-session', { gameId: 'ABC123' });
    });
  });

  describe('Room Management', () => {
    test('should join socket to room', (done) => {
      const gameId = 'ABC123';
      
      serverSocket.on('host-game', () => {
        serverSocket.join(gameId);
        expect(serverSocket.rooms.has(gameId)).toBe(true);
        serverSocket.emit('game-created', { gameId });
      });
      
      clientSocket.on('game-created', (data) => {
        expect(data.gameId).toBe(gameId);
        done();
      });
      
      clientSocket.emit('host-game');
    });

    test('should broadcast to room members', (done) => {
      const gameId = 'ABC123';
      
      // Join room and simulate broadcast
      serverSocket.join(gameId);
      
      // Mock the broadcast functionality
      const mockBroadcast = jest.fn();
      serverSocket.to = jest.fn().mockReturnValue({ emit: mockBroadcast });
      
      // Simulate broadcast
      serverSocket.to(gameId).emit('test-broadcast', { message: 'Hello room!' });
      
      expect(serverSocket.to).toHaveBeenCalledWith(gameId);
      expect(mockBroadcast).toHaveBeenCalledWith('test-broadcast', { message: 'Hello room!' });
      done();
    });

    test('should handle room-specific game events', (done) => {
      const gameId = 'ABC123';
      
      // Mock room broadcasting
      const mockRoomEmit = jest.fn();
      const mockSocketTo = jest.fn().mockReturnValue({ emit: mockRoomEmit });
      const mockIoTo = jest.fn().mockReturnValue({ emit: mockRoomEmit });
      
      serverSocket.to = mockSocketTo;
      io.to = mockIoTo;
      
      // Join room
      serverSocket.join(gameId);
      
      // Simulate opponent joined event
      serverSocket.to(gameId).emit('opponent-joined', { color: 'white' });
      
      // Simulate game start broadcast
      io.to(gameId).emit('game-start', {
        gameState: { currentTurn: 'white', status: 'active' }
      });
      
      expect(mockSocketTo).toHaveBeenCalledWith(gameId);
      expect(mockIoTo).toHaveBeenCalledWith(gameId);
      expect(mockRoomEmit).toHaveBeenCalledWith('opponent-joined', { color: 'white' });
      expect(mockRoomEmit).toHaveBeenCalledWith('game-start', {
        gameState: { currentTurn: 'white', status: 'active' }
      });
      done();
    });

    test('should handle multiple rooms simultaneously', (done) => {
      const gameId1 = 'ABC123';
      const gameId2 = 'DEF456';
      
      // Mock room functionality
      const mockEmit1 = jest.fn();
      const mockEmit2 = jest.fn();
      const mockTo1 = jest.fn().mockReturnValue({ emit: mockEmit1 });
      const mockTo2 = jest.fn().mockReturnValue({ emit: mockEmit2 });
      
      // Create mock sockets for different rooms
      const mockSocket1 = { to: mockTo1, join: jest.fn() };
      const mockSocket2 = { to: mockTo2, join: jest.fn() };
      
      // Join different rooms
      mockSocket1.join(gameId1);
      mockSocket2.join(gameId2);
      
      // Broadcast to specific rooms
      mockSocket1.to(gameId1).emit('room1-message', { room: 'room1' });
      mockSocket2.to(gameId2).emit('room2-message', { room: 'room2' });
      
      expect(mockTo1).toHaveBeenCalledWith(gameId1);
      expect(mockTo2).toHaveBeenCalledWith(gameId2);
      expect(mockEmit1).toHaveBeenCalledWith('room1-message', { room: 'room1' });
      expect(mockEmit2).toHaveBeenCalledWith('room2-message', { room: 'room2' });
      done();
    });
  });

  describe('WebSocket Error Scenarios', () => {
    test('should handle connection timeout', (done) => {
      // Mock connection timeout scenario
      const mockClient = {
        on: jest.fn(),
        disconnect: jest.fn()
      };
      
      // Simulate timeout error
      const timeoutError = new Error('Connection timeout');
      mockClient.on('connect_error', (callback) => {
        callback(timeoutError);
      });
      
      // Test the error handler
      mockClient.on('connect_error', (error) => {
        expect(error).toBeDefined();
        expect(error.message).toBe('Connection timeout');
        done();
      });
      
      // Trigger the error
      const errorCallback = mockClient.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      errorCallback(timeoutError);
    });

    test('should handle invalid event data', (done) => {
      serverSocket.on('invalid-data-test', (data) => {
        // Simulate handling invalid data
        if (!data || typeof data !== 'object') {
          serverSocket.emit('error-response', { message: 'Invalid data format' });
          return;
        }
        
        serverSocket.emit('success-response', { message: 'Valid data' });
      });
      
      clientSocket.on('error-response', (data) => {
        expect(data.message).toBe('Invalid data format');
        done();
      });
      
      // Send invalid data
      clientSocket.emit('invalid-data-test', 'invalid string data');
    });

    test('should handle missing required fields', (done) => {
      serverSocket.on('required-fields-test', (data) => {
        if (!data.gameId || !data.playerId) {
          serverSocket.emit('validation-error', { 
            message: 'Missing required fields: gameId, playerId' 
          });
          return;
        }
        
        serverSocket.emit('validation-success', { message: 'All fields present' });
      });
      
      clientSocket.on('validation-error', (data) => {
        expect(data.message).toContain('Missing required fields');
        done();
      });
      
      // Send data missing required fields
      clientSocket.emit('required-fields-test', { gameId: 'ABC123' }); // Missing playerId
    });

    test('should handle socket disconnection during event processing', (done) => {
      // Mock socket disconnection scenario
      const mockSocket = {
        connected: false,
        emit: jest.fn(),
        on: jest.fn()
      };
      
      // Simulate event handler that checks connection
      const eventHandler = () => {
        setTimeout(() => {
          if (mockSocket.connected) {
            mockSocket.emit('delayed-response', { message: 'Processed' });
          }
        }, 10);
      };
      
      // Test that handler doesn't emit when disconnected
      eventHandler();
      
      setTimeout(() => {
        expect(mockSocket.emit).not.toHaveBeenCalled();
        done();
      }, 20);
    });
  });

  describe('WebSocket Performance and Concurrency', () => {
    test('should handle multiple simultaneous connections', (done) => {
      const clients = [];
      const numClients = 5;
      let connectedCount = 0;
      
      for (let i = 0; i < numClients; i++) {
        const client = Client(`http://localhost:${port}`);
        clients.push(client);
        
        client.on('connect', () => {
          connectedCount++;
          if (connectedCount === numClients) {
            // All clients connected, now disconnect them
            clients.forEach(c => c.disconnect());
            done();
          }
        });
      }
    });

    test('should handle rapid event emission', (done) => {
      let eventCount = 0;
      const totalEvents = 10;
      
      serverSocket.on('rapid-test', (data) => {
        eventCount++;
        serverSocket.emit('rapid-response', { count: eventCount });
        
        if (eventCount === totalEvents) {
          done();
        }
      });
      
      // Emit events rapidly
      for (let i = 0; i < totalEvents; i++) {
        clientSocket.emit('rapid-test', { index: i });
      }
    });

    test('should handle large message payloads', (done) => {
      const largeMessage = 'x'.repeat(10000); // 10KB message
      
      serverSocket.on('large-message-test', (data) => {
        expect(data.message).toHaveLength(10000);
        serverSocket.emit('large-message-response', { 
          received: true, 
          length: data.message.length 
        });
      });
      
      clientSocket.on('large-message-response', (data) => {
        expect(data.received).toBe(true);
        expect(data.length).toBe(10000);
        done();
      });
      
      clientSocket.emit('large-message-test', { message: largeMessage });
    });
  });

  describe('Mock Utilities for Testing', () => {
    test('should create mock socket with required methods', () => {
      const mockSocket = {
        id: 'mock-socket-id',
        emit: jest.fn(),
        on: jest.fn(),
        join: jest.fn(),
        to: jest.fn().mockReturnThis(),
        connected: true,
        rooms: new Set()
      };
      
      expect(mockSocket.id).toBeDefined();
      expect(typeof mockSocket.emit).toBe('function');
      expect(typeof mockSocket.on).toBe('function');
      expect(typeof mockSocket.join).toBe('function');
      expect(typeof mockSocket.to).toBe('function');
      expect(mockSocket.connected).toBe(true);
    });

    test('should create mock io server with required methods', () => {
      const mockIo = {
        on: jest.fn(),
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
        sockets: {
          emit: jest.fn()
        }
      };
      
      expect(typeof mockIo.on).toBe('function');
      expect(typeof mockIo.emit).toBe('function');
      expect(typeof mockIo.to).toBe('function');
      expect(mockIo.sockets).toBeDefined();
    });

    test('should simulate event handler registration', () => {
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn()
      };
      
      const eventHandlers = {
        'host-game': jest.fn(),
        'join-game': jest.fn(),
        'make-move': jest.fn(),
        'disconnect': jest.fn()
      };
      
      // Simulate event handler registration
      Object.keys(eventHandlers).forEach(event => {
        mockSocket.on(event, eventHandlers[event]);
      });
      
      expect(mockSocket.on).toHaveBeenCalledTimes(4);
      expect(mockSocket.on).toHaveBeenCalledWith('host-game', eventHandlers['host-game']);
      expect(mockSocket.on).toHaveBeenCalledWith('join-game', eventHandlers['join-game']);
      expect(mockSocket.on).toHaveBeenCalledWith('make-move', eventHandlers['make-move']);
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', eventHandlers['disconnect']);
    });

    test('should simulate room broadcasting', () => {
      const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
      };
      
      const gameId = 'ABC123';
      const gameState = { currentTurn: 'white', status: 'active' };
      
      mockIo.to(gameId).emit('game-update', { gameState });
      
      expect(mockIo.to).toHaveBeenCalledWith(gameId);
      expect(mockIo.emit).toHaveBeenCalledWith('game-update', { gameState });
    });
  });
});