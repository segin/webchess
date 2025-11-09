/**
 * Comprehensive Mocking Utilities
 * Standardized mocking patterns for WebSocket, HTTP, and external dependencies
 */

const ResourceManager = require('./ResourceManager');

/**
 * WebSocket Mocking Utilities
 */
class WebSocketMocker {
  constructor() {
    this.activeMocks = new Map();
    this.eventHandlers = new Map();
  }

  /**
   * Create a mock Socket.IO socket
   * @param {Object} options - Socket configuration options
   * @returns {Object} Mock socket object
   */
  createMockSocket(options = {}) {
    const {
      id = `socket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      connected = true,
      rooms = new Set(),
      handshake = { address: '127.0.0.1' }
    } = options;

    const mockSocket = {
      id,
      connected,
      rooms,
      handshake,
      
      // Event handling
      on: jest.fn((event, handler) => {
        if (!this.eventHandlers.has(id)) {
          this.eventHandlers.set(id, new Map());
        }
        this.eventHandlers.get(id).set(event, handler);
      }),
      
      off: jest.fn((event) => {
        if (this.eventHandlers.has(id)) {
          this.eventHandlers.get(id).delete(event);
        }
      }),
      
      emit: jest.fn((event, ...args) => {
        // Track emitted events for testing
        if (!mockSocket._emittedEvents) {
          mockSocket._emittedEvents = [];
        }
        mockSocket._emittedEvents.push({ event, args, timestamp: Date.now() });
      }),
      
      // Room management
      join: jest.fn((room) => {
        mockSocket.rooms.add(room);
        return Promise.resolve();
      }),
      
      leave: jest.fn((room) => {
        mockSocket.rooms.delete(room);
        return Promise.resolve();
      }),
      
      // Connection management
      disconnect: jest.fn((close = false) => {
        mockSocket.connected = false;
        if (close) {
          this.cleanup(id);
        }
      }),
      
      // Utility methods for testing
      _triggerEvent: (event, ...args) => {
        if (this.eventHandlers.has(id) && this.eventHandlers.get(id).has(event)) {
          const handler = this.eventHandlers.get(id).get(event);
          handler(...args);
        }
      },
      
      _getEmittedEvents: () => mockSocket._emittedEvents || [],
      
      _clearEmittedEvents: () => {
        mockSocket._emittedEvents = [];
      },
      
      _emittedEvents: []
    };

    // Track mock for cleanup
    this.activeMocks.set(id, mockSocket);
    ResourceManager.registerCleanup(mockSocket, () => this.cleanup(id));

    return mockSocket;
  }

  /**
   * Create a mock Socket.IO server
   * @param {Object} options - Server configuration options
   * @returns {Object} Mock Socket.IO server object
   */
  createMockSocketIOServer(options = {}) {
    const {
      port = 3000,
      host = 'localhost'
    } = options;

    const sockets = new Map();
    const rooms = new Map();

    const mockServer = {
      sockets: {
        sockets,
        adapter: {
          rooms
        }
      },
      
      // Event handling
      on: jest.fn(),
      
      // Room-based operations
      to: jest.fn((room) => ({
        emit: jest.fn((event, ...args) => {
          // Emit to all sockets in room
          for (const [socketId, socket] of sockets) {
            if (socket.rooms.has(room)) {
              socket.emit(event, ...args);
            }
          }
        })
      })),
      
      in: jest.fn((room) => mockServer.to(room)),
      
      // Global emit
      emit: jest.fn((event, ...args) => {
        for (const [socketId, socket] of sockets) {
          socket.emit(event, ...args);
        }
      }),
      
      // Server lifecycle
      listen: jest.fn((portOrServer, callback) => {
        if (typeof portOrServer === 'function') {
          callback = portOrServer;
        }
        if (callback) {
          setTimeout(callback, 0);
        }
        return mockServer;
      }),
      
      close: jest.fn((callback) => {
        // Disconnect all sockets
        for (const [socketId, socket] of sockets) {
          socket.disconnect(true);
        }
        sockets.clear();
        rooms.clear();
        
        if (callback) {
          setTimeout(callback, 0);
        }
      }),
      
      // Utility methods for testing
      _addSocket: (socket) => {
        sockets.set(socket.id, socket);
      },
      
      _removeSocket: (socketId) => {
        sockets.delete(socketId);
      },
      
      _getSocketCount: () => sockets.size,
      
      _getRoomCount: () => rooms.size,
      
      _getSocketsInRoom: (room) => {
        const socketsInRoom = [];
        for (const [socketId, socket] of sockets) {
          if (socket.rooms.has(room)) {
            socketsInRoom.push(socket);
          }
        }
        return socketsInRoom;
      }
    };

    return mockServer;
  }

  /**
   * Create a complete WebSocket testing environment
   * @param {Object} options - Environment configuration
   * @returns {Object} Complete WebSocket test environment
   */
  createWebSocketEnvironment(options = {}) {
    const {
      socketCount = 2,
      serverOptions = {},
      socketOptions = {}
    } = options;

    const server = this.createMockSocketIOServer(serverOptions);
    const sockets = [];

    for (let i = 0; i < socketCount; i++) {
      const socket = this.createMockSocket({
        ...socketOptions,
        id: `test_socket_${i}`
      });
      sockets.push(socket);
      server._addSocket(socket);
    }

    return {
      server,
      sockets,
      cleanup: () => {
        server.close();
        sockets.forEach(socket => socket.disconnect(true));
      }
    };
  }

  /**
   * Simulate WebSocket events for testing
   * @param {Object} socket - Mock socket
   * @param {string} event - Event name
   * @param {Array} args - Event arguments
   */
  simulateEvent(socket, event, ...args) {
    if (socket._triggerEvent) {
      socket._triggerEvent(event, ...args);
    }
  }

  /**
   * Clean up a specific mock
   * @param {string} id - Socket ID to clean up
   */
  cleanup(id) {
    if (this.activeMocks.has(id)) {
      this.activeMocks.delete(id);
    }
    if (this.eventHandlers.has(id)) {
      this.eventHandlers.delete(id);
    }
  }

  /**
   * Clean up all mocks
   */
  cleanupAll() {
    for (const id of this.activeMocks.keys()) {
      this.cleanup(id);
    }
  }
}

/**
 * HTTP Server Mocking Utilities
 */
class HTTPMocker {
  constructor() {
    this.activeMocks = new Map();
  }

  /**
   * Create a mock HTTP server
   * @param {Object} options - Server configuration options
   * @returns {Object} Mock HTTP server object
   */
  createMockHTTPServer(options = {}) {
    const {
      port = 0,
      host = 'localhost'
    } = options;

    let isListening = false;
    let serverAddress = null;

    const mockServer = {
      // Server lifecycle
      listen: jest.fn((portOrOptions, hostOrCallback, callback) => {
        let actualPort = port;
        let actualHost = host;
        let actualCallback = callback;

        // Handle different parameter combinations
        if (typeof portOrOptions === 'object') {
          actualPort = portOrOptions.port || port;
          actualHost = portOrOptions.host || host;
          actualCallback = hostOrCallback;
        } else if (typeof portOrOptions === 'number') {
          actualPort = portOrOptions;
          if (typeof hostOrCallback === 'string') {
            actualHost = hostOrCallback;
          } else if (typeof hostOrCallback === 'function') {
            actualCallback = hostOrCallback;
          }
        }

        isListening = true;
        serverAddress = { port: actualPort, host: actualHost };

        if (actualCallback) {
          setTimeout(actualCallback, 0);
        }

        return mockServer;
      }),

      close: jest.fn((callback) => {
        isListening = false;
        serverAddress = null;
        if (callback) {
          setTimeout(callback, 0);
        }
      }),

      address: jest.fn(() => serverAddress),

      // Event handling
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      removeListener: jest.fn(),

      // Utility methods for testing
      _isListening: () => isListening,
      _getAddress: () => serverAddress,
      
      _simulateError: (error) => {
        const errorHandlers = mockServer.on.mock.calls
          .filter(call => call[0] === 'error')
          .map(call => call[1]);
        
        errorHandlers.forEach(handler => handler(error));
      },

      _simulateConnection: (socket) => {
        const connectionHandlers = mockServer.on.mock.calls
          .filter(call => call[0] === 'connection')
          .map(call => call[1]);
        
        connectionHandlers.forEach(handler => handler(socket));
      }
    };

    const serverId = `http_server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeMocks.set(serverId, mockServer);
    ResourceManager.registerCleanup(mockServer, () => this.cleanup(serverId));

    return mockServer;
  }

  /**
   * Create a mock HTTP request object
   * @param {Object} options - Request configuration options
   * @returns {Object} Mock HTTP request object
   */
  createMockRequest(options = {}) {
    const {
      method = 'GET',
      url = '/',
      headers = {},
      body = null,
      query = {},
      params = {}
    } = options;

    return {
      method,
      url,
      headers,
      body,
      query,
      params,
      
      // Event handling
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      
      // Stream methods
      pipe: jest.fn(),
      
      // Utility methods for testing
      _simulateData: (data) => {
        const dataHandlers = mockRequest.on.mock.calls
          .filter(call => call[0] === 'data')
          .map(call => call[1]);
        
        dataHandlers.forEach(handler => handler(data));
      },
      
      _simulateEnd: () => {
        const endHandlers = mockRequest.on.mock.calls
          .filter(call => call[0] === 'end')
          .map(call => call[1]);
        
        endHandlers.forEach(handler => handler());
      }
    };
  }

  /**
   * Create a mock HTTP response object
   * @param {Object} options - Response configuration options
   * @returns {Object} Mock HTTP response object
   */
  createMockResponse(options = {}) {
    const {
      statusCode = 200,
      headers = {}
    } = options;

    let responseEnded = false;
    let responseData = '';

    const mockResponse = {
      statusCode,
      headers: { ...headers },
      
      // Response methods
      writeHead: jest.fn((code, reasonOrHeaders, headersOrUndefined) => {
        mockResponse.statusCode = code;
        
        if (typeof reasonOrHeaders === 'object') {
          Object.assign(mockResponse.headers, reasonOrHeaders);
        } else if (headersOrUndefined) {
          Object.assign(mockResponse.headers, headersOrUndefined);
        }
      }),
      
      setHeader: jest.fn((name, value) => {
        mockResponse.headers[name] = value;
      }),
      
      getHeader: jest.fn((name) => mockResponse.headers[name]),
      
      write: jest.fn((chunk) => {
        if (!responseEnded) {
          responseData += chunk;
        }
      }),
      
      end: jest.fn((data) => {
        if (data) {
          responseData += data;
        }
        responseEnded = true;
      }),
      
      // Event handling
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      
      // Utility methods for testing
      _isEnded: () => responseEnded,
      _getData: () => responseData,
      _getStatusCode: () => mockResponse.statusCode,
      _getHeaders: () => ({ ...mockResponse.headers })
    };

    return mockResponse;
  }

  /**
   * Clean up a specific mock
   * @param {string} id - Server ID to clean up
   */
  cleanup(id) {
    if (this.activeMocks.has(id)) {
      const mock = this.activeMocks.get(id);
      if (mock.close) {
        mock.close();
      }
      this.activeMocks.delete(id);
    }
  }

  /**
   * Clean up all mocks
   */
  cleanupAll() {
    for (const id of this.activeMocks.keys()) {
      this.cleanup(id);
    }
  }
}

/**
 * External Dependencies Mocking Utilities
 */
class ExternalDependencyMocker {
  constructor() {
    this.originalModules = new Map();
    this.mockedModules = new Map();
  }

  /**
   * Mock Node.js built-in modules
   * @param {string} moduleName - Name of module to mock
   * @param {Object} mockImplementation - Mock implementation
   */
  mockNodeModule(moduleName, mockImplementation) {
    if (!this.originalModules.has(moduleName)) {
      try {
        this.originalModules.set(moduleName, require(moduleName));
      } catch (error) {
        // Module might not exist, that's okay
      }
    }

    jest.doMock(moduleName, () => mockImplementation);
    this.mockedModules.set(moduleName, mockImplementation);
  }

  /**
   * Mock file system operations
   * @param {Object} options - File system mock options
   * @returns {Object} Mock file system implementation
   */
  mockFileSystem(options = {}) {
    const {
      files = {},
      throwErrors = false
    } = options;

    const mockFS = {
      readFile: jest.fn((path, encoding, callback) => {
        if (typeof encoding === 'function') {
          callback = encoding;
          encoding = 'utf8';
        }

        setTimeout(() => {
          if (throwErrors && !files[path]) {
            callback(new Error(`ENOENT: no such file or directory, open '${path}'`));
          } else {
            callback(null, files[path] || '');
          }
        }, 0);
      }),

      writeFile: jest.fn((path, data, encoding, callback) => {
        if (typeof encoding === 'function') {
          callback = encoding;
          encoding = 'utf8';
        }

        setTimeout(() => {
          if (throwErrors) {
            callback(new Error(`EACCES: permission denied, open '${path}'`));
          } else {
            files[path] = data;
            callback(null);
          }
        }, 0);
      }),

      existsSync: jest.fn((path) => files.hasOwnProperty(path)),

      readFileSync: jest.fn((path, encoding = 'utf8') => {
        if (throwErrors && !files[path]) {
          throw new Error(`ENOENT: no such file or directory, open '${path}'`);
        }
        return files[path] || '';
      }),

      writeFileSync: jest.fn((path, data, encoding = 'utf8') => {
        if (throwErrors) {
          throw new Error(`EACCES: permission denied, open '${path}'`);
        }
        files[path] = data;
      }),

      // Utility methods for testing
      _getFiles: () => ({ ...files }),
      _setFile: (path, content) => { files[path] = content; },
      _deleteFile: (path) => { delete files[path]; },
      _setThrowErrors: (shouldThrow) => { throwErrors = shouldThrow; }
    };

    this.mockNodeModule('fs', mockFS);
    return mockFS;
  }

  /**
   * Mock environment variables
   * @param {Object} envVars - Environment variables to mock
   */
  mockEnvironment(envVars = {}) {
    const originalEnv = { ...process.env };
    
    // Set mock environment variables
    Object.assign(process.env, envVars);
    
    // Return cleanup function
    return () => {
      process.env = originalEnv;
    };
  }

  /**
   * Mock timers with proper cleanup tracking
   * @param {Object} options - Timer mock options
   */
  mockTimers(options = {}) {
    const {
      advanceTimersAutomatically = false,
      doNotFake = []
    } = options;

    jest.useFakeTimers({
      advanceTimers: advanceTimersAutomatically,
      doNotFake
    });

    // Track for cleanup
    ResourceManager.registerCleanup(null, () => {
      jest.useRealTimers();
    });

    return {
      advanceTime: (ms) => jest.advanceTimersByTime(ms),
      runAllTimers: () => jest.runAllTimers(),
      runOnlyPendingTimers: () => jest.runOnlyPendingTimers(),
      getTimerCount: () => jest.getTimerCount(),
      clearAllTimers: () => jest.clearAllTimers()
    };
  }

  /**
   * Restore a mocked module
   * @param {string} moduleName - Name of module to restore
   */
  restoreModule(moduleName) {
    if (this.mockedModules.has(moduleName)) {
      jest.dontMock(moduleName);
      this.mockedModules.delete(moduleName);
    }
  }

  /**
   * Restore all mocked modules
   */
  restoreAllModules() {
    for (const moduleName of this.mockedModules.keys()) {
      this.restoreModule(moduleName);
    }
    jest.restoreAllMocks();
  }
}

/**
 * Mock Management System
 */
class MockManager {
  constructor() {
    this.webSocketMocker = new WebSocketMocker();
    this.httpMocker = new HTTPMocker();
    this.externalDependencyMocker = new ExternalDependencyMocker();
    this.activeMocks = new Set();
  }

  /**
   * Create WebSocket mocks
   * @param {Object} options - WebSocket mock options
   * @returns {Object} WebSocket mocks
   */
  createWebSocketMocks(options = {}) {
    const mocks = this.webSocketMocker.createWebSocketEnvironment(options);
    this.activeMocks.add(mocks);
    return mocks;
  }

  /**
   * Create HTTP server mocks
   * @param {Object} options - HTTP mock options
   * @returns {Object} HTTP server mock
   */
  createHTTPMocks(options = {}) {
    const mock = this.httpMocker.createMockHTTPServer(options);
    this.activeMocks.add(mock);
    return mock;
  }

  /**
   * Create complete server testing environment
   * @param {Object} options - Environment options
   * @returns {Object} Complete server testing environment
   */
  createServerEnvironment(options = {}) {
    const {
      httpOptions = {},
      webSocketOptions = {},
      mockDependencies = true
    } = options;

    const environment = {
      httpServer: this.createHTTPMocks(httpOptions),
      webSocketEnvironment: this.createWebSocketMocks(webSocketOptions)
    };

    if (mockDependencies) {
      environment.fileSystem = this.externalDependencyMocker.mockFileSystem();
      environment.timers = this.externalDependencyMocker.mockTimers();
    }

    this.activeMocks.add(environment);
    return environment;
  }

  /**
   * Clean up all mocks
   */
  cleanupAll() {
    // Clean up individual mockers
    this.webSocketMocker.cleanupAll();
    this.httpMocker.cleanupAll();
    this.externalDependencyMocker.restoreAllModules();

    // Clean up tracked mocks
    for (const mock of this.activeMocks) {
      if (mock.cleanup && typeof mock.cleanup === 'function') {
        try {
          mock.cleanup();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }

    this.activeMocks.clear();
    
    // Clear all Jest mocks
    jest.clearAllMocks();
    jest.restoreAllMocks();
  }
}

// Create singleton instance
const mockManager = new MockManager();

module.exports = {
  WebSocketMocker,
  HTTPMocker,
  ExternalDependencyMocker,
  MockManager,
  mockManager
};